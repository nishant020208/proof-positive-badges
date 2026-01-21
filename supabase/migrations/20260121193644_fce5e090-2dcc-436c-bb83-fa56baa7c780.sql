-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('customer', 'shop_owner', 'owner');

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    UNIQUE (user_id, role)
);

-- Create owner_whitelist for owner co-workers
CREATE TABLE public.owner_whitelist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    added_by UUID REFERENCES auth.users(id) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    activated_at TIMESTAMP WITH TIME ZONE
);

-- Create shop_products table for shop items
CREATE TABLE public.shop_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    discounted_price NUMERIC(10, 2),
    discount_percentage NUMERIC(5, 2),
    category TEXT,
    image_url TEXT,
    is_eco_friendly BOOLEAN DEFAULT false,
    eco_tags TEXT[],
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add shop tagline and other fields
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS opening_hours JSONB;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS social_links JSONB;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS owner_verified BOOLEAN DEFAULT false;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS owner_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS owner_verified_by UUID REFERENCES auth.users(id);

-- Add vote approval fields
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS owner_approved BOOLEAN DEFAULT NULL;
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS owner_approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS owner_approved_by UUID REFERENCES auth.users(id);
ALTER TABLE public.votes ADD COLUMN IF NOT EXISTS owner_rejection_reason TEXT;

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is an owner
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'owner'
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Owners can view all roles" ON public.user_roles
  FOR SELECT USING (public.is_owner() OR user_id = auth.uid());

CREATE POLICY "Owners can manage roles" ON public.user_roles
  FOR ALL USING (public.is_owner());

-- RLS policies for owner_whitelist
CREATE POLICY "Owners can manage whitelist" ON public.owner_whitelist
  FOR ALL USING (public.is_owner());

CREATE POLICY "Users can view own whitelist entry" ON public.owner_whitelist
  FOR SELECT USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- RLS policies for shop_products
CREATE POLICY "Anyone can view available products" ON public.shop_products
  FOR SELECT USING (is_available = true);

CREATE POLICY "Shop owners can manage their products" ON public.shop_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.shops s
      JOIN public.profiles p ON s.owner_id = p.id
      WHERE s.id = shop_products.shop_id AND p.user_id = auth.uid()
    )
  );

-- Trigger for shop_products updated_at
CREATE TRIGGER update_shop_products_updated_at
BEFORE UPDATE ON public.shop_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;

-- Insert initial owner role for first admin (you can change this email)
-- This creates the first owner who can then whitelist others
INSERT INTO public.user_roles (user_id, role, created_by)
SELECT id, 'owner', id FROM auth.users LIMIT 1
ON CONFLICT DO NOTHING;