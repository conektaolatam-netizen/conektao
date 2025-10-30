import type { Product, Employee } from '@/context/AppContext';

export const generateSampleProducts = (userData: any): Product[] => {
  const businessType = userData?.businessType || 'restaurant';
  
  const baseProducts = {
    restaurant: [
      { name: 'Hamburguesa Clásica', category: 'Hamburguesas', price: 15000, cost: 8000, minStock: 5 },
      { name: 'Pizza Margherita', category: 'Pizzas', price: 18000, cost: 10000, minStock: 3 },
      { name: 'Cerveza Nacional', category: 'Bebidas', price: 5000, cost: 2500, minStock: 20 },
      { name: 'Gaseosa 350ml', category: 'Bebidas', price: 3000, cost: 1500, minStock: 30 },
      { name: 'Papas Fritas', category: 'Acompañamientos', price: 8000, cost: 4000, minStock: 10 },
      { name: 'Ensalada César', category: 'Ensaladas', price: 12000, cost: 6000, minStock: 5 },
      { name: 'Pasta Carbonara', category: 'Pastas', price: 16000, cost: 8500, minStock: 4 },
      { name: 'Agua Mineral', category: 'Bebidas', price: 2500, cost: 1200, minStock: 25 },
    ],
    cafe: [
      { name: 'Café Americano', category: 'Café Caliente', price: 4500, cost: 1500, minStock: 15 },
      { name: 'Cappuccino', category: 'Café Caliente', price: 6000, cost: 2500, minStock: 12 },
      { name: 'Croissant', category: 'Panadería', price: 5500, cost: 2800, minStock: 8 },
      { name: 'Muffin Chocolate', category: 'Panadería', price: 4000, cost: 2000, minStock: 10 },
      { name: 'Smoothie Fresa', category: 'Bebidas Frías', price: 8500, cost: 4000, minStock: 6 },
      { name: 'Té Verde', category: 'Tés', price: 3500, cost: 1200, minStock: 20 },
    ],
    retail: [
      { name: 'Camiseta Básica', category: 'Ropa', price: 25000, cost: 12000, minStock: 5 },
      { name: 'Pantalón Jean', category: 'Ropa', price: 65000, cost: 35000, minStock: 3 },
      { name: 'Zapatos Deportivos', category: 'Calzado', price: 120000, cost: 70000, minStock: 2 },
      { name: 'Gorra', category: 'Accesorios', price: 18000, cost: 9000, minStock: 8 },
    ]
  };

  const products = baseProducts[businessType as keyof typeof baseProducts] || baseProducts.restaurant;
  
  return products.map((product, index) => ({
    id: index + 1,
    ...product,
    stock: Math.floor(Math.random() * 20) + 10, // Random stock between 10-30
    sold: Math.floor(Math.random() * 50), // Random sales
    icon: getProductIcon(product.name, businessType)
  }));
};

export const generateSampleEmployees = (userData: any): Employee[] => {
  const businessType = userData?.businessType || 'restaurant';
  
  const baseEmployees = [
    { name: 'Ana García', position: 'Gerente', hourlyRate: 15000 },
    { name: 'Carlos López', position: 'Cocinero', hourlyRate: 12000 },
    { name: 'María Rodríguez', position: 'Mesero', hourlyRate: 8000 },
    { name: 'Juan Pérez', position: 'Cajero', hourlyRate: 9000 },
    { name: 'Sofía Martín', position: 'Ayudante Cocina', hourlyRate: 7500 },
  ];

  return baseEmployees.map((emp, index) => ({
    id: index + 1,
    ...emp,
    weeklyHours: 48,
    overtimeHours: 0,
    hoursWorked: Math.floor(Math.random() * 40), // Random hours worked
    bonuses: 0,
    salesBonus: 0,
    status: 'active',
    startDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
  }));
};

const getProductIcon = (productName: string, businessType: string): string => {
  const iconMap: { [key: string]: string } = {
    // Restaurant icons
    'hamburguesa': '🍔',
    'pizza': '🍕',
    'cerveza': '🍺',
    'gaseosa': '🥤',
    'papas': '🍟',
    'ensalada': '🥗',
    'pasta': '🍝',
    'agua': '💧',
    
    // Cafe icons
    'café': '☕',
    'cappuccino': '☕',
    'croissant': '🥐',
    'muffin': '🧁',
    'smoothie': '🥤',
    'té': '🍵',
    
    // Retail icons
    'camiseta': '👕',
    'pantalón': '👖',
    'zapatos': '👟',
    'gorra': '🧢',
  };

  const productLower = productName.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (productLower.includes(key)) {
      return icon;
    }
  }
  
  return businessType === 'cafe' ? '☕' : businessType === 'retail' ? '🛍️' : '🍽️';
};