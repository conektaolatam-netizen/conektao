import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Loader2, CheckCircle, AlertCircle, Timer, Calendar, User, Users, UserCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import FaceVerification from "./FaceVerification";

interface TimeRecord {
  id: string;
  employee_id: string;
  clock_type: 'clock_in' | 'clock_out';
  timestamp: string;
  is_valid_location: boolean;
  latitude: number | null;
  longitude: number | null;
  employee_name?: string;
}

interface TimeTrackingProps {
  selectedEmployeeId?: string;
  viewMode?: 'employee' | 'manager';
}

const TimeTracking = ({ selectedEmployeeId, viewMode = 'employee' }: TimeTrackingProps) => {
  const { profile, restaurant } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [isInWorkArea, setIsInWorkArea] = useState(false);
  const [lastClockAction, setLastClockAction] = useState<'clock_in' | 'clock_out' | null>(null);
  const [todayRecords, setTodayRecords] = useState<TimeRecord[]>([]);
  const [workingTime, setWorkingTime] = useState<string>("00:00:00");
  const [allEmployeeRecords, setAllEmployeeRecords] = useState<TimeRecord[]>([]);
  
  // Face verification states
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [pendingClockAction, setPendingClockAction] = useState<'clock_in' | 'clock_out' | null>(null);
  const [employeeFaceDescriptor, setEmployeeFaceDescriptor] = useState<number[] | null>(null);
  const [hasFaceEnrolled, setHasFaceEnrolled] = useState(false);

  const targetEmployeeId = viewMode === 'manager' && selectedEmployeeId ? selectedEmployeeId : profile?.id;

  const loadTodayRecords = async () => {
    if (!targetEmployeeId || !restaurant?.id) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      let query = supabase
        .from('time_clock_records')
        .select(`
          *,
          profiles!inner(full_name)
        `)
        .gte('timestamp', `${today}T00:00:00`)
        .lt('timestamp', `${today}T23:59:59`)
        .order('timestamp', { ascending: false });

      if (viewMode === 'employee') {
        query = query.eq('employee_id', targetEmployeeId);
      } else if (viewMode === 'manager' && restaurant?.id) {
        query = query.eq('restaurant_id', restaurant.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const recordsWithNames = (data || []).map(record => ({
        ...record,
        employee_name: record.profiles?.full_name || 'Usuario'
      }));

      if (viewMode === 'employee') {
        setTodayRecords(recordsWithNames);
        
        if (recordsWithNames.length > 0) {
          setLastClockAction(recordsWithNames[0].clock_type);
        } else {
          setLastClockAction(null);
        }
      } else {
        setAllEmployeeRecords(recordsWithNames);
      }
    } catch (error: any) {
      console.error("Error loading today's records:", error);
    }
  };

  const calculateWorkingTime = () => {
    if (todayRecords.length === 0) {
      setWorkingTime("00:00:00");
      return;
    }

    let totalSeconds = 0;
    let currentClockIn: Date | null = null;
    
    // Ordenar registros cronológicamente (más antiguos primero)
    const sortedRecords = [...todayRecords].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Calcular tiempo acumulado por cada par entrada-salida
    for (const record of sortedRecords) {
      const recordTime = new Date(record.timestamp);

      if (record.clock_type === 'clock_in') {
        currentClockIn = recordTime;
      } else if (record.clock_type === 'clock_out' && currentClockIn) {
        // Calcular tiempo trabajado en este período
        const diffMs = recordTime.getTime() - currentClockIn.getTime();
        totalSeconds += Math.floor(diffMs / 1000);
        currentClockIn = null;
      }
    }

    // Si hay una entrada activa (sin salida), sumar tiempo hasta ahora
    if (currentClockIn && lastClockAction === 'clock_in') {
      const now = new Date();
      const diffMs = now.getTime() - currentClockIn.getTime();
      totalSeconds += Math.floor(diffMs / 1000);
    }

    // Convertir a formato HH:MM:SS
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    setWorkingTime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  };

  const getCurrentLocation = async () => {
    console.log("🔍 Iniciando getCurrentLocation...");
    setLocationLoading(true);
    
    if (!navigator.geolocation) {
      console.error("❌ Geolocation no disponible");
      toast({
        title: "Error",
        description: "La geolocalización no está disponible en este dispositivo",
        variant: "destructive"
      });
      setLocationLoading(false);
      return;
    }

    try {
      console.log("🌍 Solicitando posición...");
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
        );
      });

      const userLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      console.log("📍 Ubicación obtenida:", userLocation);
      setCurrentLocation(userLocation);

      // Determinar ancla (establecimiento o ubicación específica del empleado)
      let anchorLat: number | null = null;
      let anchorLng: number | null = null;
      let allowedRadius: number = 100;
      let source: 'restaurant' | 'employee' | 'none' = 'none';

      if (restaurant) {
        anchorLat = (restaurant.latitude as unknown as number) ?? null;
        anchorLng = (restaurant.longitude as unknown as number) ?? null;
        allowedRadius = (restaurant.location_radius as unknown as number) ?? 100;
        source = 'restaurant';
        console.log("🏪 Datos del restaurante:", {
          lat: restaurant.latitude,
          lng: restaurant.longitude,
          radius: restaurant.location_radius
        });
      }

      // Intentar usar ubicación específica del empleado si existe (tiene prioridad)
      try {
        if (targetEmployeeId) {
          const { data: emp, error: empErr } = await supabase
            .from('profiles')
            .select('work_latitude, work_longitude, location_radius')
            .eq('id', targetEmployeeId)
            .maybeSingle();
          console.log('👤 Ubicación de empleado:', emp, empErr);
          if (!empErr && emp?.work_latitude != null && emp?.work_longitude != null) {
            anchorLat = emp.work_latitude as unknown as number;
            anchorLng = emp.work_longitude as unknown as number;
            allowedRadius = (emp.location_radius as unknown as number) ?? allowedRadius;
            source = 'employee';
          }
        }
      } catch (e) {
        console.warn('No se pudo obtener ubicación de empleado', e);
      }

      if (anchorLat == null || anchorLng == null) {
        console.warn('⚠️ No hay coordenadas base configuradas');
        setIsInWorkArea(false);
        toast({
          title: 'Ubicación base no configurada',
          description: 'Configura la ubicación del establecimiento o del empleado en el perfil.',
          variant: 'destructive'
        });
        return;
      }

      // Cálculo local de distancia (haversine)
      const R = 6371000; // m
      const lat1Rad = (anchorLat * Math.PI) / 180;
      const lat2Rad = (userLocation.latitude * Math.PI) / 180;
      const deltaLatRad = ((userLocation.latitude - anchorLat) * Math.PI) / 180;
      const deltaLngRad = ((userLocation.longitude - anchorLng) * Math.PI) / 180;

      const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
               Math.cos(lat1Rad) * Math.cos(lat2Rad) *
               Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      const within = distance <= allowedRadius;
      console.log("📏 Distancia calculada localmente:", distance, "metros", "| Radio:", allowedRadius, "| Fuente:", source);
      setIsInWorkArea(within);

      // Si la fuente es restaurante, validar también con RPC (no anula true -> false)
      if (restaurant && source === 'restaurant') {
        console.log("🏪 Validando con RPC validate_clock_location para restaurante:", restaurant.id);
        const { data: rpcIsValid, error } = await supabase.rpc('validate_clock_location', {
          restaurant_id_param: restaurant.id,
          user_lat: userLocation.latitude,
          user_lng: userLocation.longitude
        });
        console.log("🧪 Resultado RPC:", { rpcIsValid, error });
        if (error) {
          console.error("❌ Error en validación RPC:", error);
        }
        // Preferir el cálculo local si dice que está dentro
        if (within && rpcIsValid === false) {
          console.warn('RPC devolvió false pero cálculo local indica dentro; usando cálculo local.');
        }
      }

      if (within) {
        toast({
          title: "✅ Ubicación válida",
          description: `Dentro del radio (${Math.round(distance)}m ≤ ${allowedRadius}m) usando ${source === 'employee' ? 'ubicación de empleado' : 'ubicación del establecimiento'}.`,
        });
      } else {
        toast({
          title: "Fuera del área de trabajo",
          description: `Distancia: ${Math.round(distance)}m. Radio permitido: ${allowedRadius}m (fuente: ${source === 'employee' ? 'empleado' : 'establecimiento'})`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("❌ Error getting location:", error);
      toast({
        title: "Error de ubicación",
        description: "No se pudo obtener la ubicación. Verifica los permisos del navegador.",
        variant: "destructive"
      });
    } finally {
      setLocationLoading(false);
    }
  };

  // Initiate clock action - may require face verification
  const initiateClockAction = (action: 'clock_in' | 'clock_out') => {
    if (!profile?.id || !restaurant?.id || !currentLocation || !isInWorkArea) {
      toast({
        title: "Error",
        description: "Debes estar en el área de trabajo para registrar",
        variant: "destructive"
      });
      return;
    }

    // If face is enrolled, require verification
    if (hasFaceEnrolled && employeeFaceDescriptor) {
      setPendingClockAction(action);
      setShowFaceVerification(true);
    } else {
      // No face enrolled, proceed directly
      executeClockAction(action, false, null, null);
    }
  };

  // Handle face verification success
  const handleFaceVerificationSuccess = (confidence: number, photoUrl: string | null) => {
    if (pendingClockAction) {
      executeClockAction(pendingClockAction, true, confidence, photoUrl);
    }
    setPendingClockAction(null);
  };

  // Handle face verification failed
  const handleFaceVerificationFailed = () => {
    toast({
      title: "Verificación omitida",
      description: "El registro se completará sin verificación facial",
    });
    if (pendingClockAction) {
      executeClockAction(pendingClockAction, false, null, null);
    }
    setPendingClockAction(null);
  };

  // Execute the actual clock action
  const executeClockAction = async (
    action: 'clock_in' | 'clock_out', 
    faceVerified: boolean,
    faceConfidence: number | null,
    facePhotoUrl: string | null
  ) => {
    if (!profile?.id || !restaurant?.id || !currentLocation) return;

    setLoading(true);

    try {
      const deviceInfo = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('time_clock_records')
        .insert({
          employee_id: profile.id,
          restaurant_id: restaurant.id,
          clock_type: action,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          is_valid_location: isInWorkArea,
          device_info: deviceInfo,
          face_verified: faceVerified,
          face_confidence: faceConfidence,
          face_photo_url: facePhotoUrl
        });

      if (error) throw error;

      const actionText = action === 'clock_in' ? 'entrada' : 'salida';
      const verificationText = faceVerified ? ' con verificación facial' : '';
      toast({
        title: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} registrada`,
        description: `Tu ${actionText} ha sido registrada exitosamente${verificationText}`
      });

      setLastClockAction(action);
      loadTodayRecords();
    } catch (error: any) {
      console.error("Error recording clock action:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar la acción",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Load employee face descriptor
  useEffect(() => {
    const loadFaceDescriptor = async () => {
      if (!profile?.id || viewMode !== 'employee') return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('face_descriptor, face_enrolled_at')
          .eq('id', profile.id)
          .single();
        
        if (!error && data?.face_descriptor && data?.face_enrolled_at) {
          setEmployeeFaceDescriptor(data.face_descriptor as number[]);
          setHasFaceEnrolled(true);
        } else {
          setHasFaceEnrolled(false);
          setEmployeeFaceDescriptor(null);
        }
      } catch (e) {
        console.error('Error loading face descriptor:', e);
      }
    };
    
    loadFaceDescriptor();
  }, [profile?.id, viewMode]);

  useEffect(() => {
    loadTodayRecords();
    if (viewMode === 'employee') {
      getCurrentLocation();
    }
  }, [profile?.id, targetEmployeeId, viewMode]);

  useEffect(() => {
    if (viewMode === 'employee') {
      calculateWorkingTime();
      // Actualizar cada segundo cuando hay una entrada activa
      const interval = setInterval(calculateWorkingTime, 1000);
      return () => clearInterval(interval);
    }
  }, [todayRecords, lastClockAction, viewMode]);

  const getStatusBadge = () => {
    if (lastClockAction === 'clock_in') {
      return <Badge className="bg-green-500 text-white">En trabajo</Badge>;
    } else if (lastClockAction === 'clock_out') {
      return <Badge variant="secondary">Fuera de trabajo</Badge>;
    } else {
      return <Badge variant="outline">Sin registros hoy</Badge>;
    }
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (viewMode === 'manager') {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Control de Tiempo - Vista Gerencial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allEmployeeRecords.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No hay registros de tiempo para hoy
                </p>
              ) : (
                <div className="space-y-3">
                  {allEmployeeRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        {record.clock_type === 'clock_in' ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium">{record.employee_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {record.clock_type === 'clock_in' ? 'Entrada' : 'Salida'} - {formatTime(record.timestamp)}
                          </p>
                        </div>
                      </div>
                      <Badge variant={record.is_valid_location ? "outline" : "destructive"}>
                        {record.is_valid_location ? "Válido" : "Ubicación inválida"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile || profile.role === 'owner') {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Los propietarios no necesitan registrar entrada/salida
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Control de Tiempo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="font-semibold">{profile.full_name}</h3>
                <p className="text-sm text-muted-foreground">{restaurant?.name}</p>
              </div>
            </div>
            {getStatusBadge()}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="text-center p-4 bg-muted rounded-lg">
              <Timer className="h-6 w-6 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{workingTime}</p>
              <p className="text-sm text-muted-foreground">Tiempo trabajado hoy</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <Calendar className="h-6 w-6 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{todayRecords.length}</p>
              <p className="text-sm text-muted-foreground">Registros hoy</p>
            </div>
          </div>

          {/* GPS status - ONLY affects attendance registration, NOT billing */}
          <Alert className={`mb-6 ${isInWorkArea ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
            <MapPin className={`h-4 w-4 ${isInWorkArea ? 'text-green-600' : 'text-amber-600'}`} />
            <AlertDescription className={isInWorkArea ? 'text-green-800' : 'text-amber-800'}>
              {locationLoading ? (
                "Verificando ubicación para asistencia..."
              ) : currentLocation ? (
                isInWorkArea ? (
                  "✓ Ubicación válida para registrar entrada/salida"
                ) : (
                  <>
                    <span className="font-medium">Solo para asistencia:</span> Acércate al restaurante para registrar entrada/salida.
                    <br />
                    <span className="text-xs opacity-75">Esto NO afecta tu acceso a facturación.</span>
                  </>
                )
              ) : (
                <>
                  Ubicación no disponible para asistencia.
                  <br />
                  <span className="text-xs opacity-75">Permite el acceso a ubicación para registrar entrada/salida.</span>
                </>
              )}
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={() => initiateClockAction('clock_in')}
              disabled={loading || !isInWorkArea || lastClockAction === 'clock_in'}
              size="lg"
              className="h-16"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : hasFaceEnrolled ? (
                <UserCheck className="h-4 w-4 mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Registrar Entrada
            </Button>
            
            <Button
              onClick={() => initiateClockAction('clock_out')}
              disabled={loading || !isInWorkArea || lastClockAction !== 'clock_in'}
              variant="outline"
              size="lg"
              className="h-16"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : hasFaceEnrolled ? (
                <UserCheck className="h-4 w-4 mr-2" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-2" />
              )}
              Registrar Salida
            </Button>
          </div>

          {hasFaceEnrolled && (
            <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
              <UserCheck className="h-3 w-3" />
              Verificación facial habilitada
            </p>
          )}

          <Button
            onClick={getCurrentLocation}
            variant="ghost"
            size="sm"
            disabled={locationLoading}
            className="w-full mt-4"
          >
            {locationLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <MapPin className="h-4 w-4 mr-2" />
            )}
            Actualizar Ubicación
          </Button>
        </CardContent>
      </Card>

      {todayRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registros de Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayRecords.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    {record.clock_type === 'clock_in' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">
                        {record.clock_type === 'clock_in' ? 'Entrada' : 'Salida'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(record.timestamp)}
                      </p>
                    </div>
                  </div>
                  <Badge variant={record.is_valid_location ? "outline" : "destructive"}>
                    {record.is_valid_location ? "Válido" : "Ubicación inválida"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Face Verification Dialog */}
      {employeeFaceDescriptor && profile && (
        <FaceVerification
          isOpen={showFaceVerification}
          onOpenChange={setShowFaceVerification}
          employeeId={profile.id}
          employeeName={profile.full_name}
          storedDescriptor={employeeFaceDescriptor}
          onVerificationSuccess={handleFaceVerificationSuccess}
          onVerificationFailed={handleFaceVerificationFailed}
        />
      )}
    </div>
  );
};

export default TimeTracking;