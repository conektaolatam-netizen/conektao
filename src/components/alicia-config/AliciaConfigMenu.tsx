import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props { config: any; configId: string; onSave: (field: string, value: any) => Promise<void>; onReload: () => void; }

export default function AliciaConfigMenu({ config }: Props) {
  const menuData = config.menu_data || [];
  return (
    <Card>
      <CardHeader><CardTitle>Menú</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          Tu menú se carga automáticamente desde la tabla de productos. Aquí puedes ver un resumen.
        </p>
        {menuData.length > 0 ? (
          <div className="space-y-3">
            {menuData.map((cat: any, i: number) => (
              <div key={i}>
                <h4 className="font-medium text-sm">{cat.name}</h4>
                <p className="text-xs text-muted-foreground">{(cat.items || []).length} productos</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">El menú se genera automáticamente desde tus productos en el sistema</p>
        )}
      </CardContent>
    </Card>
  );
}
