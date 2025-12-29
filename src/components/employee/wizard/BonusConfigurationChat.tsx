import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BonusConfig } from "./EmployeeCreationWizard";
import { BONUS_TYPES, BONUS_FREQUENCIES } from "@/lib/permissions";

interface BonusConfigurationChatProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig: BonusConfig | null;
  onConfigured: (config: BonusConfig) => void;
}

type ChatStep = 'type' | 'frequency' | 'rule' | 'cap' | 'confirm';

interface ChatMessage {
  role: 'assistant' | 'user';
  content: string;
  options?: { value: string; label: string }[];
}

const BonusConfigurationChat = ({
  isOpen,
  onClose,
  initialConfig,
  onConfigured
}: BonusConfigurationChatProps) => {
  const [currentStep, setCurrentStep] = useState<ChatStep>('type');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: '¡Hola! 👋 Vamos a configurar la bonificación. ¿Qué tipo de bonificación quieres establecer?',
      options: BONUS_TYPES.map(t => ({ value: t.value, label: t.label }))
    }
  ]);
  const [config, setConfig] = useState<Partial<BonusConfig>>(initialConfig || {});
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const addMessage = (role: 'assistant' | 'user', content: string, options?: { value: string; label: string }[]) => {
    setMessages(prev => [...prev, { role, content, options }]);
  };

  const handleOptionSelect = (value: string, label: string) => {
    setIsProcessing(true);
    addMessage('user', label);

    setTimeout(() => {
      switch (currentStep) {
        case 'type':
          setConfig(prev => ({ ...prev, bonus_type: value }));
          addMessage('assistant', '¿Con qué frecuencia se paga esta bonificación?', 
            BONUS_FREQUENCIES.map(f => ({ value: f.value, label: f.label }))
          );
          setCurrentStep('frequency');
          break;
        case 'frequency':
          setConfig(prev => ({ ...prev, frequency: value }));
          addMessage('assistant', 'Describe la regla de la bonificación. Por ejemplo: "5% de las ventas que superen $2,000,000" o "Bono fijo de $50,000 por turno completo"');
          setCurrentStep('rule');
          break;
      }
      setIsProcessing(false);
    }, 500);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isProcessing) return;

    setIsProcessing(true);
    addMessage('user', inputValue);
    const text = inputValue;
    setInputValue('');

    setTimeout(() => {
      switch (currentStep) {
        case 'rule':
          setConfig(prev => ({ ...prev, rule_description: text }));
          addMessage('assistant', '¿Hay un tope máximo para esta bonificación? Escribe el monto o "No" si no hay límite.');
          setCurrentStep('cap');
          break;
        case 'cap':
          const capValue = text.toLowerCase() === 'no' ? null : parseFloat(text.replace(/[^0-9]/g, '')) || null;
          setConfig(prev => ({ ...prev, max_cap: capValue }));
          
          // Show summary
          const summary = `
Perfecto, aquí está el resumen:
• Tipo: ${BONUS_TYPES.find(t => t.value === config.bonus_type)?.label}
• Frecuencia: ${BONUS_FREQUENCIES.find(f => f.value === config.frequency)?.label}
• Regla: ${config.rule_description}
${capValue ? `• Tope máximo: $${capValue.toLocaleString('es-CO')}` : '• Sin tope máximo'}

¿Está correcto?`;
          addMessage('assistant', summary, [
            { value: 'confirm', label: '✓ Confirmar' },
            { value: 'restart', label: '↺ Corregir' }
          ]);
          setCurrentStep('confirm');
          break;
        default:
          break;
      }
      setIsProcessing(false);
    }, 500);
  };

  const handleConfirm = (action: string) => {
    if (action === 'confirm') {
      const finalConfig: BonusConfig = {
        bonus_type: config.bonus_type || 'percentage_sales',
        frequency: config.frequency || 'monthly',
        rule_description: config.rule_description || '',
        formula: null,
        conditions: null,
        max_cap: config.max_cap || null
      };
      onConfigured(finalConfig);
    } else {
      // Restart
      setMessages([{
        role: 'assistant',
        content: '¡Empecemos de nuevo! ¿Qué tipo de bonificación quieres establecer?',
        options: BONUS_TYPES.map(t => ({ value: t.value, label: t.label }))
      }]);
      setConfig({});
      setCurrentStep('type');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg max-h-[80vh] bg-background rounded-2xl shadow-2xl overflow-hidden flex flex-col m-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">Configurar Bonificación</h3>
              <p className="text-sm text-muted-foreground">Asistente de configuración</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  
                  {/* Options */}
                  {message.options && message.role === 'assistant' && index === messages.length - 1 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {message.options.map((option) => (
                        <Button
                          key={option.value}
                          size="sm"
                          variant="secondary"
                          className="text-xs"
                          onClick={() => {
                            if (currentStep === 'confirm') {
                              handleConfirm(option.value);
                            } else {
                              handleOptionSelect(option.value, option.label);
                            }
                          }}
                          disabled={isProcessing}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-muted rounded-2xl px-4 py-3">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            </motion.div>
          )}
        </div>

        {/* Input - Only show for text input steps */}
        {(currentStep === 'rule' || currentStep === 'cap') && (
          <form onSubmit={handleTextSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={currentStep === 'rule' ? "Describe la regla..." : "Monto o 'No'"}
                disabled={isProcessing}
                className="flex-1"
              />
              <Button type="submit" size="icon" disabled={!inputValue.trim() || isProcessing}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default BonusConfigurationChat;
