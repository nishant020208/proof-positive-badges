-- Create appeals table for shop owners to dispute votes
CREATE TABLE public.appeals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  vote_id UUID NOT NULL REFERENCES public.votes(id) ON DELETE CASCADE,
  appeal_reason TEXT NOT NULL,
  evidence_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID,
  resolution_notes TEXT,
  CONSTRAINT appeals_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT notifications_type_check CHECK (type IN ('info', 'success', 'warning', 'badge', 'score'))
);

-- Enable RLS
ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Appeals policies
CREATE POLICY "Shop owners can view their appeals"
ON public.appeals FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shops s
    JOIN public.profiles p ON s.owner_id = p.id
    WHERE s.id = appeals.shop_id AND p.user_id = auth.uid()
  )
  OR is_owner()
);

CREATE POLICY "Shop owners can create appeals"
ON public.appeals FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shops s
    JOIN public.profiles p ON s.owner_id = p.id
    WHERE s.id = appeals.shop_id AND p.user_id = auth.uid()
  )
);

CREATE POLICY "Owners can update appeals"
ON public.appeals FOR UPDATE
USING (is_owner());

-- Notifications policies
CREATE POLICY "Users can view their notifications"
ON public.notifications FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can update their notifications"
ON public.notifications FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create trigger to update updated_at on appeals
CREATE TRIGGER update_appeals_updated_at
BEFORE UPDATE ON public.appeals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to send notification when score changes
CREATE OR REPLACE FUNCTION public.notify_score_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_user_id UUID;
  v_shop_name TEXT;
BEGIN
  -- Get shop owner's user_id
  SELECT p.user_id, s.name INTO v_owner_user_id, v_shop_name
  FROM shops s
  JOIN profiles p ON s.owner_id = p.id
  WHERE s.id = NEW.id;

  -- Only notify if score changed significantly (more than 5 points)
  IF v_owner_user_id IS NOT NULL AND ABS(COALESCE(NEW.green_score, 0) - COALESCE(OLD.green_score, 0)) >= 5 THEN
    INSERT INTO notifications (user_id, title, message, type, data)
    VALUES (
      v_owner_user_id,
      'Green Score Updated!',
      'Your shop "' || v_shop_name || '" score changed to ' || ROUND(NEW.green_score) || '/100',
      'score',
      jsonb_build_object('shop_id', NEW.id, 'old_score', OLD.green_score, 'new_score', NEW.green_score)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for score notifications
CREATE TRIGGER notify_on_score_change
AFTER UPDATE ON public.shops
FOR EACH ROW
WHEN (OLD.green_score IS DISTINCT FROM NEW.green_score)
EXECUTE FUNCTION public.notify_score_change();

-- Create function to notify user badge changes
CREATE OR REPLACE FUNCTION public.notify_badge_earned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_badge_name TEXT;
BEGIN
  -- Get the actual auth user_id from profiles
  SELECT p.user_id INTO v_user_id
  FROM profiles p WHERE p.id = NEW.user_id;

  -- Get badge name
  SELECT name INTO v_badge_name
  FROM user_badge_definitions WHERE id = NEW.badge_id;

  -- Only notify on level upgrade
  IF v_user_id IS NOT NULL AND NEW.level != 'none' AND (OLD.level IS NULL OR OLD.level = 'none' OR NEW.level != OLD.level) THEN
    INSERT INTO notifications (user_id, title, message, type, data)
    VALUES (
      v_user_id,
      'New Badge Earned! 🏆',
      'You earned ' || UPPER(NEW.level) || ' level for "' || COALESCE(v_badge_name, NEW.badge_id) || '"!',
      'badge',
      jsonb_build_object('badge_id', NEW.badge_id, 'level', NEW.level)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for badge notifications
CREATE TRIGGER notify_on_badge_earned
AFTER INSERT OR UPDATE ON public.user_badges
FOR EACH ROW
EXECUTE FUNCTION public.notify_badge_earned();