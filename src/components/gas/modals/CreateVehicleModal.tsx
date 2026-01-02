import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGasData } from '@/hooks/useGasData';
import { Truck, User, Phone, Loader2 } from 'lucide-react';

interface CreateVehicleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateVehicleModal: React.FC<CreateVehicleModalProps> = ({ open, onOpenChange }) => {
  const { createVehicle, isCreatingVehicle } = useGasData();
  
  const [plate, setPlate] = useState('');
  const [capacity, setCapacity] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');

  const handleSubmit = () => {
    if (!plate.trim() || !capacity) return;

    createVehicle({
      plate: plate.trim().toUpperCase(),
      capacityValue: parseFloat(capacity),
      driverName: driverName.trim() || null,
      driverPhone: driverPhone.trim() || null,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setPlate('');
        setCapacity('');
        setDriverName('');
        setDriverPhone('');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-400" />
            Nuevo Vehículo
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Placa *</Label>
              <Input
                placeholder="ABC-123"
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                className="uppercase"
              />
            </div>

            <div className="space-y-2">
              <Label>Capacidad (kg) *</Label>
              <Input
                type="number"
                placeholder="2000"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Conductor
            </Label>
            <Input
              placeholder="Nombre del conductor"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Teléfono Conductor
            </Label>
            <Input
              placeholder="300 123 4567"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!plate.trim() || !capacity || isCreatingVehicle}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {isCreatingVehicle ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              'Crear Vehículo'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateVehicleModal;
