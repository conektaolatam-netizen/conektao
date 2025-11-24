import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, UserPlus } from 'lucide-react';

interface CustomerData {
  id?: string;
  documentType: string;
  documentNumber: string;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  taxRegime?: string;
}

interface CustomerDataFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (customer: CustomerData) => void;
  requiresFullData: boolean; // true si quiere factura electrónica
  restaurantId: string;
}

export const CustomerDataForm = ({ 
  open, 
  onClose, 
  onSubmit, 
  requiresFullData,
  restaurantId 
}: CustomerDataFormProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CustomerData>({
    documentType: 'CC',
    documentNumber: '',
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    taxRegime: 'simplificado'
  });

  const searchCustomer = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .or(`document_number.eq.${searchTerm},email.eq.${searchTerm}`)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setFormData({
          id: data.id,
          documentType: data.document_type,
          documentNumber: data.document_number,
          fullName: data.full_name,
          email: data.email,
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          taxRegime: data.tax_regime || 'simplificado'
        });
        toast({
          title: 'Cliente encontrado',
          description: 'Se han cargado los datos del cliente'
        });
      } else {
        toast({
          title: 'Cliente no encontrado',
          description: 'Ingrese los datos manualmente',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error searching customer:', error);
      toast({
        title: 'Error',
        description: 'Error al buscar cliente',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.email.includes('@')) {
      toast({
        title: 'Error',
        description: 'Email inválido',
        variant: 'destructive'
      });
      return;
    }

    if (requiresFullData) {
      if (!formData.documentNumber || !formData.fullName || !formData.address) {
        toast({
          title: 'Error',
          description: 'Complete todos los campos obligatorios para factura electrónica',
          variant: 'destructive'
        });
        return;
      }
    }

    setLoading(true);
    try {
      // Guardar o actualizar cliente
      const customerData = {
        restaurant_id: restaurantId,
        document_type: formData.documentType,
        document_number: formData.documentNumber,
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        tax_regime: formData.taxRegime
      };

      if (formData.id) {
        // Actualizar
        const { error } = await supabase
          .from('customers')
          .update(customerData)
          .eq('id', formData.id);

        if (error) throw error;
      } else {
        // Crear nuevo
        const { data, error } = await supabase
          .from('customers')
          .insert(customerData)
          .select()
          .single();

        if (error) throw error;
        formData.id = data.id;
      }

      toast({
        title: 'Éxito',
        description: 'Datos del cliente guardados'
      });

      onSubmit(formData);
    } catch (error: any) {
      console.error('Error saving customer:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al guardar datos del cliente',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {requiresFullData ? 'Datos para Factura Electrónica' : 'Datos del Cliente'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Búsqueda de cliente existente */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Buscar cliente (documento o email)</Label>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="CC o email..."
                onKeyPress={(e) => e.key === 'Enter' && searchCustomer()}
              />
            </div>
            <Button 
              onClick={searchCustomer} 
              disabled={loading}
              className="mt-6"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de documento *</Label>
                <Select
                  value={formData.documentType}
                  onValueChange={(value) => setFormData({ ...formData, documentType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                    <SelectItem value="NIT">NIT</SelectItem>
                    <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                    <SelectItem value="PPN">Pasaporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Número de documento *</Label>
                <Input
                  value={formData.documentNumber}
                  onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                  placeholder="1234567890"
                  required={requiresFullData}
                />
              </div>

              <div className="col-span-2">
                <Label>Nombre completo / Razón social *</Label>
                <Input
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Juan Pérez"
                  required={requiresFullData}
                />
              </div>

              <div className="col-span-2">
                <Label>Email * {!requiresFullData && '(para enviar comprobante)'}</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cliente@email.com"
                  required
                />
              </div>

              {requiresFullData && (
                <>
                  <div>
                    <Label>Teléfono</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="3001234567"
                    />
                  </div>

                  <div>
                    <Label>Ciudad</Label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Bogotá"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label>Dirección *</Label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Calle 123 # 45-67"
                      required
                    />
                  </div>

                  <div>
                    <Label>Régimen tributario</Label>
                    <Select
                      value={formData.taxRegime}
                      onValueChange={(value) => setFormData({ ...formData, taxRegime: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="simplificado">Simplificado</SelectItem>
                        <SelectItem value="comun">Común</SelectItem>
                        <SelectItem value="gran_contribuyente">Gran Contribuyente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              <UserPlus className="h-4 w-4 mr-2" />
              {loading ? 'Guardando...' : 'Continuar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};