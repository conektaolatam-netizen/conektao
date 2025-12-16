import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Sparkles, Clock, ChefHat } from 'lucide-react';
import { motion } from 'framer-motion';

interface MenuOnboardingWelcomeProps {
  onStart: () => void;
  onSkip: () => void;
}

export function MenuOnboardingWelcome({ onStart, onSkip }: MenuOnboardingWelcomeProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-8 text-center space-y-6">
            {/* Icon */}
            <motion.div 
              className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <ChefHat className="w-10 h-10 text-primary-foreground" />
            </motion.div>

            {/* Title */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                ¡Hola! Soy tu IA de Onboarding
              </h1>
              <p className="text-muted-foreground">
                En menos de 3 minutos voy a leer tu carta, crear tus productos y dejar tu restaurante listo para facturar.
              </p>
            </div>

            {/* Features */}
            <div className="grid gap-3 text-left">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-full bg-primary/10">
                  <Upload className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Sube fotos de tu menú</p>
                  <p className="text-xs text-muted-foreground">Físico o digital, cualquier formato</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-full bg-primary/10">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">IA extrae tus productos</p>
                  <p className="text-xs text-muted-foreground">Nombres, precios, categorías automáticamente</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="p-2 rounded-full bg-primary/10">
                  <Clock className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Revisa y confirma</p>
                  <p className="text-xs text-muted-foreground">Edita lo que necesites antes de guardar</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4">
              <Button 
                onClick={onStart} 
                className="w-full h-12 text-lg bg-gradient-to-r from-primary to-orange-500 hover:from-primary/90 hover:to-orange-500/90"
              >
                <Upload className="w-5 h-5 mr-2" />
                Subir fotos de mi carta
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={onSkip}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Saltar y crear productos manualmente
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
