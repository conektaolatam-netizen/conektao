import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import SupplierDashboard from '@/components/SupplierDashboard';
import SupplierSetup from '@/components/SupplierSetup';

const SupplierDashboardPage = () => {
  const { user } = useAuth();
  const [isSupplierSetup, setIsSupplierSetup] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSupplierSetup();
  }, [user]);

  const checkSupplierSetup = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Verificar si el usuario tiene configuración de proveedor
      const { data: supplierSettings } = await supabase
        .from('supplier_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Verificar si existe en la tabla de proveedores
      const { data: supplierData } = await supabase
        .from('suppliers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setIsSupplierSetup(!!(supplierSettings && supplierData));
    } catch (error) {
      console.error('Error checking supplier setup:', error);
      setIsSupplierSetup(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Si no está configurado como proveedor, mostrar setup
  if (isSupplierSetup === false) {
    return <SupplierSetup />;
  }

  // Si ya está configurado, mostrar dashboard
  return <SupplierDashboard />;
};

export default SupplierDashboardPage;