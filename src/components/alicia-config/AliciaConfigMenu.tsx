import React from "react";
import { UtensilsCrossed } from "lucide-react";

interface Props { config: any; configId: string; onSave: (field: string, value: any) => Promise<void>; onReload: () => void; }

export default function AliciaConfigMenu({ config }: Props) {
  const menuData = config.menu_data || [];
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-teal-500 to-orange-400 px-5 py-4 flex items-center gap-3">
        <div className="bg-white/20 rounded-lg p-2"><UtensilsCrossed className="h-5 w-5 text-white" /></div>
        <div><h3 className="text-lg font-semibold text-white">Menú</h3><p className="text-xs text-white/80">Los productos que Alicia puede ofrecer</p></div>
      </div>
      <div className="p-5">
        <p className="text-sm text-gray-500 mb-4">Tu menú se carga automáticamente desde tus productos registrados.</p>
        {menuData.length > 0 ? (
          <div className="space-y-3">
            {menuData.map((cat: any, i: number) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                <span className="font-medium text-sm text-gray-800">{cat.name}</span>
                <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full">{(cat.items || []).length} productos</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <UtensilsCrossed className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">El menú se genera automáticamente desde tus productos en el sistema</p>
          </div>
        )}
      </div>
    </div>
  );
}
