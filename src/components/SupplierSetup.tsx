import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Store, MapPin, Clock, CreditCard, FileText } from 'lucide-react';

interface SupplierSetupData {
  businessName: string;
  businessDescription: string;
  shippingCoverage: 'national' | 'local' | 'cities';
  shippingCities: string[];
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  minimumOrderAmount: number;
  acceptsCashOnDelivery: boolean;
  acceptsBankTransfer: boolean;
  bankAccountInfo: {
    bankName: string;
    accountNumber: string;
    accountType: string;
    accountHolder: string;
  };
}

const SupplierSetup = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<SupplierSetupData>({
    businessName: '',
    businessDescription: '',
    shippingCoverage: 'local',
    shippingCities: [],
    deliveryTimeMin: 24,
    deliveryTimeMax: 48,
    minimumOrderAmount: 0,
    acceptsCashOnDelivery: false,
    acceptsBankTransfer: true,
    bankAccountInfo: {
      bankName: '',
      accountNumber: '',
      accountType: 'savings',
      accountHolder: ''
    }
  });

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Usuario no autenticado');

      // Crear configuración de proveedor
      const { error: supplierError } = await supabase
        .from('supplier_settings')
        .upsert({
          user_id: user.data.user.id,
          business_name: formData.businessName,
          business_description: formData.businessDescription,
          shipping_coverage: formData.shippingCoverage,
          shipping_cities: formData.shippingCities,
          delivery_time_min: formData.deliveryTimeMin,
          delivery_time_max: formData.deliveryTimeMax,
          minimum_order_amount: formData.minimumOrderAmount,
          accepts_cash_on_delivery: formData.acceptsCashOnDelivery,
          accepts_bank_transfer: formData.acceptsBankTransfer,
          bank_account_info: formData.bankAccountInfo,
          is_active: true
        }, { onConflict: 'user_id' });

      if (supplierError) throw supplierError;

      // Crear entrada en la tabla de proveedores
      const { error: supplierRecordError } = await supabase
        .from('suppliers')
        .upsert({
          user_id: user.data.user.id,
          name: formData.businessName,
          description: formData.businessDescription,
          delivery_time: `${formData.deliveryTimeMin}-${formData.deliveryTimeMax} horas`,
          min_order: formData.minimumOrderAmount,
          is_active: true
        });

      if (supplierRecordError) throw supplierRecordError;

      // Actualizar perfil de usuario
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ account_type: 'supplier' })
        .eq('id', user.data.user.id);

      if (profileError) throw profileError;

      toast({
        title: "¡Configuración completada!",
        description: "Tu cuenta de proveedor ha sido configurada exitosamente"
      });

      // Recargar la página para actualizar el estado
      window.location.reload();

    } catch (error: any) {
      console.error('Error setting up supplier:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo completar la configuración",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addCity = (city: string) => {
    if (city && !formData.shippingCities.includes(city)) {
      setFormData(prev => ({
        ...prev,
        shippingCities: [...prev.shippingCities, city]
      }));
    }
  };

  const removeCity = (city: string) => {
    setFormData(prev => ({
      ...prev,
      shippingCities: prev.shippingCities.filter(c => c !== city)
    }));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Configurar mi Tienda de Proveedor</h1>
        <p className="text-muted-foreground">
          Configura tu perfil de proveedor para empezar a vender en Conektao
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center space-x-4 mb-8">
        {[1, 2, 3].map((stepNum) => (
          <div
            key={stepNum}
            className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step >= stepNum ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
            }`}
          >
            {stepNum}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Información del Negocio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Nombre del Negocio *</Label>
              <Input
                id="businessName"
                value={formData.businessName}
                onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                placeholder="Ej: Distribuidora de Alimentos ABC"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessDescription">Descripción del Negocio</Label>
              <Textarea
                id="businessDescription"
                value={formData.businessDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, businessDescription: e.target.value }))}
                placeholder="Describe tu negocio, productos principales y experiencia..."
                rows={4}
              />
            </div>

            <Button 
              onClick={() => setStep(2)} 
              className="w-full"
              disabled={!formData.businessName}
            >
              Continuar
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Configuración de Envíos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Cobertura de Envío *</Label>
              <Select 
                value={formData.shippingCoverage} 
                onValueChange={(value: 'national' | 'local' | 'cities') => 
                  setFormData(prev => ({ ...prev, shippingCoverage: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="local">Solo Local</SelectItem>
                  <SelectItem value="cities">Ciudades Específicas</SelectItem>
                  <SelectItem value="national">Nacional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.shippingCoverage === 'cities' && (
              <div className="space-y-2">
                <Label>Ciudades donde entregas</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nombre de la ciudad"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addCity((e.target as HTMLInputElement).value);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Nombre de la ciudad"]') as HTMLInputElement;
                      if (input) {
                        addCity(input.value);
                        input.value = '';
                      }
                    }}
                  >
                    Agregar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.shippingCities.map((city) => (
                    <span
                      key={city}
                      className="bg-primary/10 text-primary px-2 py-1 rounded-md text-sm cursor-pointer"
                      onClick={() => removeCity(city)}
                    >
                      {city} ✕
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tiempo Mínimo de Entrega (horas)</Label>
                <Input
                  type="number"
                  value={formData.deliveryTimeMin}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryTimeMin: parseInt((e.target.value || '0'), 10) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tiempo Máximo de Entrega (horas)</Label>
                <Input
                  type="number"
                  value={formData.deliveryTimeMax}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryTimeMax: parseInt((e.target.value || '0'), 10) }))}
                />
              </div>
            </div>

            <div className="space-y-2">
                <Label>Monto Mínimo de Pedido</Label>
                <Input
                  type="number"
                  value={formData.minimumOrderAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimumOrderAmount: parseFloat((e.target.value || '0')) }))}
                  placeholder="0"
                />
            </div>

            <div className="flex gap-4">
              <Button onClick={() => setStep(1)} variant="outline">
                Anterior
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Información de Pagos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.acceptsCashOnDelivery}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, acceptsCashOnDelivery: checked as boolean }))}
                />
                <Label>Acepto pagos contra entrega</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={formData.acceptsBankTransfer}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, acceptsBankTransfer: checked as boolean }))}
                />
                <Label>Acepto transferencias bancarias</Label>
              </div>
            </div>

            {formData.acceptsBankTransfer && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">Información Bancaria</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Banco</Label>
                    <Input
                      value={formData.bankAccountInfo.bankName}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        bankAccountInfo: { ...prev.bankAccountInfo, bankName: e.target.value }
                      }))}
                      placeholder="Nombre del banco"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tipo de Cuenta</Label>
                    <Select
                      value={formData.bankAccountInfo.accountType}
                      onValueChange={(value) => setFormData(prev => ({
                        ...prev,
                        bankAccountInfo: { ...prev.bankAccountInfo, accountType: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="savings">Ahorros</SelectItem>
                        <SelectItem value="checking">Corriente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Número de Cuenta</Label>
                  <Input
                    value={formData.bankAccountInfo.accountNumber}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      bankAccountInfo: { ...prev.bankAccountInfo, accountNumber: e.target.value }
                    }))}
                    placeholder="Número de cuenta bancaria"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Titular de la Cuenta</Label>
                  <Input
                    value={formData.bankAccountInfo.accountHolder}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      bankAccountInfo: { ...prev.bankAccountInfo, accountHolder: e.target.value }
                    }))}
                    placeholder="Nombre completo del titular"
                  />
                </div>
              </div>
            )}

            {/* Commission Notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-medium text-amber-800 mb-2">Información Importante sobre Comisiones</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Conektao cobra una comisión del <strong>8%</strong> por cada venta</li>
                <li>• El dinero se retiene hasta que el cliente confirme la recepción</li>
                <li>• Eres responsable de la logística y entrega de productos</li>
                <li>• Los pagos se procesan según el método seleccionado por el cliente</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button onClick={() => setStep(2)} variant="outline">
                Anterior
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="flex-1"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Configurando...
                  </>
                ) : (
                  'Completar Configuración'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SupplierSetup;