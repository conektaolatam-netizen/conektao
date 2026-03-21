const STORAGE_KEY = 'conektao_printer_config';

export interface PrinterConfig {
  printerName: string;       // Nombre exacto de la impresora seleccionada
  autoprint: boolean;        // Imprimir automáticamente al llegar pedido de ALICIA
  paperWidth: '80mm' | '58mm' | 'a4'; // Ancho del papel
  copies: number;            // Número de copias por comanda
}

const DEFAULT_CONFIG: PrinterConfig = {
  printerName: '',
  autoprint: false,
  paperWidth: '80mm',
  copies: 1,
};

export function loadPrinterConfig(): PrinterConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_CONFIG };
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function savePrinterConfig(config: Partial<PrinterConfig>): void {
  const current = loadPrinterConfig();
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...config }));
}

export function clearPrinterConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasPrinterConfigured(): boolean {
  return loadPrinterConfig().printerName.trim().length > 0;
}
