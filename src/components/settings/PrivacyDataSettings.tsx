import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Lock, FileText, Upload, Eye, Download, Loader2, Check, 
  Shield, AlertCircle, Trash2, File 
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SettingsHeader from "./SettingsHeader";
import SettingsSection from "./SettingsSection";
import SettingsRow from "./SettingsRow";
import useSettingsAudit from "@/hooks/useSettingsAudit";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PrivacyDataSettingsProps {
  onBack: () => void;
}

interface LegalDocument {
  id: string;
  document_type: string;
  title: string;
  file_url: string | null;
  created_at: string;
}

const PrivacyDataSettings = ({ onBack }: PrivacyDataSettingsProps) => {
  const { user, profile, restaurant } = useAuth();
  const { logSettingsChange } = useSettingsAudit();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Documents state
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const rutInputRef = useRef<HTMLInputElement>(null);
  const cedulaInputRef = useRef<HTMLInputElement>(null);

  const isOwner = profile?.role === "owner";

  useEffect(() => {
    loadDocuments();
  }, [restaurant?.id]);

  const loadDocuments = async () => {
    if (!restaurant?.id) {
      setFetching(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("business_documents")
        .select("id, document_type, title, file_url, created_at")
        .eq("restaurant_id", restaurant.id)
        .in("document_type", ["rut", "cedula_representante"]);

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setFetching(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("Completa todos los campos");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setPasswordLoading(true);
    setPasswordSuccess(false);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      await logSettingsChange({
        section: 'security',
        action: 'password_change',
        before: {},
        after: { changed_at: new Date().toISOString() },
      });

      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Contraseña actualizada ✓");

      setTimeout(() => setPasswordSuccess(false), 2000);
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDocumentUpload = async (docType: 'rut' | 'cedula_representante', file: File) => {
    if (!restaurant?.id || !profile?.id) return;

    setUploading(docType);

    try {
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${restaurant.id}/${docType}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("receipts")
        .getPublicUrl(fileName);

      const title = docType === 'rut' ? 'RUT' : 'Cédula del Representante Legal';

      // Check if document exists
      const existingDoc = documents.find(d => d.document_type === docType);

      if (existingDoc) {
        // Update existing
        const { error } = await supabase
          .from("business_documents")
          .update({
            file_url: urlData.publicUrl,
            title,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingDoc.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("business_documents")
          .insert({
            restaurant_id: restaurant.id,
            user_id: profile.id,
            document_type: docType,
            title,
            content: { uploaded: true },
            document_date: new Date().toISOString().split('T')[0],
            file_url: urlData.publicUrl,
          });

        if (error) throw error;
      }

      await logSettingsChange({
        section: 'documents',
        action: existingDoc ? 'update' : 'upload',
        before: existingDoc ? { file_url: existingDoc.file_url } : {},
        after: { document_type: docType, file_url: urlData.publicUrl },
      });

      toast.success(`${title} subido ✓`);
      loadDocuments();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    } finally {
      setUploading(null);
    }
  };

  const getDocumentByType = (type: string) => {
    return documents.find(d => d.document_type === type);
  };

  const rutDoc = getDocumentByType('rut');
  const cedulaDoc = getDocumentByType('cedula_representante');

  const canChangePassword = newPassword && confirmPassword && newPassword === confirmPassword && newPassword.length >= 6;

  if (fetching) {
    return (
      <div className="flex flex-col h-full bg-background">
        <SettingsHeader title="Privacidad y Datos" onBack={onBack} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <SettingsHeader title="Privacidad y Datos" onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Password Section */}
        <SettingsSection title="Cambiar Contraseña">
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/20 flex items-center justify-center">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Actualiza tu contraseña</p>
                <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-sm">Nueva contraseña</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1 bg-muted/50 border-border/30"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <Label className="text-sm">Confirmar contraseña</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 bg-muted/50 border-border/30"
                  placeholder="••••••••"
                />
              </div>

              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Las contraseñas no coinciden
                </div>
              )}

              <Button
                onClick={handlePasswordChange}
                disabled={passwordLoading || !canChangePassword}
                className={cn(
                  "w-full h-11 text-sm font-medium",
                  "bg-gradient-to-r from-primary to-primary/80",
                  passwordSuccess && "bg-green-500 from-green-500 to-green-600"
                )}
              >
                {passwordLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : passwordSuccess ? (
                  <span className="flex items-center gap-2">
                    <Check className="h-4 w-4" />
                    Actualizada
                  </span>
                ) : (
                  "Cambiar contraseña"
                )}
              </Button>
            </div>
          </div>
        </SettingsSection>

        {/* Legal Documents Section - Only for owners */}
        {isOwner && (
          <SettingsSection title="Documentos Legales">
            <div className="p-4 space-y-4">
              <p className="text-xs text-muted-foreground mb-4">
                Estos documentos son necesarios para la facturación electrónica.
              </p>

              {/* RUT */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">RUT</p>
                      {rutDoc ? (
                        <p className="text-xs text-green-500">
                          Subido el {format(new Date(rutDoc.created_at), "d MMM yyyy", { locale: es })}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">No subido</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {rutDoc && rutDoc.file_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(rutDoc.file_url!, '_blank')}
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => rutInputRef.current?.click()}
                      disabled={uploading === 'rut'}
                      className="h-8"
                    >
                      {uploading === 'rut' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </Button>
                    <input
                      ref={rutInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDocumentUpload('rut', file);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Cédula */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Cédula del Representante</p>
                      {cedulaDoc ? (
                        <p className="text-xs text-green-500">
                          Subido el {format(new Date(cedulaDoc.created_at), "d MMM yyyy", { locale: es })}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">No subido</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {cedulaDoc && cedulaDoc.file_url && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(cedulaDoc.file_url!, '_blank')}
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => cedulaInputRef.current?.click()}
                      disabled={uploading === 'cedula_representante'}
                      className="h-8"
                    >
                      {uploading === 'cedula_representante' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                    </Button>
                    <input
                      ref={cedulaInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleDocumentUpload('cedula_representante', file);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </SettingsSection>
        )}

        {/* Data & Privacy Info */}
        <SettingsSection title="Información">
          <SettingsRow
            icon={<Shield className="h-4 w-4" />}
            label="Tus datos están seguros"
            description="Encriptación de extremo a extremo"
            showChevron={false}
          />
        </SettingsSection>
      </div>
    </div>
  );
};

export default PrivacyDataSettings;
