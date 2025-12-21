import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, Percent } from 'lucide-react';

interface TipSelectorProps {
  subtotal: number;
  tipEnabled: boolean;
  defaultTipPercent: number;
  selectedTipPercent: number;
  customTipAmount: string;
  noTip: boolean;
  onTipPercentChange: (percent: number) => void;
  onCustomTipChange: (amount: string) => void;
  onNoTipChange: (noTip: boolean) => void;
  allowTipEdit: boolean;
}

const TIP_QUICK_OPTIONS = [0, 5, 8, 10];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const TipSelector: React.FC<TipSelectorProps> = ({
  subtotal,
  tipEnabled,
  defaultTipPercent,
  selectedTipPercent,
  customTipAmount,
  noTip,
  onTipPercentChange,
  onCustomTipChange,
  onNoTipChange,
  allowTipEdit
}) => {
  if (!tipEnabled) return null;

  const calculateTipAmount = () => {
    if (noTip) return 0;
    if (customTipAmount && parseFloat(customTipAmount) > 0) {
      return parseFloat(customTipAmount);
    }
    return subtotal * selectedTipPercent / 100;
  };

  const suggestedAmount = subtotal * defaultTipPercent / 100;
  const currentAmount = calculateTipAmount();

  return (
    <Card className="bg-gray-800/50 border-yellow-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white text-lg">
          <Coins className="h-5 w-5 text-yellow-500" />
          Propina
          <span className="text-sm font-normal text-gray-400">
            (sugerida: {defaultTipPercent}%)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Propina sugerida */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-300 text-sm">Propina sugerida ({defaultTipPercent}%):</span>
            <span className="text-yellow-400 font-bold text-lg">{formatCurrency(suggestedAmount)}</span>
          </div>
        </div>

        {allowTipEdit && (
          <>
            {/* Botones rápidos de porcentaje */}
            <div className="space-y-2">
              <Label className="text-gray-300 text-sm">Seleccionar porcentaje:</Label>
              <div className="grid grid-cols-5 gap-2">
                {TIP_QUICK_OPTIONS.map((percent) => (
                  <Button
                    key={percent}
                    type="button"
                    variant={!noTip && !customTipAmount && selectedTipPercent === percent ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      onNoTipChange(percent === 0);
                      onCustomTipChange('');
                      onTipPercentChange(percent);
                    }}
                    className={`
                      ${!noTip && !customTipAmount && selectedTipPercent === percent 
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-none" 
                        : "border-white/20 text-white hover:bg-white/10"
                      }
                      ${percent === 0 ? "text-red-400" : ""}
                    `}
                  >
                    {percent === 0 ? "0%" : `${percent}%`}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant={customTipAmount ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    onNoTipChange(false);
                    // Focus the custom input
                    const input = document.getElementById('custom-tip-input');
                    if (input) input.focus();
                  }}
                  className={`
                    ${customTipAmount 
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none" 
                      : "border-white/20 text-white hover:bg-white/10"
                    }
                  `}
                >
                  Otro
                </Button>
              </div>
            </div>

            {/* Input personalizado */}
            <div className="space-y-2">
              <Label htmlFor="custom-tip-input" className="text-gray-300 text-sm flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Monto personalizado:
              </Label>
              <Input
                id="custom-tip-input"
                type="number"
                placeholder="Ingrese monto personalizado"
                value={customTipAmount}
                onChange={(e) => {
                  onCustomTipChange(e.target.value);
                  if (e.target.value) {
                    onNoTipChange(false);
                  }
                }}
                min="0"
                className="bg-gray-700/50 border-white/20 text-white placeholder:text-gray-500"
              />
            </div>
          </>
        )}

        {/* Total propina actual */}
        <div className={`rounded-lg p-4 ${noTip ? 'bg-red-500/10 border border-red-500/30' : 'bg-green-500/10 border border-green-500/30'}`}>
          <div className="flex justify-between items-center">
            <span className={`font-medium ${noTip ? 'text-red-400' : 'text-green-400'}`}>
              {noTip ? '❌ Sin propina' : '✅ Propina total:'}
            </span>
            <span className={`text-2xl font-bold ${noTip ? 'text-red-400' : 'text-green-400'}`}>
              {formatCurrency(currentAmount)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TipSelector;
