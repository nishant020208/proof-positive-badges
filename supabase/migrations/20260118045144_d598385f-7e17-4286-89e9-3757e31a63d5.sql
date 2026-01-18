
-- Create user_badges table for tracking customer badges
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  percentage NUMERIC DEFAULT 0,
  level TEXT DEFAULT 'none',
  is_eligible BOOLEAN DEFAULT false,
  progress_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view user badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Users can update own badges" ON public.user_badges FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = user_badges.user_id AND profiles.user_id = auth.uid())
);

-- Add credibility_score to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS credibility_score NUMERIC DEFAULT 50;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_reports INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS accepted_reports INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS streak_days INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_date DATE;

-- Create user badge definitions table
CREATE TABLE public.user_badge_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL,
  requirement_value NUMERIC NOT NULL
);

-- Insert user badge definitions
INSERT INTO public.user_badge_definitions (id, name, description, category, icon, requirement_type, requirement_value) VALUES
-- REPORTING & TRUST (3)
('eco-watcher', 'Eco Watcher', '≥10 valid reports accepted', 'reporting', '🔍', 'accepted_reports', 10),
('proof-master', 'Proof Master', '≥90% submissions accepted with proof', 'reporting', '📸', 'acceptance_rate', 90),
('truth-teller', 'Truth Teller', 'Votes align with majority ≥80%', 'reporting', '✓', 'alignment_rate', 80),
-- GREEN IMPACT (3)
('green-supporter', 'Green Supporter', '≥70% visits to A/B grade shops', 'impact', '🌱', 'green_visit_rate', 70),
('plastic-fighter', 'Plastic Fighter', '≥20 reports exposing plastic usage', 'impact', '🚫', 'plastic_reports', 20),
('digital-first', 'Digital First', '≥70% confirmations support digital billing', 'impact', '📱', 'digital_support_rate', 70),
-- CONSISTENCY & ACTIVITY (2)
('consistency-streak', 'Consistency Streak', 'Active eco reporting for 30+ days', 'consistency', '🔥', 'streak_days', 30),
('area-guardian', 'Area Guardian', 'Top contributor in a specific locality', 'consistency', '🛡️', 'locality_rank', 1),
-- COMMUNITY STATUS (2)
('community-verified', 'Community Verified', 'Confirmations backed by others ≥85%', 'community', '✅', 'community_backing', 85),
('green-champion', 'Green Champion', 'Top-tier: high credibility, long-term, no abuse', 'community', '🌍', 'champion_score', 85);

-- Enable RLS for user badge definitions
ALTER TABLE public.user_badge_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view user badge definitions" ON public.user_badge_definitions FOR SELECT USING (true);

-- Function to update user badges based on activity
CREATE OR REPLACE FUNCTION public.update_user_badges_on_vote()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id UUID;
  v_total_reports INTEGER;
  v_accepted_reports INTEGER;
BEGIN
  -- Get profile id from user_id
  SELECT id INTO v_profile_id FROM profiles WHERE user_id = NEW.user_id;
  
  IF v_profile_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Update total reports count
  UPDATE profiles 
  SET 
    total_reports = total_reports + 1,
    last_active_date = CURRENT_DATE,
    streak_days = CASE 
      WHEN last_active_date = CURRENT_DATE - INTERVAL '1 day' THEN streak_days + 1
      WHEN last_active_date = CURRENT_DATE THEN streak_days
      ELSE 1
    END
  WHERE id = v_profile_id;
  
  -- Calculate accepted reports (where vote aligns with majority)
  SELECT COUNT(*) INTO v_total_reports FROM votes WHERE user_id = NEW.user_id;
  
  -- Update Eco Watcher badge
  INSERT INTO user_badges (user_id, badge_id, percentage, level, is_eligible)
  VALUES (
    v_profile_id, 
    'eco-watcher', 
    LEAST(v_total_reports * 10, 100),
    CASE 
      WHEN v_total_reports >= 10 THEN 'gold'
      WHEN v_total_reports >= 7 THEN 'silver'
      WHEN v_total_reports >= 5 THEN 'bronze'
      ELSE 'none'
    END,
    v_total_reports >= 10
  )
  ON CONFLICT (user_id, badge_id) DO UPDATE SET
    percentage = LEAST(EXCLUDED.percentage, 100),
    level = EXCLUDED.level,
    is_eligible = EXCLUDED.is_eligible,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS update_user_badges_trigger ON votes;
CREATE TRIGGER update_user_badges_trigger
AFTER INSERT ON votes
FOR EACH ROW
EXECUTE FUNCTION update_user_badges_on_vote();

-- Add auto-verification function for shops
CREATE OR REPLACE FUNCTION public.check_shop_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Auto-verify if all required documents are present
  IF NEW.shop_image_url IS NOT NULL 
     AND NEW.latitude IS NOT NULL 
     AND NEW.longitude IS NOT NULL
     AND NEW.address IS NOT NULL
     AND (NEW.certificate_url IS NOT NULL OR NEW.license_url IS NOT NULL) THEN
    NEW.is_verified := true;
    NEW.verification_status := 'verified';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-verification
DROP TRIGGER IF EXISTS check_shop_verification_trigger ON shops;
CREATE TRIGGER check_shop_verification_trigger
BEFORE INSERT OR UPDATE ON shops
FOR EACH ROW
EXECUTE FUNCTION check_shop_verification();
