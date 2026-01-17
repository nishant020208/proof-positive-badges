-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('customer', 'shop_owner');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shops table
CREATE TABLE public.shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  shop_image_url TEXT,
  certificate_url TEXT,
  license_url TEXT,
  gst_number TEXT,
  is_verified BOOLEAN DEFAULT false,
  verification_status TEXT DEFAULT 'pending',
  green_score NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create badges table to store badge definitions
CREATE TABLE public.badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  icon TEXT NOT NULL
);

-- Create shop_badges table to track badge status per shop
CREATE TABLE public.shop_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  badge_id TEXT REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  yes_count INTEGER DEFAULT 0,
  no_count INTEGER DEFAULT 0,
  percentage NUMERIC DEFAULT 0,
  level TEXT DEFAULT 'none',
  is_eligible BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(shop_id, badge_id)
);

-- Create votes table to track user votes with proof
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
  badge_id TEXT REFERENCES public.badges(id) ON DELETE CASCADE NOT NULL,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('yes', 'no')),
  proof_image_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, shop_id, badge_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Shops policies
CREATE POLICY "Anyone can view verified shops" ON public.shops FOR SELECT USING (true);
CREATE POLICY "Shop owners can insert their shops" ON public.shops FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = owner_id AND user_id = auth.uid())
);
CREATE POLICY "Shop owners can update their shops" ON public.shops FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = owner_id AND user_id = auth.uid())
);

-- Badges policies (read-only for all)
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);

-- Shop badges policies
CREATE POLICY "Anyone can view shop badges" ON public.shop_badges FOR SELECT USING (true);
CREATE POLICY "System can update shop badges" ON public.shop_badges FOR UPDATE USING (true);
CREATE POLICY "System can insert shop badges" ON public.shop_badges FOR INSERT WITH CHECK (true);

-- Votes policies
CREATE POLICY "Users can view all votes" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert votes" ON public.votes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id AND profiles.user_id = auth.uid())
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON public.shops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_shop_badges_updated_at BEFORE UPDATE ON public.shop_badges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('shop-images', 'shop-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('proof-images', 'proof-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Storage policies
CREATE POLICY "Anyone can view shop images" ON storage.objects FOR SELECT USING (bucket_id = 'shop-images');
CREATE POLICY "Authenticated users can upload shop images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'shop-images' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view proof images" ON storage.objects FOR SELECT USING (bucket_id = 'proof-images');
CREATE POLICY "Authenticated users can upload proof images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'proof-images' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

-- Insert all 20 badge definitions
INSERT INTO public.badges (id, name, description, category, icon) VALUES
-- Plastic & Packaging
('plastic-free-champ', 'Plastic-Free Champ', 'No plastic bags used', 'plastic_packaging', 'PackageX'),
('low-plastic-usage', 'Low-Plastic Usage', 'Reduced plastic (paper + occasional plastic)', 'plastic_packaging', 'Package'),
('eco-packaging-pro', 'Eco Packaging Pro', 'Biodegradable / recyclable packaging', 'plastic_packaging', 'Recycle'),
('bring-your-own', 'Bring-Your-Own Friendly', 'Allows customer containers', 'plastic_packaging', 'ShoppingBag'),
('zero-packaging', 'Zero Packaging', 'Bulk / refill-style shop', 'plastic_packaging', 'Leaf'),
-- Energy & Resources
('energy-saver', 'Energy Saver', 'LED lights, efficient appliances', 'energy_resources', 'Lightbulb'),
('green-power', 'Green Power User', 'Solar / renewable energy usage', 'energy_resources', 'Sun'),
('low-energy-waste', 'Low Energy Waste', 'No unnecessary lights, optimized usage', 'energy_resources', 'Zap'),
('smart-cooling', 'Smart Cooling', 'Efficient AC / natural ventilation', 'energy_resources', 'Wind'),
('water-saver', 'Water Saver', 'Tap control, no visible water waste', 'energy_resources', 'Droplets'),
-- Operations & Systems
('digital-billing', 'Digital Billing Hero', 'Digital bills provided', 'operations_systems', 'FileText'),
('paper-reduction', 'Paper Reduction Champ', 'Minimal paper receipts, menus, flyers', 'operations_systems', 'FileX'),
('waste-segregation', 'Waste Segregation Pro', 'Separate dry/wet waste bins visible', 'operations_systems', 'Trash2'),
('clean-disposal', 'Clean Disposal Partner', 'Proper garbage handling', 'operations_systems', 'CheckCircle'),
('compliance-friendly', 'Compliance Friendly', 'Follows local eco guidelines', 'operations_systems', 'Shield'),
-- Community & Consistency
('community-trusted', 'Community Trusted', 'High user credibility confirmations', 'community_consistency', 'Users'),
('eco-improvement', 'Eco Improvement Star', 'Score improved over time', 'community_consistency', 'TrendingUp'),
('consistency-king', 'Consistency King', 'High % maintained for 60+ days', 'community_consistency', 'Award'),
('green-favorite', 'Green Favorite', 'Frequently chosen by eco-conscious users', 'community_consistency', 'Heart'),
('green-earth-certified', 'Green Earth Certified', 'Top-tier certification', 'community_consistency', 'Trophy');