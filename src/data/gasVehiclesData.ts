// Simulated fleet data for Conektao GAS - 12 vehicles across 3 plants

export interface GasVehicle {
  id: string;
  name: string;
  driver: string;
  plant: 'ibague' | 'puerto_salgar_p1' | 'puerto_salgar_mayorista';
  plantLabel: string;
  vehicleType: 'camion' | 'cisterna';
  mermaPercent: number;
  status: 'excellent' | 'normal' | 'warning' | 'critical';
  lastReading?: string;
  todayTrips: number;
  todayLitersDelivered: number;
}

export const PLANTS = {
  ibague: { name: 'Ibagué', color: 'orange', vehicleCount: 5 },
  puerto_salgar_p1: { name: 'Puerto Salgar Planta 1', color: 'cyan', vehicleCount: 4 },
  puerto_salgar_mayorista: { name: 'Puerto Salgar Mayorista', color: 'purple', vehicleCount: 3 },
};

function getStatus(merma: number): GasVehicle['status'] {
  if (merma === 0) return 'excellent';
  if (merma < 2) return 'normal';
  if (merma < 4) return 'warning';
  return 'critical';
}

export const GAS_VEHICLES: GasVehicle[] = [
  // Ibagué (5 vehículos)
  {
    id: 'truck-01',
    name: 'Camión 01',
    driver: 'Jhonatan Ramírez',
    plant: 'ibague',
    plantLabel: 'Ibagué',
    vehicleType: 'camion',
    mermaPercent: 0,
    status: getStatus(0),
    todayTrips: 4,
    todayLitersDelivered: 2850,
  },
  {
    id: 'truck-02',
    name: 'Camión 02',
    driver: 'Andrés Díaz',
    plant: 'ibague',
    plantLabel: 'Ibagué',
    vehicleType: 'camion',
    mermaPercent: 2.3,
    status: getStatus(2.3),
    todayTrips: 3,
    todayLitersDelivered: 2100,
  },
  {
    id: 'truck-03',
    name: 'Camión 03',
    driver: 'Camilo Suárez',
    plant: 'ibague',
    plantLabel: 'Ibagué',
    vehicleType: 'camion',
    mermaPercent: 1.8,
    status: getStatus(1.8),
    todayTrips: 5,
    todayLitersDelivered: 3200,
  },
  {
    id: 'truck-04',
    name: 'Camión 04',
    driver: 'Esteban Castaño',
    plant: 'ibague',
    plantLabel: 'Ibagué',
    vehicleType: 'camion',
    mermaPercent: 0,
    status: getStatus(0),
    todayTrips: 4,
    todayLitersDelivered: 2700,
  },
  {
    id: 'truck-05',
    name: 'Camión 05',
    driver: 'Karen Buitrago',
    plant: 'ibague',
    plantLabel: 'Ibagué',
    vehicleType: 'camion',
    mermaPercent: 3.1,
    status: getStatus(3.1),
    todayTrips: 3,
    todayLitersDelivered: 1950,
  },
  // Puerto Salgar Planta 1 (4 vehículos)
  {
    id: 'truck-06',
    name: 'Camión 06',
    driver: 'Wilson Gutiérrez',
    plant: 'puerto_salgar_p1',
    plantLabel: 'Puerto Salgar P1',
    vehicleType: 'camion',
    mermaPercent: 0,
    status: getStatus(0),
    todayTrips: 4,
    todayLitersDelivered: 2600,
  },
  {
    id: 'truck-07',
    name: 'Camión 07',
    driver: 'Julián Rojas',
    plant: 'puerto_salgar_p1',
    plantLabel: 'Puerto Salgar P1',
    vehicleType: 'camion',
    mermaPercent: 2.9,
    status: getStatus(2.9),
    todayTrips: 3,
    todayLitersDelivered: 2200,
  },
  {
    id: 'truck-08',
    name: 'Camión 08',
    driver: 'Daniel Ortega',
    plant: 'puerto_salgar_p1',
    plantLabel: 'Puerto Salgar P1',
    vehicleType: 'camion',
    mermaPercent: 0,
    status: getStatus(0),
    todayTrips: 5,
    todayLitersDelivered: 3100,
  },
  {
    id: 'truck-09',
    name: 'Camión 09',
    driver: 'Diana Ávila',
    plant: 'puerto_salgar_p1',
    plantLabel: 'Puerto Salgar P1',
    vehicleType: 'camion',
    mermaPercent: 1.2,
    status: getStatus(1.2),
    todayTrips: 4,
    todayLitersDelivered: 2450,
  },
  // Puerto Salgar Mayorista (3 cisternas)
  {
    id: 'cistern-10',
    name: 'Cisterna 10',
    driver: 'Freddy Moreno',
    plant: 'puerto_salgar_mayorista',
    plantLabel: 'PS Mayorista',
    vehicleType: 'cisterna',
    mermaPercent: 4.5,
    status: getStatus(4.5),
    todayTrips: 2,
    todayLitersDelivered: 8500,
  },
  {
    id: 'cistern-11',
    name: 'Cisterna 11',
    driver: 'Sebastián López',
    plant: 'puerto_salgar_mayorista',
    plantLabel: 'PS Mayorista',
    vehicleType: 'cisterna',
    mermaPercent: 0,
    status: getStatus(0),
    todayTrips: 3,
    todayLitersDelivered: 12000,
  },
  {
    id: 'cistern-12',
    name: 'Cisterna 12',
    driver: 'Luis Barreto',
    plant: 'puerto_salgar_mayorista',
    plantLabel: 'PS Mayorista',
    vehicleType: 'cisterna',
    mermaPercent: 2.1,
    status: getStatus(2.1),
    todayTrips: 2,
    todayLitersDelivered: 9200,
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
  const totalLiters = GAS_VEHICLES.reduce((sum, v) => sum + v.todayLitersDelivered, 0);
  const avgMerma = GAS_VEHICLES.reduce((sum, v) => sum + v.mermaPercent, 0) / total;
  const withMerma = GAS_VEHICLES.filter(v => v.mermaPercent > 0).length;
  const excellent = GAS_VEHICLES.filter(v => v.status === 'excellent').length;
  
  return { total, totalTrips, totalLiters, avgMerma, withMerma, excellent };
};
