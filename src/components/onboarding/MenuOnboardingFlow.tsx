import { useState } from 'react';
import { MenuOnboardingWelcome } from './MenuOnboardingWelcome';
import { MenuOnboardingUpload } from './MenuOnboardingUpload';
import { MenuOnboardingReview } from './MenuOnboardingReview';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type MenuSection = {
  section_name: string;
  items: MenuItemData[];
};

export type MenuItemData = {
  name: string;
  description: string | null;
  variants: { size: string; price: number }[];
  confidence_score: number;
};

export type ExtractedMenuData = {
  sections: MenuSection[];
  metadata: {
    total_sections: number;
    total_items: number;
    low_confidence_items: number;
    images_processed: number;
  };
};

interface MenuOnboardingFlowProps {
  onComplete: (data: ExtractedMenuData) => void;
  onSkip: () => void;
}

export function MenuOnboardingFlow({ onComplete, onSkip }: MenuOnboardingFlowProps) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState<'welcome' | 'upload' | 'review'>('welcome');
  const [extractedData, setExtractedData] = useState<ExtractedMenuData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleUploadComplete = (data: ExtractedMenuData) => {
    setExtractedData(data);
    setStep('review');
  };

  const handleReviewConfirm = async (finalData: ExtractedMenuData) => {
    if (!user || !profile?.restaurant_id) {
      toast.error('No se pudo identificar tu restaurante');
      return;
    }

    setIsSaving(true);

    try {
      const restaurantId = profile.restaurant_id;
      let categoriesCreated = 0;
      let productsCreated = 0;

      for (const section of finalData.sections) {
        // Find or create category
        const categoryName = section.section_name.trim();
        
        const { data: existingCats } = await supabase
          .from('categories')
          .select('id')
          .eq('restaurant_id', restaurantId)
          .ilike('name', categoryName)
          .limit(1);

        let categoryId: string;

        if (existingCats && existingCats.length > 0) {
          categoryId = existingCats[0].id;
        } else {
          const { data: newCat, error: catError } = await supabase
            .from('categories')
            .insert({
              name: categoryName,
              user_id: user.id,
              restaurant_id: restaurantId,
            })
            .select('id')
            .single();

          if (catError) throw catError;
          categoryId = newCat.id;
          categoriesCreated++;
        }

        // Create products for this category
        for (const item of section.items) {
          if (item.variants.length <= 1) {
            // Single variant product
            const price = item.variants[0]?.price || 0;
            const sku = `${categoryName.substring(0, 3).toUpperCase()}-${Date.now().toString(36)}`;

            const { error: prodError } = await supabase
              .from('products')
              .insert({
                name: item.name,
                description: item.description || null,
                price,
                category_id: categoryId,
                user_id: user.id,
                restaurant_id: restaurantId,
                sku,
                is_active: true,
              });

            if (prodError) throw prodError;
            productsCreated++;
          } else {
            // Multiple variants — one product per variant
            for (const variant of item.variants) {
              const variantName = `${item.name} (${variant.size})`;
              const sku = `${categoryName.substring(0, 3).toUpperCase()}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`;

              const { error: prodError } = await supabase
                .from('products')
                .insert({
                  name: variantName,
                  description: item.description || null,
                  price: variant.price,
                  category_id: categoryId,
                  user_id: user.id,
                  restaurant_id: restaurantId,
                  sku,
                  is_active: true,
                });

              if (prodError) throw prodError;
              productsCreated++;
            }
          }
        }
      }

      // Update menu_import_session
      await supabase
        .from('menu_import_sessions')
        .update({
          status: 'completed',
          final_data: finalData as any,
          products_created: productsCreated,
          categories_created: categoriesCreated,
          completed_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('status', 'review')
        .order('created_at', { ascending: false })
        .limit(1);

      toast.success(`¡${productsCreated} productos creados en ${finalData.sections.length} categorías!`);
      onComplete(finalData);

    } catch (error) {
      console.error('Error saving menu:', error);
      toast.error('Error al guardar el menú. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {step === 'welcome' && (
        <MenuOnboardingWelcome 
          onStart={() => setStep('upload')} 
          onSkip={onSkip}
        />
      )}
      
      {step === 'upload' && (
        <MenuOnboardingUpload 
          onComplete={handleUploadComplete}
          onBack={() => setStep('welcome')}
        />
      )}
      
      {step === 'review' && extractedData && (
        <MenuOnboardingReview 
          data={extractedData}
          onConfirm={handleReviewConfirm}
          onBack={() => setStep('upload')}
        />
      )}
    </div>
  );
}
