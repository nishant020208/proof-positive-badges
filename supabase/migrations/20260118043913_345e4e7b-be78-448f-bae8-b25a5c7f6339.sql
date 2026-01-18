-- Add unique constraint to prevent duplicate votes per user/shop/badge combination
ALTER TABLE public.votes 
ADD CONSTRAINT votes_user_shop_badge_unique 
UNIQUE (user_id, shop_id, badge_id);

-- Create trigger to update shop_badges when votes are inserted
DROP TRIGGER IF EXISTS update_shop_badge_on_vote_trigger ON public.votes;
CREATE TRIGGER update_shop_badge_on_vote_trigger
  AFTER INSERT ON public.votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_shop_badge_on_vote();

-- Create trigger to update shop green score when shop_badges change
DROP TRIGGER IF EXISTS update_shop_green_score_trigger ON public.shop_badges;
CREATE TRIGGER update_shop_green_score_trigger
  AFTER INSERT OR UPDATE ON public.shop_badges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_shop_green_score();