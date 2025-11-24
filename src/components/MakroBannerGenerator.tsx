import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';

export const MakroBannerGenerator = () => {
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  const generateBanner = async () => {
    setGenerating(true);
    try {
      toast({
        title: 'Generando banner...',
        description: 'Esto puede tomar unos segundos'
      });

      const { data, error } = await supabase.functions.invoke('generate-makro-banner', {});

      if (error) throw error;

      if (data.imageUrl) {
        // Convert base64 to blob
        const base64Data = data.imageUrl.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/png' });

        // Upload to Supabase storage
        const fileName = `makro-banner-${Date.now()}.png`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, blob, {
            contentType: 'image/png',
            upsert: false
          });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName);

        setBannerUrl(urlData.publicUrl);

        toast({
          title: 'Banner generado',
          description: 'La imagen se ha generado y guardado exitosamente',
          className: 'bg-green-500 text-white'
        });
      }

    } catch (error: any) {
      console.error('Error generating banner:', error);
      toast({
        title: 'Error',
        description: error.message || 'Error al generar el banner',
        variant: 'destructive'
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button 
          onClick={generateBanner} 
          disabled={generating}
          size="sm"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Generar nuevo banner Makro
            </>
          )}
        </Button>
      </div>

      {bannerUrl && (
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-2">Banner generado:</p>
          <img 
            src={bannerUrl} 
            alt="Makro Banner" 
            className="w-full rounded-lg shadow-lg"
          />
          <p className="text-xs text-muted-foreground mt-2">URL: {bannerUrl}</p>
        </div>
      )}
    </div>
  );
};