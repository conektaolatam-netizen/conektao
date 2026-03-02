import React, { useState } from "react";
import { MenuOnboardingUpload } from "@/components/onboarding/MenuOnboardingUpload";
import { MenuOnboardingReview } from "@/components/onboarding/MenuOnboardingReview";
import type { ExtractedMenuData } from "@/components/onboarding/MenuOnboardingFlow";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { UtensilsCrossed } from "lucide-react";

interface Props {
  data: any;
  onSave: (data: Record<string, any>) => void;
  saving: boolean;
  onBack?: () => void;
}

const OnboardingStepMenu = ({ onSave, saving, onBack }: Props) => {
  const { user, profile } = useAuth();
  const [step, setStep] = useState<"intro" | "upload" | "review">("intro");
  const [extractedData, setExtractedData] = useState<ExtractedMenuData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleUploadComplete = (data: ExtractedMenuData) => {
    setExtractedData(data);
    setStep("review");
  };

  const handleReviewConfirm = async (finalData: ExtractedMenuData) => {
    if (!user || !profile?.restaurant_id) {
      toast.error("No se pudo identificar tu restaurante");
      return;
    }

    setIsSaving(true);

    try {
      const restaurantId = profile.restaurant_id;
      let productsCreated = 0;

      for (const section of finalData.sections) {
        const categoryName = section.section_name.trim();

        const { data: existingCats } = await supabase
          .from("categories")
          .select("id")
          .eq("restaurant_id", restaurantId)
          .ilike("name", categoryName)
          .limit(1);

        let categoryId: string;

        if (existingCats && existingCats.length > 0) {
          categoryId = existingCats[0].id;
        } else {
          const { data: newCat, error: catError } = await supabase
            .from("categories")
            .insert({
              name: categoryName,
              user_id: user.id,
              restaurant_id: restaurantId,
            })
            .select("id")
            .single();

          if (catError) throw catError;
          categoryId = newCat.id;
        }

        for (const item of section.items) {
          if (item.variants.length <= 1) {
            const price = item.variants[0]?.price || 0;
            const sku = `${categoryName.substring(0, 3).toUpperCase()}-${Date.now().toString(36)}`;

            await supabase.from("products").insert({
              name: item.name,
              description: item.description || null,
              price,
              category_id: categoryId,
              user_id: user.id,
              restaurant_id: restaurantId,
              sku,
              is_active: true,
            });
            productsCreated++;
          } else {
            for (const variant of item.variants) {
              const variantName = `${item.name} (${variant.size})`;
              const sku = `${categoryName.substring(0, 3).toUpperCase()}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;

              await supabase.from("products").insert({
                name: variantName,
                description: item.description || null,
                price: variant.price,
                category_id: categoryId,
                user_id: user.id,
                restaurant_id: restaurantId,
                sku,
                is_active: true,
              });
              productsCreated++;
            }
          }
        }
      }

      toast.success(`¡${productsCreated} productos creados!`);
      onSave({ menu_imported: true, products_count: productsCreated });
    } catch (error) {
      console.error("Error saving menu:", error);
      toast.error("Error al guardar el menú. Intenta de nuevo.");
    } finally {
      setIsSaving(false);
    }
  };

  if (step === "upload") {
    return (
      <MenuOnboardingUpload
        onComplete={handleUploadComplete}
        onBack={() => setStep("intro")}
      />
    );
  }

  if (step === "review" && extractedData) {
    return (
      <MenuOnboardingReview
        data={extractedData}
        onConfirm={handleReviewConfirm}
        onBack={() => setStep("upload")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mx-auto mb-4">
          <UtensilsCrossed className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Sube tu menú</h2>
        <p className="text-muted-foreground mt-1">
          Toma fotos de tu menú y nuestra IA lo extrae automáticamente
        </p>
      </div>

      <div className="bg-card border border-border/50 rounded-xl p-4 space-y-3">
        <h3 className="font-semibold text-foreground text-sm">¿Cómo funciona?</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>📸 Toma fotos claras de cada página de tu menú</p>
          <p>🤖 Nuestra IA extrae categorías, productos, precios y descripciones</p>
          <p>✏️ Revisas y corriges antes de guardar</p>
        </div>
      </div>

      <div className="flex gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex-1 py-3 rounded-xl font-semibold border border-border text-foreground hover:bg-muted transition-all"
          >
            ← Atrás
          </button>
        )}
        <button
          onClick={() => setStep("upload")}
          className="flex-1 py-3 rounded-xl font-semibold text-primary-foreground bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-all"
        >
          📸 Subir fotos del menú
        </button>
      </div>

      <button
        onClick={() => onSave({ menu_imported: false, skipped: true })}
        disabled={saving}
        className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Omitir por ahora →
      </button>
    </div>
  );
};

export default OnboardingStepMenu;
