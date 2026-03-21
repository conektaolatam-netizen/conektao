import React, { useState, useEffect } from 'react';
import { Printer, RefreshCw, CheckCircle, AlertCircle, FlaskConical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import SettingsSection from './SettingsSection';
import {
  loadPrinterConfig,
  savePrinterConfig,
  type PrinterConfig,
} from '@/lib/printerConfig';
import { printComanda, type ComandaData } from '@/lib/printComanda';
import { useToast } from '@/hooks/use-toast';

// ─── Detección de impresoras ──────────────────────────────────────────────────
// La API window.print() no expone una lista de impresoras directamente.
// Usamos la API experimental window.navigator.permissions + CSS @media print
// para detectar si hay impresoras. En la práctica, el browser no expone
// los nombres — la lista de impresoras viene del diálogo del OS cuando el
// usuario hace clic en "Imprimir". Por eso mostramos la impresora seleccionada
// via un flujo de "prueba de impresión" donde el usuario ve el diálogo del OS
// y luego ingresa (o confirmamos) cuál quiere usar.
//
// Para mayor comodidad, también ofrecemos un campo manual para escribir el
// nombre exacto de la impresora, que el usuario puede copiar del diálogo del OS.

const COMMON_THERMAL_PRINTERS = [
  'Epson TM-T20',
  'Epson TM-T88',
  'Star TSP100',
  'Star TSP650',
  'Bixolon SRP-350',
  'Citizens CT-S310',
  'HP LaserJet',
  'Otra impresora',
];

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
  const [customName, setCustomName] = useState('');
  const [saved, setSaved] = useState(false);

  // Sincronizar campo manual si ya hay una impresora guardada
  useEffect(() => {
    if (config.printerName && !COMMON_THERMAL_PRINTERS.slice(0, -1).includes(config.printerName)) {
      setCustomName(config.printerName);
    }
  }, []);

  function handleSelectPrinter(value: string) {
    const name = value === 'Otra impresora' ? customName : value;
    const updated = { ...config, printerName: name };
    setConfig(updated);
    savePrinterConfig(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleCustomNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCustomName(e.target.value);
  }

  function handleCustomNameSave() {
    const name = customName.trim();
    if (!name) return;
    const updated = { ...config, printerName: name };
    setConfig(updated);
    savePrinterConfig(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast({ title: 'Impresora guardada', description: name });
  }

  function handleAutoprintToggle(checked: boolean) {
    const updated = { ...config, autoprint: checked };
    setConfig(updated);
    savePrinterConfig(updated);
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

  const selectedDropdownValue = COMMON_THERMAL_PRINTERS.slice(0, -1).includes(config.printerName)
    ? config.printerName
    : config.printerName
    ? 'Otra impresora'
    : '';

  return (
    <div className="space-y-6">
      {/* ── Selección de impresora ── */}
      <SettingsSection
        title="Impresora"
        description="Selecciona la impresora donde se imprimirán las comandas"
      >
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Impresora instalada</Label>
            <Select
              value={selectedDropdownValue}
              onValueChange={handleSelectPrinter}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona una impresora…" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_THERMAL_PRINTERS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              ¿No ves tu impresora? Escribe el nombre exacto abajo (lo encuentras en
              Configuración del sistema → Impresoras).
            </p>
          </div>

          {/* Campo manual */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nombre exacto de la impresora…"
              value={customName}
              onChange={handleCustomNameChange}
              className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <Button variant="outline" size="sm" onClick={handleCustomNameSave}>
              {saved ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                'Guardar'
              )}
            </Button>
          </div>

          {/* Estado actual */}
          {config.printerName ? (
            <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-3 py-2">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="text-sm text-green-800 font-medium">
                {config.printerName}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-md bg-amber-50 border border-amber-200 px-3 py-2">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span className="text-sm text-amber-800">
                Sin impresora configurada
              </span>
            </div>
          )}
        </div>
      </SettingsSection>

      {/* ── Ancho del papel ── */}
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

      {/* ── Autoimpresión ── */}
      <SettingsSection
        title="Autoimpresión"
        description="Imprime automáticamente cada vez que ALICIA confirme un pedido"
      >
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="autoprint" className="text-sm font-medium cursor-pointer">
                Imprimir al confirmar pedido
              </Label>
              <p className="text-xs text-muted-foreground">
                {config.autoprint
                  ? 'Activo — cada pedido de WhatsApp se imprimirá automáticamente'
                  : 'Inactivo — recibirás una notificación para imprimir manualmente'}
              </p>
            </div>
            <Switch
              id="autoprint"
              checked={config.autoprint}
              onCheckedChange={handleAutoprintToggle}
              disabled={!config.printerName}
            />
          </div>
          {!config.printerName && (
            <p className="mt-2 text-xs text-amber-600">
              Configura una impresora primero para activar la autoimpresión.
            </p>
          )}
        </div>
      </SettingsSection>

      {/* ── Prueba ── */}
      <SettingsSection title="Prueba">
        <div className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Imprime una comanda de ejemplo para verificar que todo funciona correctamente.
          </p>
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleTestPrint}
          >
            <FlaskConical className="h-4 w-4" />
            Imprimir comanda de prueba
          </Button>
          <p className="text-xs text-muted-foreground">
            Se abrirá el diálogo de impresión de tu sistema. Selecciona la impresora
            que quieras usar y verifica que el formato es correcto.
          </p>
        </div>
      </SettingsSection>
    </div>
  );
};

export default PrinterSettings;
