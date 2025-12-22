/**
 * DEPRECATED: This component was using local-only state without Supabase persistence.
 * All inventory functionality has been consolidated into InventoryManagement.
 * This file now just redirects to the proper component.
 */
import InventoryManagement from './inventory/InventoryManagement';

interface InventoryProps {
  userData?: any;
  onModuleChange?: (module: string) => void;
}

const Inventory = ({ onModuleChange }: InventoryProps) => {
  // Redirect to the properly connected InventoryManagement component
  return <InventoryManagement onModuleChange={onModuleChange} />;
};

export default Inventory;
