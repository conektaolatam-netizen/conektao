import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, Store, Package, Star, Clock, DollarSign, ArrowLeft, MapPin, Phone, Mail, Globe, Filter, Grid3X3, List, Truck, Plus, Minus, Heart, Share2, CheckCircle, CreditCard, Percent, Send, Flame, Shield, Wrench }from 'lucide-react';
interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  stock: number;
  category: string;
  image?: string;
  discount?: number;
  isNew?: boolean;
  isFeatured?: boolean;
}
interface Supplier {
  id: string;
  name: string;
  category: string;
  type: 'supermarket' | 'local' | 'gas';
  rating: number;
  deliveryTime: string;
  location: string;
  contact: string;
  email: string;
  website?: string;
  description: string;
  logo: string;
  coverImage: string;
  primaryColor: string;
  secondaryColor: string;
  products: Product[];
  specialties: string[];
  minOrder: number;
  freeShipping: number;
  isVerified?: boolean;
  externalLink?: string;
}
const Marketplace = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [currentView, setCurrentView] = useState<'marketplace' | 'store' | 'payment' | 'tracking'>('marketplace');
  const [selectedStore, setSelectedStore] = useState<Supplier | null>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [productSearch, setProductSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'microcredit'>('cash');
  const [microcreditTerms, setMicrocreditTerms] = useState(12);
  
  // Simulación del perfil del usuario (esto vendría de la base de datos)
  const userProfile = {
    monthsActive: 8, // meses usando la app
    totalOrders: 23, // pedidos realizados
    paymentHistory: 'excellent', // excellent, good, regular, poor
    avgOrderValue: 125000, // valor promedio de pedidos
    latePayments: 0, // pagos tardíos en microcréditos previos
    completedCredits: 2 // microcréditos completados exitosamente
  };

  // Función para calcular automáticamente el perfil crediticio
  const calculateCreditProfile = () => {
    let score = 0;
    
    // Antigüedad (máximo 25 puntos)
    if (userProfile.monthsActive >= 12) score += 25;
    else if (userProfile.monthsActive >= 6) score += 20;
    else if (userProfile.monthsActive >= 3) score += 15;
    else score += 10;
    
    // Frecuencia de uso (máximo 25 puntos)
    if (userProfile.totalOrders >= 50) score += 25;
    else if (userProfile.totalOrders >= 20) score += 20;
    else if (userProfile.totalOrders >= 10) score += 15;
    else score += 10;
    
    // Historial de pagos (máximo 30 puntos)
    switch (userProfile.paymentHistory) {
      case 'excellent': score += 30; break;
      case 'good': score += 25; break;
      case 'regular': score += 15; break;
      case 'poor': score += 5; break;
    }
    
    // Valor promedio de pedidos (máximo 10 puntos)
    if (userProfile.avgOrderValue >= 200000) score += 10;
    else if (userProfile.avgOrderValue >= 100000) score += 8;
    else if (userProfile.avgOrderValue >= 50000) score += 6;
    else score += 4;
    
    // Penalización por pagos tardíos
    score -= userProfile.latePayments * 5;
    
    // Bonus por créditos completados
    score += userProfile.completedCredits * 5;
    
    // Determinar perfil basado en puntaje
    if (score >= 85) return 'excellent';
    else if (score >= 70) return 'good';
    else if (score >= 50) return 'regular';
    else return 'high_risk';
  };

  // Configuración de microcrédito - calculada automáticamente
  const predefinedRates = {
    excellent: { rate: 2.0, label: 'Excelente', color: 'bg-green-500', icon: '⭐', description: 'Cliente premium' },
    good: { rate: 2.5, label: 'Bueno', color: 'bg-blue-500', icon: '💎', description: 'Cliente confiable' },
    regular: { rate: 2.8, label: 'Regular', color: 'bg-yellow-500', icon: '🔥', description: 'Cliente en desarrollo' },
    high_risk: { rate: 3.5, label: 'Nuevo', color: 'bg-orange-500', icon: '🚀', description: 'Cliente en crecimiento' }
  };
  
  const autoCalculatedProfile = calculateCreditProfile();
  const currentRate = predefinedRates[autoCalculatedProfile].rate;
  
  const [orderTracking, setOrderTracking] = useState<any>(null);

  // 30 proveedores colombianos
  const suppliers: Supplier[] = [
  // 4 Supermercados famosos de Colombia
  {
    id: "exito",
    name: "Éxito",
    category: "Supermercado",
    type: "supermarket",
    rating: 4.6,
    deliveryTime: "2-4 horas",
    location: "Nacional",
    contact: "+57 1 587 8000",
    email: "servicio@exito.com",
    website: "exito.com",
    description: "La cadena de supermercados más grande de Colombia, con más de 100 años sirviendo a las familias colombianas.",
    logo: "🛒",
    coverImage: "linear-gradient(135deg, #E31E24, #FF6B6B)",
    primaryColor: "#E31E24",
    secondaryColor: "#FF6B6B",
    minOrder: 50000,
    freeShipping: 150000,
    specialties: ["Mercado", "Electrodomésticos", "Hogar", "Tecnología"],
    products: Array.from({
      length: 60
    }, (_, i) => ({
      id: i + 1,
      name: ["Arroz Diana x 5kg", "Aceite Gourmet 1L", "Pollo Entero kg", "Panela La Abuela 500g", "Café Juan Valdez 250g", "Leche Alquería 1L", "Huevos AAA x30", "Pan Bimbo Integral", "Yogurt Alpina Natural", "Queso Campesino 500g", "Atún Van Camps", "Pasta La Muñeca 500g", "Salsa Fruco Tomate", "Cereal Zucaritas", "Avena Quaker 1kg", "Banano Criollo kg", "Mango Tommy kg", "Papaya Maradol kg", "Aguacate Hass kg", "Tomate Chonto kg", "Cebolla Cabezona kg", "Papa Criolla kg", "Zanahoria kg", "Lechuga Batavia", "Cilantro Manojo", "Detergente Ariel 1kg", "Jabón Rey 400g", "Shampoo Head & Shoulders", "Papel Higiénico Scott", "Toallas Nosotras", "Televisor Samsung 55''", "Nevera Haceb 242L", "Licuadora Oster", "Cafetera Imusa", "Plancha Black & Decker", "Smartphone Xiaomi", "Tablet Samsung", "Auriculares Sony", "Cargador USB-C", "Mouse Logitech", "Camiseta Deportiva", "Pantalón Jean", "Zapatos Deportivos", "Medias Esquire", "Ropa Interior", "Colchón Semidoble", "Almohada Viscoelástica", "Sabanas Algodón", "Toalla de Baño", "Cortina Blackout", "Juguetes Lego", "Muñeca Barbie", "Carros Hot Wheels", "Pelota de Fútbol", "Bicicleta Infantil", "Medicina Acetaminofén", "Vitaminas Centrum", "Protector Solar", "Cepillo Dental", "Crema Corporal"][i % 55] || `Producto ${i + 1}`,
      price: Math.floor(Math.random() * 500000) + 10000,
      description: "Producto de alta calidad disponible en Éxito",
      stock: Math.floor(Math.random() * 100) + 5,
      category: ["Mercado", "Electrodomésticos", "Hogar", "Tecnología", "Ropa", "Farmacia"][Math.floor(Math.random() * 6)],
      isNew: Math.random() > 0.8,
      isFeatured: Math.random() > 0.9,
      discount: Math.random() > 0.7 ? Math.floor(Math.random() * 30) + 5 : 0
    }))
  }, {
    id: "carulla",
    name: "Carulla",
    category: "Supermercado Premium",
    type: "supermarket",
    rating: 4.7,
    deliveryTime: "1-3 horas",
    location: "Principales ciudades",
    contact: "+57 1 744 0000",
    email: "contacto@carulla.com",
    website: "carulla.com",
    description: "Supermercado premium con productos gourmet y de alta calidad para el hogar colombiano.",
    logo: "🥂",
    coverImage: "linear-gradient(135deg, #8B4513, #D2691E)",
    primaryColor: "#8B4513",
    secondaryColor: "#D2691E",
    minOrder: 80000,
    freeShipping: 200000,
    specialties: ["Gourmet", "Vinos", "Quesos", "Delicatessen"],
    products: Array.from({
      length: 55
    }, (_, i) => ({
      id: i + 100,
      name: ["Vino Tinto Reserva", "Queso Brie Francia", "Jamón Serrano España", "Aceite Oliva Extra", "Salmón Ahumado", "Caviar Ruso", "Champagne Francés", "Chocolate Belga", "Café Premium Huila", "Miel de Abeja Orgánica", "Trufa Negra", "Foie Gras", "Pasta Italiana", "Vinagre Balsámico", "Especias Importadas", "Pan Artesanal", "Mantequilla Francesa", "Yogurt Griego", "Granola Premium", "Frutos Secos", "Carne Wagyu", "Pollo Orgánico", "Pescado Fresco", "Mariscos Importados", "Vegetales Orgánicos", "Copa de Vino Cristal", "Plato Porcelana", "Cubiertos Plata", "Mantel Lino", "Servilletas Algodón", "Perfume Importado", "Crema Anti-edad", "Jabón Artesanal", "Sales de Baño", "Aceites Esenciales", "Suplementos Premium", "Proteína Whey", "Vitaminas Naturales", "Té Verde Japonés", "Infusiones Herbal", "Tecnología Apple", "Smartwatch Premium", "Auriculares Bose", "Cámara Professional", "Tablet Pro", "Ropa de Marca", "Zapatos Cuero", "Perfumes de Lujo", "Relojes Suizos", "Joyas Oro"][i % 50] || `Producto Premium ${i + 1}`,
      price: Math.floor(Math.random() * 1000000) + 50000,
      description: "Producto premium seleccionado especialmente para Carulla",
      stock: Math.floor(Math.random() * 50) + 3,
      category: ["Gourmet", "Vinos", "Delicatessen", "Premium", "Lujo"][Math.floor(Math.random() * 5)],
      isNew: Math.random() > 0.85,
      isFeatured: Math.random() > 0.8,
      discount: Math.random() > 0.8 ? Math.floor(Math.random() * 20) + 5 : 0
    }))
  }, {
    id: "jumbo",
    name: "Jumbo",
    category: "Hipermercado",
    type: "supermarket",
    rating: 4.5,
    deliveryTime: "3-6 horas",
    location: "Principales ciudades",
    contact: "+57 1 426 0000",
    email: "info@tiendasjumbo.co",
    website: "tiendasjumbo.co",
    description: "Hipermercado con la mayor variedad de productos para toda la familia a precios competitivos.",
    logo: "🐘",
    coverImage: "linear-gradient(135deg, #FF8C00, #FFD700)",
    primaryColor: "#FF8C00",
    secondaryColor: "#FFD700",
    minOrder: 60000,
    freeShipping: 180000,
    specialties: ["Gran Variedad", "Electrodomésticos", "Juguetes", "Deportes"],
    products: Array.from({
      length: 65
    }, (_, i) => ({
      id: i + 200,
      name: ["TV 65 pulgadas", "Nevera Side by Side", "Lavadora 18kg", "Secadora Eléctrica", "Horno Microondas", "Aspiradora Robot", "Aire Acondicionado", "Calentador de Agua", "Estufa 6 Puestos", "Campana Extractora", "PlayStation 5", "Xbox Series X", "Nintendo Switch", "Videojuegos", "Controles Gaming", "Bicicleta Montaña", "Trotadora Eléctrica", "Pesas Gimnasio", "Balón Fútbol FIFA", "Raqueta Tenis", "Juguetes Educativos", "Lego Creator", "Muñecas Interactive", "Carros Control Remoto", "Peluches Gigantes", "Piscina Inflable", "Trampolín Jardín", "Parrilla Gas", "Muebles Jardín", "Toldo Terraza", "Smartphone Gama Alta", "Laptop Gaming", "Tablet Kids", "Smartwatch Deporte", "Audífonos Gaming", "Ropa Deportiva Nike", "Zapatos Running", "Vestidos Fiesta", "Trajes Formales", "Ropa Bebé", "Muebles Sala", "Comedor 6 Puestos", "Cama King Size", "Armario 6 Puertas", "Mesa de Centro", "Instrumentos Musicales", "Guitarra Eléctrica", "Piano Digital", "Batería Completa", "Micrófono Pro"][i % 50] || `Producto Jumbo ${i + 1}`,
      price: Math.floor(Math.random() * 2000000) + 30000,
      description: "Gran variedad y mejores precios en Jumbo Colombia",
      stock: Math.floor(Math.random() * 80) + 5,
      category: ["Electrodomésticos", "Tecnología", "Deportes", "Juguetes", "Hogar", "Moda"][Math.floor(Math.random() * 6)],
      isNew: Math.random() > 0.75,
      isFeatured: Math.random() > 0.85,
      discount: Math.random() > 0.6 ? Math.floor(Math.random() * 40) + 10 : 0
    }))
  }, {
    id: "olimpica",
    name: "Olímpica",
    category: "Supermercado Regional",
    type: "supermarket",
    rating: 4.4,
    deliveryTime: "2-5 horas",
    location: "Costa Atlántica",
    contact: "+57 5 385 0000",
    email: "servicioalcliente@olimpica.com",
    website: "olimpica.com",
    description: "Cadena costeña con sabor local y productos frescos de la región Caribe colombiana.",
    logo: "🏖️",
    coverImage: "linear-gradient(135deg, #00CED1, #20B2AA)",
    primaryColor: "#00CED1",
    secondaryColor: "#20B2AA",
    minOrder: 45000,
    freeShipping: 120000,
    specialties: ["Productos Costeños", "Pescados", "Frutas Tropicales", "Carnes"],
    products: Array.from({
      length: 58
    }, (_, i) => ({
      id: i + 300,
      name: ["Pargo Rojo Fresco kg", "Róbalo Entero kg", "Camarón Tigre kg", "Langostinos kg", "Pescado Bocachico", "Yuca Costeña kg", "Ñame Criollo kg", "Plátano Verde kg", "Plátano Maduro kg", "Malanga kg", "Coco Fresco", "Guayaba kg", "Maracuyá kg", "Corozo kg", "Mamoncillo kg", "Chicharrón Costeño", "Chorizo Costeño", "Morcilla Dulce", "Butifarra Soledeña", "Queso Costeño", "Suero Costeño", "Arepa de Huevo", "Bollo de Mazorca", "Casabe", "Patacón Congelado", "Ron Medellín", "Aguardiente Antioqueño", "Cerveza Costeña", "Pola Pilsen", "Refresco Postobón", "Ventilador de Techo", "Aire Portátil", "Hamaca Wayuu", "Sombrero Vueltiao", "Artesanías Locales", "Medicinas Tropicales", "Repelente Mosquitos", "Protector Solar", "Suero Oral", "Vitamina C", "Ropa Playera", "Vestido de Baño", "Sandalias Havaianas", "Gorra Deportiva", "Short Bermuda", "Equipo de Pesca", "Atarraya", "Anzuelos", "Carnada", "Nevera Playera"][i % 50] || `Producto Costeño ${i + 1}`,
      price: Math.floor(Math.random() * 300000) + 15000,
      description: "Auténticos sabores y productos de la Costa Caribe colombiana",
      stock: Math.floor(Math.random() * 60) + 8,
      category: ["Pescados", "Frutas", "Carnes", "Bebidas", "Regional", "Playa"][Math.floor(Math.random() * 6)],
      isNew: Math.random() > 0.8,
      isFeatured: Math.random() > 0.87,
      discount: Math.random() > 0.75 ? Math.floor(Math.random() * 25) + 5 : 0
    }))
  },
  // 26 Proveedores locales especializados
  {
    id: "bella_italia",
    name: "Bella Italia",
    category: "Restaurante Italiano",
    type: "local",
    rating: 4.9,
    deliveryTime: "30-45 min",
    location: "Zona Rosa, Bogotá",
    contact: "+57 1 234 5678",
    email: "info@bellaitalia.co",
    description: "Auténtica cocina italiana con ingredientes importados directamente de Italia.",
    logo: "🇮🇹",
    coverImage: "linear-gradient(135deg, #009246, #FFFFFF, #CE2B37)",
    primaryColor: "#009246",
    secondaryColor: "#CE2B37",
    minOrder: 35000,
    freeShipping: 80000,
    specialties: ["Pasta Fresca", "Pizza Napolitana", "Risotto", "Tiramisu"],
    products: Array.from({
      length: 52
    }, (_, i) => ({
      id: i + 400,
      name: ["Spaghetti Carbonara", "Pizza Margherita", "Lasagna Bolognese", "Risotto ai Funghi", "Gnocchi Sorrentina", "Antipasto Italiano", "Bruschetta Tradicional", "Carpaccio di Manzo", "Prosciutto di Parma", "Mozzarella di Bufala", "Pasta Penne Arrabbiata", "Fettuccine Alfredo", "Ravioli Ricotta", "Tortellini en Brodo", "Tagliatelle al Ragu", "Pizza Quattro Stagioni", "Pizza Diavola", "Pizza Capricciosa", "Calzone Ripieno", "Focaccia Rosmarino", "Risotto Milanese", "Osso Buco", "Saltimbocca Romana", "Vitello Tonnato", "Pollo Parmigiana", "Tiramisu Casero", "Panna Cotta", "Cannoli Siciliani", "Gelato Artesanal", "Affogato al Caffè", "Vino Chianti", "Prosecco DOCG", "Limoncello", "Espresso Illy", "Cappuccino Italiano", "Aceite Oliva Extra", "Vinagre Balsámico", "Pasta Importada", "Queso Parmigiano", "Tomate San Marzano", "Pan Focaccia", "Grissini Turinesi", "Mortadella Bologna", "Salami Milano", "Bresaola", "Vino Barolo", "Amaretto Disaronno", "Café Lavazza", "Nutella Original", "Biscotti Amaretti"][i % 50] || `Specialità ${i + 1}`,
      price: Math.floor(Math.random() * 150000) + 25000,
      description: "Auténtico sabor italiano preparado por chefs napolitanos",
      stock: Math.floor(Math.random() * 30) + 5,
      category: ["Pasta", "Pizza", "Antipasti", "Dolci", "Vini", "Ingredienti"][Math.floor(Math.random() * 6)],
      isNew: Math.random() > 0.9,
      isFeatured: Math.random() > 0.85,
      discount: Math.random() > 0.85 ? Math.floor(Math.random() * 15) + 5 : 0
    }))
  }, {
    id: "carnes_premium",
    name: "Carnes Premium",
    category: "Carnicería Especializada",
    type: "local",
    rating: 4.8,
    deliveryTime: "1-2 horas",
    location: "Chapinero, Bogotá",
    contact: "+57 1 345 6789",
    email: "pedidos@carnespremium.co",
    description: "Las mejores carnes seleccionadas, maduradas y cortadas por expertos carniceros.",
    logo: "🥩",
    coverImage: "linear-gradient(135deg, #8B0000, #DC143C)",
    primaryColor: "#8B0000",
    secondaryColor: "#DC143C",
    minOrder: 50000,
    freeShipping: 150000,
    specialties: ["Carne Wagyu", "Cortes Premium", "Carne Madurada", "Embutidos Artesanales"],
    products: Array.from({
      length: 54
    }, (_, i) => ({
      id: i + 500,
      name: ["Bife de Chorizo Wagyu", "Ojo de Bife Premium", "Entraña Argentina", "Churrasco Angus", "Lomo Fino", "T-Bone Steak", "Ribeye Madurado", "Tomahawk Premium", "Picanha Brasileña", "Baby Beef", "Cordero Patagónico", "Costillas BBQ", "Chuleta de Cerdo", "Lomo de Cerdo", "Tocino Artesanal", "Chorizo Español", "Morcilla Vasca", "Salchichón Ibérico", "Jamón Serrano", "Panceta Curada", "Hamburguesa Wagyu", "Albóndigas Premium", "Carpaccio Preparado", "Tartar de Res", "Carne Molida Premium", "Pollo Orgánico", "Pechuga Marinada", "Muslos Confitados", "Alas BBQ", "Pollo Entero Premium", "Salmón Atlántico", "Trucha Arcoíris", "Atún Fresco", "Camarones Jumbo", "Langostinos", "Especias para Carne", "Sal de Mar", "Pimienta Premium", "Marinadas", "Salsas Gourmet", "Vino Malbec", "Cerveza Artesanal", "Whisky Premium", "Ron Añejo", "Brandy Reserva", "Parrilla Portátil", "Carbón Premium", "Utensilios BBQ", "Termómetro Carne", "Tabla de Cortar"][i % 50] || `Corte Premium ${i + 1}`,
      price: Math.floor(Math.random() * 200000) + 30000,
      description: "Carnes premium seleccionadas y maduradas por expertos",
      stock: Math.floor(Math.random() * 25) + 3,
      category: ["Res", "Cerdo", "Cordero", "Aves", "Mariscos", "Embutidos"][Math.floor(Math.random() * 6)],
      isNew: Math.random() > 0.88,
      isFeatured: Math.random() > 0.8,
      discount: Math.random() > 0.9 ? Math.floor(Math.random() * 10) + 5 : 0
    }))
  },
  // Resto de proveedores locales especializados (24 más)
  {
    id: "cerdo_dorado",
    name: "El Cerdo Dorado",
    category: "Carnicería de Cerdo",
    type: "local",
    rating: 4.7,
    deliveryTime: "2-3 horas",
    location: "La Candelaria, Bogotá",
    contact: "+57 1 456 7890",
    email: "pedidos@cerdodorado.co",
    description: "Especialistas en carne de cerdo criado en libertad con alimentación natural.",
    logo: "🐷",
    coverImage: "linear-gradient(135deg, #FFB6C1, #FFA500)",
    primaryColor: "#FFB6C1",
    secondaryColor: "#FFA500",
    minOrder: 40000,
    freeShipping: 120000,
    specialties: ["Cerdo Criollo", "Chorizo Artesanal", "Chicharrón", "Lomo Ahumado"],
    products: Array.from({
      length: 51
    }, (_, i) => ({
      id: i + 600,
      name: ["Lomo de Cerdo Premium", "Costillas BBQ", "Chuletas Gruesas", "Pierna de Cerdo", "Tocino Artesanal", "Chorizo Antioqueño", "Morcilla Rellena", "Chicharrón Prensado", "Jamón Casero", "Panceta Curada", "Pernil Ahumado", "Costilla de Cerdo", "Chuleta Ahumada", "Lomo Marinado", "Cabeza de Cerdo", "Patas de Cerdo", "Rabo de Cerdo", "Oreja de Cerdo", "Vísceras Frescas", "Carne Molida de Cerdo"][i % 20] || `Producto Cerdo ${i + 1}`,
      price: Math.floor(Math.random() * 120000) + 20000,
      description: "Carne de cerdo fresca y de calidad premium",
      stock: Math.floor(Math.random() * 30) + 5,
      category: ["Cerdo", "Embutidos", "Ahumados"][Math.floor(Math.random() * 3)],
      isNew: Math.random() > 0.85,
      discount: Math.random() > 0.8 ? Math.floor(Math.random() * 15) + 5 : 0
    }))
  }, {
    id: "mariscos_atlantico",
    name: "Mariscos del Atlántico",
    category: "Pescadería",
    type: "local",
    rating: 4.9,
    deliveryTime: "1-2 horas",
    location: "Mercado Central, Barranquilla",
    contact: "+57 5 567 8901",
    email: "frescos@mariscosatlantico.co",
    description: "Los mariscos más frescos del mar Caribe, directo del puerto a tu mesa.",
    logo: "🦐",
    coverImage: "linear-gradient(135deg, #1E90FF, #00CED1)",
    primaryColor: "#1E90FF",
    secondaryColor: "#00CED1",
    minOrder: 60000,
    freeShipping: 150000,
    specialties: ["Camarón Fresco", "Langosta", "Pulpo", "Pescado del Día"],
    products: Array.from({
      length: 53
    }, (_, i) => ({
      id: i + 700,
      name: ["Camarón Jumbo", "Langostinos Tigre", "Pulpo Fresco", "Calamar Entero", "Jaiba Azul", "Pargo Rojo", "Corvina Fresca", "Róbalo Entero", "Atún Aleta Amarilla", "Salmón del Norte", "Ostras Frescas", "Mejillones", "Almejas", "Caracola", "Cangrejo Azul", "Pescado Bocachico", "Bagre Rayado", "Mojarra Roja", "Sierra", "Cazón", "Filete de Pescado", "Pescado Entero", "Mariscos Mixtos", "Cóctel de Mariscos", "Sopa de Mariscos"][i % 25] || `Marisco ${i + 1}`,
      price: Math.floor(Math.random() * 180000) + 30000,
      description: "Mariscos frescos del Caribe colombiano",
      stock: Math.floor(Math.random() * 20) + 3,
      category: ["Mariscos", "Pescados", "Crustáceos", "Moluscos"][Math.floor(Math.random() * 4)],
      isNew: Math.random() > 0.87,
      discount: Math.random() > 0.85 ? Math.floor(Math.random() * 12) + 3 : 0
    }))
  }, {
    id: "panaderia_artesanal",
    name: "Panadería El Trigal",
    category: "Panadería Artesanal",
    type: "local",
    rating: 4.6,
    deliveryTime: "30-60 min",
    location: "Barrio Rosales, Bogotá",
    contact: "+57 1 678 9012",
    email: "pedidos@panaderiaeltrigal.co",
    description: "Pan artesanal horneado diariamente con ingredientes naturales y recetas tradicionales.",
    logo: "🥖",
    coverImage: "linear-gradient(135deg, #DEB887, #F4A460)",
    primaryColor: "#DEB887",
    secondaryColor: "#F4A460",
    minOrder: 25000,
    freeShipping: 75000,
    specialties: ["Pan Artesanal", "Repostería", "Pasteles", "Galletas"],
    products: Array.from({
      length: 55
    }, (_, i) => ({
      id: i + 800,
      name: ["Pan Integral", "Baguette Francesa", "Pan de Centeno", "Croissant Mantequilla", "Pain au Chocolat", "Torta Tres Leches", "Cheesecake Frutos Rojos", "Tiramisú", "Brownie Chocolate", "Muffin Arándanos", "Galletas Avena", "Cookies Chispas", "Macarons Franceses", "Éclair Vainilla", "Profiteroles", "Pan de Ajo", "Focaccia Herbs", "Ciabatta", "Pan Pita", "Bagel Sésamo", "Torta Chocolate", "Pie de Limón", "Tarta de Frutas", "Cupcakes", "Donuts Glaseadas"][i % 25] || `Producto Panadería ${i + 1}`,
      price: Math.floor(Math.random() * 50000) + 5000,
      description: "Productos de panadería artesanal hechos con amor",
      stock: Math.floor(Math.random() * 50) + 10,
      category: ["Pan", "Repostería", "Galletas", "Pasteles"][Math.floor(Math.random() * 4)],
      isNew: Math.random() > 0.8,
      discount: Math.random() > 0.75 ? Math.floor(Math.random() * 20) + 5 : 0
    }))
  }, {
    id: "lacteos_valle",
    name: "Lácteos del Valle",
    category: "Productos Lácteos",
    type: "local",
    rating: 4.8,
    deliveryTime: "2-4 horas",
    location: "Valle del Cauca",
    contact: "+57 2 789 0123",
    email: "ventas@lacteosvalle.co",
    description: "Productos lácteos frescos y naturales de las mejores ganaderías del Valle del Cauca.",
    logo: "🥛",
    coverImage: "linear-gradient(135deg, #FFFFFF, #F0F8FF)",
    primaryColor: "#4169E1",
    secondaryColor: "#87CEEB",
    minOrder: 35000,
    freeShipping: 100000,
    specialties: ["Leche Fresca", "Quesos Artesanales", "Yogurt Natural", "Mantequilla"],
    products: Array.from({
      length: 52
    }, (_, i) => ({
      id: i + 900,
      name: ["Leche Entera Fresh", "Yogurt Griego Natural", "Queso Campesino", "Mantequilla Artesanal", "Crema de Leche", "Queso Mozzarella", "Queso Parmesano", "Queso Cheddar", "Queso Doble Crema", "Cuajada Fresca", "Suero Costeño", "Arequipe Casero", "Natilla Tradicional", "Kumis Natural", "Yogurt con Frutas", "Leche Deslactosada", "Leche Descremada", "Leche Saborizada", "Batido de Frutas", "Smoothie Natural"][i % 20] || `Lácteo ${i + 1}`,
      price: Math.floor(Math.random() * 40000) + 8000,
      description: "Productos lácteos frescos del Valle",
      stock: Math.floor(Math.random() * 60) + 15,
      category: ["Leches", "Quesos", "Yogurts", "Cremas"][Math.floor(Math.random() * 4)],
      isNew: Math.random() > 0.83,
      discount: Math.random() > 0.78 ? Math.floor(Math.random() * 18) + 5 : 0
    }))
  }, {
    id: "cafe_colombiano",
    name: "Café de Colombia Premium",
    category: "Cafetería Especializada",
    type: "local",
    rating: 4.9,
    deliveryTime: "45-90 min",
    location: "Eje Cafetero",
    contact: "+57 6 890 1234",
    email: "info@cafecolombiano.co",
    description: "El mejor café colombiano tostado artesanalmente, directo desde las montañas del Eje Cafetero.",
    logo: "☕",
    coverImage: "linear-gradient(135deg, #8B4513, #D2691E)",
    primaryColor: "#8B4513",
    secondaryColor: "#D2691E",
    minOrder: 40000,
    freeShipping: 120000,
    specialties: ["Café Premium", "Café Orgánico", "Café Especial", "Accesorios"],
    products: Array.from({
      length: 56
    }, (_, i) => ({
      id: i + 1000,
      name: ["Café Huila Premium", "Café Nariño Especial", "Café Tolima Orgánico", "Café Quindío Supremo", "Café Caldas Tradicional", "Espresso Italiano", "Americano Suave", "Cappuccino Mix", "Latte Macchiato", "Mocha Chocolate", "Café Descafeinado", "Café en Grano", "Café Molido", "Café Instantáneo", "Café Verde", "Cafetera Italiana", "Prensa Francesa", "Filtros de Papel", "Molinillo Manual", "Taza Cerámica"][i % 20] || `Café ${i + 1}`,
      price: Math.floor(Math.random() * 80000) + 15000,
      description: "Café premium colombiano de alta calidad",
      stock: Math.floor(Math.random() * 40) + 8,
      category: ["Café", "Bebidas", "Accesorios"][Math.floor(Math.random() * 3)],
      isNew: Math.random() > 0.86,
      discount: Math.random() > 0.82 ? Math.floor(Math.random() * 15) + 5 : 0
    }))
  },
  // ENVAGAS - Proveedor de GLP verificado
  {
    id: "envagas",
    name: "ENVAGAS",
    category: "Distribuidora de GLP",
    type: "gas" as const,
    rating: 4.9,
    deliveryTime: "2-24 horas",
    location: "Ibagué, Tolima",
    contact: "+57 318 123 4567",
    email: "ventas@envagas.co",
    website: "envagas.co",
    description: "Distribuidora líder de GLP. Soluciones residenciales, industriales y servicio técnico certificado para tu negocio.",
    logo: "🔥",
    coverImage: "linear-gradient(135deg, #F97316, #3B82F6)",
    primaryColor: "#F97316",
    secondaryColor: "#3B82F6",
    minOrder: 0,
    freeShipping: 0,
    isVerified: true,
    externalLink: "/marketplace/envagas",
    specialties: ["Cilindros GLP", "Tanques Industriales", "Servicio Técnico", "Redes de Gas"],
    products: [
      { id: 2001, name: "Cilindro GLP 20 lb", price: 55000, description: "Cilindro residencial ideal para cocinas domésticas", stock: 100, category: "Residencial", isNew: false, isFeatured: true, discount: 0 },
      { id: 2002, name: "Cilindro GLP 30 lb", price: 75000, description: "Cilindro mediano para restaurantes pequeños", stock: 80, category: "Residencial", isNew: false, isFeatured: true, discount: 0 },
      { id: 2003, name: "Cilindro GLP 40 lb", price: 95000, description: "Cilindro grande para uso comercial", stock: 60, category: "Comercial", isNew: false, isFeatured: true, discount: 0 },
      { id: 2004, name: "Cilindro GLP 100 lb", price: 230000, description: "Cilindro industrial para alto consumo", stock: 40, category: "Industrial", isNew: true, isFeatured: true, discount: 0 },
      { id: 2005, name: "Suministro por Cisterna", price: 0, description: "Abastecimiento industrial programado - Solicitar cotización", stock: 999, category: "Industrial", isNew: false, isFeatured: true, discount: 0 },
      { id: 2006, name: "Tanque Estacionario 120 gal", price: 0, description: "Instalación y suministro de tanque estacionario - Cotizar", stock: 20, category: "Industrial", isNew: true, isFeatured: true, discount: 0 },
      { id: 2007, name: "Diseño Redes GLP", price: 0, description: "Diseño profesional de redes de gas - Cotizar", stock: 999, category: "Servicio Técnico", isNew: false, isFeatured: false, discount: 0 },
      { id: 2008, name: "Mantenimiento Redes", price: 0, description: "Servicio de mantenimiento preventivo y correctivo", stock: 999, category: "Servicio Técnico", isNew: false, isFeatured: false, discount: 0 },
      { id: 2009, name: "Certificación Gas", price: 0, description: "Certificación de instalaciones de gas", stock: 999, category: "Servicio Técnico", isNew: false, isFeatured: true, discount: 0 },
      { id: 2010, name: "Instalación Completa", price: 0, description: "Construcción e instalación de redes de gas", stock: 999, category: "Servicio Técnico", isNew: false, isFeatured: false, discount: 0 },
      { id: 2011, name: "Tanque 300 gal", price: 0, description: "Tanque estacionario mediana capacidad - Cotizar", stock: 15, category: "Industrial", isNew: false, isFeatured: false, discount: 0 },
      { id: 2012, name: "Tanque 500 gal", price: 0, description: "Tanque estacionario alta capacidad - Cotizar", stock: 10, category: "Industrial", isNew: false, isFeatured: false, discount: 0 }
    ]
  }
  ];

  // Filtrar proveedores
  const filteredSuppliers = suppliers.filter(supplier => supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) || supplier.category.toLowerCase().includes(searchTerm.toLowerCase()) || supplier.location.toLowerCase().includes(searchTerm.toLowerCase()) || supplier.specialties.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase())));

  // Filtrar productos en la tienda
  const filteredProducts = selectedStore?.products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase()) || product.description.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory = selectedCategory === 'todos' || product.category.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  }) || [];
  const categories = selectedStore ? ['todos', ...Array.from(new Set(selectedStore.products.map(p => p.category)))] : [];
  const addToCart = (product: Product, supplier: Supplier) => {
    const cartItem = {
      ...product,
      supplierId: supplier.id,
      supplierName: supplier.name,
      supplierLogo: supplier.logo,
      quantity: 1
    };
    const existingIndex = cart.findIndex(item => item.id === product.id && item.supplierId === supplier.id);
    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, cartItem]);
    }
    toast({
      title: "Producto agregado",
      description: `${product.name} añadido al carrito`,
      duration: 1500
    });
  };
  const updateCartQuantity = (itemIndex: number, quantity: number) => {
    if (quantity <= 0) {
      const newCart = cart.filter((_, index) => index !== itemIndex);
      setCart(newCart);
    } else {
      const newCart = [...cart];
      newCart[itemIndex].quantity = quantity;
      setCart(newCart);
    }
  };
  const removeFromCart = (itemIndex: number) => {
    setCart(cart.filter((_, index) => index !== itemIndex));
  };
  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };
  const getTotalPrice = () => {
    return cart.reduce((sum, item) => {
      const discountedPrice = item.discount ? item.price * (1 - item.discount / 100) : item.price;
      return sum + discountedPrice * item.quantity;
    }, 0);
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };
  const enterStore = (supplier: Supplier) => {
    setSelectedStore(supplier);
    setCurrentView('store');
    setProductSearch('');
    setSelectedCategory('todos');
  };
  const exitStore = () => {
    setCurrentView('marketplace');
    setSelectedStore(null);
  };
  const processOrder = () => {
    if (cart.length === 0) return;
    const orderNumber = `MKT-${Date.now()}`;
    const orderData = {
      id: orderNumber,
      items: cart,
      total: getTotalPrice(),
      paymentMethod,
      microcreditTerms: paymentMethod === 'microcredit' ? microcreditTerms : null,
      monthlyPayment: paymentMethod === 'microcredit' ? calculateMicrocreditPayment(getTotalPrice(), microcreditTerms) : null,
      status: 'confirmed',
      estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000),
      // 45 minutes
      restaurant: "Tu Restaurante",
      customer: {
        name: "Cliente Demo",
        phone: "+57 300 123 4567",
        address: "Calle 123 #45-67, Bogotá"
      }
    };
    setOrderTracking(orderData);
    setCurrentView('tracking');
    toast({
      title: "¡Pedido confirmado! 🎉",
      description: `Orden ${orderNumber} por ${formatCurrency(getTotalPrice())} confirmada. Seguimiento activado.`
    });
    setCart([]);
  };
  const calculateMicrocreditPayment = (amount: number, months: number) => {
    // Fórmula del sistema francés (interés compuesto)
    // PMT = P × [r(1+r)^n] / [(1+r)^n - 1]
    const monthlyRate = currentRate / 100; // Tasa mensual directa
    if (monthlyRate === 0) return amount / months; // Sin interés
    
    const payment = amount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    return payment;
  };
  if (currentView === 'store' && selectedStore) {
    return <div className="min-h-screen" style={{
      background: `linear-gradient(135deg, ${selectedStore.primaryColor}15, ${selectedStore.secondaryColor}15)`
    }}>
        {/* Store Header */}
        <div className="relative h-64 bg-cover bg-center" style={{
        background: selectedStore.coverImage
      }}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-center justify-between p-6">
            <Button variant="outline" onClick={exitStore} className="bg-white/20 border-white/30 text-white hover:bg-white/30">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Marketplace
            </Button>
            
            {/* Cart Button */}
            <Button className="bg-white/20 border-white/30 text-white hover:bg-white/30 relative" variant="outline">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Carrito ({getTotalItems()})
              {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {getTotalItems()}
                </span>}
            </Button>
          </div>
        </div>

        {/* Store Info */}
        <div className="relative -mt-16 mx-6">
          <Card className="p-6 bg-gradient-to-br from-blue-900 via-blue-800 to-gray-900 shadow-2xl border-2 border-blue-500/30">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-lg ring-4 ring-blue-400/30" style={{
                backgroundColor: selectedStore.primaryColor
              }}>
                  {selectedStore.logo}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-3xl font-bold text-white">{selectedStore.name}</h1>
                    <Badge className="text-white bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg" style={{
                    backgroundColor: selectedStore.primaryColor
                  }}>
                      {selectedStore.type === 'supermarket' ? 'Supermercado' : 'Local'}
                    </Badge>
                  </div>
                  <p className="text-gray-300 mt-1 text-xs line-clamp-2 leading-tight">{selectedStore.description}</p>
                  <div className="flex flex-wrap gap-2 mt-3 text-xs">
                    <div className="flex items-center space-x-1 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-full border border-white/20">
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      <span className="font-medium text-white">{selectedStore.rating}</span>
                    </div>
                    <div className="flex items-center space-x-1 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-full border border-white/20">
                      <Clock className="h-3 w-3 text-blue-300" />
                      <span className="truncate max-w-20 text-white">{selectedStore.deliveryTime}</span>
                    </div>
                    <div className="flex items-center space-x-1 bg-white/10 backdrop-blur-sm px-2 py-1 rounded-full border border-white/20">
                      <MapPin className="h-3 w-3 text-blue-300" />
                      <span className="truncate max-w-24 text-white">{selectedStore.location}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {selectedStore.specialties.map(specialty => <Badge key={specialty} variant="outline" className="bg-white/10 border-white/30 text-white">
                  {specialty}
                </Badge>)}
            </div>

            <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
              <div className="text-center p-3 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-lg border border-green-400/30 backdrop-blur-sm">
                <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-400" />
                <p className="font-medium text-white">Pedido mínimo</p>
                <p className="text-green-300">{formatCurrency(selectedStore.minOrder)}</p>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg border border-blue-400/30 backdrop-blur-sm">
                <Truck className="h-5 w-5 mx-auto mb-1 text-blue-400" />
                <p className="font-medium text-white">Envío gratis desde</p>
                <p className="text-blue-300">{formatCurrency(selectedStore.freeShipping)}</p>
              </div>
              <div className="text-center p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-lg border border-purple-400/30 backdrop-blur-sm">
                <Package className="h-5 w-5 mx-auto mb-1 text-purple-400" />
                <p className="font-medium text-white">Productos</p>
                <p className="text-purple-300">{selectedStore.products.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Product Filters */}
        <div className="p-6">
          <Card className="p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-blue-500/30">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Buscar productos..." className="pl-10 bg-gray-700/50 border-white/20 text-white placeholder:text-gray-400" value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                </div>
                
                <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="px-3 py-2 border rounded-md bg-gray-700/50 border-white/20 text-white">
                  {categories.map(category => <option key={category} value={category} className="bg-gray-800">
                      {category === 'todos' ? 'Todas las categorías' : category}
                    </option>)}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gray-700/50 border-white/20 text-white hover:bg-gray-600'}>
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')} className={viewMode === 'list' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-gray-700/50 border-white/20 text-white hover:bg-gray-600'}>
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Products Grid */}
        <div className="px-6 pb-6">
          {filteredProducts.length === 0 ? <Card className="p-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No se encontraron productos</h3>
              <p className="text-muted-foreground">
                Intenta cambiar los filtros de búsqueda
              </p>
            </Card> : <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
              {filteredProducts.map(product => <Card key={product.id} className={`overflow-hidden hover:shadow-lg transition-all ${viewMode === 'list' ? 'flex items-center p-4' : 'h-full'}`}>
                  {viewMode === 'grid' ? <div className="h-full flex flex-col">
                      <div className="relative">
                        <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <Package className="h-16 w-16 text-gray-400" />
                        </div>
                        {product.isNew && <Badge className="absolute top-2 left-2 bg-green-500">Nuevo</Badge>}
                        {product.discount && <Badge className="absolute top-2 right-2 bg-red-500">
                            -{product.discount}%
                          </Badge>}
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</h3>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {product.description}
                          </p>
                          <Badge variant="outline" className="text-xs mb-2">
                            {product.category}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            {product.discount ? <div className="flex flex-col">
                                <span className="text-xs text-muted-foreground line-through">
                                  {formatCurrency(product.price)}
                                </span>
                                <span className="font-bold text-green-600">
                                  {formatCurrency(product.price * (1 - product.discount / 100))}
                                </span>
                              </div> : <span className="font-bold text-lg" style={{
                      color: selectedStore.primaryColor
                    }}>
                                {formatCurrency(product.price)}
                              </span>}
                            <span className="text-xs text-muted-foreground">
                              Stock: {product.stock}
                            </span>
                          </div>
                          <Button className="w-full text-white" style={{
                    backgroundColor: selectedStore.primaryColor
                  }} onClick={() => addToCart(product, selectedStore)} disabled={product.stock === 0}>
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar
                          </Button>
                        </div>
                      </div>
                    </div> : <div className="flex items-center space-x-4 w-full">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{product.name}</h3>
                            <p className="text-sm text-muted-foreground">{product.description}</p>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {product.category}
                            </Badge>
                          </div>
                          <div className="text-right">
                            {product.discount ? <div>
                                <span className="text-sm text-muted-foreground line-through block">
                                  {formatCurrency(product.price)}
                                </span>
                                <span className="font-bold text-green-600">
                                  {formatCurrency(product.price * (1 - product.discount / 100))}
                                </span>
                              </div> : <span className="font-bold text-lg" style={{
                      color: selectedStore.primaryColor
                    }}>
                                {formatCurrency(product.price)}
                              </span>}
                            <p className="text-xs text-muted-foreground mt-1">Stock: {product.stock}</p>
                          </div>
                        </div>
                      </div>
                      <Button className="text-white" style={{
                backgroundColor: selectedStore.primaryColor
              }} onClick={() => addToCart(product, selectedStore)} disabled={product.stock === 0}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>}
                </Card>)}
            </div>}
        </div>

        {/* Floating Cart Summary */}
        {cart.length > 0 && <div className="fixed bottom-6 right-6 z-50 animate-slide-in-right">
            <Card className="p-4 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 shadow-2xl border-2 border-blue-500/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold text-white">Carrito ({getTotalItems()})</span>
                <span className="font-bold text-lg bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                  {formatCurrency(getTotalPrice())}
                </span>
              </div>
              <Button className="w-full bg-gradient-to-r from-orange-500 via-pink-500 to-orange-600 hover:from-orange-600 hover:via-pink-600 hover:to-orange-700 text-white shadow-lg hover:shadow-orange-500/50 transition-all duration-300" onClick={() => setCurrentView('payment')}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Ir a Pagar
              </Button>
            </Card>
          </div>}
      </div>;
  }

  // Vista de pago con métodos completos
  if (currentView === 'payment') {
    return <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-black p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center mb-6">
            <Button variant="outline" onClick={() => setCurrentView('marketplace')} className="mr-4 bg-white/10 border-white/20 text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <h1 className="text-3xl font-bold text-white">
              Pasarela de Pago
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment Methods */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 bg-gray-800/50 border-white/10 shadow-xl backdrop-blur-sm">
                <h2 className="text-xl font-bold mb-4 text-white">Método de Pago</h2>
                
                <div className="space-y-4">
                  {/* Cash Payment */}
                  <Card className={`p-4 cursor-pointer transition-all bg-gray-700/30 border-white/10 ${paymentMethod === 'cash' ? 'border-primary shadow-primary bg-primary/20' : 'hover:shadow-md hover:bg-gray-700/50'}`} onClick={() => setPaymentMethod('cash')}>
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-green-500/20 rounded-full">
                        <DollarSign className="h-6 w-6 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Pago en Efectivo</h3>
                        <p className="text-sm text-gray-300">
                          Paga en efectivo al recibir tu pedido
                        </p>
                      </div>
                      {paymentMethod === 'cash' && <CheckCircle className="h-5 w-5 text-primary ml-auto" />}
                    </div>
                  </Card>

                  {/* Card Payment */}
                  <Card className={`p-4 cursor-pointer transition-all bg-gray-700/30 border-white/10 ${paymentMethod === 'card' ? 'border-primary shadow-primary bg-primary/20' : 'hover:shadow-md hover:bg-gray-700/50'}`} onClick={() => setPaymentMethod('card')}>
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-500/20 rounded-full">
                        <CreditCard className="h-6 w-6 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Tarjeta de Crédito/Débito</h3>
                        <p className="text-sm text-gray-300">
                          Pago seguro con tu tarjeta bancaria
                        </p>
                      </div>
                      {paymentMethod === 'card' && <CheckCircle className="h-5 w-5 text-primary ml-auto" />}
                    </div>
                    
                    {paymentMethod === 'card' && <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white">Número de Tarjeta</Label>
                            <Input placeholder="1234 5678 9012 3456" className="bg-gray-700/50 border-white/20 text-white placeholder:text-gray-400" />
                          </div>
                          <div>
                            <Label className="text-white">Nombre en la Tarjeta</Label>
                            <Input placeholder="JUAN PEREZ" className="bg-gray-700/50 border-white/20 text-white placeholder:text-gray-400" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-white">Fecha de Vencimiento</Label>
                            <Input placeholder="MM/AA" className="bg-gray-700/50 border-white/20 text-white placeholder:text-gray-400" />
                          </div>
                          <div>
                            <Label className="text-white">CVV</Label>
                            <Input placeholder="123" className="bg-gray-700/50 border-white/20 text-white placeholder:text-gray-400" />
                          </div>
                        </div>
                      </div>}
                  </Card>

                  {/* Microcredit */}
                  <Card className={`p-4 cursor-pointer transition-all bg-gray-700/30 border-white/10 ${paymentMethod === 'microcredit' ? 'border-cyan-500 shadow-cyan-500/50 bg-gradient-to-br from-cyan-900/30 to-teal-900/30' : 'hover:shadow-md hover:bg-gray-700/50'}`} onClick={() => setPaymentMethod('microcredit')}>
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-cyan-500/20 rounded-full">
                        <Percent className="h-6 w-6 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Microcrédito Conektao</h3>
                        <p className="text-sm text-gray-300">
                          Compra ahora y paga en cuotas sin tarjeta
                        </p>
                      </div>
                      {paymentMethod === 'microcredit' && <CheckCircle className="h-5 w-5 text-cyan-400 ml-auto" />}
                    </div>
                    
                     {paymentMethod === 'microcredit' && <div className="mt-4 pt-4 border-t space-y-4">
                        {/* Perfil crediticio automático con fondo atractivo */}
                        <div className="bg-gradient-to-r from-cyan-50 via-teal-50 to-cyan-100 p-5 rounded-xl mb-4 border border-cyan-200 shadow-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-cyan-800">Tu Perfil Crediticio</h4>
                            <div className={`${predefinedRates[autoCalculatedProfile].color} text-white px-3 py-1 rounded-full flex items-center space-x-2 shadow-md`}>
                              <span>{predefinedRates[autoCalculatedProfile].icon}</span>
                              <span className="font-bold">{predefinedRates[autoCalculatedProfile].label}</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                            <div>
                              <span className="text-cyan-700">Tasa mensual:</span>
                              <p className="font-bold text-lg text-cyan-600">{currentRate}%</p>
                            </div>
                            <div>
                              <span className="text-cyan-700">Nivel:</span>
                              <p className="font-medium text-cyan-800">{predefinedRates[autoCalculatedProfile].description}</p>
                            </div>
                          </div>
                          <div className="bg-white/80 p-4 rounded-lg shadow-sm border border-cyan-100">
                            <p className="text-sm text-cyan-800 flex items-center">
                              <span className="mr-2">🧠</span>
                              <span className="font-medium">
                                Tu tasa es calculada automáticamente. Mientras más uses Conektao y pagues a tiempo, podrás mejorarla y pagar menos intereses.
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 bg-gradient-to-r from-cyan-50 to-teal-50 p-4 rounded-lg">
                          <div>
                            <Label className="text-cyan-800">Plazo (meses)</Label>
                            <select value={microcreditTerms} onChange={e => setMicrocreditTerms(parseInt(e.target.value))} className="w-full p-2 border border-cyan-200 rounded-md focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200">
                              <option value={6}>6 meses</option>
                              <option value={12}>12 meses</option>
                              <option value={18}>18 meses</option>
                              <option value={24}>24 meses</option>
                            </select>
                          </div>
                          <div>
                            <Label className="text-cyan-800">Cuota Mensual</Label>
                            <div className="p-2 bg-cyan-100 border border-cyan-200 rounded-md text-center font-bold text-cyan-700 shadow-sm">
                              {formatCurrency(calculateMicrocreditPayment(getTotalPrice(), microcreditTerms))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-cyan-50 via-teal-50 to-cyan-100 p-4 rounded-lg border border-cyan-200">
                          <h4 className="font-semibold text-cyan-800 mb-2">Resumen del Crédito</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-cyan-700">Monto total:</span>
                              <p className="font-bold text-cyan-800">{formatCurrency(getTotalPrice())}</p>
                            </div>
                            <div>
                              <span className="text-cyan-700">Total a pagar:</span>
                              <p className="font-bold text-cyan-800">
                                {formatCurrency(calculateMicrocreditPayment(getTotalPrice(), microcreditTerms) * microcreditTerms)}
                              </p>
                            </div>
                            <div>
                              <span className="text-cyan-700">Intereses:</span>
                              <p className="font-bold text-cyan-600">
                                {formatCurrency(calculateMicrocreditPayment(getTotalPrice(), microcreditTerms) * microcreditTerms - getTotalPrice())}
                              </p>
                            </div>
                            <div>
                              <span className="text-cyan-700">Plazo:</span>
                              <p className="font-bold text-cyan-800">{microcreditTerms} meses</p>
                            </div>
                          </div>
                        </div>
                      </div>}
                  </Card>
                </div>
              </Card>

              {/* Delivery Address */}
              <Card className="p-6 bg-gray-800/50 border-white/10 shadow-xl backdrop-blur-sm">
                <h2 className="text-xl font-bold mb-4 text-white">Dirección de Entrega</h2>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Dirección completa</Label>
                    <Input placeholder="Calle 123 #45-67" className="bg-gray-700/50 border-white/20 text-white placeholder:text-gray-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Ciudad</Label>
                      <Input placeholder="Bogotá" className="bg-gray-700/50 border-white/20 text-white placeholder:text-gray-400" />
                    </div>
                    <div>
                      <Label className="text-white">Código Postal</Label>
                      <Input placeholder="110111" className="bg-gray-700/50 border-white/20 text-white placeholder:text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-white">Instrucciones especiales</Label>
                    <textarea className="w-full p-2 border rounded-md bg-gray-700/50 border-white/20 text-white placeholder:text-gray-400" rows={3} placeholder="Apartamento 401, tocar el timbre..." />
                  </div>
                </div>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="space-y-6">
              <Card className="p-6 bg-gray-800/50 border-white/10 shadow-xl backdrop-blur-sm">
                <h2 className="text-xl font-bold mb-4 text-white">Resumen del Pedido</h2>
                
                <div className="space-y-3 mb-4">
                  {cart.map((item, index) => <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <span>{item.supplierLogo}</span>
                        <span className="truncate text-white">{item.name}</span>
                        <span className="text-gray-400">x{item.quantity}</span>
                      </div>
                      <span className="font-medium text-white">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>)}
                </div>

                <div className="border-t border-white/10 pt-4 space-y-2">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal:</span>
                    <span className="text-white">{formatCurrency(getTotalPrice())}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Envío:</span>
                    <span className="text-green-400">Gratis</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span className="text-white">Total:</span>
                    <span className="text-green-400">{formatCurrency(getTotalPrice())}</span>
                  </div>
                  
                  {paymentMethod === 'microcredit' && <div className="bg-gradient-to-r from-cyan-50 via-teal-50 to-cyan-100 p-3 rounded-lg mt-4 border border-cyan-200">
                      <div className="flex justify-between text-sm">
                        <span className="text-cyan-700">Cuota mensual:</span>
                        <span className="font-bold text-cyan-600">
                          {formatCurrency(calculateMicrocreditPayment(getTotalPrice(), microcreditTerms))}
                        </span>
                      </div>
                    </div>}
                </div>

                <Button className="w-full mt-6 bg-gradient-primary text-lg py-4 text-white" onClick={processOrder}>
                  {paymentMethod === 'cash' && '💰 Confirmar Pedido'}
                  {paymentMethod === 'card' && '💳 Pagar con Tarjeta'}
                  {paymentMethod === 'microcredit' && '📊 Confirmar Crédito'}
                </Button>
              </Card>

              {/* Payment Security */}
              <Card className="p-4 bg-gradient-to-r from-green-900/30 to-blue-900/30 border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/20 rounded-full">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white">Pago 100% Seguro</h3>
                    <p className="text-xs text-gray-300">
                      Tus datos están protegidos con encriptación SSL
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>;
  }

  // Vista de seguimiento tipo Uber
  if (currentView === 'tracking' && orderTracking) {
    return <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                🚚 Seguimiento de Pedido
              </h1>
              <p className="text-muted-foreground">Orden #{orderTracking.id}</p>
            </div>
            <Button variant="outline" onClick={() => setCurrentView('marketplace')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Marketplace
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Status Timeline */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6 bg-white shadow-xl">
                <h2 className="text-xl font-bold mb-6">Estado del Pedido</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Pedido Confirmado</h3>
                      <p className="text-sm text-muted-foreground">Tu pedido ha sido recibido</p>
                      <p className="text-xs text-green-600">Completado - hace 2 min</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                      <Package className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Preparando Pedido</h3>
                      <p className="text-sm text-muted-foreground">Los proveedores están preparando tus productos</p>
                      <p className="text-xs text-blue-600">En proceso - 15 min estimados</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 opacity-50">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <Truck className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">En Camino</h3>
                      <p className="text-sm text-muted-foreground">Tu pedido está siendo enviado</p>
                      <p className="text-xs text-gray-500">Pendiente</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 opacity-50">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">Entregado</h3>
                      <p className="text-sm text-muted-foreground">Pedido entregado al restaurante</p>
                      <p className="text-xs text-gray-500">Pendiente</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Live Map Simulation */}
              <Card className="p-6 bg-white shadow-xl">
                <h2 className="text-xl font-bold mb-4">Ubicación en Tiempo Real</h2>
                <div className="h-64 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0icmdiYSgwLDAsMCwwLjEpIi8+Cjwvc3ZnPgo=')] opacity-20"></div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4 mx-auto animate-bounce">
                      <Truck className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="font-semibold text-lg">Preparando en:</h3>
                    <p className="text-muted-foreground">Múltiples proveedores</p>
                    <p className="text-sm text-blue-600 mt-2">Estimado: 15-20 min</p>
                  </div>
                  
                  {/* Animated delivery route */}
                  <div className="absolute top-4 left-4 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <div className="absolute bottom-4 right-4 w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="absolute top-1/2 left-1/2 w-1 h-20 bg-blue-300 transform -translate-x-1/2 -translate-y-1/2 rotate-45"></div>
                </div>
              </Card>
            </div>

            {/* Order Details */}
            <div className="space-y-6">
              <Card className="p-6 bg-white shadow-xl">
                <h2 className="text-xl font-bold mb-4">Detalles del Pedido</h2>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Tiempo Estimado</h3>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <span className="text-lg font-bold text-blue-600">35-45 min</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold">Método de Pago</h3>
                    <p className="capitalize">
                      {orderTracking.paymentMethod === 'cash' && '💰 Efectivo'}
                      {orderTracking.paymentMethod === 'card' && '💳 Tarjeta'}
                      {orderTracking.paymentMethod === 'microcredit' && '📊 Microcrédito'}
                    </p>
                    {orderTracking.paymentMethod === 'microcredit' && <p className="text-sm text-orange-600">
                        {orderTracking.microcreditTerms} cuotas de {formatCurrency(orderTracking.monthlyPayment)}
                      </p>}
                  </div>

                  <div>
                    <h3 className="font-semibold">Total</h3>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(orderTracking.total)}
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold">Entrega a</h3>
                    <p className="text-sm">{orderTracking.restaurant}</p>
                    <p className="text-sm text-muted-foreground">{orderTracking.customer.address}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-white shadow-xl">
                <h2 className="text-xl font-bold mb-4">Productos ({orderTracking.items.length})</h2>
                
                <div className="space-y-3">
                  {orderTracking.items.map((item: any, index: number) => <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span>{item.supplierLogo}</span>
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.supplierName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">x{item.quantity}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>)}
                </div>
              </Card>

              {/* Contact Options */}
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-green-50">
                <h3 className="font-semibold mb-3">¿Necesitas ayuda?</h3>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Phone className="h-4 w-4 mr-2" />
                    Llamar al repartidor
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Chat con soporte
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>;
  }

  // Vista principal del marketplace
  return <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            className="bg-gradient-primary relative" 
            onClick={() => setCurrentView('payment')}
            disabled={cart.length === 0}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Mi Carrito ({getTotalItems()})
            {cart.length > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-sm flex items-center justify-center">
                {getTotalItems()}
              </span>}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 -mt-4">
        
        
        <Card className="p-3 bg-gradient-card border-0 shadow-elegant w-64 h-20">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-0.5">Total en Carrito</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(getTotalPrice())}</p>
            </div>
          </div>
        </Card>
        
      </div>

      {/* Search and Filters */}
      <Card className="p-6 bg-gradient-card border-0 shadow-card">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="Buscar proveedores, productos, categorías..." className="pl-12 h-12 text-lg" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <Button variant="outline" className="h-12 px-6">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </Button>
        </div>
      </Card>

      {/* Suppliers Categories */}
      <div className="space-y-6">
        {/* Supermercados */}
        <div>
          <h3 className="text-2xl font-bold mb-4 flex items-center">
            <div className="w-2 h-8 bg-gradient-primary rounded-full mr-3"></div>
            Supermercados Principales
          </h3>
          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredSuppliers.filter(s => s.type === 'supermarket').map(supplier => <Card key={supplier.id} className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group" onClick={() => enterStore(supplier)}>
                <div className="h-32 relative" style={{
              background: supplier.coverImage
            }}>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all" />
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center space-x-1 bg-white/20 rounded-full px-3 py-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-white font-medium">{supplier.rating}</span>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg" style={{
                  backgroundColor: supplier.primaryColor
                }}>
                      {supplier.logo}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-bold text-lg mb-1">{supplier.name}</h4>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {supplier.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{supplier.deliveryTime}</span>
                    </div>
                    <Badge className="text-white" style={{
                  backgroundColor: supplier.primaryColor
                }}>
                      {supplier.products.length} productos
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3 mb-4">
                    {supplier.specialties.slice(0, 2).map(specialty => <Badge key={specialty} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>)}
                  </div>
                  <Button 
                    className="w-full bg-gradient-primary hover:bg-gradient-primary/90 text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      enterStore(supplier);
                    }}
                  >
                    <Store className="h-4 w-4 mr-2" />
                    Ver Productos
                  </Button>
                </div>
              </Card>)}
          </div>
          
          {/* Mobile Horizontal Carousel */}
          <div className="md:hidden">
            <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
              {filteredSuppliers.filter(s => s.type === 'supermarket').map(supplier => 
                <Card key={supplier.id} className="flex-shrink-0 w-64 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group" onClick={() => enterStore(supplier)}>
                  <div className="h-24 relative" style={{
                    background: supplier.coverImage
                  }}>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all" />
                    <div className="absolute top-2 right-2">
                      <div className="flex items-center space-x-1 bg-white/20 rounded-full px-2 py-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-white text-xs font-medium">{supplier.rating}</span>
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-lg" style={{
                        backgroundColor: supplier.primaryColor
                      }}>
                        {supplier.logo}
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-bold text-sm mb-1">{supplier.name}</h4>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {supplier.description}
                    </p>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{supplier.deliveryTime}</span>
                      </div>
                      <Badge className="text-white text-xs" style={{
                        backgroundColor: supplier.primaryColor
                      }}>
                        {supplier.products.length}
                      </Badge>
                    </div>
                    <Button 
                      size="sm"
                      className="w-full mt-2 bg-gradient-primary hover:bg-gradient-primary/90 text-white text-xs py-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        enterStore(supplier);
                      }}
                    >
                      <Store className="h-3 w-3 mr-1" />
                      Ver Tienda
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Proveedores Locales */}
        <div>
          <h3 className="text-2xl font-bold mb-4 flex items-center">
            <div className="w-2 h-8 bg-gradient-secondary rounded-full mr-3"></div>
            Proveedores Especializados
          </h3>
          {/* Desktop Grid */}
          <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSuppliers.filter(s => s.type === 'local').map(supplier => <Card key={supplier.id} onClick={() => enterStore(supplier)} className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group py-0 my-0">
                <div className="h-40 relative" style={{
              background: supplier.coverImage
            }}>
                  <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-all" />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/20 text-white border-white/30">
                      Local
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center space-x-1 bg-white/20 rounded-full px-3 py-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-white font-medium">{supplier.rating}</span>
                    </div>
                  </div>
                  <div className="absolute bottom-4 left-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-xl" style={{
                  backgroundColor: supplier.primaryColor
                }}>
                      {supplier.logo}
                    </div>
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="font-bold text-xl mb-1">{supplier.name}</h4>
                  <p className="text-sm text-primary font-medium mb-2">{supplier.category}</p>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {supplier.description}
                  </p>
                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{supplier.location}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{supplier.deliveryTime}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {supplier.specialties.map(specialty => <Badge key={specialty} variant="outline" className="text-xs" style={{
                  borderColor: supplier.primaryColor,
                  color: supplier.primaryColor
                }}>
                        {specialty}
                      </Badge>)}
                  </div>
                  <div className="text-center">
                    <Button 
                      className="w-full bg-gradient-primary hover:bg-gradient-primary/90 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        enterStore(supplier);
                      }}
                    >
                      <Store className="h-4 w-4 mr-2" />
                      Entrar a la Tienda
                    </Button>
                  </div>
                </div>
              </Card>)}
          </div>
          
          {/* Mobile Horizontal Carousel */}
          <div className="md:hidden">
            <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
              {filteredSuppliers.filter(s => s.type === 'local').map(supplier => 
                <Card key={supplier.id} className="flex-shrink-0 w-64 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group" onClick={() => enterStore(supplier)}>
                  <div className="h-24 relative" style={{
                    background: supplier.coverImage
                  }}>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all" />
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-white/20 text-white border-white/30 text-xs">
                        Local
                      </Badge>
                    </div>
                    <div className="absolute top-2 right-2">
                      <div className="flex items-center space-x-1 bg-white/20 rounded-full px-2 py-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-white text-xs font-medium">{supplier.rating}</span>
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-lg" style={{
                        backgroundColor: supplier.primaryColor
                      }}>
                        {supplier.logo}
                      </div>
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-bold text-sm mb-1">{supplier.name}</h4>
                    <p className="text-xs text-primary font-medium mb-1">{supplier.category}</p>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {supplier.description}
                    </p>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">{supplier.location}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{supplier.deliveryTime}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {supplier.specialties.slice(0, 2).map(specialty => 
                        <Badge key={specialty} variant="outline" className="text-xs" style={{
                          borderColor: supplier.primaryColor,
                          color: supplier.primaryColor
                        }}>
                          {specialty}
                        </Badge>
                      )}
                    </div>
                    <Button 
                      size="sm"
                      className="w-full bg-gradient-primary hover:bg-gradient-primary/90 text-white text-xs py-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        enterStore(supplier);
                      }}
                    >
                      <Store className="h-3 w-3 mr-1" />
                      Entrar
                    </Button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Servicios Industriales - ENVAGAS Featured */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold flex items-center">
            <div className="w-2 h-8 bg-gradient-to-b from-orange-500 to-blue-500 rounded-full mr-3"></div>
            Servicios Industriales
            <Badge className="ml-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
              Nuevo
            </Badge>
          </h3>
          
          {/* Envagas Featured Card */}
          {filteredSuppliers.filter(s => s.type === 'gas').map(supplier => (
            <Card 
              key={supplier.id}
              className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group border-2 border-orange-500/30 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 relative"
              onClick={() => supplier.externalLink ? navigate(supplier.externalLink) : enterStore(supplier)}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="p-6 md:p-8 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 via-orange-600 to-blue-600 shadow-xl group-hover:scale-110 transition-transform">
                      <Flame className="h-8 w-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="text-2xl font-bold text-white">{supplier.name}</h4>
                        {supplier.isVerified && (
                          <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 shadow-lg shadow-orange-500/30">
                            <Shield className="h-3 w-3 mr-1" />
                            Verificado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-orange-400 font-medium mb-2">{supplier.category}</p>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-yellow-400 font-semibold">{supplier.rating}</span>
                        <span className="text-xs text-gray-500 ml-1">(238 reseñas)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <p className="text-gray-400 mb-3 line-clamp-2">{supplier.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {supplier.specialties.map(specialty => (
                        <Badge 
                          key={specialty}
                          variant="outline" 
                          className="border-orange-500/30 text-orange-400 bg-orange-500/10"
                        >
                          {specialty === 'Servicio Técnico' && <Wrench className="h-3 w-3 mr-1" />}
                          {specialty === 'Tanques Industriales' && <Truck className="h-3 w-3 mr-1" />}
                          {specialty === 'Cilindros GLP' && <Flame className="h-3 w-3 mr-1" />}
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <div className="space-y-1 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-cyan-400" />
                        <span>Entrega: {supplier.deliveryTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-cyan-400" />
                        <span>{supplier.location}</span>
                      </div>
                    </div>
                    <Button 
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 shadow-lg shadow-orange-500/20 group-hover:shadow-orange-500/40 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (supplier.externalLink) {
                          navigate(supplier.externalLink);
                        } else {
                          enterStore(supplier);
                        }
                      }}
                    >
                      <Store className="h-4 w-4 mr-2" />
                      Ver Productos y Servicios
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

        {/* Floating Cart Summary with Payment Gateway */}
        {cart.length > 0 && <div className="fixed bottom-6 right-6 z-50 animate-slide-in-right">
            <Card className="p-6 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 shadow-2xl border-2 border-blue-500/50 max-w-sm backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg text-white">Mi Carrito</h3>
                <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg">
                  {getTotalItems()} productos
                </Badge>
              </div>
              
              <div className="space-y-2 max-h-32 overflow-y-auto mb-4">
                {cart.slice(0, 3).map((item, index) => <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <span>{item.supplierLogo}</span>
                      <span className="truncate max-w-32 text-white">{item.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" className="h-6 w-6 p-0 bg-gray-700/50 border-white/20 text-white hover:bg-gray-600" onClick={() => updateCartQuantity(index, item.quantity - 1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-medium text-white">{item.quantity}</span>
                      <Button size="sm" variant="outline" className="h-6 w-6 p-0 bg-gray-700/50 border-white/20 text-white hover:bg-gray-600" onClick={() => updateCartQuantity(index, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>)}
                {cart.length > 3 && <p className="text-xs text-gray-400 text-center">
                    y {cart.length - 3} productos más...
                  </p>}
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-bold text-lg text-white">Total:</span>
                  <span className="font-bold text-xl bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                    {formatCurrency(getTotalPrice())}
                  </span>
                </div>
                <Button className="w-full bg-gradient-to-r from-orange-500 via-pink-500 to-orange-600 hover:from-orange-600 hover:via-pink-600 hover:to-orange-700 text-white text-lg py-3 shadow-lg hover:shadow-orange-500/50 transition-all duration-300" onClick={() => setCurrentView('payment')}>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Ir a Pagar
                </Button>
              </div>
            </Card>
          </div>}
    </div>;
};

export default Marketplace;
