-- Enable realtime for votes and shop_badges tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_badges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shops;

-- Add AI verification columns to votes table
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS ai_verified BOOLEAN DEFAULT NULL;
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS ai_verification_result TEXT;
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS ai_confidence_score NUMERIC DEFAULT NULL;

-- Add AI verification columns to shops table
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS ai_verification_status TEXT DEFAULT 'pending';
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS ai_verification_result TEXT;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS ai_verified_at TIMESTAMP WITH TIME ZONE;

-- Create shop_responses table for shop owners to respond to reports
CREATE TABLE IF NOT EXISTS public.shop_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  vote_id UUID NOT NULL REFERENCES public.votes(id) ON DELETE CASCADE,
  response_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_shop_vote_response UNIQUE (shop_id, vote_id)
);

-- Enable RLS on shop_responses
ALTER TABLE public.shop_responses ENABLE ROW LEVEL SECURITY;

-- RLS policies for shop_responses
CREATE POLICY "Anyone can view shop responses"
  ON public.shop_responses FOR SELECT
  USING (true);

CREATE POLICY "Shop owners can insert responses for their shops"
  ON public.shop_responses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.shops 
      WHERE shops.id = shop_responses.shop_id 
      AND shops.owner_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Shop owners can update their responses"
  ON public.shop_responses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.shops 
      WHERE shops.id = shop_responses.shop_id 
      AND shops.owner_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- Enable realtime for shop_responses
ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_responses;

-- Create trigger for shop_responses updated_at
CREATE TRIGGER update_shop_responses_updated_at
BEFORE UPDATE ON public.shop_responses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();