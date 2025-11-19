-- Create table to store verified/genuine phone numbers
CREATE TABLE IF NOT EXISTS public.verified_phone_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone_number TEXT NOT NULL UNIQUE,
  user_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verified_phone_numbers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to check if phone number is verified
CREATE POLICY "Anyone can check verified phone numbers"
ON public.verified_phone_numbers
FOR SELECT
USING (is_active = true);

-- Allow authenticated users to manage phone numbers
CREATE POLICY "Authenticated users can manage phone numbers"
ON public.verified_phone_numbers
FOR ALL
USING (auth.role() = 'authenticated');

-- Create index for fast phone number lookups
CREATE INDEX idx_verified_phone_numbers_phone ON public.verified_phone_numbers(phone_number);

-- Add trigger for updated_at
CREATE TRIGGER update_verified_phone_numbers_updated_at
BEFORE UPDATE ON public.verified_phone_numbers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample verified phone numbers for testing
INSERT INTO public.verified_phone_numbers (phone_number, user_name, is_active) VALUES
('+919876543210', 'Test User 1', true),
('+919876543211', 'Test User 2', true),
('+911234567890', 'Test User 3', true)
ON CONFLICT (phone_number) DO NOTHING;