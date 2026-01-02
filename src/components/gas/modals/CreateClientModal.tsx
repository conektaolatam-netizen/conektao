import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useGasData } from '@/hooks/useGasData';
import { Users, MapPin, Phone, Mail, Loader2 } from 'lucide-react';

interface CreateClientModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateClientModal: React.FC<CreateClientModalProps> = ({ open, onOpenChange }) => {
  const { createClient, isCreatingClient } = useGasData();
  
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [clientType, setClientType] = useState<'contract' | 'free'>('free');
  const [notes, setNotes] = useState('');

  const handleSubmit = () => {
    if (!name.trim() || !address.trim()) return;

    createClient({
      name: name.trim(),
      contactName: contactName.trim() || null,
      contactPhone: contactPhone.trim() || null,
      email: email.trim() || null,
      address: address.trim(),
      city: city.trim() || null,
      clientType,
      notes: notes.trim() || null,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        resetForm();
      }
    });
  };

  const resetForm = () => {
    setName('');
    setContactName('');
    setContactPhone('');
    setEmail('');
    setAddress('');
    setCity('');
    setClientType('free');
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-400" />
            Nuevo Cliente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label>Nombre del Cliente / Empresa *</Label>
            <Input
              placeholder="Ej: Restaurante El Sabor"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Contacto
              </Label>
              <Input
                placeholder="Nombre contacto"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Teléfono
              </Label>
              <Input
                placeholder="300 123 4567"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Dirección *
            </Label>
            <Input
              placeholder="Calle 80 #15-20"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Input
                placeholder="Bogotá"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Cliente</Label>
              <Select value={clientType} onValueChange={(v: 'contract' | 'free') => setClientType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Libre</SelectItem>
                  <SelectItem value="contract">Contrato</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              placeholder="Notas adicionales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!name.trim() || !address.trim() || isCreatingClient}
            className="bg-green-500 hover:bg-green-600"
          >
            {isCreatingClient ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : (
              'Crear Cliente'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateClientModal;
