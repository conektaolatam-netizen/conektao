import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FuturisticCard } from '@/components/ui/FuturisticCard';
import { useFlowmeterData } from '@/hooks/useFlowmeterData';
import { 
  TrendingDown, 
  AlertTriangle, 
  Star,
  CheckCircle2,
  User,
  Truck,
  Calendar
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const GasMermaAnalysis: React.FC = () => {
  const { mermaByDriver, dailySummary, isLoading } = useFlowmeterData();

  // Prepare chart data from daily summary
  const chartData = dailySummary.slice(0, 7).reverse().map(day => ({
    date: new Date(day.date).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }),
    merma: day.merma_percent,
    enviado: day.sent_liters / 1000, // Convert to thousands
    recibido: day.received_liters / 1000,
  }));

  // Calculate alerts
  const driversWithAlerts = mermaByDriver.filter(d => d.status === 'warning');

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
          <TrendingDown className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Análisis de Mermas</h2>
          <p className="text-sm text-muted-foreground">Última semana por conductor</p>
        </div>
      </div>

      {/* Alerts Section */}
      {driversWithAlerts.length > 0 && (
        <div className="space-y-2">
          {driversWithAlerts.map(driver => (
            <div 
              key={driver.driver_name}
              className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/20"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                <div>
                  <p className="font-medium text-red-400">{driver.driver_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Supera umbral de 1% en últimos viajes
                  </p>
                </div>
              </div>
              <Badge variant="destructive">
                {driver.avg_merma_percent.toFixed(2)}% promedio
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Driver Table */}
      <FuturisticCard glowColor="orange" className="p-0 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-orange-400" />
            Merma por Conductor
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead>Conductor</TableHead>
                <TableHead className="text-center">Viajes</TableHead>
                <TableHead className="text-center">Merma Total</TableHead>
                <TableHead className="text-center">Promedio</TableHead>
                <TableHead className="text-center">Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mermaByDriver.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No hay datos de merma disponibles
                  </TableCell>
                </TableRow>
              ) : (
                mermaByDriver.map((driver, index) => (
                  <TableRow key={driver.driver_name} className="border-border/20">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          driver.status === 'excellent' ? 'bg-green-500/20' :
                          driver.status === 'warning' ? 'bg-red-500/20' :
                          'bg-blue-500/20'
                        }`}>
                          <User className={`w-4 h-4 ${
                            driver.status === 'excellent' ? 'text-green-400' :
                            driver.status === 'warning' ? 'text-red-400' :
                            'text-blue-400'
                          }`} />
                        </div>
                        <span className="font-medium">{driver.driver_name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{driver.total_trips}</Badge>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {driver.total_merma_liters.toFixed(0)} L
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`font-bold ${
                        driver.avg_merma_percent > 1 ? 'text-red-400' :
                        driver.avg_merma_percent < 0.6 ? 'text-green-400' :
                        'text-yellow-400'
                      }`}>
                        {driver.avg_merma_percent.toFixed(2)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {driver.status === 'excellent' && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <Star className="w-3 h-3 mr-1" />
                          Excelente
                        </Badge>
                      )}
                      {driver.status === 'normal' && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Normal
                        </Badge>
                      )}
                      {driver.status === 'warning' && (
                        <Badge variant="destructive" className="animate-pulse">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Alerta
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </FuturisticCard>

      {/* Trend Chart */}
      <FuturisticCard glowColor="cyan" className="p-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" />
            Tendencia de Merma (7 días)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="merma" 
                  stroke="hsl(25 100% 50%)" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(25 100% 50%)', strokeWidth: 2 }}
                  name="% Merma"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No hay datos suficientes para mostrar tendencia
            </div>
          )}
        </CardContent>
      </FuturisticCard>

      {/* Historical Summary */}
      <FuturisticCard glowColor="purple" className="p-0">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="w-5 h-5 text-purple-400" />
            Histórico de Cargas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/30 hover:bg-transparent">
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Enviado (L)</TableHead>
                <TableHead className="text-right">Recibido (L)</TableHead>
                <TableHead className="text-right">Merma</TableHead>
                <TableHead className="text-right">Pipetas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailySummary.slice(0, 7).map((day) => (
                <TableRow key={day.date} className="border-border/20">
                  <TableCell>
                    {new Date(day.date).toLocaleDateString('es-CO', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {day.sent_liters.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {day.received_liters.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-bold ${
                      day.merma_percent > 1 ? 'text-red-400' :
                      day.merma_percent < 0.6 ? 'text-green-400' :
                      'text-yellow-400'
                    }`}>
                      {day.merma_liters.toFixed(0)} L ({day.merma_percent.toFixed(2)}%)
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline">{day.pipetas_filled}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </FuturisticCard>
    </div>
  );
};

export default GasMermaAnalysis;
