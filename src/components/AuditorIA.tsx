import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
  Eye,
  Send,
  Package,
  CreditCard,
  Users,
  AlertTriangle,
  TrendingDown,
  RefreshCw,
  Download,
  ArrowLeft,
  Loader2,
  Shield,
  Search,
  Calendar,
  FileText,
  DollarSign,
} from 'lucide-react';
import SuspiciousEventsPanel from './audit/SuspiciousEventsPanel';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AuditSummary {
  inventoryAlerts: number;
  cashAlerts: number;
  userAlerts: number;
  wasteAlerts: number;
  totalRiskLevel: 'low' | 'medium' | 'high';
}

interface AuditorIAProps {
  onClose?: () => void;
}

const AuditorIA = ({ onClose }: AuditorIAProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [auditSummary, setAuditSummary] = useState<AuditSummary | null>(null);
  const [auditData, setAuditData] = useState<any>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { profile } = useAuth();

  // Check permissions
  const hasPermission = 
    profile?.role === 'owner' || 
    profile?.role === 'admin' || 
    (profile?.permissions as any)?.view_audit_ia;

  useEffect(() => {
    if (hasPermission) {
      loadInitialAudit();
    }
  }, [hasPermission]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadInitialAudit = async () => {
    setIsLoadingSummary(true);
    try {
      const { data, error } = await supabase.functions.invoke('auditor-ia', {
        body: { 
          message: "Dame un resumen ejecutivo de auditoría de los últimos 7 días.",
          analysisType: 'summary'
        }
      });

      if (error) throw error;

      if (data?.auditData) {
        setAuditData(data.auditData);
        
        // Calculate summary
        const inventoryAlerts = data.auditData.inventoryDiscrepancies?.length || 0;
        const cashAlerts = data.auditData.cashAnalysis?.registersWithDifference?.length || 0;
        const userAlerts = data.auditData.suspiciousPatterns?.filter((p: any) => 
          p.type === 'high_void_rate'
        ).length || 0;
        const wasteAlerts = data.auditData.wasteAnalysis?.totalWaste || 0;

        const totalAlerts = inventoryAlerts + cashAlerts + userAlerts;
        const totalRiskLevel = totalAlerts > 5 ? 'high' : totalAlerts > 2 ? 'medium' : 'low';

        setAuditSummary({
          inventoryAlerts,
          cashAlerts,
          userAlerts,
          wasteAlerts,
          totalRiskLevel,
        });

        // Set initial AI message
        if (data.response) {
          setMessages([{
            role: 'assistant',
            content: data.response,
            timestamp: new Date(),
          }]);
        }
      }
    } catch (error: any) {
      console.error('Error loading audit:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cargar la auditoría",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const sendMessage = async (customMessage?: string) => {
    const messageToSend = customMessage || inputMessage.trim();
    if (!messageToSend || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('auditor-ia', {
        body: { message: messageToSend }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || 'No pude procesar tu solicitud.',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (data.auditData) {
        setAuditData(data.auditData);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const quickActions = [
    { label: 'Revisar cajeros', icon: Users, action: 'Analiza el comportamiento de cada cajero/empleado, identificando anulaciones, descuentos y diferencias de caja por usuario.' },
    { label: 'Revisar productos', icon: Package, action: 'Analiza qué productos tienen más mermas, descuentos o comportamientos extraños en ventas.' },
    { label: 'Inventario vs ventas', icon: TrendingDown, action: 'Compara el inventario teórico según ventas con el inventario real y muestra las diferencias significativas.' },
    { label: 'Cierres de caja', icon: CreditCard, action: 'Revisa todos los cierres de caja del período y detecta diferencias o patrones sospechosos.' },
    { label: 'Descargar informe', icon: Download, action: 'Genera un informe completo de auditoría en formato detallado para revisión.' },
  ];

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">🔴 Riesgo Alto</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">🟡 Riesgo Medio</Badge>;
      default:
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">🟢 Riesgo Bajo</Badge>;
    }
  };

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Card className="p-8 bg-card/80 backdrop-blur-sm border-red-500/30 max-w-md text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-bold mb-2">Acceso Restringido</h2>
          <p className="text-muted-foreground">
            No tienes permisos para acceder a auditorIA. 
            Contacta al administrador si necesitas acceso.
          </p>
          {onClose && (
            <Button onClick={onClose} className="mt-4" variant="outline">
              Volver
            </Button>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500/20 to-orange-500/20 border border-cyan-500/30">
              <Eye className="h-6 w-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">
                <span className="text-white">auditor</span>
                <span className="bg-gradient-to-r from-cyan-400 to-orange-500 bg-clip-text text-transparent">IA</span>
              </h1>
              <p className="text-xs text-muted-foreground">Auditoría del negocio</p>
            </div>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadInitialAudit}
          disabled={isLoadingSummary}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingSummary ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {!showChat ? (
        /* Dashboard View */
        <div className="flex-1 space-y-4 overflow-auto">
          {/* Summary Cards */}
          {isLoadingSummary ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              <span className="ml-3 text-muted-foreground">Analizando datos...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/20 hover:border-cyan-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Package className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{auditSummary?.inventoryAlerts || 0}</p>
                      <p className="text-xs text-muted-foreground">Diferencias inventario</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/20 hover:border-cyan-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/20">
                      <CreditCard className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{auditSummary?.cashAlerts || 0}</p>
                      <p className="text-xs text-muted-foreground">Alertas de caja</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/20 hover:border-cyan-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500/20">
                      <Users className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{auditSummary?.userAlerts || 0}</p>
                      <p className="text-xs text-muted-foreground">Alertas por usuario</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/20 hover:border-cyan-500/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-500/20">
                      <AlertTriangle className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{auditSummary?.wasteAlerts || 0}</p>
                      <p className="text-xs text-muted-foreground">Mermas detectadas</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Risk Level Summary */}
              <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/20">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Estado General de Auditoría</h3>
                  {auditSummary && getRiskBadge(auditSummary.totalRiskLevel)}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Reviso tus ventas, inventarios y caja en busca de errores, pérdidas o posibles robos.
                </p>
                
                {/* Main CTA */}
                <Button 
                  onClick={() => setShowChat(true)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-orange-500 hover:from-cyan-600 hover:to-orange-600 text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all"
                >
                  <Eye className="h-5 w-5 mr-2" />
                  💬 Chatear con auditorIA
                </Button>
              </Card>

              {/* Suspicious Patterns Preview */}
              {auditData?.suspiciousPatterns?.length > 0 && (
                <Card className="p-4 bg-card/80 backdrop-blur-sm border-red-500/20">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    Patrones Sospechosos Detectados
                  </h3>
                  <div className="space-y-2">
                    {auditData.suspiciousPatterns.slice(0, 3).map((pattern: any, idx: number) => (
                      <div key={idx} className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{pattern.userName || 'Usuario'}</span>
                          <Badge variant="outline" className={
                            pattern.riskLevel === 'high' ? 'border-red-500 text-red-400' : 'border-yellow-500 text-yellow-400'
                          }>
                            {pattern.riskLevel === 'high' ? '🔴 Alto' : '🟡 Medio'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{pattern.detail}</p>
                      </div>
                    ))}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-3 text-cyan-400"
                    onClick={() => setShowChat(true)}
                  >
                    Ver análisis completo →
                  </Button>
                </Card>
              )}

              {/* Inventory Discrepancies Preview */}
              {auditData?.inventoryDiscrepancies?.length > 0 && (
                <Card className="p-4 bg-card/80 backdrop-blur-sm border-purple-500/20">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4 text-purple-400" />
                    Diferencias de Inventario
                  </h3>
                  <div className="space-y-2">
                    {auditData.inventoryDiscrepancies.slice(0, 3).map((disc: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-purple-500/10 rounded-lg">
                        <span className="text-sm font-medium">{disc.ingredient}</span>
                        <span className={`text-sm ${parseFloat(disc.differencePercent) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {disc.differencePercent}%
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Suspicious Events from POS */}
              <SuspiciousEventsPanel />
            </>
          )}
        </div>
      ) : (
        /* Chat View */
        <div className="flex-1 flex flex-col bg-card/50 rounded-xl border border-border/20 overflow-hidden">
          {/* Chat Header */}
          <div className="p-3 border-b border-border/20 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setShowChat(false)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al resumen
            </Button>
            <div className="flex gap-2">
              {auditSummary && getRiskBadge(auditSummary.totalRiskLevel)}
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-4 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-cyan-500 to-orange-500 text-white'
                        : 'bg-card border border-border/30'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="h-4 w-4 text-cyan-400" />
                        <span className="text-xs font-semibold">
                          <span className="text-white">auditor</span>
                          <span className="text-cyan-400">IA</span>
                        </span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-white/70' : 'text-muted-foreground'}`}>
                      {msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-card border border-border/30 p-4 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                      <span className="text-sm text-muted-foreground">Analizando...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Quick Actions */}
          <div className="p-3 border-t border-border/20">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {quickActions.map((action, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  className="flex-shrink-0 border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-500/50"
                  onClick={() => sendMessage(action.action)}
                  disabled={isLoading}
                >
                  <action.icon className="h-3 w-3 mr-1" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border/20">
            <div className="flex gap-2">
              <Input
                placeholder="Pregunta sobre auditoría, empleados, inventario..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                disabled={isLoading}
                className="flex-1 bg-background/50 border-border/30"
              />
              <Button
                onClick={() => sendMessage()}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-gradient-to-r from-cyan-500 to-orange-500 hover:from-cyan-600 hover:to-orange-600"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditorIA;
