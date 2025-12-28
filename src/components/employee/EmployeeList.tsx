import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Users, Settings, Phone, Mail, Loader2, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import EmployeeForm from "./EmployeeForm";
import EmployeeLocationDialog from "./EmployeeLocationDialog";
import WaiterTipRating from "./WaiterTipRating";

interface Employee {
  id: string;
  email: string;
  full_name: string;
  role: 'owner' | 'admin' | 'employee';
  phone: string | null;
  is_active: boolean;
  permissions: any;
  created_at: string;
  work_latitude?: number;
  work_longitude?: number;
  work_address?: string;
  location_radius?: number;
}

interface EmployeeListProps {
  onEmployeeSelect?: (employee: Employee) => void;
}

interface Invitation {
  id: string;
  email: string;
  role: 'admin' | 'employee';
  status: string;
  created_at: string;
  expires_at: string;
}

const EmployeeList = ({ onEmployeeSelect }: EmployeeListProps) => {
  const { profile, restaurant } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [isLocationDialogOpen, setIsLocationDialogOpen] = useState(false);
  const [locationEmployee, setLocationEmployee] = useState<Employee | null>(null);

  const loadEmployees = async () => {
    if (!restaurant?.id) return;

    try {
      // Limpiar invitaciones expiradas
      await supabase.rpc('cleanup_expired_invitations');

      // Cargar empleados actuales
      const { data: employeesData, error: employeesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .neq('role', 'owner')
        .order('created_at', { ascending: false });

      if (employeesError) throw employeesError;
      setEmployees(employeesData || []);

      // Cargar invitaciones pendientes
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('restaurant_invitations')
        .select('id, email, role, status, created_at, expires_at')
        .eq('restaurant_id', restaurant.id)
        .eq('status', 'pending')
        .neq('role', 'owner')
        .order('created_at', { ascending: false });

      if (invitationsError) throw invitationsError;
      setInvitations((invitationsData || []) as Invitation[]);

    } catch (error: any) {
      console.error("Error loading employees:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los empleados",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [restaurant?.id]);

  const toggleEmployeeStatus = async (employeeId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', employeeId);

      if (error) throw error;

      toast({
        title: "Estado actualizado",
        description: `El empleado ha sido ${!currentStatus ? 'activado' : 'desactivado'}`
      });

      loadEmployees();
    } catch (error: any) {
      console.error("Error updating employee status:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del empleado",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingEmployee(null);
  };

  const openLocationDialog = (employee: Employee) => {
    setLocationEmployee(employee);
    setIsLocationDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'employee': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'employee': return 'Empleado';
      default: return role;
    }
  };

  const getActivePermissions = (permissions: any) => {
    if (!permissions) return [];
    return Object.entries(permissions)
      .filter(([key, value]) => value === true)
      .map(([key]) => {
        const labels: Record<string, string> = {
          access_pos: 'POS',
          access_billing: 'Facturación',
          manage_cash: 'Caja',
          upload_receipts: 'Facturas IA',
          process_payments: 'Pagos'
        };
        return labels[key] || key;
      });
  };

  // Permitir acceso a owners y admins
  if (!profile || (profile.role !== 'owner' && profile.role !== 'admin')) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            No tienes permisos para gestionar empleados
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Waiter Tip Performance */}
      <WaiterTipRating />
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Gestión de Personal</h3>
            <p className="text-sm text-muted-foreground">
              {employees.length} empleado{employees.length !== 1 ? 's' : ''} activo{employees.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Agregar Empleado
          </Button>
        </div>

      {loading ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Cargando empleados...
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">

          {/* Empleados activos */}
          {employees.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No hay empleados</h3>
                <p className="text-muted-foreground mb-4">
                  Agrega el primer miembro de tu equipo
                </p>
                <Button onClick={() => setIsFormOpen(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Agregar Empleado
                </Button>
              </CardContent>
            </Card>
          ) : (
            employees.map((employee) => (
              <Card 
                key={employee.id} 
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  onEmployeeSelect ? 'hover:shadow-md' : ''
                }`}
                onClick={() => onEmployeeSelect?.(employee)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold">{employee.full_name}</h4>
                        <Badge variant={getRoleBadgeVariant(employee.role)}>
                          {getRoleLabel(employee.role)}
                        </Badge>
                        <Badge variant={employee.is_active ? "outline" : "destructive"}>
                          {employee.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      
                       <div className="flex items-center gap-4 text-sm text-muted-foreground">
                         <div className="flex items-center gap-1">
                           <Mail className="h-3 w-3" />
                           {employee.email}
                         </div>
                         {employee.phone && (
                           <div className="flex items-center gap-1">
                             <Phone className="h-3 w-3" />
                             {employee.phone}
                           </div>
                         )}
                         {employee.work_latitude && employee.work_longitude && (
                           <div className="flex items-center gap-1">
                             <MapPin className="h-3 w-3 text-green-600" />
                             <span className="text-green-600">Ubicación establecida</span>
                           </div>
                         )}
                       </div>

                      {/* Permisos clave */}
                      <div className="flex flex-wrap gap-1">
                        {getActivePermissions(employee.permissions).slice(0, 4).map((permission) => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                        {getActivePermissions(employee.permissions).length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{getActivePermissions(employee.permissions).length - 4} más
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                     <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => toggleEmployeeStatus(employee.id, employee.is_active)}
                       >
                         {employee.is_active ? "Desactivar" : "Activar"}
                       </Button>
                       <Button 
                         variant="outline" 
                         size="sm" 
                         onClick={() => openLocationDialog(employee)}
                         title="Establecer ubicación de trabajo"
                       >
                         <MapPin className="h-4 w-4" />
                       </Button>
                       <Button 
                         variant="outline" 
                         size="sm" 
                         onClick={() => openEditDialog(employee)}
                       >
                         <Settings className="h-4 w-4" />
                       </Button>
                     </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      <EmployeeForm
        isOpen={isFormOpen}
        onOpenChange={handleFormClose}
        employee={editingEmployee}
        onSuccess={loadEmployees}
      />

      <EmployeeLocationDialog
        employee={locationEmployee}
        isOpen={isLocationDialogOpen}
        onOpenChange={setIsLocationDialogOpen}
        onSuccess={loadEmployees}
      />
      </div>
    </div>
  );
};

export default EmployeeList;