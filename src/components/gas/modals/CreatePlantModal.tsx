import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGasData } from '@/hooks/useGasData';
import { Package, MapPin, Loader2 } from 'lucide-react';

interface CreatePlantModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreatePlantModal: React.FC<CreatePlantModalProps> = ({ open, onOpenChange }) => {
  const { createPlant, isCreatingPlant } = useGasData();
  
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [capacity, setCapacity] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;

    createPlant({
      name: name.trim(),
      locationText: location.trim() || null,
      capacityValue: parseFloat(capacity) || null,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setName('');
        setLocation('');
        setCapacity('');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-orange-400" />
            Nueva Planta
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre de la Planta *</Label>
            <Input
              placeholder="Ej: Planta Norte"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Ubicación
            </Label>
            <Input
              placeholder="Ej: Zona Industrial, Bogotá"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Capacidad (kg)</Label>
            <Input
              type="number"
              placeholder="Ej: 50000"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!name.trim() || isCreatingPlant}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isCreatingPlant ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              'Crear Planta'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePlantModal;
