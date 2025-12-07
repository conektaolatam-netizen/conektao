import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Users, Clock, Coins, Check, Divide, Timer, Hand } from 'lucide-react';

interface Employee {
  id: string;
  full_name: string;
  hoursWorked: number;
  isSelected: boolean;
  manualPercentage: number;
  calculatedAmount: number;
}

interface TipDistributionModalProps {
  open: boolean;
  onClose: () => void;
  totalTipAmount: number;
  saleId: string;
  cashRegisterId?: string;
  onDistributed?: () => void;
}

const TipDistributionModal = ({
  open,
  onClose,
  totalTipAmount,
  saleId,
  cashRegisterId,
  onDistributed
}: TipDistributionModalProps) => {
  const { profile, restaurant } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [distributionType, setDistributionType] = useState<'equal' | 'by_hours' | 'manual'>('equal');
  const [notes, setNotes] = useState('');

  // Load employees on shift
  useEffect(() => {
    if (open && restaurant?.id) {
      loadEmployeesOnShift();
    }
  }, [open, restaurant?.id]);

  // Recalculate amounts when distribution type or selection changes
  useEffect(() => {
    calculateDistribution();
  }, [distributionType, employees.map(e => e.isSelected).join(','), employees.map(e => e.manualPercentage).join(',')]);

  const loadEmployeesOnShift = async () => {
    if (!restaurant?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get employees who clocked in today
      const { data: clockInRecords, error: timeError } = await supabase
        .from('time_clock_records')
        .select(`
          employee_id,
          timestamp,
          clock_type,
          profiles!time_clock_records_employee_id_fkey(id, full_name)
        `)
        .eq('restaurant_id', restaurant.id)
        .eq('clock_type', 'clock_in')
        .gte('timestamp', `${today}T00:00:00`);

      if (timeError) {
        console.error('Error loading time records:', timeError);
      }

      // Get clock out records to calculate hours
      const { data: clockOutRecords } = await supabase
        .from('time_clock_records')
        .select('employee_id, timestamp')
        .eq('restaurant_id', restaurant.id)
        .eq('clock_type', 'clock_out')
        .gte('timestamp', `${today}T00:00:00`);

      // If we have time records, use them
      if (clockInRecords && clockInRecords.length > 0) {
        // Get unique employees with their latest clock in
        const employeeMap = new Map<string, any>();
        
        clockInRecords.forEach((record: any) => {
          const existing = employeeMap.get(record.employee_id);
          if (!existing || new Date(record.timestamp) > new Date(existing.timestamp)) {
            employeeMap.set(record.employee_id, record);
          }
        });

        const employeeData = Array.from(employeeMap.values()).map((record: any) => {
          const clockIn = new Date(record.timestamp);
          const clockOut = clockOutRecords?.find((r: any) => 
            r.employee_id === record.employee_id && 
            new Date(r.timestamp) > clockIn
          );
          const endTime = clockOut ? new Date(clockOut.timestamp) : new Date();
          const hoursWorked = (endTime.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
          
          return {
            id: record.employee_id,
            full_name: record.profiles?.full_name || 'Empleado',
            hoursWorked: Math.round(hoursWorked * 100) / 100,
            isSelected: true,
            manualPercentage: 0,
            calculatedAmount: 0
          };
        });
        setEmployees(employeeData);
      } else {
        // Fallback: get all active employees (waiters)
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('restaurant_id', restaurant.id)
          .eq('is_active', true)
          .in('role', ['employee', 'admin']);

        if (profilesError) {
          console.error('Error loading profiles:', profilesError);
          return;
        }

        const employeeData = (profiles || []).map((p: any) => ({
          id: p.id,
          full_name: p.full_name || 'Empleado',
          hoursWorked: 0,
          isSelected: true,
          manualPercentage: 0,
          calculatedAmount: 0
        }));
        setEmployees(employeeData);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const calculateDistribution = () => {
    const selectedEmployees = employees.filter(e => e.isSelected);
    if (selectedEmployees.length === 0) return;

    let updatedEmployees = [...employees];

    if (distributionType === 'equal') {
      const amountPerPerson = totalTipAmount / selectedEmployees.length;
      updatedEmployees = employees.map(e => ({
        ...e,
        calculatedAmount: e.isSelected ? amountPerPerson : 0,
        manualPercentage: e.isSelected ? 100 / selectedEmployees.length : 0
      }));
    } else if (distributionType === 'by_hours') {
      const totalHours = selectedEmployees.reduce((sum, e) => sum + (e.hoursWorked || 1), 0);
      updatedEmployees = employees.map(e => {
        if (!e.isSelected) return { ...e, calculatedAmount: 0, manualPercentage: 0 };
        const hours = e.hoursWorked || 1;
        const percentage = (hours / totalHours) * 100;
        return {
          ...e,
          calculatedAmount: (hours / totalHours) * totalTipAmount,
          manualPercentage: percentage
        };
      });
    } else if (distributionType === 'manual') {
      const totalPercentage = selectedEmployees.reduce((sum, e) => sum + (e.manualPercentage || 0), 0);
      updatedEmployees = employees.map(e => ({
        ...e,
        calculatedAmount: e.isSelected && totalPercentage > 0 
          ? (e.manualPercentage / totalPercentage) * totalTipAmount 
          : 0
      }));
    }

    // Only update if values actually changed
    const hasChanges = updatedEmployees.some((e, i) => 
      e.calculatedAmount !== employees[i].calculatedAmount
    );
    if (hasChanges) {
      setEmployees(updatedEmployees);
    }
  };

  const handleEmployeeToggle = (employeeId: string) => {
    setEmployees(prev => prev.map(e => 
      e.id === employeeId ? { ...e, isSelected: !e.isSelected } : e
    ));
  };

  const handleManualPercentageChange = (employeeId: string, percentage: number) => {
    setEmployees(prev => prev.map(e => 
      e.id === employeeId ? { ...e, manualPercentage: percentage } : e
    ));
  };

  const handleDistribute = async () => {
    if (!restaurant?.id || !profile?.id) return;
    
    const selectedEmployees = employees.filter(e => e.isSelected && e.calculatedAmount > 0);
    if (selectedEmployees.length === 0) {
      toast({
        title: 'Selecciona al menos un empleado',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // 1. Create tip distribution record
      const { data: distribution, error: distError } = await supabase
        .from('tip_distributions')
        .insert({
          restaurant_id: restaurant.id,
          sale_id: saleId,
          cash_register_id: cashRegisterId || null,
          total_tip_amount: totalTipAmount,
          distribution_type: distributionType,
          distributed_by: profile.id,
          notes
        })
        .select()
        .single();

      if (distError) throw distError;

      // 2. Create tip payouts for each employee
      const payouts = selectedEmployees.map(e => ({
        distribution_id: distribution.id,
        employee_id: e.id,
        amount: e.calculatedAmount,
        percentage: e.manualPercentage,
        hours_worked: e.hoursWorked,
        status: 'pending'
      }));

      const { error: payoutsError } = await supabase
        .from('tip_payouts')
        .insert(payouts);

      if (payoutsError) throw payoutsError;

      toast({
        title: '✅ Propina distribuida',
        description: `${formatCurrency(totalTipAmount)} distribuido entre ${selectedEmployees.length} meseros`
      });

      onDistributed?.();
      onClose();
    } catch (error) {
      console.error('Error distributing tips:', error);
      toast({
        title: 'Error al distribuir propina',
        description: 'Intenta nuevamente',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    toast({
      title: 'Propina pendiente',
      description: 'Puedes distribuirla después desde Gestión de Caja'
    });
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const selectedCount = employees.filter(e => e.isSelected).length;
  const totalDistributed = employees.reduce((sum, e) => sum + e.calculatedAmount, 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <Coins className="h-6 w-6 text-yellow-400" />
            Distribución de Propina
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Total tip amount */}
          <div className="text-center p-4 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
            <p className="text-sm text-yellow-300">Total Propina</p>
            <p className="text-3xl font-bold text-yellow-400">{formatCurrency(totalTipAmount)}</p>
          </div>

          {/* Distribution type selector */}
          <div className="space-y-3">
            <Label className="text-white">Tipo de distribución</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={distributionType === 'equal' ? 'default' : 'outline'}
                className={`flex-col h-auto py-3 ${distributionType === 'equal' ? 'bg-primary' : 'border-white/20 text-white hover:bg-white/10'}`}
                onClick={() => setDistributionType('equal')}
              >
                <Divide className="h-5 w-5 mb-1" />
                <span className="text-xs">Equitativa</span>
              </Button>
              <Button
                variant={distributionType === 'by_hours' ? 'default' : 'outline'}
                className={`flex-col h-auto py-3 ${distributionType === 'by_hours' ? 'bg-primary' : 'border-white/20 text-white hover:bg-white/10'}`}
                onClick={() => setDistributionType('by_hours')}
              >
                <Timer className="h-5 w-5 mb-1" />
                <span className="text-xs">Por Horas</span>
              </Button>
              <Button
                variant={distributionType === 'manual' ? 'default' : 'outline'}
                className={`flex-col h-auto py-3 ${distributionType === 'manual' ? 'bg-primary' : 'border-white/20 text-white hover:bg-white/10'}`}
                onClick={() => setDistributionType('manual')}
              >
                <Hand className="h-5 w-5 mb-1" />
                <span className="text-xs">Manual</span>
              </Button>
            </div>
          </div>

          {/* Employees list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-white flex items-center gap-2">
                <Users className="h-4 w-4" />
                Meseros en turno ({selectedCount} seleccionados)
              </Label>
            </div>

            {employees.length === 0 ? (
              <div className="text-center py-6 text-white/60">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay empleados registrados en turno</p>
                <p className="text-xs">Los empleados deben marcar entrada primero</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {employees.map(employee => (
                  <div 
                    key={employee.id}
                    className={`p-3 rounded-lg border transition-all ${
                      employee.isSelected 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'bg-gray-800/50 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={employee.isSelected}
                        onCheckedChange={() => handleEmployeeToggle(employee.id)}
                        className="border-white/30 data-[state=checked]:bg-primary"
                      />
                      
                      <div className="flex-1">
                        <p className="font-medium text-white">{employee.full_name}</p>
                        {employee.hoursWorked > 0 && (
                          <p className="text-xs text-white/60 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatHours(employee.hoursWorked)}
                          </p>
                        )}
                      </div>

                      {distributionType === 'manual' && employee.isSelected && (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={employee.manualPercentage || ''}
                            onChange={(e) => handleManualPercentageChange(employee.id, parseFloat(e.target.value) || 0)}
                            className="w-16 h-8 text-center bg-gray-700 border-white/20 text-white"
                          />
                          <span className="text-white/60 text-sm">%</span>
                        </div>
                      )}

                      {employee.isSelected && (
                        <Badge variant="outline" className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                          {formatCurrency(employee.calculatedAmount)}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator className="bg-white/10" />

          {/* Summary */}
          <div className="p-3 rounded-lg bg-gray-800/50 border border-white/10">
            <div className="flex justify-between text-sm">
              <span className="text-white/60">Total a distribuir:</span>
              <span className="text-yellow-400 font-bold">{formatCurrency(totalDistributed)}</span>
            </div>
            {Math.abs(totalDistributed - totalTipAmount) > 1 && (
              <p className="text-xs text-orange-400 mt-1">
                ⚠️ El total no coincide. Ajusta los porcentajes.
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-white">Notas (opcional)</Label>
            <Input
              placeholder="Ej: Turno de la tarde..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-gray-800 border-white/20 text-white placeholder:text-white/40"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Distribuir después
            </Button>
            <Button
              onClick={handleDistribute}
              disabled={loading || selectedCount === 0}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-semibold"
            >
              <Check className="h-4 w-4 mr-2" />
              {loading ? 'Distribuyendo...' : 'Distribuir Propina'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TipDistributionModal;
