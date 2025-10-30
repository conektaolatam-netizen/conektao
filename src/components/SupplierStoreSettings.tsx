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
import {
  ArrowLeft,
  Store,
  Upload,
  Image as ImageIcon,
  Save,
  MapPin,
  Clock,
  CreditCard
} from 'lucide-react';

interface SupplierStoreSettingsProps {
  onBack: () => void;
  onSave: () => void;
}

const SupplierStoreSettings = ({ onBack, onSave }: SupplierStoreSettingsProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [storeData, setStoreData] = useState({
    businessName: '',
    businessDescription: '',
    logo: '',
    coverImage: '',
    shippingCoverage: 'local' as 'national' | 'local' | 'cities',
    shippingCities: [] as string[],
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
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  useEffect(() => {
    loadStoreSettings();
  }, []);

  const loadStoreSettings = async () => {
    try {
      setInitialLoading(true);
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      // Cargar configuración del proveedor
      const { data: settingsData } = await supabase
        .from('supplier_settings')
        .select('*')
        .eq('user_id', user.data.user.id)
        .single();

      // Cargar datos del proveedor
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.data.user.id)
        .single();

      if (settingsData && supplierData) {
        setStoreData({
          businessName: supplierData.name || '',
          businessDescription: supplierData.description || '',
          logo: supplierData.logo || '',
          coverImage: supplierData.cover_image || '',
          shippingCoverage: settingsData.shipping_coverage || 'local',
          shippingCities: settingsData.shipping_cities || [],
          deliveryTimeMin: settingsData.delivery_time_min || 24,
          deliveryTimeMax: settingsData.delivery_time_max || 48,
          minimumOrderAmount: settingsData.minimum_order_amount || 0,
          acceptsCashOnDelivery: settingsData.accepts_cash_on_delivery || false,
          acceptsBankTransfer: settingsData.accepts_bank_transfer || true,
          bankAccountInfo: (settingsData.bank_account_info as any) || {
            bankName: '',
            accountNumber: '',
            accountType: 'savings',
            accountHolder: ''
          }
        });
      }
    } catch (error) {
      console.error('Error loading store settings:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const uploadImage = async (file: File, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('store-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('store-images')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const addCity = (city: string) => {
    if (city && !storeData.shippingCities.includes(city)) {
      setStoreData(prev => ({
        ...prev,
        shippingCities: [...prev.shippingCities, city]
      }));
    }
  };

  const removeCity = (city: string) => {
    setStoreData(prev => ({
      ...prev,
      shippingCities: prev.shippingCities.filter(c => c !== city)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('Usuario no autenticado');

      let logoUrl = storeData.logo;
      let coverUrl = storeData.coverImage;

      // Subir logo si hay uno nuevo
      if (logoFile) {
        logoUrl = await uploadImage(logoFile, 'logos');
      }

      // Subir imagen de portada si hay una nueva
      if (coverFile) {
        coverUrl = await uploadImage(coverFile, 'covers');
      }

      // Actualizar configuración de proveedor
      const { error: settingsError } = await supabase
        .from('supplier_settings')
        .upsert({
          user_id: user.data.user.id,
          business_name: storeData.businessName,
          business_description: storeData.businessDescription,
          shipping_coverage: storeData.shippingCoverage,
          shipping_cities: storeData.shippingCities,
          delivery_time_min: storeData.deliveryTimeMin,
          delivery_time_max: storeData.deliveryTimeMax,
          minimum_order_amount: storeData.minimumOrderAmount,
          accepts_cash_on_delivery: storeData.acceptsCashOnDelivery,
          accepts_bank_transfer: storeData.acceptsBankTransfer,
          bank_account_info: storeData.bankAccountInfo
        });

      if (settingsError) throw settingsError;

      // Actualizar datos del proveedor
      const { error: supplierError } = await supabase
        .from('suppliers')
        .upsert({
          user_id: user.data.user.id,
          name: storeData.businessName,
          description: storeData.businessDescription,
          logo: logoUrl,
          cover_image: coverUrl,
          delivery_time: `${storeData.deliveryTimeMin}-${storeData.deliveryTimeMax} horas`
        });

      if (supplierError) throw supplierError;

      toast({
        title: "Configuración guardada",
        description: "Los cambios se guardaron exitosamente"
      });

      onSave();

    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudieron guardar los cambios",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Configuración de mi Tienda</h1>
          <p className="text-muted-foreground">
            Personaliza tu tienda en el marketplace
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Nombre del Negocio *</Label>
              <Input
                id="businessName"
                value={storeData.businessName}
                onChange={(e) => setStoreData(prev => ({ ...prev, businessName: e.target.value }))}
                placeholder="Ej: Distribuidora de Alimentos ABC"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessDescription">Descripción del Negocio</Label>
              <Textarea
                id="businessDescription"
                value={storeData.businessDescription}
                onChange={(e) => setStoreData(prev => ({ ...prev, businessDescription: e.target.value }))}
                placeholder="Describe tu negocio, productos principales y experiencia..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Imágenes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Imágenes de tu Tienda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo de la Tienda</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {storeData.logo ? (
                    <div className="space-y-4">
                      <img
                        src={storeData.logo}
                        alt="Logo"
                        className="max-w-full h-24 object-contain mx-auto rounded"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStoreData(prev => ({ ...prev, logo: '' }))}
                      >
                        Cambiar Logo
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                      <div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setLogoFile(file);
                          }}
                          className="hidden"
                          id="logo-upload"
                        />
                        <Label htmlFor="logo-upload" className="cursor-pointer">
                          <Button type="button" variant="outline" asChild>
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              Subir Logo
                            </span>
                          </Button>
                        </Label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Portada */}
              <div className="space-y-2">
                <Label>Imagen de Portada</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {storeData.coverImage ? (
                    <div className="space-y-4">
                      <img
                        src={storeData.coverImage}
                        alt="Portada"
                        className="max-w-full h-24 object-cover mx-auto rounded"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setStoreData(prev => ({ ...prev, coverImage: '' }))}
                      >
                        Cambiar Portada
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                      <div>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) setCoverFile(file);
                          }}
                          className="hidden"
                          id="cover-upload"
                        />
                        <Label htmlFor="cover-upload" className="cursor-pointer">
                          <Button type="button" variant="outline" asChild>
                            <span>
                              <Upload className="h-4 w-4 mr-2" />
                              Subir Portada
                            </span>
                          </Button>
                        </Label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de Envíos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Configuración de Envíos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Cobertura de Envío</Label>
              <Select 
                value={storeData.shippingCoverage} 
                onValueChange={(value: 'national' | 'local' | 'cities') => 
                  setStoreData(prev => ({ ...prev, shippingCoverage: value }))}
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

            {storeData.shippingCoverage === 'cities' && (
              <div className="space-y-2">
                <Label>Ciudades donde entregas</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nombre de la ciudad"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
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
                      if (input && input.value) {
                        addCity(input.value);
                        input.value = '';
                      }
                    }}
                  >
                    Agregar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {storeData.shippingCities.map((city) => (
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
                  value={storeData.deliveryTimeMin}
                  onChange={(e) => setStoreData(prev => ({ ...prev, deliveryTimeMin: parseInt(e.target.value) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Tiempo Máximo de Entrega (horas)</Label>
                <Input
                  type="number"
                  value={storeData.deliveryTimeMax}
                  onChange={(e) => setStoreData(prev => ({ ...prev, deliveryTimeMax: parseInt(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Monto Mínimo de Pedido</Label>
              <Input
                type="number"
                value={storeData.minimumOrderAmount}
                onChange={(e) => setStoreData(prev => ({ ...prev, minimumOrderAmount: parseFloat(e.target.value) }))}
                placeholder="0"
              />
            </div>
          </CardContent>
        </Card>

        {/* Información de Pagos */}
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
                  checked={storeData.acceptsCashOnDelivery}
                  onCheckedChange={(checked) => 
                    setStoreData(prev => ({ ...prev, acceptsCashOnDelivery: checked as boolean }))}
                />
                <Label>Acepto pagos contra entrega</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={storeData.acceptsBankTransfer}
                  onCheckedChange={(checked) => 
                    setStoreData(prev => ({ ...prev, acceptsBankTransfer: checked as boolean }))}
                />
                <Label>Acepto transferencias bancarias</Label>
              </div>
            </div>

            {storeData.acceptsBankTransfer && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">Información Bancaria</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Banco</Label>
                    <Input
                      value={storeData.bankAccountInfo.bankName}
                      onChange={(e) => setStoreData(prev => ({
                        ...prev,
                        bankAccountInfo: { ...prev.bankAccountInfo, bankName: e.target.value }
                      }))}
                      placeholder="Nombre del banco"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tipo de Cuenta</Label>
                    <Select
                      value={storeData.bankAccountInfo.accountType}
                      onValueChange={(value) => setStoreData(prev => ({
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
                    value={storeData.bankAccountInfo.accountNumber}
                    onChange={(e) => setStoreData(prev => ({
                      ...prev,
                      bankAccountInfo: { ...prev.bankAccountInfo, accountNumber: e.target.value }
                    }))}
                    placeholder="Número de cuenta bancaria"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Titular de la Cuenta</Label>
                  <Input
                    value={storeData.bankAccountInfo.accountHolder}
                    onChange={(e) => setStoreData(prev => ({
                      ...prev,
                      bankAccountInfo: { ...prev.bankAccountInfo, accountHolder: e.target.value }
                    }))}
                    placeholder="Nombre completo del titular"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Botones de Acción */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            disabled={loading || !storeData.businessName}
            className="flex-1"
          >
            {loading ? (
              <>Guardando...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default SupplierStoreSettings;