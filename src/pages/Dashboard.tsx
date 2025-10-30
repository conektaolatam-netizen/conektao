import React from "react";
import { useAuth } from "@/hooks/useAuth";
import RestaurantSetup from "@/components/RestaurantSetup";
import EmployeeSystem from "@/components/EmployeeSystem";
import Dashboard from "@/components/Dashboard";

interface DashboardPageProps {
  onModuleChange: (module: string) => void;
}

const DashboardPage = ({ onModuleChange }: DashboardPageProps) => {
  const { profile, restaurant, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  // Si el usuario no tiene perfil, necesita configurar su restaurante
  if (!profile) {
    return <RestaurantSetup />;
  }

  // Si es propietario pero no tiene restaurante, necesita configurarlo
  if (profile.role === 'owner' && !restaurant) {
    return <RestaurantSetup />;
  }

  // Si es empleado, mostrar sistema de empleados (solo control de tiempo)
  if (profile.role === 'employee') {
    return <EmployeeSystem />;
  }

  // Si es propietario o admin, mostrar dashboard completo
  return (
    <div className="space-y-8">
      <Dashboard onModuleChange={onModuleChange} />
    </div>
  );
};

export default DashboardPage;