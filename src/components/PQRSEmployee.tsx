import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import {
  MessageSquare,
  Send,
  Shield,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  Camera as CameraIcon,
  FileText,
  Star,
  Calendar,
  Filter,
  Search,
  Eye,
  MoreHorizontal
} from 'lucide-react';

interface PQRS {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'peticion' | 'queja' | 'reclamo' | 'sugerencia';
  title: string;
  description: string;
  anonymous: boolean;
  status: 'pending' | 'in_review' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
  branch: string;
  location?: {
    lat: number;
    lng: number;
    verified: boolean;
    address?: string;
  };
  attachments?: string[];
  response?: string;
  rating?: number;
}

interface PQRSEmployeeProps {
  employeeId: string;
  employeeName: string;
  branch: string;
  onSubmit: (pqrs: Partial<PQRS>) => void;
}

const PQRSEmployee = ({ employeeId, employeeName, branch, onSubmit }: PQRSEmployeeProps) => {
  const [formData, setFormData] = useState({
    type: '' as PQRS['type'],
    title: '',
    description: '',
    anonymous: false,
    priority: 'medium' as PQRS['priority']
  });
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Obtener ubicación automáticamente al cargar
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      
      toast({
        title: "Ubicación Verificada",
        description: "Tu ubicación ha sido registrada para verificación",
      });
    } catch (error) {
      toast({
        title: "Error de Ubicación",
        description: "No se pudo obtener tu ubicación. Asegúrate de estar en el establecimiento.",
        variant: "destructive"
      });
    }
  };

  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      if (image.dataUrl) {
        setAttachments([...attachments, image.dataUrl]);
        toast({
          title: "Foto Agregada",
          description: "La imagen ha sido adjuntada a tu reporte",
        });
      }
    } catch (error) {
      toast({
        title: "Error de Cámara",
        description: "No se pudo tomar la foto",
        variant: "destructive"
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.type || !formData.title || !formData.description) {
      toast({
        title: "Campos Requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive"
      });
      return;
    }

    if (!location) {
      toast({
        title: "Ubicación Requerida",
        description: "Se necesita verificar tu ubicación para enviar el reporte",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const pqrsData: Partial<PQRS> = {
        employeeId: formData.anonymous ? 'anonymous' : employeeId,
        employeeName: formData.anonymous ? 'Anónimo' : employeeName,
        type: formData.type,
        title: formData.title,
        description: formData.description,
        anonymous: formData.anonymous,
        priority: formData.priority,
        branch,
        location: {
          lat: location.lat,
          lng: location.lng,
          verified: true
        },
        attachments: attachments.length > 0 ? attachments : undefined,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      onSubmit(pqrsData);
      
      // Reset form
      setFormData({
        type: '' as PQRS['type'],
        title: '',
        description: '',
        anonymous: false,
        priority: 'medium'
      });
      setAttachments([]);
      
      toast({
        title: "PQRS Enviado",
        description: "Tu reporte ha sido enviado exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error al Enviar",
        description: "Hubo un problema al enviar tu reporte",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white/90 backdrop-blur-sm border-gray-200/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Sistema PQRS - Empleados
        </CardTitle>
        <p className="text-sm text-gray-600">
          Peticiones, Quejas, Reclamos y Sugerencias con verificación de ubicación
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de PQRS */}
          <div>
            <Label htmlFor="type">Tipo de Reporte *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: PQRS['type']) => setFormData({...formData, type: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el tipo de reporte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="peticion">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    Petición
                  </div>
                </SelectItem>
                <SelectItem value="queja">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Queja
                  </div>
                </SelectItem>
                <SelectItem value="reclamo">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-red-500" />
                    Reclamo
                  </div>
                </SelectItem>
                <SelectItem value="sugerencia">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-green-500" />
                    Sugerencia
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Título */}
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Describe brevemente tu reporte"
              required
            />
          </div>

          {/* Descripción */}
          <div>
            <Label htmlFor="description">Descripción Detallada *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Explica detalladamente tu petición, queja, reclamo o sugerencia"
              rows={4}
              required
            />
          </div>

          {/* Prioridad */}
          <div>
            <Label htmlFor="priority">Prioridad</Label>
            <Select 
              value={formData.priority} 
              onValueChange={(value: PQRS['priority']) => setFormData({...formData, priority: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    Baja
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    Media
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    Alta
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Opciones adicionales */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={formData.anonymous}
                onChange={(e) => setFormData({...formData, anonymous: e.target.checked})}
                className="rounded border-gray-300"
              />
              <Label htmlFor="anonymous" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Enviar de forma anónima
              </Label>
            </div>

            {/* Estado de ubicación */}
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <MapPin className="h-4 w-4 text-blue-500" />
              <span className="text-sm">
                {location ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Ubicación verificada
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Verificando ubicación...
                  </div>
                )}
              </span>
              <Button 
                type="button" 
                size="sm" 
                variant="outline" 
                onClick={getCurrentLocation}
                className="ml-auto"
              >
                Actualizar
              </Button>
            </div>

            {/* Adjuntar fotos */}
            <div className="space-y-2">
              <Label>Adjuntos (Opcional)</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={takePhoto}
                  className="flex items-center gap-2"
                >
                  <CameraIcon className="h-4 w-4" />
                  Tomar Foto
                </Button>
                {attachments.length > 0 && (
                  <Badge className="bg-green-100 text-green-700">
                    {attachments.length} foto(s) adjunta(s)
                  </Badge>
                )}
              </div>
              
              {/* Preview de imágenes */}
              {attachments.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="relative">
                      <img 
                        src={attachment} 
                        alt={`Adjunto ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Información del empleado (si no es anónimo) */}
          {!formData.anonymous && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Enviado por:</strong> {employeeName} | <strong>Sucursal:</strong> {branch}
              </p>
            </div>
          )}

          {/* Botón de envío */}
          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            disabled={isSubmitting || !location}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Enviando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Enviar Reporte
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PQRSEmployee;