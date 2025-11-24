import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Users, Search, Mail, Phone, FileText } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const CustomerManagement = () => {
  const { toast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (user?.restaurant_id) {
      loadCustomers();
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

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('restaurant_id', user.restaurant_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      console.error('Error loading customers:', error);
      toast({
        title: 'Error',
        description: 'Error al cargar clientes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const search = searchTerm.toLowerCase();
    return (
      customer.full_name.toLowerCase().includes(search) ||
      customer.document_number.includes(search) ||
      customer.email.toLowerCase().includes(search)
    );
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Base de Datos de Clientes</h1>
          <p className="text-muted-foreground">Gestiona la información de tus clientes</p>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold">{customers.length}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, documento o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando clientes...</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron clientes
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Documento</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Régimen</TableHead>
                    <TableHead>Fecha registro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell className="font-mono">
                        <div>
                          <div className="text-xs text-muted-foreground">{customer.document_type}</div>
                          <div>{customer.document_number}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{customer.full_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{customer.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{customer.phone}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{customer.city || '-'}</TableCell>
                      <TableCell>
                        {customer.tax_regime && (
                          <span className="text-xs bg-secondary px-2 py-1 rounded">
                            {customer.tax_regime}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(customer.created_at).toLocaleDateString('es-CO')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};