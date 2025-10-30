import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  Users,
  Shield,
  Settings,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  Clock,
  Activity,
  Key,
  Mail,
  Phone,
  Calendar,
  Award,
  AlertTriangle
} from 'lucide-react';
import { generateSecurePassword } from '@/utils/securePassword';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'manager' | 'cashier' | 'waiter' | 'cook';
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  createdAt: string;
  permissions: string[];
  shift: 'morning' | 'afternoon' | 'night' | 'full';
  hourlyRate: number;
  avatar?: string;
}

interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  module: string;
  timestamp: string;
  details: string;
}

const UserManagement = () => {
  const { state } = useApp();
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<'users' | 'roles' | 'activity' | 'new-user'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');

  // Sample users data
  const [users, setUsers] = useState<User[]>([
    {
      id: 'USER001',
      name: 'Ana María González',
      email: 'ana@restaurant.com',
      phone: '+57 301 234 5678',
      role: 'admin',
      status: 'active',
      lastLogin: '2024-01-23T10:30:00',
      createdAt: '2024-01-01T00:00:00',
      permissions: ['all'],
      shift: 'full',
      hourlyRate: 25000,
      avatar: '👩‍💼'
    },
    {
      id: 'USER002',
      name: 'Carlos Rodríguez',
      email: 'carlos@restaurant.com',
      phone: '+57 312 876 5432',
      role: 'manager',
      status: 'active',
      lastLogin: '2024-01-23T09:15:00',
      createdAt: '2024-01-05T00:00:00',
      permissions: ['billing', 'inventory', 'reports', 'employees'],
      shift: 'morning',
      hourlyRate: 20000
    },
    {
      id: 'USER003',
      name: 'María López',
      email: 'maria@restaurant.com',
      phone: '+57 315 567 8901',
      role: 'cashier',
      status: 'active',
      lastLogin: '2024-01-23T08:45:00',
      createdAt: '2024-01-10T00:00:00',
      permissions: ['billing', 'cash'],
      shift: 'afternoon',
      hourlyRate: 15000
    },
    {
      id: 'USER004',
      name: 'Juan Pérez',
      email: 'juan@restaurant.com',
      phone: '+57 320 123 4567',
      role: 'waiter',
      status: 'active',
      lastLogin: '2024-01-22T19:30:00',
      createdAt: '2024-01-15T00:00:00',
      permissions: ['billing', 'tables'],
      shift: 'night',
      hourlyRate: 12000
    },
    {
      id: 'USER005',
      name: 'Pedro García',
      email: 'pedro@restaurant.com',
      phone: '+57 318 765 4321',
      role: 'cook',
      status: 'active',
      lastLogin: '2024-01-23T07:00:00',
      createdAt: '2024-01-08T00:00:00',
      permissions: ['kitchen', 'inventory'],
      shift: 'morning',
      hourlyRate: 18000
    }
  ]);

  // Sample activity logs
  const [activityLogs] = useState<ActivityLog[]>([
    {
      id: 'LOG001',
      userId: 'USER002',
      userName: 'Carlos Rodríguez',
      action: 'Venta procesada',
      module: 'Facturación',
      timestamp: '2024-01-23T10:15:00',
      details: 'Procesó venta por $45,000 - Mesa 5'
    },
    {
      id: 'LOG002',
      userId: 'USER003',
      userName: 'María López',
      action: 'Cierre de caja',
      module: 'Caja',
      timestamp: '2024-01-22T22:00:00',
      details: 'Cerró caja con diferencia de $2,000'
    },
    {
      id: 'LOG003',
      userId: 'USER001',
      userName: 'Ana María González',
      action: 'Usuario creado',
      module: 'Administración',
      timestamp: '2024-01-22T15:30:00',
      details: 'Creó usuario nuevo: Juan Pérez'
    },
    {
      id: 'LOG004',
      userId: 'USER004',
      userName: 'Juan Pérez',
      action: 'Orden tomada',
      module: 'Mesas',
      timestamp: '2024-01-22T20:45:00',
      details: 'Tomó orden Mesa 3 - 4 productos'
    },
    {
      id: 'LOG005',
      userId: 'USER005',
      userName: 'Pedro García',
      action: 'Inventario actualizado',
      module: 'Cocina',
      timestamp: '2024-01-22T08:30:00',
      details: 'Reportó falta de tomate en inventario'
    }
  ]);

  const roleConfig = {
    admin: {
      name: 'Administrador',
      color: 'from-red-500 to-red-600',
      permissions: ['all'],
      description: 'Acceso completo a todas las funciones'
    },
    manager: {
      name: 'Gerente',
      color: 'from-blue-500 to-blue-600',
      permissions: ['billing', 'inventory', 'reports', 'employees', 'cash'],
      description: 'Gestión operativa y reportes'
    },
    cashier: {
      name: 'Cajero',
      color: 'from-green-500 to-green-600',
      permissions: ['billing', 'cash'],
      description: 'Facturación y manejo de caja'
    },
    waiter: {
      name: 'Mesero',
      color: 'from-purple-500 to-purple-600',
      permissions: ['billing', 'tables'],
      description: 'Toma de órdenes y servicio'
    },
    cook: {
      name: 'Cocinero',
      color: 'from-orange-500 to-orange-600',
      permissions: ['kitchen', 'inventory'],
      description: 'Cocina y control de ingredientes'
    }
  };

  const permissionLabels = {
    all: 'Todos los permisos',
    billing: 'Facturación',
    inventory: 'Inventario',
    reports: 'Reportes',
    employees: 'Empleados',
    cash: 'Caja',
    tables: 'Mesas',
    kitchen: 'Cocina'
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return UserCheck;
      case 'inactive': return UserX;
      case 'suspended': return AlertTriangle;
      default: return UserX;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const toggleUserStatus = (userId: string) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' }
        : user
    ));

    const user = users.find(u => u.id === userId);
    toast({
      title: "Estado actualizado",
      description: `${user?.name} ahora está ${user?.status === 'active' ? 'inactivo' : 'activo'}`,
    });
  };

  const resetUserPassword = (userId: string) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) {
        toast({
          title: "Error",
          description: "Usuario no encontrado",
          variant: "destructive"
        });
        return;
      }

      // Generate a secure password
      const newPassword = generateSecurePassword(16);
      
      // In a real implementation, this would:
      // 1. Update the password in the database
      // 2. Send the password via secure email
      // 3. Force password change on next login
      
      console.log(`New secure password for ${user.email}:`, newPassword);
      
      toast({
        title: "Contraseña restablecida",
        description: `Se generó nueva contraseña segura para ${user.email}. Se enviará por correo electrónico.`,
      });
    } catch (error) {
      console.error('Error generating password:', error);
      toast({
        title: "Error",
        description: "No se pudo generar una nueva contraseña",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Gestión de Usuarios</h1>
            <p className="text-slate-600">Administra usuarios, roles y permisos del sistema</p>
          </div>
          <Button 
            onClick={() => setCurrentView('new-user')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Usuario
          </Button>
        </div>

        <Tabs value={currentView} onValueChange={(value: any) => setCurrentView(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usuarios ({users.length})
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Roles y Permisos
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Actividad
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6 mt-6">
            {/* Filters */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="border border-input bg-background rounded-md px-3 py-2"
              >
                <option value="all">Todos los roles</option>
                {Object.entries(roleConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.name}</option>
                ))}
              </select>
            </div>

            {/* Users Grid */}
            <div className="grid gap-6">
              {filteredUsers.map(user => {
                const StatusIcon = getStatusIcon(user.status);
                const roleInfo = roleConfig[user.role];
                
                return (
                  <Card key={user.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl">
                            {user.avatar || '👤'}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-slate-800">{user.name}</h3>
                              <Badge className={getStatusColor(user.status)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {user.status}
                              </Badge>
                              <Badge className={`bg-gradient-to-r ${roleInfo.color} text-white`}>
                                {roleInfo.name}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Mail className="h-4 w-4" />
                                {user.email}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Phone className="h-4 w-4" />
                                {user.phone}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Clock className="h-4 w-4" />
                                {user.shift}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <Award className="h-4 w-4" />
                                {formatCurrency(user.hourlyRate)}/hora
                              </div>
                            </div>

                            <div className="mb-3">
                              <p className="text-sm font-medium text-slate-700 mb-2">Permisos:</p>
                              <div className="flex flex-wrap gap-2">
                                {user.permissions.map((permission, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {permissionLabels[permission] || permission}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="text-sm text-slate-500">
                              <p>Último acceso: {new Date(user.lastLogin).toLocaleString('es-CO')}</p>
                              <p>Registrado: {new Date(user.createdAt).toLocaleDateString('es-CO')}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleUserStatus(user.id)}
                          >
                            {user.status === 'active' ? (
                              <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <Eye className="h-4 w-4 mr-2" />
                                Activar
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resetUserPassword(user.id)}
                          >
                            <Key className="h-4 w-4 mr-2" />
                            Reset Password
                          </Button>
                          <Button size="sm" variant="ghost">
                            Editar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="roles" className="space-y-6 mt-6">
            <div className="grid gap-6">
              {Object.entries(roleConfig).map(([roleKey, role]) => (
                <Card key={roleKey}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${role.color}`}>
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      {role.name}
                      <Badge variant="outline">
                        {users.filter(u => u.role === roleKey).length} usuarios
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 mb-4">{role.description}</p>
                    <div className="space-y-3">
                      <p className="font-medium text-sm">Permisos incluidos:</p>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        {role.permissions.map((permission, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-sm">{permissionLabels[permission] || permission}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Registro de Actividad Reciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityLogs.map(log => (
                    <div key={log.id} className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{log.userName}</span>
                          <Badge variant="outline" className="text-xs">
                            {log.module}
                          </Badge>
                          <span className="text-sm text-slate-500">
                            {new Date(log.timestamp).toLocaleString('es-CO')}
                          </span>
                        </div>
                        <p className="font-medium text-slate-800">{log.action}</p>
                        <p className="text-sm text-slate-600">{log.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 mt-6">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Configuración de Seguridad</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Autenticación de dos factores</p>
                      <p className="text-sm text-slate-600">Requiere verificación adicional para acceder</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Sesiones múltiples</p>
                      <p className="text-sm text-slate-600">Permite múltiples sesiones simultáneas</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Auto-logout</p>
                      <p className="text-sm text-slate-600">Cierra sesión automáticamente por inactividad</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Políticas de Contraseña</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Longitud mínima</label>
                      <Input type="number" defaultValue="8" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Días de expiración</label>
                      <Input type="number" defaultValue="90" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Requerir mayúsculas</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Requerir números</span>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Requerir símbolos</span>
                    <Switch />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserManagement;