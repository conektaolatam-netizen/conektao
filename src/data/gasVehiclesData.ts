// Simulated fleet data for Conektao GAS - 12 vehicles across 3 plants
// Coherent with sales data: same drivers, same merma percentages

export interface GasVehicle {
  id: string;
  name: string;
  driver: string;
  plant: 'ibague' | 'puerto_salgar_madre' | 'puerto_salgar_operativa';
  plantLabel: string;
  vehicleType: 'camion' | 'cisterna';
  mermaPercent: number;
  status: 'excellent' | 'normal' | 'warning' | 'critical';
  lastReading?: string;
  todayTrips: number;
  todayGallonsDelivered: number;
  invoicedValue: number;
}

export const PLANTS = {
  ibague: { name: 'Ibagué', color: 'orange', vehicleCount: 3 },
  puerto_salgar_madre: { name: 'P. Salgar Madre', color: 'cyan', vehicleCount: 5 },
  puerto_salgar_operativa: { name: 'P. Salgar Operativa', color: 'purple', vehicleCount: 4 },
};

function getStatus(merma: number): GasVehicle['status'] {
  if (merma === 0) return 'excellent';
  if (merma < 2) return 'normal';
  if (merma < 4) return 'warning';
  return 'critical';
}

export const GAS_VEHICLES: GasVehicle[] = [
  // Ibagué (3 vehículos)
  {
    id: 'truck-01',
    name: 'Camión 01',
    driver: 'Juan Camilo Torres',
    plant: 'ibague',
    plantLabel: 'Ibagué',
    vehicleType: 'camion',
    mermaPercent: 0,
    status: getStatus(0),
    todayTrips: 4,
    todayGallonsDelivered: 2300,
    invoicedValue: 8740000,
  },
  {
    id: 'truck-02',
    name: 'Camión 02',
    driver: 'Andrés Gutiérrez',
    plant: 'ibague',
    plantLabel: 'Ibagué',
    vehicleType: 'camion',
    mermaPercent: 2,
    status: getStatus(2),
    todayTrips: 3,
    todayGallonsDelivered: 1950,
    invoicedValue: 7410000,
  },
  {
    id: 'truck-03',
    name: 'Camión 03',
    driver: 'Camila Rodríguez',
    plant: 'ibague',
    plantLabel: 'Ibagué',
    vehicleType: 'camion',
    mermaPercent: 0,
    status: getStatus(0),
    todayTrips: 5,
    todayGallonsDelivered: 2400,
    invoicedValue: 9120000,
  },
  // Puerto Salgar Madre (5 vehículos)
  {
    id: 'truck-04',
    name: 'Camión 04',
    driver: 'Manuel Perdomo',
    plant: 'puerto_salgar_madre',
    plantLabel: 'P. Salgar Madre',
    vehicleType: 'camion',
    mermaPercent: 4,
    status: getStatus(4),
    todayTrips: 4,
    todayGallonsDelivered: 2800,
    invoicedValue: 10640000,
  },
  {
    id: 'truck-05',
    name: 'Camión 05',
    driver: 'Freddy Castañeda',
    plant: 'puerto_salgar_madre',
    plantLabel: 'P. Salgar Madre',
    vehicleType: 'camion',
    mermaPercent: 0,
    status: getStatus(0),
    todayTrips: 4,
    todayGallonsDelivered: 2600,
    invoicedValue: 9880000,
  },
  {
    id: 'truck-06',
    name: 'Camión 06',
    driver: 'Jhon Jairo Rivas',
    plant: 'puerto_salgar_madre',
    plantLabel: 'P. Salgar Madre',
    vehicleType: 'camion',
    mermaPercent: 1.5,
    status: getStatus(1.5),
    todayTrips: 3,
    todayGallonsDelivered: 2500,
    invoicedValue: 9500000,
  },
  {
    id: 'truck-07',
    name: 'Camión 07',
    driver: 'Jairo Londoño',
    plant: 'puerto_salgar_madre',
    plantLabel: 'P. Salgar Madre',
    vehicleType: 'camion',
    mermaPercent: 0,
    status: getStatus(0),
    todayTrips: 4,
    todayGallonsDelivered: 2700,
    invoicedValue: 10260000,
  },
  {
    id: 'truck-08',
    name: 'Camión 08',
    driver: 'Óscar Herrera',
    plant: 'puerto_salgar_madre',
    plantLabel: 'P. Salgar Madre',
    vehicleType: 'camion',
    mermaPercent: 0,
    status: getStatus(0),
    todayTrips: 3,
    todayGallonsDelivered: 1940,
    invoicedValue: 7372000,
  },
  // Puerto Salgar Operativa (4 cisternas)
  {
    id: 'cistern-09',
    name: 'Cisterna 09',
    driver: 'Carlos Moreno',
    plant: 'puerto_salgar_operativa',
    plantLabel: 'P. Salgar Operativa',
    vehicleType: 'cisterna',
    mermaPercent: 3,
    status: getStatus(3),
    todayTrips: 3,
    todayGallonsDelivered: 2350,
    invoicedValue: 8930000,
  },
  {
    id: 'cistern-10',
    name: 'Cisterna 10',
    driver: 'David Bermúdez',
    plant: 'puerto_salgar_operativa',
    plantLabel: 'P. Salgar Operativa',
    vehicleType: 'cisterna',
    mermaPercent: 0,
    status: getStatus(0),
    todayTrips: 3,
    todayGallonsDelivered: 2000,
    invoicedValue: 7600000,
  },
  {
    id: 'cistern-11',
    name: 'Cisterna 11',
    driver: 'Sebastián Muñoz',
    plant: 'puerto_salgar_operativa',
    plantLabel: 'P. Salgar Operativa',
    vehicleType: 'cisterna',
    mermaPercent: 0.5,
    status: getStatus(0.5),
    todayTrips: 3,
    todayGallonsDelivered: 2200,
    invoicedValue: 8360000,
  },
  {
    id: 'cistern-12',
    name: 'Cisterna 12',
    driver: 'William Galvis',
    plant: 'puerto_salgar_operativa',
    plantLabel: 'P. Salgar Operativa',
    vehicleType: 'cisterna',
    mermaPercent: 6,
    status: getStatus(6),
    todayTrips: 3,
    todayGallonsDelivered: 2100,
    invoicedValue: 7980000,
  },
];

// Helpers
export const getVehiclesByPlant = (plant: GasVehicle['plant']) => 
  GAS_VEHICLES.filter(v => v.plant === plant);

export const getVehiclesWithMerma = () => 
  GAS_VEHICLES.filter(v => v.mermaPercent > 0).sort((a, b) => b.mermaPercent - a.mermaPercent);

export const getExcellentDrivers = () => 
  GAS_VEHICLES.filter(v => v.status === 'excellent');

export const getCriticalVehicles = () => 
  GAS_VEHICLES.filter(v => v.status === 'critical' || v.status === 'warning');

export const getTotalFleetStats = () => {
  const total = GAS_VEHICLES.length;
  const totalTrips = GAS_VEHICLES.reduce((sum, v) => sum + v.todayTrips, 0);
  const totalGallons = GAS_VEHICLES.reduce((sum, v) => sum + v.todayGallonsDelivered, 0);
  const totalInvoiced = GAS_VEHICLES.reduce((sum, v) => sum + v.invoicedValue, 0);
  const avgMerma = GAS_VEHICLES.reduce((sum, v) => sum + v.mermaPercent, 0) / total;
  const withMerma = GAS_VEHICLES.filter(v => v.mermaPercent > 0).length;
  const excellent = GAS_VEHICLES.filter(v => v.status === 'excellent').length;
  
  return { total, totalTrips, totalGallons, totalInvoiced, avgMerma, withMerma, excellent };
};
