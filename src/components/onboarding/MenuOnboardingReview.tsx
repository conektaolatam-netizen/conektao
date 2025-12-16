import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Check, AlertTriangle, Trash2, Plus, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import type { ExtractedMenuData, MenuSection, MenuItemData } from './MenuOnboardingFlow';

interface MenuOnboardingReviewProps {
  data: ExtractedMenuData;
  onConfirm: (data: ExtractedMenuData) => void;
  onBack: () => void;
}

export function MenuOnboardingReview({ data, onConfirm, onBack }: MenuOnboardingReviewProps) {
  const [sections, setSections] = useState<MenuSection[]>(data.sections);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const updateItem = (sectionIndex: number, itemIndex: number, updates: Partial<MenuItemData>) => {
    setSections(prev => {
      const newSections = [...prev];
      newSections[sectionIndex] = {
        ...newSections[sectionIndex],
        items: newSections[sectionIndex].items.map((item, i) => 
          i === itemIndex ? { ...item, ...updates } : item
        )
      };
      return newSections;
    });
  };

  const updateVariantPrice = (sectionIndex: number, itemIndex: number, variantIndex: number, price: number) => {
    setSections(prev => {
      const newSections = [...prev];
      const item = newSections[sectionIndex].items[itemIndex];
      const newVariants = [...item.variants];
      newVariants[variantIndex] = { ...newVariants[variantIndex], price };
      newSections[sectionIndex].items[itemIndex] = { ...item, variants: newVariants };
      return newSections;
    });
  };

  const deleteItem = (sectionIndex: number, itemIndex: number) => {
    setSections(prev => {
      const newSections = [...prev];
      newSections[sectionIndex] = {
        ...newSections[sectionIndex],
        items: newSections[sectionIndex].items.filter((_, i) => i !== itemIndex)
      };
      // Remove empty sections
      return newSections.filter(s => s.items.length > 0);
    });
    toast.success('Producto eliminado');
  };

  const handleConfirm = () => {
    const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);
    if (totalItems === 0) {
      toast.error('Debes tener al menos un producto');
      return;
    }
    
    onConfirm({
      sections,
      metadata: {
        ...data.metadata,
        total_sections: sections.length,
        total_items: totalItems,
      }
    });
  };

  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);
  const lowConfidenceCount = sections.reduce((sum, s) => 
    sum + s.items.filter(i => i.confidence_score < 70).length, 0);

  return (
    <div className="min-h-screen p-4 pb-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto space-y-4"
      >
        {/* Header */}
        <Card className="border-primary/20 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex-1">
                <CardTitle>Revisa tu menú</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Edita o elimina productos antes de guardar
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-4 flex-wrap">
              <Badge variant="outline" className="gap-1">
                <Check className="w-3 h-3" />
                {sections.length} categorías
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Check className="w-3 h-3" />
                {totalItems} productos
              </Badge>
              {lowConfidenceCount > 0 && (
                <Badge variant="destructive" className="gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {lowConfidenceCount} requieren revisión
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Sections */}
        <Accordion type="multiple" defaultValue={sections.map((_, i) => `section-${i}`)}>
          {sections.map((section, sectionIndex) => (
            <AccordionItem 
              key={`section-${sectionIndex}`} 
              value={`section-${sectionIndex}`}
              className="border border-border/50 rounded-lg mb-3 overflow-hidden bg-card/50"
            >
              <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{section.section_name}</span>
                  <Badge variant="secondary">{section.items.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3">
                  {section.items.map((item, itemIndex) => {
                    const itemKey = `${sectionIndex}-${itemIndex}`;
                    const isEditing = editingItem === itemKey;
                    const isLowConfidence = item.confidence_score < 70;
                    
                    return (
                      <motion.div
                        key={itemKey}
                        layout
                        className={`p-3 rounded-lg border ${
                          isLowConfidence 
                            ? 'border-yellow-500/50 bg-yellow-500/5' 
                            : 'border-border/50 bg-muted/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <Input
                                value={item.name}
                                onChange={(e) => updateItem(sectionIndex, itemIndex, { name: e.target.value })}
                                className="font-medium mb-2"
                                autoFocus
                                onBlur={() => setEditingItem(null)}
                                onKeyDown={(e) => e.key === 'Enter' && setEditingItem(null)}
                              />
                            ) : (
                              <p className="font-medium truncate">{item.name}</p>
                            )}
                            
                            {item.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                {item.description}
                              </p>
                            )}
                            
                            {/* Variants/Prices */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {item.variants.map((variant, vIndex) => (
                                <div 
                                  key={vIndex}
                                  className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-sm"
                                >
                                  <span className="text-muted-foreground">{variant.size}:</span>
                                  <Input
                                    type="number"
                                    value={variant.price}
                                    onChange={(e) => updateVariantPrice(sectionIndex, itemIndex, vIndex, Number(e.target.value))}
                                    className="w-24 h-6 text-sm p-1"
                                  />
                                </div>
                              ))}
                            </div>

                            {isLowConfidence && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-yellow-600">
                                <AlertTriangle className="w-3 h-3" />
                                Baja confianza ({item.confidence_score}%) - Revisa este item
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditingItem(isEditing ? null : itemKey)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => deleteItem(sectionIndex, itemIndex)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Fixed bottom action */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t">
          <div className="max-w-3xl mx-auto flex gap-3">
            <Button variant="outline" onClick={onBack} className="flex-1">
              Volver a subir
            </Button>
            <Button 
              onClick={handleConfirm}
              className="flex-1 bg-gradient-to-r from-primary to-orange-500"
            >
              <Check className="w-4 h-4 mr-2" />
              Confirmar {totalItems} productos
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
