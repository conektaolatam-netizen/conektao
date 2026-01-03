import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getGasPermissions } from '@/lib/gasPermissions';
import GasLayout from './GasLayout';
import GasHomeDashboard from './GasHomeDashboard';
import GasDashboardLogistica from './GasDashboardLogistica';
import GasDashboardCartera from './GasDashboardCartera';
import GasAppConductor from './GasAppConductor';
import { LoadingState } from '@/components/LoadingState';

const GasIndex: React.FC = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return <LoadingState message="Cargando Conektao GAS..." fullScreen />;
  }

  const role = profile?.role || 'employee';
  const permissions = getGasPermissions(role);

  // Determine which dashboard to show based on role/permissions
  const renderDashboard = () => {
    // Owner/Admin/Gerencia sees full management dashboard
    if (permissions.viewFullKpis && permissions.viewDashboard) {
      return <GasHomeDashboard />;
    }

    // Logistics sees route management
    if (permissions.createRoutes || permissions.assignRoutes) {
      return <GasDashboardLogistica />;
    }

    // Cartera sees payment/AR dashboard
    if (permissions.reconcilePayments) {
      return <GasDashboardCartera />;
    }

    // Conductor sees simple delivery app
    if (permissions.executeDeliveries) {
      return <GasAppConductor />;
    }

    // Default: show conductor view for employees
    return <GasAppConductor />;
  };

  return (
    <GasLayout>
      {renderDashboard()}
    </GasLayout>
  );
};

export default GasIndex;
