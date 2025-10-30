import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ChefHat, Clock, CheckCircle, Users, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface KitchenCommand {
  id: string;
  order_number: string;
  table_number: number | null;
  status: string;
  total_items: number;
  sent_at: string;
  completed_at: string | null;
  items: Array<{
    product_name: string;
    quantity: number;
    special_instructions: string | null;
  }>;
}

const KitchenCommandsLog = () => {
  const { profile } = useAuth();
  const [commands, setCommands] = useState<KitchenCommand[]>([]);
  const [selectedCommand, setSelectedCommand] = useState<KitchenCommand | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadCommands();
  }, [profile?.restaurant_id, dateFilter]);

  const loadCommands = async () => {
    if (!profile?.restaurant_id) return;

    const startDate = new Date(dateFilter);
    const endDate = new Date(dateFilter);
    endDate.setDate(endDate.getDate() + 1);

    try {
      const { data, error } = await supabase
        .from('kitchen_orders')
        .select(`
          *,
          kitchen_order_items (
            product_name,
            quantity,
            special_instructions
          )
        `)
        .eq('restaurant_id', profile.restaurant_id)
        .gte('sent_at', startDate.toISOString())
        .lt('sent_at', endDate.toISOString())
        .order('sent_at', { ascending: false });

      if (error) throw error;

      setCommands(data?.map(cmd => ({
        ...cmd,
        items: cmd.kitchen_order_items || []
      })) || []);
    } catch (error) {
      console.error('Error loading commands:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ChefHat className="h-6 w-6 text-orange-600" />
          <div>
            <h2 className="text-xl font-semibold">Registro de Comandas</h2>
            <p className="text-sm text-gray-500">Historial diario de comandas enviadas a cocina</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          />
          <Button onClick={loadCommands} size="sm">
            Actualizar
          </Button>
        </div>
      </div>

      {/* Estadísticas del día */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ChefHat className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Total Comandas</span>
            </div>
            <p className="text-2xl font-bold">{commands.length}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Completadas</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {commands.filter(c => c.status === 'completed').length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">En Proceso</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {commands.filter(c => c.status === 'in_progress').length}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Items Total</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {commands.reduce((sum, c) => sum + c.total_items, 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de comandas */}
      <Card>
        <CardHeader>
          <CardTitle>Comandas del {new Date(dateFilter).toLocaleDateString('es-ES')}</CardTitle>
        </CardHeader>
        <CardContent>
          {commands.length === 0 ? (
            <div className="text-center py-8">
              <ChefHat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay comandas para esta fecha</p>
            </div>
          ) : (
            <div className="space-y-3">
              {commands.map((command) => (
                <div key={command.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <h4 className="font-medium">#{command.order_number}</h4>
                        <p className="text-sm text-gray-600">
                          {command.table_number ? `Mesa ${command.table_number}` : 'Domicilio'}
                        </p>
                      </div>
                      
                      <div className="text-sm">
                        <p>Enviado: {formatTime(command.sent_at)}</p>
                        {command.completed_at && (
                          <p>Completado: {formatTime(command.completed_at)}</p>
                        )}
                      </div>
                      
                      <div className="text-sm">
                        <p>{command.total_items} items</p>
                        <p>{command.items.length} productos</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(command.status)}>
                        {command.status === 'completed' ? 'Completado' : 
                         command.status === 'in_progress' ? 'En Proceso' : 'Pendiente'}
                      </Badge>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCommand(command);
                          setIsDetailOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Productos resumidos */}
                  <div className="mt-3 text-sm text-gray-600">
                    {command.items.slice(0, 3).map((item, index) => (
                      <span key={index}>
                        {item.quantity}x {item.product_name}
                        {index < Math.min(2, command.items.length - 1) && ', '}
                      </span>
                    ))}
                    {command.items.length > 3 && ` y ${command.items.length - 3} más...`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalles */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comanda #{selectedCommand?.order_number}</DialogTitle>
          </DialogHeader>
          
          {selectedCommand && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Mesa: {selectedCommand.table_number || 'Domicilio'}</div>
                <div>Total items: {selectedCommand.total_items}</div>
                <div>Enviado: {formatTime(selectedCommand.sent_at)}</div>
                {selectedCommand.completed_at && (
                  <div>Completado: {formatTime(selectedCommand.completed_at)}</div>
                )}
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Productos:</h4>
                {selectedCommand.items.map((item, index) => (
                  <div key={index} className="border rounded p-2">
                    <div className="flex justify-between">
                      <span>{item.quantity}x {item.product_name}</span>
                    </div>
                    {item.special_instructions && (
                      <p className="text-xs text-orange-600 mt-1">
                        Obs: {item.special_instructions}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KitchenCommandsLog;