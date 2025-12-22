import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Camera, MapPin, Send, Loader2 } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { toast } from 'sonner';

type PQRSType = 'peticion' | 'queja' | 'reclamo' | 'sugerencia';
type Priority = 'baja' | 'media' | 'alta';

interface PQRS {
  id?: string;
  type: PQRSType;
  title: string;
  description: string;
  priority: Priority;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  is_anonymous: boolean;
  employee_id?: string;
  employee_name?: string;
  branch_id?: string;
  branch_name?: string;
  location_latitude?: number;
  location_longitude?: number;
  location_address?: string;
  attachments?: string[];
  created_at?: string;
}

interface PQRSEmployeeProps {
  employeeId: string;
  employeeName: string;
  branchId: string;
  branchName: string;
  onSubmit: (pqrs: PQRS) => Promise<void>;
}

export const PQRSEmployee: React.FC<PQRSEmployeeProps> = ({
  employeeId,
  employeeName,
  branchId,
  branchName,
  onSubmit
}) => {
  const [type, setType] = useState<PQRSType>('sugerencia');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('media');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
    address?: string;
  } | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const fetchLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        address: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
      });
      toast.success('Ubicación obtenida correctamente');
    } catch (error) {
      console.error('Error getting location:', error);
      toast.error('No se pudo obtener la ubicación');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const takePhoto = async () => {
    try {
      const image = await CapCamera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });
      
      if (image.base64String) {
        setAttachments(prev => [...prev, `data:image/jpeg;base64,${image.base64String}`]);
        toast.success('Foto agregada');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      toast.error('No se pudo tomar la foto');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('El título es requerido');
      return;
    }
    if (!description.trim()) {
      toast.error('La descripción es requerida');
      return;
    }

    setIsSubmitting(true);
    try {
      const pqrs: PQRS = {
        type,
        title: title.trim(),
        description: description.trim(),
        priority,
        status: 'pending',
        is_anonymous: isAnonymous,
        employee_id: isAnonymous ? undefined : employeeId,
        employee_name: isAnonymous ? undefined : employeeName,
        branch_id: branchId,
        branch_name: branchName,
        location_latitude: location?.latitude,
        location_longitude: location?.longitude,
        location_address: location?.address,
        attachments: attachments.length > 0 ? attachments : undefined
      };

      await onSubmit(pqrs);
      
      // Reset form
      setTitle('');
      setDescription('');
      setType('sugerencia');
      setPriority('media');
      setIsAnonymous(false);
      setAttachments([]);
      
      toast.success('PQRS enviado correctamente');
    } catch (error) {
      console.error('Error submitting PQRS:', error);
      toast.error('Error al enviar el PQRS');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, []);

  const typeLabels: Record<PQRSType, string> = {
    peticion: 'Petición',
    queja: 'Queja',
    reclamo: 'Reclamo',
    sugerencia: 'Sugerencia'
  };

  const priorityLabels: Record<Priority, string> = {
    baja: 'Baja',
    media: 'Media',
    alta: 'Alta'
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Enviar PQRS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Type Selection */}
        <div className="space-y-2">
          <Label>Tipo de reporte</Label>
          <Select value={type} onValueChange={(v) => setType(v as PQRSType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(typeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            placeholder="Resumen breve del reporte"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            placeholder="Describe detalladamente tu reporte..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        {/* Priority */}
        <div className="space-y-2">
          <Label>Prioridad</Label>
          <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(priorityLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Anonymous Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enviar de forma anónima</Label>
            <p className="text-sm text-muted-foreground">
              Tu identidad no será visible para los administradores
            </p>
          </div>
          <Switch
            checked={isAnonymous}
            onCheckedChange={setIsAnonymous}
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Ubicación
          </Label>
          <div className="flex items-center gap-2">
            <Input
              value={location?.address || 'No disponible'}
              disabled
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={fetchLocation}
              disabled={isLoadingLocation}
            >
              {isLoadingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Photo Attachments */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            Adjuntos ({attachments.length})
          </Label>
          <div className="flex flex-wrap gap-2">
            {attachments.map((att, idx) => (
              <div key={idx} className="relative">
                <img
                  src={att}
                  alt={`Adjunto ${idx + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs"
                  onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                >
                  ×
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-20 h-20"
              onClick={takePhoto}
            >
              <Camera className="h-6 w-6" />
            </Button>
          </div>
        </div>

        {/* Employee Info (if not anonymous) */}
        {!isAnonymous && (
          <div className="p-4 bg-muted rounded-lg space-y-1">
            <p className="text-sm">
              <span className="font-medium">Empleado:</span> {employeeName}
            </p>
            <p className="text-sm">
              <span className="font-medium">Sucursal:</span> {branchName}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={isSubmitting || !title.trim() || !description.trim()}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Enviar PQRS
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PQRSEmployee;
