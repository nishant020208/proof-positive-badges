 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
 };
 
 const SYSTEM_PROMPT = `You are GreenScore AI, a friendly and knowledgeable assistant for the GreenScore eco-verification platform.
 
 Your role is to help users understand:
 - How the GreenScore system works (shops are scored 0-100 based on eco-friendly practices)
 - Badge system: 20 badges across 4 categories (Plastic & Packaging, Energy & Resources, Operations & Systems, Community & Consistency)
 - Badge levels: Bronze (≥50%), Silver (≥70%), Gold (≥85%) based on user verification votes
 - How users can report and verify shop practices with photo proof
 - How shop owners can improve their green score
 - The importance of environmental sustainability
 
 Badge Categories:
 1. Plastic & Packaging (5 badges): Plastic-Free Champ, Low-Plastic Usage, Eco Packaging Pro, Bring-Your-Own Friendly, Zero Packaging
 2. Energy & Resources (5 badges): Energy Saver, Green Power User, Low Energy Waste, Smart Cooling, Water Saver
 3. Operations & Systems (5 badges): Digital Billing Hero, Paper Reduction Champ, Waste Segregation Pro, Clean Disposal Partner, Compliance Friendly
 4. Community & Consistency (5 badges): Community Trusted, Eco Improvement Star, Consistency King, Green Favorite, Green Earth Certified
 
 User Roles:
 - Customers: Can discover shops, submit verified reports with photo proof, earn badges for contributions
 - Shop Owners: Can manage their shop profile, respond to reports, track badge progress
 - Owners (Admins): Can verify shops, approve votes, manage the platform
 
 Be helpful, concise, and encourage eco-friendly behavior. Use emojis sparingly to keep responses friendly.`;
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { messages, userRole } = await req.json();
     const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
     
     if (!LOVABLE_API_KEY) {
       throw new Error("LOVABLE_API_KEY is not configured");
     }
 
     const roleContext = userRole === 'shop_owner' 
       ? "\n\nThe user is a shop owner. Focus on helping them improve their shop's green score and manage their profile."
       : userRole === 'owner'
       ? "\n\nThe user is a platform admin. They can verify shops and manage the platform."
       : "\n\nThe user is a customer. Help them discover eco-friendly shops and understand how to submit reports.";
 
     const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
       method: "POST",
       headers: {
         Authorization: `Bearer ${LOVABLE_API_KEY}`,
         "Content-Type": "application/json",
       },
       body: JSON.stringify({
         model: "google/gemini-3-flash-preview",
         messages: [
           { role: "system", content: SYSTEM_PROMPT + roleContext },
           ...messages,
         ],
         stream: true,
       }),
     });
 
     if (!response.ok) {
       if (response.status === 429) {
         return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
           status: 429,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       if (response.status === 402) {
         return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
           status: 402,
           headers: { ...corsHeaders, "Content-Type": "application/json" },
         });
       }
       const errorText = await response.text();
       console.error("AI gateway error:", response.status, errorText);
       return new Response(JSON.stringify({ error: "AI gateway error" }), {
         status: 500,
         headers: { ...corsHeaders, "Content-Type": "application/json" },
       });
     }
 
     return new Response(response.body, {
       headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
     });
   } catch (error) {
     console.error("Chat error:", error);
     return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
       status: 500,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
   }
 });