import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, CreditCard, Building2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export const PaymentAccountsConfig = () => {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [newAccount, setNewAccount] = useState({
    accountType: 'nequi',
    accountNumber: '',
    accountHolder: '',
    lastFourDigits: ''
  });

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user?.restaurant_id) {
      loadAccounts();
    }
  }, [user]);

  const loadUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*, restaurants(*)')
      .eq('id', authUser.id)
      .single();

    setUser({ ...authUser, ...profile });
  };

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_payment_accounts')
        .select('*')
        .eq('restaurant_id', user.restaurant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      console.error('Error loading accounts:', error);
      toast({
        title: 'Error',
        description: 'Error al cargar cuentas',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addAccount = async () => {
    if (!newAccount.accountNumber || !newAccount.accountHolder || !newAccount.lastFourDigits) {
      toast({
        title: 'Error',
        description: 'Complete todos los campos',
        variant: 'destructive'
      });
      return;
    }

    if (newAccount.lastFourDigits.length !== 4) {
      toast({
        title: 'Error',
        description: 'Últimos 4 dígitos debe tener exactamente 4 caracteres',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('business_payment_accounts')
        .insert({
          restaurant_id: user.restaurant_id,
          account_type: newAccount.accountType,
          account_number: newAccount.accountNumber,
          account_holder: newAccount.accountHolder,
          last_four_digits: newAccount.lastFourDigits,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Cuenta agregada correctamente'
      });

      setNewAccount({
        accountType: 'nequi',
        accountNumber: '',
        accountHolder: '',
        lastFourDigits: ''
      });

      loadAccounts();
    } catch (error: any) {
      console.error('Error adding account:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al agregar cuenta',
        variant: 'destructive'
      });
    }
  };

  const toggleAccount = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('business_payment_accounts')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: `Cuenta ${!currentStatus ? 'activada' : 'desactivada'}`
      });

      loadAccounts();
    } catch (error: any) {
      console.error('Error toggling account:', error);
      toast({
        title: 'Error',
        description: 'Error al actualizar cuenta',
        variant: 'destructive'
      });
    }
  };

  const deleteAccount = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta cuenta?')) return;

    try {
      const { error } = await supabase
        .from('business_payment_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Cuenta eliminada'
      });

      loadAccounts();
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: 'Error al eliminar cuenta',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración de Cuentas de Pago</h1>
        <p className="text-muted-foreground">
          Registra las cuentas bancarias del negocio para validación automática de pagos
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agregar Nueva Cuenta</CardTitle>
          <CardDescription>
            Los últimos 4 dígitos se usan para validar comprobantes con IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de cuenta</Label>
              <Select
                value={newAccount.accountType}
                onValueChange={(value) => setNewAccount({ ...newAccount, accountType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nequi">Nequi</SelectItem>
                  <SelectItem value="daviplata">Daviplata</SelectItem>
                  <SelectItem value="bancolombia">Bancolombia</SelectItem>
                  <SelectItem value="banco_bogota">Banco de Bogotá</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Número de cuenta completo</Label>
              <Input
                value={newAccount.accountNumber}
                onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                placeholder="1234567890"
              />
            </div>

            <div>
              <Label>Titular de la cuenta</Label>
              <Input
                value={newAccount.accountHolder}
                onChange={(e) => setNewAccount({ ...newAccount, accountHolder: e.target.value })}
                placeholder="Nombre del negocio"
              />
            </div>

            <div>
              <Label>Últimos 4 dígitos (para validación)</Label>
              <Input
                value={newAccount.lastFourDigits}
                onChange={(e) => setNewAccount({ ...newAccount, lastFourDigits: e.target.value.slice(0, 4) })}
                placeholder="7890"
                maxLength={4}
              />
            </div>

            <div className="col-span-2">
              <Button onClick={addAccount} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Cuenta
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cuentas Registradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : accounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay cuentas registradas
            </div>
          ) : (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    {account.account_type === 'nequi' || account.account_type === 'daviplata' ? (
                      <CreditCard className="h-8 w-8 text-primary" />
                    ) : (
                      <Building2 className="h-8 w-8 text-primary" />
                    )}
                    <div>
                      <div className="font-semibold capitalize">
                        {account.account_type.replace('_', ' ')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {account.account_holder}
                      </div>
                      <div className="text-sm font-mono">
                        ****{account.last_four_digits}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={account.is_active}
                        onCheckedChange={() => toggleAccount(account.id, account.is_active)}
                      />
                      <span className="text-sm">
                        {account.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteAccount(account.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};