import React, { useState } from "react";
import { UtensilsCrossed, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { MenuOnboardingFlow, ExtractedMenuData } from "@/components/onboarding/MenuOnboardingFlow";

interface Props { config: any; configId: string; onSave: (field: string, value: any) => Promise<void>; onReload: () => void; }

export default function AliciaConfigMenu({ config, onReload }: Props) {
  const menuData = config.menu_data || [];
  const [showImport, setShowImport] = useState(false);

  const handleImportComplete = (_data: ExtractedMenuData) => {
    setShowImport(false);
    onReload();
  };

  return (
    <>
      <div className="bg-card border border-border/20 rounded-xl shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-teal-500 to-orange-400 px-5 py-4 flex items-center gap-3">
          <div className="bg-white/20 rounded-lg p-2"><UtensilsCrossed className="h-5 w-5 text-white" /></div>
          <div><h3 className="text-lg font-semibold text-white">Menú</h3><p className="text-xs text-white/80">Los productos que Alicia puede ofrecer</p></div>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Tu menú se carga automáticamente desde tus productos registrados.</p>
            <Button
              onClick={() => setShowImport(true)}
              size="sm"
              className="bg-gradient-to-r from-teal-500 to-orange-400 text-white gap-2 shrink-0"
            >
              <Sparkles className="h-4 w-4" />
              Importar menú con IA
            </Button>
          </div>
          {menuData.length > 0 ? (
            <div className="space-y-3">
              {menuData.map((cat: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-muted rounded-lg px-4 py-3">
                  <span className="font-medium text-sm text-foreground">{cat.name}</span>
                  <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded-full">{(cat.items || []).length} productos</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-muted rounded-lg p-6 text-center">
              <UtensilsCrossed className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">El menú se genera automáticamente desde tus productos en el sistema</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={showImport} onOpenChange={setShowImport}>
        <DialogContent className="max-w-4xl h-[90vh] p-0 overflow-auto">
          <MenuOnboardingFlow
            onComplete={handleImportComplete}
            onSkip={() => setShowImport(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}