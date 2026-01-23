-- Drop the foreign key constraint on owner_whitelist.added_by
ALTER TABLE public.owner_whitelist DROP CONSTRAINT IF EXISTS owner_whitelist_added_by_fkey;

-- Make added_by nullable so system can add initial owner
ALTER TABLE public.owner_whitelist ALTER COLUMN added_by DROP NOT NULL;