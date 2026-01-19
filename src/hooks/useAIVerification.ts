import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ShopVerificationResult {
  isValid: boolean;
  confidence: number;
  reason: string;
  issues?: string[];
  suggestions?: string[];
}

interface ProofVerificationResult {
  isValid: boolean;
  isRelevant: boolean;
  confidence: number;
  supports: 'yes' | 'no' | 'inconclusive';
  reason: string;
  details: string;
}

export function useAIVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<ShopVerificationResult | ProofVerificationResult | null>(null);

  const verifyShopImage = async (
    imageFile: File,
    shopName?: string
  ): Promise<ShopVerificationResult | null> => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // Convert file to base64
      const base64 = await fileToBase64(imageFile);
      
      const { data, error } = await supabase.functions.invoke('verify-image', {
        body: {
          imageUrl: base64,
          verificationType: 'shop',
          context: {
            shopName,
          },
        },
      });

      if (error) {
        console.error('Verification error:', error);
        return { isValid: true, confidence: 0, reason: 'Verification unavailable' };
      }

      setVerificationResult(data);
      return data as ShopVerificationResult;
    } catch (err) {
      console.error('AI verification failed:', err);
      return { isValid: true, confidence: 0, reason: 'Verification failed' };
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyProofImage = async (
    imageFile: File,
    badgeName: string,
    shopName: string,
    expectedContent?: string
  ): Promise<ProofVerificationResult | null> => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      // Convert file to base64
      const base64 = await fileToBase64(imageFile);
      
      const { data, error } = await supabase.functions.invoke('verify-image', {
        body: {
          imageUrl: base64,
          verificationType: 'proof',
          context: {
            badgeName,
            shopName,
            expectedContent,
          },
        },
      });

      if (error) {
        console.error('Verification error:', error);
        return {
          isValid: true,
          isRelevant: true,
          confidence: 0,
          supports: 'inconclusive',
          reason: 'Verification unavailable',
          details: '',
        };
      }

      setVerificationResult(data);
      return data as ProofVerificationResult;
    } catch (err) {
      console.error('AI verification failed:', err);
      return {
        isValid: true,
        isRelevant: true,
        confidence: 0,
        supports: 'inconclusive',
        reason: 'Verification failed',
        details: '',
      };
    } finally {
      setIsVerifying(false);
    }
  };

  const clearResult = () => {
    setVerificationResult(null);
  };

  return {
    isVerifying,
    verificationResult,
    verifyShopImage,
    verifyProofImage,
    clearResult,
  };
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}
