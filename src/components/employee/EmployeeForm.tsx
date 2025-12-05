import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import FaceEnrollment from "./FaceEnrollment";

interface Employee {
  id?: string;
  email: string;
  full_name: string;
  role: 'owner' | 'admin' | 'employee';
  employee_type?: 'fixed' | 'hourly';
  hourly_rate?: number | null;
  phone: string | null;
  is_active: boolean;
  permissions: any;
  created_at: string;
  face_photo_url?: string | null;
}

interface EmployeeFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
  onSuccess: () => void;
}

const EmployeeForm = ({ isOpen, onOpenChange, employee, onSuccess }: EmployeeFormProps) => {
  const { profile, restaurant } = useAuth();
  const { toast } = useToast();
  const [formLoading, setFormLoading] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: employee?.email || "",
    full_name: employee?.full_name || "",
    phone: employee?.phone || "",
    password: "", // Nueva contraseña asignada por el propietario
    role: (employee?.role as 'admin' | 'employee') || "employee",
    employee_type: employee?.employee_type || 'fixed' as 'fixed' | 'hourly',
    hourly_rate: employee?.hourly_rate || undefined as number | undefined,
    permissions: {
      // Mercado de proveedores
      access_supplier_marketplace: !!employee?.permissions?.access_supplier_marketplace || false,
      
      // Comandar y añadir productos (sin procesar pagos)
      add_products_to_order: !!employee?.permissions?.add_products_to_order || false,
      
      // Facturación (procesar pagos y enviar facturas)
      process_payments: !!employee?.permissions?.process_payments || false,
      
      // Subir facturas con IA y actualizar inventario
      upload_receipts_with_ai: !!employee?.permissions?.upload_receipts_with_ai || false,
      
      // Ver inventario (sin editar)
      view_inventory: !!employee?.permissions?.view_inventory || false,
      
      // Editar inventario
      edit_inventory: !!employee?.permissions?.edit_inventory || false,
      
      // Ver horas trabajadas del personal
      view_employee_hours: !!employee?.permissions?.view_employee_hours || false,
      
      // Ver valor de nómina
      view_payroll_values: !!employee?.permissions?.view_payroll_values || false,
      
      // Editar horas de registro y salida
      edit_time_records: !!employee?.permissions?.edit_time_records || false,
      
      // Ver documentos
      view_documents: !!employee?.permissions?.view_documents || false,
      
      // Acceso a IA
      access_ai: !!employee?.permissions?.access_ai || false,
      
      // Permisos adicionales existentes
      view_sales: !!employee?.permissions?.view_sales || false,
      view_reports: !!employee?.permissions?.view_reports || false,
      manage_products: !!employee?.permissions?.manage_products || false,
      view_employees: !!employee?.permissions?.view_employees || false,
      access_pos: !!employee?.permissions?.access_pos || false,
      manage_cash: !!employee?.permissions?.manage_cash || false,
      access_kitchen: !!employee?.permissions?.access_kitchen || false,
      manage_kitchen_orders: !!employee?.permissions?.manage_kitchen_orders || false
    }
  });

  const [inviteMethod, setInviteMethod] = React.useState<'direct' | 'invitation'>('direct');

  React.useEffect(() => {
    if (employee) {
      setFormData({
        email: employee.email,
        full_name: employee.full_name,
        phone: employee.phone || "",
        password: "", // No mostrar contraseña al editar
        role: employee.role as 'admin' | 'employee',
        employee_type: employee.employee_type || 'fixed',
        hourly_rate: employee.hourly_rate || undefined,
        permissions: {
          // Mercado de proveedores
          access_supplier_marketplace: !!employee.permissions?.access_supplier_marketplace,
          
          // Comandar y añadir productos (sin procesar pagos)
          add_products_to_order: !!employee.permissions?.add_products_to_order,
          
          // Facturación (procesar pagos y enviar facturas)
          process_payments: !!employee.permissions?.process_payments,
          
          // Subir facturas con IA y actualizar inventario
          upload_receipts_with_ai: !!employee.permissions?.upload_receipts_with_ai,
          
          // Ver inventario (sin editar)
          view_inventory: !!employee.permissions?.view_inventory,
          
          // Editar inventario
          edit_inventory: !!employee.permissions?.edit_inventory,
          
          // Ver horas trabajadas del personal
          view_employee_hours: !!employee.permissions?.view_employee_hours,
          
          // Ver valor de nómina
          view_payroll_values: !!employee.permissions?.view_payroll_values,
          
          // Editar horas de registro y salida
          edit_time_records: !!employee.permissions?.edit_time_records,
          
          // Ver documentos
          view_documents: !!employee.permissions?.view_documents,
          
          // Acceso a IA
          access_ai: !!employee.permissions?.access_ai,
          
          // Permisos adicionales existentes
          view_sales: !!employee.permissions?.view_sales,
          view_reports: !!employee.permissions?.view_reports,
          manage_products: !!employee.permissions?.manage_products,
          view_employees: !!employee.permissions?.view_employees,
          access_pos: !!employee.permissions?.access_pos,
          manage_cash: !!employee.permissions?.manage_cash,
          access_kitchen: !!employee.permissions?.access_kitchen,
          manage_kitchen_orders: !!employee.permissions?.manage_kitchen_orders
        }
      });
    } else {
      setFormData({
        email: "",
        full_name: "",
        phone: "",
        password: "",
        role: "employee",
        employee_type: 'fixed',
        hourly_rate: undefined,
        permissions: {
          // Mercado de proveedores
          access_supplier_marketplace: false,
          
          // Comandar y añadir productos (sin procesar pagos)
          add_products_to_order: false,
          
          // Facturación (procesar pagos y enviar facturas)
          process_payments: false,
          
          // Subir facturas con IA y actualizar inventario
          upload_receipts_with_ai: false,
          
          // Ver inventario (sin editar)
          view_inventory: false,
          
          // Editar inventario
          edit_inventory: false,
          
          // Ver horas trabajadas del personal
          view_employee_hours: false,
          
          // Ver valor de nómina
          view_payroll_values: false,
          
          // Editar horas de registro y salida
          edit_time_records: false,
          
          // Ver documentos
          view_documents: false,
          
          // Acceso a IA
          access_ai: false,
          
          // Permisos adicionales existentes
          view_sales: false,
          view_reports: false,
          manage_products: false,
          view_employees: false,
          access_pos: false,
          manage_cash: false,
          access_kitchen: false,
          manage_kitchen_orders: false
        }
      });
    }
  }, [employee]);

  const checkEmail = async (email: string) => {
    try {
      if (!email) { setEmailExists(false); return; }
      setEmailCheckLoading(true);
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      const exists = !!data;
      setEmailExists(exists);
      // Nota: Permitimos el método "Crear usuario ahora" incluso si el email ya existe.
      // El edge function create-employee se encarga de vincular y actualizar el perfil existente.
    } finally {
      setEmailCheckLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!restaurant?.id || !profile?.id) return;

    setFormLoading(true);

    try {
      if (employee) {
        // Actualizar empleado existente
        const { error } = await supabase
          .from('profiles')
          .update({
          full_name: formData.full_name,
          phone: formData.phone,
          role: formData.role,
          employee_type: formData.employee_type,
          hourly_rate: formData.employee_type === 'hourly' ? formData.hourly_rate : null,
          permissions: formData.permissions
          })
          .eq('id', employee.id);

        if (error) throw error;

        toast({
          title: "Empleado actualizado",
          description: `${formData.full_name} ha sido actualizado correctamente`
        });
      } else {
        // Crear empleado o enviar invitación según método seleccionado
        if (inviteMethod === 'direct') {
          // Permitimos creación directa incluso si el email ya existe.
          // El edge function manejará casos de email existente actualizando al usuario y su perfil.

          const { data: result, error: createUserError } = await supabase.functions.invoke('create-employee', {
            body: {
              email: formData.email,
              password: formData.password,
              full_name: formData.full_name,
              phone: formData.phone,
              role: formData.role,
              permissions: formData.permissions,
              restaurant_id: restaurant.id,
              created_by: profile.id,
              restaurant_name: restaurant?.name || 'Mi Establecimiento',
              owner_name: profile.full_name || 'Administrador'
            }
          });

          if (createUserError || result?.error) {
            console.error('create-employee error:', createUserError || result?.error, result);
            throw new Error(result?.error || createUserError?.message || 'No se pudo crear el empleado');
          }

          toast({
            title: 'Empleado creado',
            description: `${formData.full_name} ha sido añadido al equipo con acceso inmediato.`,
          });
        } else {
          // Invitación por email
          const token = (crypto as any)?.randomUUID ? (crypto as any).randomUUID() : Math.random().toString(36).slice(2);

          const { error: inviteInsertError } = await supabase
            .from('restaurant_invitations')
            .insert({
              restaurant_id: restaurant.id,
              invited_by: profile.id,
              role: formData.role,
              email: formData.email,
              token
            });

          if (inviteInsertError) throw inviteInsertError;

          const { error: sendInviteError } = await supabase.functions.invoke('send-invitation', {
            body: {
              email: formData.email,
              restaurantName: restaurant?.name || 'Mi Establecimiento',
              inviterName: profile.full_name || 'Administrador',
              role: formData.role,
              token,
              siteUrl: window.location.origin
            }
          });

          if (sendInviteError) console.warn('Error enviando invitación (continuando):', sendInviteError);

          toast({
            title: 'Invitación enviada',
            description: `Se envió una invitación a ${formData.email} para unirse como ${formData.role === 'admin' ? 'Administrador' : 'Empleado'}.`,
          });
        }
      }

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error saving employee:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el empleado",
        variant: "destructive"
      });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{employee ? 'Editar empleado' : 'Nuevo Empleado'}</DialogTitle>
          <DialogDescription>
            {employee ? 'Actualiza los datos y permisos del empleado' : 'Crea una cuenta para un nuevo miembro del equipo'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nombre completo</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="Juan Pérez"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              onBlur={() => checkEmail(formData.email)}
              placeholder="juan@ejemplo.com"
              required
              disabled={!!employee}
            />
            {emailCheckLoading && (
              <p className="text-xs text-muted-foreground">Verificando email...</p>
            )}
            {emailExists && !employee && (
              <p className="text-xs text-destructive">Este email ya está en uso. Usa "Enviar invitación" o elige otro correo.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="+52 55 1234 5678"
            />
          </div>

          {!employee && (
            <>
              <div className="space-y-2">
                <Label>Método de incorporación</Label>
                <Select value={inviteMethod} onValueChange={(value: 'direct' | 'invitation') => setInviteMethod(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Crear usuario ahora</SelectItem>
                    <SelectItem value="invitation">Enviar invitación por email</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {inviteMethod === 'direct'
                    ? 'El empleado podrá ingresar de inmediato con la contraseña asignada.'
                    : 'Se enviará un correo con un enlace para aceptar la invitación y crear su cuenta.'}
                </p>
              </div>

              {inviteMethod === 'direct' && (
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Crea una contraseña para el empleado"
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Esta contraseña será asignada al empleado. Debe tener al menos 6 caracteres.
                  </p>
                </div>
              )}
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="role">Rol</Label>
            <Select value={formData.role} onValueChange={(value: 'admin' | 'employee') => 
              setFormData(prev => ({ ...prev, role: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Empleado</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Permisos</Label>
            <div className="space-y-2">
              <div className="border-b pb-2 mb-3">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Permisos de Mercado y Pedidos
                </Label>
              </div>
              {Object.entries({
                access_supplier_marketplace: "Acceso al mercado de proveedores",
                add_products_to_order: "Comandar y añadir productos (sin procesar pagos)"
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between space-x-2 py-2">
                  <Label htmlFor={key} className="text-sm font-medium cursor-pointer">{label}</Label>
                  <Switch
                    id={key}
                    checked={formData.permissions[key as keyof typeof formData.permissions]}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        permissions: {
                          ...prev.permissions,
                          [key]: checked
                        }
                      }))
                    }
                  />
                </div>
              ))}
              
              <div className="border-b pb-2 mb-3 mt-4">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Permisos de Caja y Facturación
                </Label>
              </div>
              {Object.entries({
                access_pos: "Acceso al sistema POS",
                process_payments: "Facturar (procesar pagos y enviar facturas)",
                manage_cash: "Gestionar caja registradora"
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between space-x-2 py-2">
                  <Label htmlFor={key} className="text-sm font-medium cursor-pointer">{label}</Label>
                  <Switch
                    id={key}
                    checked={formData.permissions[key as keyof typeof formData.permissions]}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        permissions: {
                          ...prev.permissions,
                          [key]: checked
                        }
                      }))
                    }
                  />
                </div>
              ))}

              <div className="border-b pb-2 mb-3 mt-4">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Permisos de Inventario
                </Label>
              </div>
              {Object.entries({
                upload_receipts_with_ai: "Subir facturas con IA y actualizar inventario",
                view_inventory: "Ver inventario (solo lectura)",
                edit_inventory: "Editar inventario"
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between space-x-2 py-2">
                  <Label htmlFor={key} className="text-sm font-medium cursor-pointer">{label}</Label>
                  <Switch
                    id={key}
                    checked={formData.permissions[key as keyof typeof formData.permissions]}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        permissions: {
                          ...prev.permissions,
                          [key]: checked
                        }
                      }))
                    }
                  />
                </div>
              ))}

              <div className="border-b pb-2 mb-3 mt-4">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Permisos de Personal
                </Label>
              </div>
              {Object.entries({
                view_employee_hours: "Ver horas trabajadas del personal",
                view_payroll_values: "Ver valor de nómina",
                edit_time_records: "Editar horas de registro y salida",
                view_employees: "Ver lista de empleados"
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between space-x-2 py-2">
                  <Label htmlFor={key} className="text-sm font-medium cursor-pointer">{label}</Label>
                  <Switch
                    id={key}
                    checked={formData.permissions[key as keyof typeof formData.permissions]}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        permissions: {
                          ...prev.permissions,
                          [key]: checked
                        }
                      }))
                    }
                  />
                </div>
              ))}

              <div className="border-b pb-2 mb-3 mt-4">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Permisos de Documentos y IA
                </Label>
              </div>
              {Object.entries({
                view_documents: "Ver todos los documentos",
                access_ai: "Acceso a IA para preguntas"
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between space-x-2 py-2">
                  <Label htmlFor={key} className="text-sm font-medium cursor-pointer">{label}</Label>
                  <Switch
                    id={key}
                    checked={formData.permissions[key as keyof typeof formData.permissions]}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        permissions: {
                          ...prev.permissions,
                          [key]: checked
                        }
                      }))
                    }
                  />
                </div>
              ))}

              <div className="border-b pb-2 mb-3 mt-4">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Otros Permisos
                </Label>
              </div>
              {Object.entries({
                view_sales: "Ver ventas",
                view_reports: "Ver reportes",
                manage_products: "Gestionar productos",
                access_kitchen: "Acceder al panel de cocina",
                manage_kitchen_orders: "Gestionar comandas de cocina"
              }).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between space-x-2 py-2">
                  <Label htmlFor={key} className="text-sm font-medium cursor-pointer">{label}</Label>
                  <Switch
                    id={key}
                    checked={formData.permissions[key as keyof typeof formData.permissions]}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        permissions: {
                          ...prev.permissions,
                          [key]: checked
                        }
                      }))
                    }
                  />
                </div>
              ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_type">Tipo de Empleado</Label>
                <select
                  id="employee_type"
                  value={formData.employee_type}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    employee_type: e.target.value as 'fixed' | 'hourly',
                    hourly_rate: e.target.value === 'fixed' ? undefined : prev.hourly_rate
                  }))}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="fixed">Empleado Fijo (Salario mensual)</option>
                  <option value="hourly">Por Turno (Pago por hora)</option>
                </select>
              </div>

              {formData.employee_type === 'hourly' && (
                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Tarifa por Hora (COP)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    value={formData.hourly_rate || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      hourly_rate: parseFloat(e.target.value) || undefined 
                    }))}
                    placeholder="Ej: 5000"
                    min="0"
                    step="100"
                  />
                  <p className="text-sm text-muted-foreground">
                    Monto que se pagará por cada hora trabajada
                  </p>
                </div>
              )}
            </div>

            {/* Face Enrollment Section - Only for existing employees */}
            {employee?.id && (
              <div className="pt-4 border-t">
                <FaceEnrollment
                  employeeId={employee.id}
                  employeeName={employee.full_name}
                  currentFacePhotoUrl={employee.face_photo_url}
                  onEnrollmentComplete={onSuccess}
                />
              </div>
            )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={formLoading}>
              {formLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {employee ? 'Guardando...' : 'Creando...'}
                </>
              ) : (
                employee ? "Guardar cambios" : "Crear Empleado"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeForm;