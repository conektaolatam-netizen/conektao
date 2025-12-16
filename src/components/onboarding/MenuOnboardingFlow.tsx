import { useState } from 'react';
import { MenuOnboardingWelcome } from './MenuOnboardingWelcome';
import { MenuOnboardingUpload } from './MenuOnboardingUpload';
import { MenuOnboardingReview } from './MenuOnboardingReview';

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
  const [step, setStep] = useState<'welcome' | 'upload' | 'review'>('welcome');
  const [extractedData, setExtractedData] = useState<ExtractedMenuData | null>(null);

  const handleUploadComplete = (data: ExtractedMenuData) => {
    setExtractedData(data);
    setStep('review');
  };

  const handleReviewConfirm = (finalData: ExtractedMenuData) => {
    onComplete(finalData);
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
