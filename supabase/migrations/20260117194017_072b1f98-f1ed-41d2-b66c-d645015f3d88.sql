-- Fix shop_badges policies - restrict to authenticated users and proper checks
DROP POLICY IF EXISTS "System can update shop badges" ON public.shop_badges;
DROP POLICY IF EXISTS "System can insert shop badges" ON public.shop_badges;

-- Shop badges can be updated via a trigger/function when votes change
CREATE POLICY "Shop owners can insert shop badges" ON public.shop_badges 
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shops s 
    JOIN public.profiles p ON s.owner_id = p.id 
    WHERE s.id = shop_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated can update shop badges via vote" ON public.shop_badges 
FOR UPDATE USING (auth.role() = 'authenticated');

-- Create function to update shop badge counts when a vote is cast
CREATE OR REPLACE FUNCTION public.update_shop_badge_on_vote()
RETURNS TRIGGER AS $$
DECLARE
  v_yes_count INTEGER;
  v_no_count INTEGER;
  v_total INTEGER;
  v_percentage NUMERIC;
  v_level TEXT;
  v_is_eligible BOOLEAN;
BEGIN
  -- Count votes for this shop/badge combination
  SELECT 
    COUNT(*) FILTER (WHERE vote_type = 'yes'),
    COUNT(*) FILTER (WHERE vote_type = 'no')
  INTO v_yes_count, v_no_count
  FROM public.votes
  WHERE shop_id = NEW.shop_id AND badge_id = NEW.badge_id;
  
  v_total := v_yes_count + v_no_count;
  v_is_eligible := v_total >= 10;
  
  IF v_total > 0 THEN
    v_percentage := ROUND((v_yes_count::NUMERIC / v_total::NUMERIC) * 100);
  ELSE
    v_percentage := 0;
  END IF;
  
  -- Determine level
  IF v_is_eligible THEN
    IF v_percentage >= 85 THEN
      v_level := 'gold';
    ELSIF v_percentage >= 70 THEN
      v_level := 'silver';
    ELSIF v_percentage >= 50 THEN
      v_level := 'bronze';
    ELSE
      v_level := 'none';
    END IF;
  ELSE
    v_level := 'none';
  END IF;
  
  -- Upsert the shop_badges record
  INSERT INTO public.shop_badges (shop_id, badge_id, yes_count, no_count, percentage, level, is_eligible)
  VALUES (NEW.shop_id, NEW.badge_id, v_yes_count, v_no_count, v_percentage, v_level, v_is_eligible)
  ON CONFLICT (shop_id, badge_id) 
  DO UPDATE SET 
    yes_count = v_yes_count,
    no_count = v_no_count,
    percentage = v_percentage,
    level = v_level,
    is_eligible = v_is_eligible,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update shop badges when vote is inserted
CREATE TRIGGER on_vote_inserted
AFTER INSERT ON public.votes
FOR EACH ROW
EXECUTE FUNCTION public.update_shop_badge_on_vote();

-- Create function to calculate and update shop green score
CREATE OR REPLACE FUNCTION public.update_shop_green_score()
RETURNS TRIGGER AS $$
DECLARE
  v_score NUMERIC;
BEGIN
  -- Calculate weighted average score from all badges
  SELECT COALESCE(
    SUM(
      CASE level
        WHEN 'gold' THEN 5
        WHEN 'silver' THEN 3
        WHEN 'bronze' THEN 1
        ELSE 0
      END * percentage
    ) / NULLIF(COUNT(*), 0) / 100 * 100,
    0
  )
  INTO v_score
  FROM public.shop_badges
  WHERE shop_id = NEW.shop_id AND is_eligible = true;
  
  UPDATE public.shops SET green_score = v_score WHERE id = NEW.shop_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update shop score when badges change
CREATE TRIGGER on_shop_badge_updated
AFTER INSERT OR UPDATE ON public.shop_badges
FOR EACH ROW
EXECUTE FUNCTION public.update_shop_green_score();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for auto profile creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();