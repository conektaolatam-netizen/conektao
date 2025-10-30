import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Clock, TrendingUp, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Employee {
  id: string;
  full_name: string;
  role: string;
  employee_type: 'fixed' | 'hourly';
  hourly_rate: number | null;
  email: string;
  phone: string | null;
}

interface TimeRecord {
  id: string;
  employee_id: string;
  clock_type: 'clock_in' | 'clock_out';
  timestamp: string;
  is_valid_location: boolean;
}

interface PayrollData {
  employee: Employee;
  regularHours: number;
  overtimeHours: number;
  nightHours: number;
  holidayHours: number;
  totalHours: number;
  baseSalary: number;
  overtimePay: number;
  nightPay: number;
  holidayPay: number;
  healthContribution: number;
  pensionContribution: number;
  totalEarnings: number;
  totalDeductions: number;
  netPay: number;
  workDays: number;
}

const PayrollCalculation = () => {
  const { restaurant } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current'); // current, last
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');

  useEffect(() => {
    // Calcular período actual (primera quincena del mes)
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    let startDate, endDate;
    
    if (today.getDate() <= 15) {
      // Primera quincena
      startDate = new Date(currentYear, currentMonth, 1);
      endDate = new Date(currentYear, currentMonth, 15);
    } else {
      // Segunda quincena
      startDate = new Date(currentYear, currentMonth, 16);
      endDate = new Date(currentYear, currentMonth + 1, 0); // Último día del mes
    }
    
    setPeriodStart(startDate.toISOString().split('T')[0]);
    setPeriodEnd(endDate.toISOString().split('T')[0]);
  }, []);

  const loadEmployees = async () => {
    if (!restaurant?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, employee_type, hourly_rate, email, phone')
        .eq('restaurant_id', restaurant.id)
        .eq('is_active', true)
        .neq('role', 'owner');

      if (error) throw error;
      setEmployees((data || []).map(emp => ({
        ...emp,
        employee_type: emp.employee_type as 'fixed' | 'hourly'
      })));
    } catch (error: any) {
      console.error("Error loading employees:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los empleados",
        variant: "destructive"
      });
    }
  };

  const calculatePayroll = async () => {
    if (!employees.length || !periodStart || !periodEnd) return;

    setLoading(true);
    const payrollResults: PayrollData[] = [];

    try {
      for (const employee of employees) {
        const { data: timeRecords, error } = await supabase
          .from('time_clock_records')
          .select('*')
          .eq('employee_id', employee.id)
          .gte('timestamp', `${periodStart}T00:00:00`)
          .lte('timestamp', `${periodEnd}T23:59:59`)
          .eq('is_valid_location', true)
          .order('timestamp', { ascending: true });

        if (error) throw error;

        const workSessions = calculateWorkSessions(timeRecords || []);
        const totals = calculateTotals(workSessions);
        
        let regularPay, overtimePayDiurnal, nightPay, holidayPay, totalEarnings;
        let hourlyRate: number;

        if (employee.employee_type === 'hourly') {
          // Empleado por turno: usar tarifa por hora configurada
          hourlyRate = employee.hourly_rate || 5000; // Fallback a $5000/hora
          
          regularPay = Math.min(totals.totalHours, totals.workDays * 8) * hourlyRate;
          overtimePayDiurnal = totals.overtimeHours * hourlyRate * 1.25;
          nightPay = totals.nightHours * hourlyRate * 1.35;
          holidayPay = totals.holidayHours * hourlyRate * 1.75;
          
        } else {
          // Empleado fijo: calcular basado en salario mensual
          const monthlySalary = getBaseSalaryByRole(employee.role);
          const dailyRate = monthlySalary / 30;
          hourlyRate = dailyRate / 8;

          regularPay = Math.min(totals.totalHours, totals.workDays * 8) * hourlyRate;
          overtimePayDiurnal = totals.overtimeHours * hourlyRate * 1.25;
          nightPay = totals.nightHours * hourlyRate * 1.35;
          holidayPay = totals.holidayHours * hourlyRate * 1.75;
        }
        
        totalEarnings = regularPay + overtimePayDiurnal + nightPay + holidayPay;
        
        // Deducciones obligatorias según ley colombiana
        const healthContribution = totalEarnings * 0.04; // 4% salud
        const pensionContribution = totalEarnings * 0.04; // 4% pensión
        const totalDeductions = healthContribution + pensionContribution;
        
        const netPay = totalEarnings - totalDeductions;

        payrollResults.push({
          employee,
          regularHours: totals.regularHours,
          overtimeHours: totals.overtimeHours,
          nightHours: totals.nightHours,
          holidayHours: totals.holidayHours,
          totalHours: totals.totalHours,
          baseSalary: regularPay,
          overtimePay: overtimePayDiurnal,
          nightPay,
          holidayPay,
          healthContribution,
          pensionContribution,
          totalEarnings,
          totalDeductions,
          netPay,
          workDays: totals.workDays
        });
      }

      setPayrollData(payrollResults);
    } catch (error: any) {
      console.error("Error calculating payroll:", error);
      toast({
        title: "Error",
        description: "Error al calcular la nómina",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateWorkSessions = (records: TimeRecord[]) => {
    const sessions: { 
      date: string; 
      hours: number; 
      nightHours: number; 
      isHoliday: boolean;
      overtimeHours: number;
    }[] = [];
    const recordsByDate: { [key: string]: TimeRecord[] } = {};

    // Agrupar por fecha
    records.forEach(record => {
      const date = record.timestamp.split('T')[0];
      if (!recordsByDate[date]) {
        recordsByDate[date] = [];
      }
      recordsByDate[date].push(record);
    });

    // Calcular horas por día
    Object.entries(recordsByDate).forEach(([date, dayRecords]) => {
      let totalMinutes = 0;
      let nightMinutes = 0;
      let currentClockIn: Date | null = null;
      const dateObj = new Date(date);
      const isHoliday = isHolidayDate(dateObj);

      dayRecords.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      for (const record of dayRecords) {
        if (record.clock_type === 'clock_in') {
          currentClockIn = new Date(record.timestamp);
        } else if (record.clock_type === 'clock_out' && currentClockIn) {
          const clockOut = new Date(record.timestamp);
          const sessionMinutes = Math.floor((clockOut.getTime() - currentClockIn.getTime()) / (1000 * 60));
          totalMinutes += sessionMinutes;
          
          // Calcular trabajo nocturno (6:00 PM - 6:00 AM)
          nightMinutes += calculateNightMinutes(currentClockIn, clockOut);
          currentClockIn = null;
        }
      }

      if (totalMinutes > 0) {
        const totalHours = totalMinutes / 60;
        const regularHours = Math.min(totalHours, 8);
        const overtimeHours = Math.max(0, totalHours - 8);
        
        sessions.push({
          date,
          hours: totalHours,
          nightHours: nightMinutes / 60,
          isHoliday,
          overtimeHours
        });
      }
    });

    return sessions;
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

  const isHolidayDate = (date: Date): boolean => {
    const day = date.getDay();
    // Domingo = 0, Sábado = 6
    return day === 0; // Solo domingos por simplicidad, aquí podrías agregar festivos nacionales
  };

  const calculateTotals = (sessions: { 
    date: string; 
    hours: number; 
    nightHours: number; 
    isHoliday: boolean;
    overtimeHours: number;
  }[]) => {
    const totalHours = sessions.reduce((sum, session) => sum + session.hours, 0);
    const nightHours = sessions.reduce((sum, session) => sum + session.nightHours, 0);
    const holidayHours = sessions.filter(s => s.isHoliday).reduce((sum, session) => sum + session.hours, 0);
    const overtimeHours = sessions.reduce((sum, session) => sum + session.overtimeHours, 0);
    const workDays = sessions.length;
    const regularHours = totalHours - overtimeHours;

    return {
      totalHours,
      nightHours,
      holidayHours,
      overtimeHours,
      workDays,
      regularHours
    };
  };

  const getBaseSalaryByRole = (role: string): number => {
    // Salarios base Colombia 2025 (actualizados)
    const salaries = {
      'admin': 2500000, // Administrador
      'employee': 1300000, // Salario mínimo legal vigente 2025
    };
    return salaries[role as keyof typeof salaries] || salaries.employee;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getTotalPayroll = () => {
    return payrollData.reduce((sum, data) => sum + data.netPay, 0);
  };

  const exportPayroll = () => {
    // Aquí podrías implementar la exportación a PDF o Excel
    toast({
      title: "Exportar nómina",
      description: "Función de exportación disponible próximamente"
    });
  };

  useEffect(() => {
    loadEmployees();
  }, [restaurant?.id]);

  useEffect(() => {
    if (employees.length > 0 && periodStart && periodEnd) {
      calculatePayroll();
    }
  }, [employees, periodStart, periodEnd]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cálculo de Nómina
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div>
                <label className="text-sm font-medium">Período:</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="px-3 py-1 border rounded"
                  />
                  <span className="self-center">-</span>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="px-3 py-1 border rounded"
                  />
                </div>
              </div>
            </div>
            <Button onClick={exportPayroll} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Horas Totales</p>
                  <p className="text-xl font-bold">
                    {payrollData.reduce((sum, data) => sum + data.totalHours, 0).toFixed(1)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Horas Extra</p>
                  <p className="text-xl font-bold">
                    {payrollData.reduce((sum, data) => sum + data.overtimeHours, 0).toFixed(1)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Horas Nocturnas</p>
                  <p className="text-xl font-bold">
                    {payrollData.reduce((sum, data) => sum + data.nightHours, 0).toFixed(1)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Horas Festivas</p>
                  <p className="text-xl font-bold">
                    {payrollData.reduce((sum, data) => sum + data.holidayHours, 0).toFixed(1)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Empleados Activos</p>
                  <p className="text-xl font-bold">{payrollData.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Nómina Neta</p>
                  <p className="text-xl font-bold">{formatCurrency(getTotalPayroll())}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Detalle por empleado */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Detalle por Empleado</h3>
            
            {loading ? (
              <div className="text-center py-8">Calculando nómina...</div>
            ) : payrollData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay datos de tiempo registrados para el período seleccionado
              </div>
            ) : (
              <div className="space-y-3">
                {payrollData.map((data) => (
                  <Card key={data.employee.id} className="p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-semibold">{data.employee.full_name}</h4>
                        <p className="text-sm text-muted-foreground capitalize">{data.employee.role}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">
                            {data.workDays} días trabajados
                          </Badge>
                          <Badge variant={data.employee.employee_type === 'fixed' ? 'default' : 'secondary'}>
                            {data.employee.employee_type === 'fixed' ? 'Fijo' : 'Por Turno'}
                          </Badge>
                          {data.employee.employee_type === 'hourly' && data.employee.hourly_rate && (
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              ${data.employee.hourly_rate.toLocaleString()}/h
                            </Badge>
                          )}
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
                        <div className="flex justify-between text-sm">
                          <span>Horas festivas (+75%):</span>
                          <span>{data.holidayHours.toFixed(1)}h</span>
                        </div>
                        <div className="flex justify-between font-semibold border-t pt-1">
                          <span>Total horas:</span>
                          <span>{data.totalHours.toFixed(1)}h</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Salario base:</span>
                          <span>{formatCurrency(data.baseSalary)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Pago horas extra:</span>
                          <span>{formatCurrency(data.overtimePay)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Pago nocturno:</span>
                          <span>{formatCurrency(data.nightPay)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Pago festivos:</span>
                          <span>{formatCurrency(data.holidayPay)}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium border-t pt-1">
                          <span>Total devengado:</span>
                          <span>{formatCurrency(data.totalEarnings)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-red-600">
                          <span>Salud (4%):</span>
                          <span>-{formatCurrency(data.healthContribution)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-red-600">
                          <span>Pensión (4%):</span>
                          <span>-{formatCurrency(data.pensionContribution)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2 text-green-600">
                          <span>Pago neto:</span>
                          <span>{formatCurrency(data.netPay)}</span>
                        </div>
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

export default PayrollCalculation;