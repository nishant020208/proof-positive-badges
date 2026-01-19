import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  imageUrl: string;
  verificationType: 'shop' | 'proof';
  context?: {
    badgeName?: string;
    shopName?: string;
    expectedContent?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, verificationType, context }: VerificationRequest = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let prompt = '';
    
    if (verificationType === 'shop') {
      prompt = `You are an AI verification system for an eco-friendly shop verification platform called GreenScore. 

Analyze this shop image and determine if it's a legitimate business establishment. Check for:
1. Is this a real storefront/shop image?
2. Does it appear to be a genuine business location?
3. Is the image clear and shows actual business premises?
4. Does it look like it could be a retail establishment, restaurant, or service business?

${context?.shopName ? `Shop name being verified: ${context.shopName}` : ''}

Respond in JSON format:
{
  "isValid": true/false,
  "confidence": 0-100,
  "reason": "Brief explanation",
  "issues": ["list of concerns if any"],
  "suggestions": ["improvements if needed"]
}`;
    } else {
      prompt = `You are an AI verification system for GreenScore, an eco-friendly shop rating platform.

A user is voting on a shop's eco-badge and has submitted this image as proof. Analyze if this image is valid proof for the eco-badge being voted on.

${context?.badgeName ? `Badge being voted: ${context.badgeName}` : ''}
${context?.shopName ? `Shop: ${context.shopName}` : ''}
${context?.expectedContent ? `Expected content: ${context.expectedContent}` : ''}

Check for:
1. Is this image relevant to the eco-badge being voted on?
2. Does it appear to be taken at an actual business location?
3. Is there evidence supporting or denying the eco-practice?
4. Is this a genuine photo (not stock, screenshot, or edited)?

For example:
- "Plastic-Free" badge: Look for evidence of plastic bags or lack thereof
- "Digital Billing" badge: Look for digital receipts/screens or paper receipts
- "Eco Packaging" badge: Look for packaging materials being used

Respond in JSON format:
{
  "isValid": true/false,
  "isRelevant": true/false,
  "confidence": 0-100,
  "supports": "yes" | "no" | "inconclusive",
  "reason": "Brief explanation of what the image shows",
  "details": "Detailed analysis of eco-practices visible"
}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limit exceeded. Please try again later.",
          isValid: true, // Default to valid to not block users
          confidence: 0 
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "AI verification temporarily unavailable.",
          isValid: true,
          confidence: 0 
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse the JSON response from AI
    let result;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      result = jsonMatch ? JSON.parse(jsonMatch[0]) : { isValid: true, confidence: 50, reason: "Could not parse AI response" };
    } catch {
      result = { isValid: true, confidence: 50, reason: "Could not parse AI response" };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Verification error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      isValid: true, // Default to valid on error to not block users
      confidence: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});