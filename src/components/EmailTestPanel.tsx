import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Send, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: string;
}

const EmailTestPanel = () => {
  const [testEmail, setTestEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { toast } = useToast();

  const testEmailDelivery = async () => {
    if (!testEmail) {
      toast({
        title: "❌ Error",
        description: "Por favor ingresa un email de prueba",
        variant: "destructive"
      });
      return;
    }

    console.log("🧪 Starting email delivery test to:", testEmail);
    setIsLoading(true);

    try {
      // Create test invoice data
      const testInvoiceData = {
        customerEmail: testEmail,
        customerName: "Cliente de Prueba",
        restaurantName: "Restaurante Test",
        invoiceNumber: "TEST001",
        date: new Date().toLocaleDateString('es-CO'),
        time: new Date().toLocaleTimeString('es-CO'),
        items: [
          {
            name: "Pizza de Prueba",
            quantity: 1,
            price: 25000,
            total: 25000
          },
          {
            name: "Bebida de Prueba", 
            quantity: 2,
            price: 5000,
            total: 10000
          }
        ],
        subtotal: 35000,
        service: 2800,
        tax: 0,
        total: 37800,
        paymentMethod: "Efectivo"
      };

      console.log("📧 Sending test email with data:", testInvoiceData);

      const { data, error } = await supabase.functions.invoke('send-invoice', {
        body: testInvoiceData
      });

      console.log("📨 Test email response:", { data, error });

      const result: TestResult = {
        success: !error && data?.success,
        message: error ? `Error: ${error.message}` : data?.message || "Email enviado exitosamente",
        details: { data, error },
        timestamp: new Date().toLocaleString('es-CO')
      };

      setTestResults(prev => [result, ...prev]);

      if (result.success) {
        toast({
          title: "✅ Test exitoso",
          description: `Email de prueba enviado a ${testEmail}`,
        });
      } else {
        toast({
          title: "❌ Test fallido",
          description: result.message,
          variant: "destructive"
        });
      }

    } catch (error: any) {
      console.error("💥 Test error:", error);
      
      const result: TestResult = {
        success: false,
        message: `Error inesperado: ${error.message}`,
        details: error,
        timestamp: new Date().toLocaleString('es-CO')
      };

      setTestResults(prev => [result, ...prev]);

      toast({
        title: "❌ Error de test",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const getStatusIcon = (success: boolean) => {
    return success ? 
      <CheckCircle className="h-5 w-5 text-green-600" /> : 
      <XCircle className="h-5 w-5 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Panel de Testing de Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-email">Email de Prueba</Label>
            <Input
              id="test-email"
              type="email"
              placeholder="tu-email@ejemplo.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={testEmailDelivery} 
              disabled={isLoading}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? "Enviando..." : "Enviar Email de Prueba"}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {showAdvanced && (
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-sm">Configuración Avanzada</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <strong>Dominio de envío:</strong> resend.dev
                  </div>
                  <div>
                    <strong>CORS:</strong> Habilitado
                  </div>
                  <div>
                    <strong>Auth:</strong> JWT deshabilitado
                  </div>
                  <div>
                    <strong>Timeout:</strong> 30 segundos
                  </div>
                </div>
                <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-xs">
                      <strong>Nota:</strong> Para producción, configura tu propio dominio en Resend
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Resultados de Testing ({testResults.length})
          </CardTitle>
          {testResults.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearResults}>
              Limpiar
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {testResults.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay resultados de testing aún
            </div>
          ) : (
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <Card key={index} className={`border-l-4 ${result.success ? 'border-l-green-500' : 'border-l-red-500'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.success)}
                        <Badge variant={result.success ? "default" : "destructive"}>
                          {result.success ? "ÉXITO" : "ERROR"}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {result.timestamp}
                      </span>
                    </div>
                    
                    <p className="text-sm mb-2">{result.message}</p>
                    
                    {result.details && showAdvanced && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground">
                          Ver detalles técnicos
                        </summary>
                        <Textarea
                          className="mt-2 font-mono text-xs"
                          value={JSON.stringify(result.details, null, 2)}
                          readOnly
                          rows={6}
                        />
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailTestPanel;