import { useAuth } from '@/hooks/useAuth';

export type ProductMode = 'restaurant' | 'gas';

export const useProductMode = (): {
  productMode: ProductMode;
  isGasMode: boolean;
  isRestaurantMode: boolean;
  isLoading: boolean;
} => {
  const { restaurant, loading } = useAuth();
  
  // Get product_mode from restaurant, defaulting to 'restaurant'
  const rawMode = restaurant?.product_mode;
  const productMode: ProductMode = (rawMode === 'gas' ? 'gas' : 'restaurant');
  
  return {
    productMode,
    isGasMode: productMode === 'gas',
    isRestaurantMode: productMode === 'restaurant',
    isLoading: loading,
  };
};
