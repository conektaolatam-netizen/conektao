import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useApp } from '@/context/AppContext';
import { useNotifications } from '@/hooks/useNotifications';
import { generateSampleProducts, generateSampleEmployees } from '@/utils/sampleDataGenerators';
import Layout from '@/components/Layout';
import DashboardPage from '@/pages/Dashboard';
import Billing from '@/components/Billing';
import EmployeeSystem from '@/components/EmployeeSystem';
import Marketplace from '@/components/Marketplace';
import ProductManager from '@/components/ProductManager';
import AIAssistant from '@/components/AIAssistant';
import ContAI from '@/components/ContAI';
import Documents from '@/components/Documents';
import IncomePresentation from '@/components/IncomePresentation';
import CashManagement from '@/components/CashManagement';
import InvoiceSystem from '@/components/InvoiceSystem';
import InvoiceSystemReal from '@/components/InvoiceSystemReal';
import POSBilling from '@/components/POSBilling';
import Reports from '@/components/Reports';
import Suppliers from '@/components/Suppliers';
import UserManagement from '@/components/UserManagement';
import TutorialGuide from '@/components/TutorialGuide';
import RestaurantSetupWizard from '@/components/RestaurantSetupWizard';
import KitchenDashboard from '@/components/kitchen/KitchenDashboard';
import { IngredientsManager } from '@/components/inventory/IngredientsManager';
import InventoryManager from '@/components/InventoryManager';
import ProductsCatalog from '@/components/ProductsCatalog';
import Welcome from './Welcome';

const Index = () => {
  const { user, profile, restaurant, loading } = useAuth();
  const { state, dispatch } = useApp();
  const { notifications } = useNotifications();
  const [showIncomePresentation, setShowIncomePresentation] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Solo para limpiar datos legacy si es necesario
  useEffect(() => {
    if (profile && restaurant) {
      const savedUserData = localStorage.getItem('restaurantUserData');
      if (savedUserData) {
        try {
          const parsedData = JSON.parse(savedUserData);
          dispatch({ type: 'SET_USER_DATA', payload: parsedData });
        } catch (error) {
          console.log('Error parsing legacy data');
        }
      }
    }
  }, [profile, restaurant, dispatch]);

  // Show welcome landing when not authenticated
  if (!loading && !user) {
    return <Welcome />;
  }

  // Show loading while checking authentication or profile
  if (loading || (user && profile === undefined)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  // Si el usuario no tiene establecimiento asignado, mostrar setup wizard
  if (user && profile && !profile.restaurant_id) {
    return (
      <RestaurantSetupWizard 
        onComplete={() => window.location.reload()} 
      />
    );
  }

  const handleOnboardingComplete = (data: any) => {
    localStorage.setItem('restaurantUserData', JSON.stringify(data));
    dispatch({ type: 'SET_USER_DATA', payload: data });
    setShowTutorial(true);
    initializeSampleData(data);
  };

  const initializeSampleData = (userData: any) => {
    const sampleProducts = generateSampleProducts(userData);
    sampleProducts.forEach(product => {
      dispatch({ type: 'ADD_PRODUCT', payload: product });
    });

    const sampleEmployees = generateSampleEmployees(userData);
    sampleEmployees.forEach(employee => {
      dispatch({ type: 'ADD_EMPLOYEE', payload: employee });
    });
  };

  const resetOnboarding = () => {
    localStorage.removeItem('restaurantUserData');
    localStorage.removeItem('tutorialCompleted');
    localStorage.removeItem('conektaoAppData');
    location.reload();
  };
  
  const showTutorialManually = () => {
    setShowTutorial(true);
  };

  const handleModuleChange = (module: string) => {
    dispatch({ type: 'SET_ACTIVE_MODULE', payload: module });
  };

  // Check if user has permission to access a module
  const hasPermission = (permission: string) => {
    // Owners and admins have access to everything
    if (profile?.role === 'owner' || profile?.role === 'admin') {
      return true;
    }
    
    // For employees, check specific permissions
    return profile?.permissions?.[permission as keyof typeof profile.permissions] || false;
  };

  // Render unauthorized access message
  const renderUnauthorized = (moduleName: string) => (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso No Autorizado</h3>
        <p className="text-gray-600 mb-4">
          No tienes permisos para acceder al módulo de {moduleName}.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Contacta al administrador o propietario para solicitar acceso.
        </p>
        <button
          onClick={() => handleModuleChange('dashboard')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Volver al Dashboard
        </button>
      </div>
    </div>
  );

  const renderModule = () => {
    switch (state.activeModule) {
      case 'dashboard':
        return <DashboardPage onModuleChange={handleModuleChange} />;
      case 'billing':
      case 'pos':
      case 'pos-billing':
        if (!hasPermission('access_pos')) {
          return renderUnauthorized('Facturación/POS');
        }
        return state.activeModule === 'billing' ? <Billing /> : <POSBilling />;
      case 'team':
        if (!hasPermission('view_employees')) {
          return renderUnauthorized('Personal');
        }
        return <EmployeeSystem />;
      case 'marketplace':
        return <Marketplace />;
      case 'inventory':
        if (!hasPermission('manage_inventory')) {
          return renderUnauthorized('Inventario');
        }
        return <InventoryManager />;
      case 'products':
        if (!hasPermission('manage_products')) {
          return renderUnauthorized('Productos');
        }
        return <ProductsCatalog />;
      case 'ai':
        return <AIAssistant />;
      case 'contai':
        return <ContAI />;
      case 'documents':
        if (!hasPermission('view_reports')) {
          return renderUnauthorized('Documentos');
        }
        return <Documents />;
      case 'cash':
        if (!hasPermission('manage_cash')) {
          return renderUnauthorized('Caja');
        }
        return <CashManagement />;
      case 'invoices':
        if (!hasPermission('access_billing')) {
          return renderUnauthorized('Facturas');
        }
        return <InvoiceSystemReal />;
      case 'reports':
        if (!hasPermission('view_reports')) {
          return renderUnauthorized('Reportes');
        }
        return <Reports />;
      case 'suppliers':
        return <Suppliers />;
      case 'users':
        if (!hasPermission('view_employees')) {
          return renderUnauthorized('Usuarios');
        }
        return <UserManagement />;
      case 'kitchen':
        if (!hasPermission('access_kitchen')) {
          return renderUnauthorized('Cocina');
        }
        return <KitchenDashboard />;
      default:
        return <DashboardPage onModuleChange={handleModuleChange} />;
    }
  };

  // Si está en modo presentación de ingresos
  if (showIncomePresentation) {
    return (
      <IncomePresentation 
        userData={state.userData} 
        onClose={() => setShowIncomePresentation(false)} 
      />
    );
  }

  return (
    <>
      <Layout 
        currentModule={state.activeModule} 
        onModuleChange={handleModuleChange}
        onResetOnboarding={resetOnboarding}
        onShowIncomePresentation={() => setShowIncomePresentation(true)}
        onShowTutorial={showTutorialManually}
      >
        {renderModule()}
      </Layout>
      
      {showTutorial && (
        <TutorialGuide 
          onClose={() => setShowTutorial(false)}
          onGoToModule={(module) => {
            handleModuleChange(module);
            setShowTutorial(false);
          }}
        />
      )}
    </>
  );
};

export default Index;