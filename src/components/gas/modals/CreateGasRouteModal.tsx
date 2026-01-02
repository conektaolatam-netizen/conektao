import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGasData, GasClient } from '@/hooks/useGasData';
import { Plus, Trash2, Truck, Package, Users, Loader2 } from 'lucide-react';

interface DeliveryItem {
  clientId: string;
  clientName: string;
  plannedQty: number;
}

interface CreateGasRouteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateGasRouteModal: React.FC<CreateGasRouteModalProps> = ({ open, onOpenChange }) => {
  const { plants, vehicles, clients, createRoute, isCreatingRoute } = useGasData();
  
  const [plantId, setPlantId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [assignedQty, setAssignedQty] = useState('');
  const [selectedClients, setSelectedClients] = useState<DeliveryItem[]>([]);
  const [clientQty, setClientQty] = useState<Record<string, string>>({});

  const handleAddClient = (client: GasClient) => {
    if (selectedClients.find(c => c.clientId === client.id)) return;
    
    const qty = parseFloat(clientQty[client.id] || '0');
    if (qty <= 0) return;

    setSelectedClients(prev => [...prev, {
      clientId: client.id,
      clientName: client.name,
      plannedQty: qty,
    }]);
    setClientQty(prev => ({ ...prev, [client.id]: '' }));
  };

  const handleRemoveClient = (clientId: string) => {
    setSelectedClients(prev => prev.filter(c => c.clientId !== clientId));
  };

  const totalPlanned = selectedClients.reduce((sum, c) => sum + c.plannedQty, 0);
  const assignedNum = parseFloat(assignedQty) || 0;

  const handleSubmit = () => {
    if (!plantId || !vehicleId || assignedNum <= 0 || selectedClients.length === 0) return;

    createRoute({
      plantId,
      vehicleId,
      assignedQty: assignedNum,
      deliveries: selectedClients.map((c, index) => ({
        clientId: c.clientId,
        plannedQty: c.plannedQty,
        order: index + 1,
      })),
    }, {
      onSuccess: () => {
        onOpenChange(false);
        resetForm();
      }
    });
  };

  const resetForm = () => {
    setPlantId('');
    setVehicleId('');
    setAssignedQty('');
    setSelectedClients([]);
    setClientQty({});
  };

  const availableClients = clients.filter(c => 
    c.status === 'active' && !selectedClients.find(sc => sc.clientId === c.id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-orange-400" />
            Crear Nueva Ruta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-auto pr-2">
          {/* Plant & Vehicle */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Planta Origen
              </Label>
              <Select value={plantId} onValueChange={setPlantId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar planta" />
                </SelectTrigger>
                <SelectContent>
                  {plants.map(plant => (
                    <SelectItem key={plant.id} value={plant.id}>
                      {plant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Vehículo
              </Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar vehículo" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map(vehicle => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.plate} ({vehicle.capacity_value} {vehicle.capacity_unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assigned Quantity */}
          <div className="space-y-2">
            <Label>Cantidad de Gas Asignado (kg)</Label>
            <Input
              type="number"
              placeholder="Ej: 1500"
              value={assignedQty}
              onChange={(e) => setAssignedQty(e.target.value)}
            />
            {assignedNum > 0 && (
              <p className="text-xs text-muted-foreground">
                Planificado: {totalPlanned} kg • Restante: {assignedNum - totalPlanned} kg
              </p>
            )}
          </div>

          {/* Add Clients */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Agregar Clientes a la Ruta
            </Label>
            <ScrollArea className="h-40 border rounded-lg p-2">
              {availableClients.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay más clientes disponibles
                </p>
              ) : (
                <div className="space-y-2">
                  {availableClients.map(client => (
                    <div 
                      key={client.id}
                      className="flex items-center justify-between p-2 rounded bg-background/50 border border-border/20"
                    >
                      <div>
                        <p className="text-sm font-medium">{client.name}</p>
                        <p className="text-xs text-muted-foreground">{client.address}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          placeholder="kg"
                          className="w-20 h-8 text-sm"
                          value={clientQty[client.id] || ''}
                          onChange={(e) => setClientQty(prev => ({
                            ...prev,
                            [client.id]: e.target.value
                          }))}
                        />
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleAddClient(client)}
                          disabled={!clientQty[client.id] || parseFloat(clientQty[client.id]) <= 0}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Selected Clients */}
          {selectedClients.length > 0 && (
            <div className="space-y-3">
              <Label>Entregas Programadas ({selectedClients.length})</Label>
              <div className="space-y-2 border rounded-lg p-3 bg-muted/30">
                {selectedClients.map((item, index) => (
                  <div 
                    key={item.clientId}
                    className="flex items-center justify-between p-2 rounded bg-background border"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span className="text-sm font-medium">{item.clientName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className="bg-orange-500/20 text-orange-400">
                        {item.plannedQty} kg
                      </Badge>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => handleRemoveClient(item.clientId)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t mt-4">
          <div className="text-sm text-muted-foreground">
            Total planificado: <span className="font-bold text-foreground">{totalPlanned} kg</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!plantId || !vehicleId || assignedNum <= 0 || selectedClients.length === 0 || isCreatingRoute}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isCreatingRoute ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creando...
                </>
              ) : (
                'Crear Ruta'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateGasRouteModal;
