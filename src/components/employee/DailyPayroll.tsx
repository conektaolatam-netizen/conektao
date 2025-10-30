import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Clock, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  full_name: string;
  role: string;
  employee_type: 'fixed' | 'hourly';
  hourly_rate: number | null;
}

interface TimeRecord {
  id: string;
  employee_id: string;
  clock_type: 'clock_in' | 'clock_out';
  timestamp: string;
  is_valid_location: boolean;
}

interface DailyPayData {
  employee: Employee;
  hoursWorked: number;
  regularHours: number;
  overtimeHours: number;
  nightHours: number;
  dailyPay: number;
  isComplete: boolean; // Si ya registró salida
}

const DailyPayroll = () => {
  const { restaurant } = useAuth();
  const { toast } = useToast();
  const [hourlyEmployees, setHourlyEmployees] = useState<Employee[]>([]);
  const [dailyPayData, setDailyPayData] = useState<DailyPayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const loadHourlyEmployees = async () => {
    if (!restaurant?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, employee_type, hourly_rate')
        .eq('restaurant_id', restaurant.id)
        .eq('is_active', true)
        .eq('employee_type', 'hourly')
        .neq('role', 'owner');

      if (error) throw error;
      setHourlyEmployees((data || []).map(emp => ({
        ...emp,
        employee_type: emp.employee_type as 'fixed' | 'hourly'
      })));
    } catch (error: any) {
      console.error("Error loading hourly employees:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los empleados por turno",
        variant: "destructive"
      });
    }
  };

  const calculateDailyPay = async () => {
    if (!hourlyEmployees.length || !selectedDate) return;

    setLoading(true);
    const payResults: DailyPayData[] = [];

    try {
      for (const employee of hourlyEmployees) {
        const { data: timeRecords, error } = await supabase
          .from('time_clock_records')
          .select('*')
          .eq('employee_id', employee.id)
          .gte('timestamp', `${selectedDate}T00:00:00`)
          .lte('timestamp', `${selectedDate}T23:59:59`)
          .eq('is_valid_location', true)
          .order('timestamp', { ascending: true });

        if (error) throw error;

        const workSession = calculateDayWorkSession(timeRecords || []);
        const hourlyRate = employee.hourly_rate || 5000;

        // Calcular pagos según legislación colombiana
        const regularPay = Math.min(workSession.totalHours, 8) * hourlyRate;
        const overtimePay = workSession.overtimeHours * hourlyRate * 1.25; // +25%
        const nightPay = workSession.nightHours * hourlyRate * 1.35; // +35%
        
        const totalDailyPay = regularPay + overtimePay + nightPay;

        payResults.push({
          employee,
          hoursWorked: workSession.totalHours,
          regularHours: Math.min(workSession.totalHours, 8),
          overtimeHours: workSession.overtimeHours,
          nightHours: workSession.nightHours,
          dailyPay: totalDailyPay,
          isComplete: workSession.isComplete
        });
      }

      setDailyPayData(payResults);
    } catch (error: any) {
      console.error("Error calculating daily pay:", error);
      toast({
        title: "Error",
        description: "Error al calcular el pago diario",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDayWorkSession = (records: TimeRecord[]) => {
    let totalMinutes = 0;
    let nightMinutes = 0;
    let currentClockIn: Date | null = null;
    let isComplete = false;

    for (const record of records) {
      if (record.clock_type === 'clock_in') {
        currentClockIn = new Date(record.timestamp);
      } else if (record.clock_type === 'clock_out' && currentClockIn) {
        const clockOut = new Date(record.timestamp);
        const sessionMinutes = Math.floor((clockOut.getTime() - currentClockIn.getTime()) / (1000 * 60));
        totalMinutes += sessionMinutes;
        
        // Calcular trabajo nocturno (6:00 PM - 6:00 AM)
        nightMinutes += calculateNightMinutes(currentClockIn, clockOut);
        currentClockIn = null;
        isComplete = true;
      }
    }

    // Si hay entrada activa (sin salida), calcular hasta ahora
    if (currentClockIn && !isComplete) {
      const now = new Date();
      const currentSessionMinutes = Math.floor((now.getTime() - currentClockIn.getTime()) / (1000 * 60));
      totalMinutes += currentSessionMinutes;
      nightMinutes += calculateNightMinutes(currentClockIn, now);
    }

    const totalHours = totalMinutes / 60;
    const overtimeHours = Math.max(0, totalHours - 8);
    
    return {
      totalHours,
      overtimeHours,
      nightHours: nightMinutes / 60,
      isComplete: isComplete && !currentClockIn
    };
  };

  const calculateNightMinutes = (start: Date, end: Date): number => {
    const nightStart = 18; // 6:00 PM
    const nightEnd = 6; // 6:00 AM
    let nightMinutes = 0;
    
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    
    // Si el turno cruza medianoche
    if (startHour >= nightStart || endHour <= nightEnd) {
      if (startHour >= nightStart) {
        nightMinutes += Math.min(24 - startHour, endHour <= nightEnd ? 24 - startHour + endHour : 24 - startHour) * 60;
      }
      if (endHour <= nightEnd) {
        nightMinutes += endHour * 60;
      }
    }
    
    return nightMinutes;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTotalDailyPay = () => {
    return dailyPayData.reduce((sum, data) => sum + data.dailyPay, 0);
  };

  const getTotalHours = () => {
    return dailyPayData.reduce((sum, data) => sum + data.hoursWorked, 0);
  };

  useEffect(() => {
    loadHourlyEmployees();
  }, [restaurant?.id]);

  useEffect(() => {
    if (hourlyEmployees.length > 0) {
      calculateDailyPay();
    }
  }, [hourlyEmployees, selectedDate]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Pago Diario - Empleados por Turno
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div>
                <label className="text-sm font-medium">Fecha:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="ml-2 px-3 py-1 border rounded"
                />
              </div>
            </div>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Empleados por Turno</p>
                  <p className="text-xl font-bold">{dailyPayData.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Horas Totales</p>
                  <p className="text-xl font-bold">{getTotalHours().toFixed(1)}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Turnos Completos</p>
                  <p className="text-xl font-bold">
                    {dailyPayData.filter(d => d.isComplete).length}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total a Pagar</p>
                  <p className="text-xl font-bold">{formatCurrency(getTotalDailyPay())}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Detalle por empleado */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detalle por Empleado</h3>
            
            {loading ? (
              <div className="text-center py-8">Calculando pagos diarios...</div>
            ) : dailyPayData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay empleados por turno registrados
              </div>
            ) : (
              <div className="space-y-3">
                {dailyPayData.map((data) => (
                  <Card key={data.employee.id} className="p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold">{data.employee.full_name}</h4>
                        <p className="text-sm text-muted-foreground capitalize">{data.employee.role}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">Por Turno</Badge>
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            ${data.employee.hourly_rate?.toLocaleString()}/h
                          </Badge>
                          <Badge variant={data.isComplete ? "default" : "destructive"}>
                            {data.isComplete ? "Turno Completo" : "En Turno"}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Horas regulares:</span>
                          <span>{data.regularHours.toFixed(1)}h</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Horas extra (+25%):</span>
                          <span>{data.overtimeHours.toFixed(1)}h</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Horas nocturnas (+35%):</span>
                          <span>{data.nightHours.toFixed(1)}h</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t pt-1">
                          <span>Total horas:</span>
                          <span>{data.hoursWorked.toFixed(1)}h</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between font-bold text-lg text-green-600">
                          <span>Pago del día:</span>
                          <span>{formatCurrency(data.dailyPay)}</span>
                        </div>
                        {!data.isComplete && (
                          <p className="text-xs text-amber-600">
                            * Cálculo en tiempo real (empleado aún trabajando)
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyPayroll;