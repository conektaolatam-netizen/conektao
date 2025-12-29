import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  CreditCard, Plus, Loader2, Check, Trash2, Star, AlertCircle 
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SettingsHeader from "./SettingsHeader";
import SettingsSection from "./SettingsSection";
import useSettingsAudit from "@/hooks/useSettingsAudit";
import { cn } from "@/lib/utils";

interface PaymentMethodsSettingsProps {
  onBack: () => void;
}

interface PaymentAccount {
  id: string;
  account_type: string;
  account_holder: string;
  last_four_digits: string;
  is_active: boolean;
  created_at: string;
}

const PaymentMethodsSettings = ({ onBack }: PaymentMethodsSettingsProps) => {
  const { profile, restaurant } = useAuth();
  const { logSettingsChange } = useSettingsAudit();
  const [fetching, setFetching] = useState(true);
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // New account form
  const [newAccount, setNewAccount] = useState({
    account_type: "credit_card",
    account_holder: "",
    account_number: "",
    last_four_digits: "",
  });

  const isOwner = profile?.role === "owner";

  useEffect(() => {
    loadAccounts();
  }, [restaurant?.id]);

  const loadAccounts = async () => {
    if (!restaurant?.id) {
      setFetching(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("business_payment_accounts")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error) {
      console.error("Error loading accounts:", error);
    } finally {
      setFetching(false);
    }
  };

  const handleAddAccount = async () => {
    if (!restaurant?.id || !isOwner) return;

    if (!newAccount.account_holder || !newAccount.account_number) {
      toast.error("Completa todos los campos");
      return;
    }

    setSaving(true);

    try {
      const lastFour = newAccount.account_number.slice(-4);

      const { error } = await supabase
        .from("business_payment_accounts")
        .insert({
          restaurant_id: restaurant.id,
          account_type: newAccount.account_type,
          account_holder: newAccount.account_holder,
          account_number: newAccount.account_number,
          last_four_digits: lastFour,
          is_active: accounts.length === 0, // First card is active by default
        });

      if (error) throw error;

      await logSettingsChange({
        section: 'payment_methods',
        action: 'add',
        before: {},
        after: { account_type: newAccount.account_type, last_four: lastFour },
      });

      toast.success("Método de pago agregado ✓");
      setShowAddDialog(false);
      setNewAccount({
        account_type: "credit_card",
        account_holder: "",
        account_number: "",
        last_four_digits: "",
      });
      loadAccounts();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSetActive = async (accountId: string) => {
    if (!restaurant?.id || !isOwner) return;

    try {
      // Deactivate all
      await supabase
        .from("business_payment_accounts")
        .update({ is_active: false })
        .eq("restaurant_id", restaurant.id);

      // Activate selected
      const { error } = await supabase
        .from("business_payment_accounts")
        .update({ is_active: true })
        .eq("id", accountId);

      if (error) throw error;

      await logSettingsChange({
        section: 'payment_methods',
        action: 'set_active',
        before: {},
        after: { account_id: accountId },
      });

      toast.success("Método de pago actualizado ✓");
      loadAccounts();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!isOwner) return;

    setDeleting(accountId);

    try {
      const { error } = await supabase
        .from("business_payment_accounts")
        .delete()
        .eq("id", accountId);

      if (error) throw error;

      await logSettingsChange({
        section: 'payment_methods',
        action: 'delete',
        before: { account_id: accountId },
        after: {},
      });

      toast.success("Método de pago eliminado");
      loadAccounts();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setDeleting(null);
    }
  };

  const getCardIcon = (type: string) => {
    return <CreditCard className="h-5 w-5" />;
  };

  const getCardLabel = (type: string) => {
    const labels: Record<string, string> = {
      credit_card: "Tarjeta de Crédito",
      debit_card: "Tarjeta Débito",
      bank_account: "Cuenta Bancaria",
    };
    return labels[type] || type;
  };

  if (fetching) {
    return (
      <div className="flex flex-col h-full bg-background">
        <SettingsHeader title="Métodos de Pago" onBack={onBack} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <SettingsHeader title="Métodos de Pago" onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {!isOwner && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm text-yellow-500">
              Solo el propietario puede gestionar métodos de pago
            </p>
          </div>
        )}

        <SettingsSection title="Tarjetas Registradas">
          {accounts.length === 0 ? (
            <div className="p-6 text-center">
              <CreditCard className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No hay métodos de pago registrados
              </p>
              {isOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setShowAddDialog(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar método
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border/10">
              {accounts.map((account) => (
                <div key={account.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      account.is_active 
                        ? "bg-gradient-to-br from-primary/30 to-secondary/20" 
                        : "bg-muted/50"
                    )}>
                      {getCardIcon(account.account_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">
                          •••• {account.last_four_digits}
                        </p>
                        {account.is_active && (
                          <Star className="h-3 w-3 text-primary fill-primary" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getCardLabel(account.account_type)} • {account.account_holder}
                      </p>
                    </div>
                  </div>

                  {isOwner && (
                    <div className="flex items-center gap-2">
                      {!account.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetActive(account.id)}
                          className="text-xs"
                        >
                          Usar
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(account.id)}
                        disabled={deleting === account.id}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        {deleting === account.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </SettingsSection>

        {isOwner && accounts.length > 0 && (
          <div className="mt-6">
            <Button
              variant="outline"
              className="w-full h-12"
              onClick={() => setShowAddDialog(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar método de pago
            </Button>
          </div>
        )}

        {/* Info */}
        <SettingsSection title="Información">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Los métodos de pago registrados se utilizan para el cobro 
                automático de tu suscripción a Conektao.
              </p>
            </div>
          </div>
        </SettingsSection>
      </div>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Agregar Método de Pago</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={newAccount.account_type}
                onValueChange={(v) => setNewAccount(prev => ({ ...prev, account_type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
                  <SelectItem value="debit_card">Tarjeta Débito</SelectItem>
                  <SelectItem value="bank_account">Cuenta Bancaria</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Titular</Label>
              <Input
                value={newAccount.account_holder}
                onChange={(e) => setNewAccount(prev => ({ ...prev, account_holder: e.target.value }))}
                placeholder="Nombre como aparece en la tarjeta"
              />
            </div>

            <div className="space-y-2">
              <Label>Número de tarjeta</Label>
              <Input
                value={newAccount.account_number}
                onChange={(e) => setNewAccount(prev => ({ ...prev, account_number: e.target.value.replace(/\D/g, '') }))}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
              />
              <p className="text-xs text-muted-foreground">
                Solo guardamos los últimos 4 dígitos por seguridad
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddAccount} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Agregar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentMethodsSettings;
