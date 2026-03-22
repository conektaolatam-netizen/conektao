import React, { useState } from 'react';
import { Printer, CheckCircle, AlertCircle, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SettingsSection from './SettingsSection';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  loadPrinterConfig,
  savePrinterConfig,
  type PrinterConfig,
} from '@/lib/printerConfig';
import { printKitchenTickets, type ComandaData } from '@/lib/printComanda';
import { useToast } from '@/hooks/use-toast';

const TEST_COMANDA: ComandaData = {
  order_id: 'TEST-0001',
  customer_name: 'Cliente Prueba',
  customer_phone: '+573001234567',
  items: [
    { product_name: 'Arepa con Queso', quantity: 2, unit_price: 8000 },
    { product_name: 'Jugo de Mora', quantity: 1, unit_price: 5000, notes: 'sin azúcar' },
  ],
  total: 21000,
  delivery_type: 'delivery',
  delivery_address: 'Calle 5 #10-20',
  payment_method: 'Efectivo',
  notes: 'Tocar timbre',
  created_at: new Date().toISOString(),
  source: 'whatsapp',
};

// ─── Componente ───────────────────────────────────────────────────────────────

const PrinterSettings: React.FC = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<PrinterConfig>(loadPrinterConfig);

  // Flujo de configuración por primera vez
  // 'idle' → botón "Configurar"
  // 'step1' → usuario debe hacer la impresión de prueba
  // 'step2' → usuario ingresa el nombre de la impresora
  const [setupPhase, setSetupPhase] = useState<'idle' | 'step1' | 'step2'>('idle');
  const [printerNameInput, setPrinterNameInput] = useState('');

  function handleStartSetup() {
    setSetupPhase('step1');
  }

  function handleStep1Print() {
    const success = printKitchenTickets(TEST_COMANDA);
    if (!success) {
      toast({
        title: 'No se pudo abrir la ventana de impresión',
        description: 'Permite ventanas emergentes (pop-ups) para este sitio en tu navegador.',
        variant: 'destructive',
      });
      return;
    }
    setSetupPhase('step2');
  }

  function handleSavePrinterName() {
    const name = printerNameInput.trim();
    if (!name) return;
    const updated = { ...config, printerName: name };
    setConfig(updated);
    savePrinterConfig(updated);
    setSetupPhase('idle');
    setPrinterNameInput('');
    toast({ title: 'Impresora configurada', description: name });
  }

  function handleChangePrinter() {
    setPrinterNameInput(config.printerName);
    setSetupPhase('step1');
  }

  function handlePaperWidthChange(value: PrinterConfig['paperWidth']) {
    const updated = { ...config, paperWidth: value };
    setConfig(updated);
    savePrinterConfig(updated);
  }

  function handleTestPrint() {
    const success = printComanda(TEST_COMANDA);
    if (!success) {
      toast({
        title: 'No se pudo abrir la ventana de impresión',
        description: 'Permite ventanas emergentes (pop-ups) para este sitio en tu navegador.',
        variant: 'destructive',
      });
    }
  }

  const isPrinterConfigured = config.printerName.trim().length > 0;

  return (
    <div className="space-y-6">

      {/* ── 1. Configuración de impresora ── */}
      <SettingsSection
        title="Impresora"
        description="Configúrala una sola vez y las comandas se imprimirán automáticamente"
      >
        <div className="p-4 space-y-4">

          {/* Estado: configurada */}
          {isPrinterConfigured && setupPhase === 'idle' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-green-800">Impresora configurada</p>
                  <p className="text-xs text-green-700 truncate">{config.printerName}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-700 hover:text-green-900 text-xs flex-shrink-0"
                  onClick={handleChangePrinter}
                >
                  Cambiar
                </Button>
              </div>
            </div>
          )}

          {/* Estado: sin configurar — botón inicial */}
          {!isPrinterConfigured && setupPhase === 'idle' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800">Sin impresora configurada</p>
              </div>
              <Button className="w-full gap-2" onClick={handleStartSetup}>
                <Printer className="h-4 w-4" />
                Configurar impresora
              </Button>
            </div>
          )}

          {/* Paso 1: imprimir comanda de prueba */}
          {setupPhase === 'step1' && (
            <div className="space-y-4 rounded-xl border border-border/50 bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
                <p className="text-sm font-semibold">Imprime una comanda de prueba</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Al hacer clic se abrirá el diálogo de impresión. Selecciona tu impresora térmica
                y haz clic en <strong>Imprimir</strong>. Memoriza el nombre que aparece en el diálogo.
              </p>
              <Button className="w-full gap-2" onClick={handleStep1Print}>
                <FlaskConical className="h-4 w-4" />
                Abrir diálogo de impresión
              </Button>
            </div>
          )}

          {/* Paso 2: ingresar nombre de la impresora */}
          {setupPhase === 'step2' && (
            <div className="space-y-4 rounded-xl border border-border/50 bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                <p className="text-sm font-semibold">¿Cómo se llama tu impresora?</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Escribe el nombre exacto como aparece en el diálogo de impresión.
                Solo necesitas hacerlo esta única vez.
              </p>
              <input
                type="text"
                placeholder="Ej: Epson TM-T20, BIXOLON SRP-350…"
                value={printerNameInput}
                onChange={(e) => setPrinterNameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSavePrinterName()}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoFocus
              />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setSetupPhase('step1')}>
                  Volver
                </Button>
                <Button
                  className="flex-1"
                  disabled={!printerNameInput.trim()}
                  onClick={handleSavePrinterName}
                >
                  Guardar y listo
                </Button>
              </div>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* ── 2. Ventanas emergentes ── */}
      <SettingsSection
        title="Permitir ventanas emergentes"
        description="Requerido para que la impresión automática funcione"
      >
        <div className="p-4 space-y-4">
          {/* Alerta explicativa */}
          <div className="flex gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-3">
            <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              Chrome bloquea ventanas emergentes por defecto. Sin este permiso,{' '}
              <strong>las comandas no se imprimirán automáticamente</strong>.
              Solo necesitas hacerlo una vez.
            </p>
          </div>

          {/* Paso 1 */}
          <div className="flex gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex-shrink-0 mt-0.5">1</span>
            <div className="space-y-1">
              <p className="text-sm font-medium">Busca el ícono de bloqueo en Chrome</p>
              <p className="text-xs text-muted-foreground">
                En la barra de direcciones de Chrome, a la izquierda de la URL,
                hay un ícono de <strong>candado</strong> o de <strong>información</strong> (i).
                Haz clic en él.
              </p>
            </div>
          </div>

          <div className="border-t border-border/40" />

          {/* Paso 2 */}
          <div className="flex gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex-shrink-0 mt-0.5">2</span>
            <div className="space-y-1">
              <p className="text-sm font-medium">Permite las ventanas emergentes</p>
              <p className="text-xs text-muted-foreground">
                En el menú que aparece, busca <strong>"Ventanas emergentes y redireccionamientos"</strong>{' '}
                y cambia el valor de <strong>"Bloquear"</strong> a <strong>"Permitir"</strong>.
                Chrome guardará este permiso para siempre en este sitio.
              </p>
            </div>
          </div>

          <div className="border-t border-border/40" />

          {/* Paso 3 */}
          <div className="flex gap-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex-shrink-0 mt-0.5">3</span>
            <div className="space-y-1">
              <p className="text-sm font-medium">Configura tu térmica como predeterminada</p>
              <p className="text-xs text-muted-foreground">
                Para que Chrome seleccione tu térmica automáticamente, ve a{' '}
                <strong>Configuración del sistema → Impresoras</strong>, haz clic derecho
                sobre tu térmica y elige <strong>"Usar como predeterminada"</strong>.
              </p>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* ── 3. Ancho del papel ── */}
      <SettingsSection
        title="Papel"
        description="Elige el formato según tu impresora"
      >
        <div className="p-4 space-y-2">
          <Label className="text-sm font-medium">Ancho del papel</Label>
          <Select
            value={config.paperWidth}
            onValueChange={(v) => handlePaperWidthChange(v as PrinterConfig['paperWidth'])}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="80mm">80mm — Térmica estándar (restaurantes)</SelectItem>
              <SelectItem value="58mm">58mm — Térmica pequeña</SelectItem>
              <SelectItem value="a4">A4 / Carta — Impresora de oficina</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SettingsSection>

      {/* ── 4. Prueba (solo si hay impresora) ── */}
      {isPrinterConfigured && (
        <SettingsSection title="Prueba">
          <div className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Imprime una comanda de ejemplo para verificar que el formato es correcto.
            </p>
            <Button variant="outline" className="w-full gap-2" onClick={handleTestPrint}>
              <FlaskConical className="h-4 w-4" />
              Imprimir comanda de prueba
            </Button>
          </div>
        </SettingsSection>
      )}
    </div>
  );
};

export default PrinterSettings;
