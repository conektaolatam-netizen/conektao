import * as React from "react"
import { cn } from "@/lib/utils"

interface CurrencyInputProps extends Omit<React.ComponentProps<"input">, 'onChange' | 'value'> {
  value?: number | null;
  onChange?: (value: number) => void;
  placeholder?: string;
  currency?: string;
  showCurrencyLabel?: boolean;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ 
    className, 
    value, 
    onChange, 
    placeholder = "Ej: 50.000",
    currency = "COP",
    showCurrencyLabel = true,
    ...props 
  }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("");
    const [isFocused, setIsFocused] = React.useState(false);

    // Formatear número a string con separadores de miles
    const formatNumber = (num: number): string => {
      if (num === 0) return "";
      return new Intl.NumberFormat('es-CO', {
        maximumFractionDigits: 0,
        useGrouping: true
      }).format(num);
    };

    // Parsear string a número (remover puntos de miles)
    const parseNumber = (str: string): number => {
      const cleaned = str.replace(/\./g, '').replace(/,/g, '').replace(/[^\d]/g, '');
      return parseInt(cleaned, 10) || 0;
    };

    // Actualizar display cuando cambia el value externo (solo si no está enfocado)
    React.useEffect(() => {
      if (!isFocused) {
        if (value && value > 0) {
          setDisplayValue(formatNumber(value));
        } else {
          setDisplayValue("");
        }
      }
    }, [value, isFocused]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Al enfocar, mostrar el número sin formato o vacío
      if (value && value > 0) {
        setDisplayValue(value.toString());
      } else {
        setDisplayValue("");
      }
      props.onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      // Al perder foco, formatear el número
      const numValue = parseNumber(displayValue);
      if (numValue > 0) {
        setDisplayValue(formatNumber(numValue));
      } else {
        setDisplayValue("");
      }
      props.onBlur?.(e);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      
      // Solo permitir dígitos y puntos (para copiar/pegar números formateados)
      const cleanedForDisplay = rawValue.replace(/[^\d.]/g, '');
      setDisplayValue(cleanedForDisplay);
      
      // Parsear y enviar el valor numérico limpio
      const numericValue = parseNumber(cleanedForDisplay);
      onChange?.(numericValue);
    };

    return (
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            showCurrencyLabel && "pr-16",
            className
          )}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          {...props}
        />
        {showCurrencyLabel && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-medium pointer-events-none">
            {currency}
          </div>
        )}
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
