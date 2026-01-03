// Simulated sales data for Conektao GAS - Based on real delivery data
// This data is coherent with vehicle/driver merma data

export interface GasSaleRecord {
  id: string;
  driver: string;
  plant: 'ibague' | 'puerto_salgar_madre' | 'puerto_salgar_operativa';
  plantLabel: string;
  gallonsDelivered: number;
  mermaPercent: number;
  gallonsLost: number;
  invoicedValue: number; // COP
}

export interface PlantSalesSummary {
  plant: string;
  plantKey: 'ibague' | 'puerto_salgar_madre' | 'puerto_salgar_operativa';
  totalGallons: number;
  totalInvoiced: number;
  totalMerma: number;
  avgMermaPercent: number;
  driverCount: number;
}

// Raw sales data from the provided table
export const GAS_SALES_DATA: GasSaleRecord[] = [
  // Ibagué (3 conductores)
  {
    id: 'sale-01',
    driver: 'Juan Camilo Torres',
    plant: 'ibague',
    plantLabel: 'Ibagué',
    gallonsDelivered: 2300,
    mermaPercent: 0,
    gallonsLost: 0,
    invoicedValue: 8740000,
  },
  {
    id: 'sale-02',
    driver: 'Andrés Gutiérrez',
    plant: 'ibague',
    plantLabel: 'Ibagué',
    gallonsDelivered: 1950,
    mermaPercent: 2,
    gallonsLost: 39,
    invoicedValue: 7410000,
  },
  {
    id: 'sale-03',
    driver: 'Camila Rodríguez',
    plant: 'ibague',
    plantLabel: 'Ibagué',
    gallonsDelivered: 2400,
    mermaPercent: 0,
    gallonsLost: 0,
    invoicedValue: 9120000,
  },
  // Puerto Salgar Madre (5 conductores)
  {
    id: 'sale-04',
    driver: 'Manuel Perdomo',
    plant: 'puerto_salgar_madre',
    plantLabel: 'P. Salgar Madre',
    gallonsDelivered: 2800,
    mermaPercent: 4,
    gallonsLost: 112,
    invoicedValue: 10640000,
  },
  {
    id: 'sale-05',
    driver: 'Freddy Castañeda',
    plant: 'puerto_salgar_madre',
    plantLabel: 'P. Salgar Madre',
    gallonsDelivered: 2600,
    mermaPercent: 0,
    gallonsLost: 0,
    invoicedValue: 9880000,
  },
  {
    id: 'sale-06',
    driver: 'Jhon Jairo Rivas',
    plant: 'puerto_salgar_madre',
    plantLabel: 'P. Salgar Madre',
    gallonsDelivered: 2500,
    mermaPercent: 1.5,
    gallonsLost: 37.5,
    invoicedValue: 9500000,
  },
  {
    id: 'sale-07',
    driver: 'Jairo Londoño',
    plant: 'puerto_salgar_madre',
    plantLabel: 'P. Salgar Madre',
    gallonsDelivered: 2700,
    mermaPercent: 0,
    gallonsLost: 0,
    invoicedValue: 10260000,
  },
  {
    id: 'sale-08',
    driver: 'Óscar Herrera',
    plant: 'puerto_salgar_madre',
    plantLabel: 'P. Salgar Madre',
    gallonsDelivered: 1940,
    mermaPercent: 0,
    gallonsLost: 0,
    invoicedValue: 7372000,
  },
  // Puerto Salgar Operativa (4 conductores)
  {
    id: 'sale-09',
    driver: 'Carlos Moreno',
    plant: 'puerto_salgar_operativa',
    plantLabel: 'P. Salgar Operativa',
    gallonsDelivered: 2350,
    mermaPercent: 3,
    gallonsLost: 70.5,
    invoicedValue: 8930000,
  },
  {
    id: 'sale-10',
    driver: 'David Bermúdez',
    plant: 'puerto_salgar_operativa',
    plantLabel: 'P. Salgar Operativa',
    gallonsDelivered: 2000,
    mermaPercent: 0,
    gallonsLost: 0,
    invoicedValue: 7600000,
  },
  {
    id: 'sale-11',
    driver: 'Sebastián Muñoz',
    plant: 'puerto_salgar_operativa',
    plantLabel: 'P. Salgar Operativa',
    gallonsDelivered: 2200,
    mermaPercent: 0.5,
    gallonsLost: 11,
    invoicedValue: 8360000,
  },
  {
    id: 'sale-12',
    driver: 'William Galvis',
    plant: 'puerto_salgar_operativa',
    plantLabel: 'P. Salgar Operativa',
    gallonsDelivered: 2100,
    mermaPercent: 6,
    gallonsLost: 126,
    invoicedValue: 7980000,
  },
];

// Plant configuration with colors
export const SALES_PLANTS = {
  ibague: { 
    name: 'Ibagué', 
    color: 'orange',
    bgClass: 'bg-primary/10',
    textClass: 'text-primary',
    borderClass: 'border-primary/30'
  },
  puerto_salgar_madre: { 
    name: 'P. Salgar Madre', 
    color: 'cyan',
    bgClass: 'bg-cyan-500/10',
    textClass: 'text-cyan-400',
    borderClass: 'border-cyan-500/30'
  },
  puerto_salgar_operativa: { 
    name: 'P. Salgar Operativa', 
    color: 'purple',
    bgClass: 'bg-purple-500/10',
    textClass: 'text-purple-400',
    borderClass: 'border-purple-500/30'
  },
};

// Helper functions
export const getSalesByPlant = (plant: GasSaleRecord['plant']) => 
  GAS_SALES_DATA.filter(s => s.plant === plant);

export const getPlantSummaries = (): PlantSalesSummary[] => {
  const plants: GasSaleRecord['plant'][] = ['ibague', 'puerto_salgar_madre', 'puerto_salgar_operativa'];
  
  return plants.map(plantKey => {
    const plantSales = getSalesByPlant(plantKey);
    const totalGallons = plantSales.reduce((sum, s) => sum + s.gallonsDelivered, 0);
    const totalInvoiced = plantSales.reduce((sum, s) => sum + s.invoicedValue, 0);
    const totalMerma = plantSales.reduce((sum, s) => sum + s.gallonsLost, 0);
    const avgMermaPercent = plantSales.length > 0 
      ? plantSales.reduce((sum, s) => sum + s.mermaPercent, 0) / plantSales.length 
      : 0;
    
    return {
      plant: SALES_PLANTS[plantKey].name,
      plantKey,
      totalGallons,
      totalInvoiced,
      totalMerma,
      avgMermaPercent,
      driverCount: plantSales.length,
    };
  });
};

export const getTotalSalesStats = () => {
  const totalGallons = GAS_SALES_DATA.reduce((sum, s) => sum + s.gallonsDelivered, 0);
  const totalInvoiced = GAS_SALES_DATA.reduce((sum, s) => sum + s.invoicedValue, 0);
  const totalMerma = GAS_SALES_DATA.reduce((sum, s) => sum + s.gallonsLost, 0);
  const driversWithMerma = GAS_SALES_DATA.filter(s => s.mermaPercent > 0).length;
  const driversWithoutMerma = GAS_SALES_DATA.filter(s => s.mermaPercent === 0).length;
  const avgMermaPercent = GAS_SALES_DATA.reduce((sum, s) => sum + s.mermaPercent, 0) / GAS_SALES_DATA.length;
  
  return {
    totalGallons,        // 27,840 gal
    totalInvoiced,       // $105,792,000 COP
    totalMerma,          // 396 gal
    driversWithMerma,    // 7
    driversWithoutMerma, // 5
    avgMermaPercent,
    driverCount: GAS_SALES_DATA.length,
  };
};

// Get drivers with high merma for alerts (>2%)
export const getHighMermaDrivers = () => 
  GAS_SALES_DATA.filter(s => s.mermaPercent > 2).sort((a, b) => b.mermaPercent - a.mermaPercent);

// Get top performers (0% merma)
export const getTopPerformers = () => 
  GAS_SALES_DATA.filter(s => s.mermaPercent === 0);
