import { useState } from 'react';
import { MenuOnboardingFlow, ExtractedMenuData } from '@/components/onboarding/MenuOnboardingFlow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function MenuOnboardingTest() {
  const navigate = useNavigate();
  const [result, setResult] = useState<ExtractedMenuData | null>(null);
  const [showFlow, setShowFlow] = useState(true);

  const handleComplete = (data: ExtractedMenuData) => {
    setResult(data);
    setShowFlow(false);
    toast.success('¡Fase 1 completada! Datos extraídos correctamente.');
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  if (showFlow) {
    return <MenuOnboardingFlow onComplete={handleComplete} onSkip={handleSkip} />;
  }

  // Show results for validation
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border-green-500/50 bg-green-500/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-green-700">¡Fase 1 Validada!</CardTitle>
                <p className="text-sm text-muted-foreground">
                  La IA extrajo correctamente los datos del menú
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 flex-wrap">
              <Badge variant="outline" className="text-lg py-2 px-4">
                {result?.metadata.total_sections} categorías
              </Badge>
              <Badge variant="outline" className="text-lg py-2 px-4">
                {result?.metadata.total_items} productos
              </Badge>
              <Badge variant="outline" className="text-lg py-2 px-4">
                {result?.metadata.images_processed} imágenes procesadas
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Raw JSON for debugging */}
        <Card>
          <CardHeader>
            <CardTitle>JSON Extraído (para debug)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button variant="outline" onClick={() => setShowFlow(true)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Probar de nuevo
          </Button>
          <Button onClick={() => navigate('/dashboard')}>
            Ir al Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
