-- Create QR codes whitelist table for authentic products
CREATE TABLE public.qr_codes_whitelist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code_hash TEXT NOT NULL UNIQUE,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  batch_number TEXT,
  manufacturing_date DATE,
  expiry_date DATE,
  digital_signature TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create QR scan history table
CREATE TABLE public.qr_scan_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  qr_code_hash TEXT NOT NULL,
  scan_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  scan_location TEXT,
  scan_device TEXT,
  is_authentic BOOLEAN NOT NULL,
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  is_suspicious_velocity BOOLEAN NOT NULL DEFAULT false,
  alert_sent BOOLEAN NOT NULL DEFAULT false,
  user_contact TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.qr_codes_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_scan_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for qr_codes_whitelist
CREATE POLICY "Anyone can view active QR codes" 
ON public.qr_codes_whitelist 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can manage QR codes" 
ON public.qr_codes_whitelist 
FOR ALL 
USING (auth.role() = 'authenticated');

-- RLS Policies for qr_scan_history
CREATE POLICY "Anyone can insert scan history" 
ON public.qr_scan_history 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can view scan history" 
ON public.qr_scan_history 
FOR SELECT 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_qr_codes_hash ON public.qr_codes_whitelist(qr_code_hash);
CREATE INDEX idx_qr_scan_history_hash ON public.qr_scan_history(qr_code_hash);
CREATE INDEX idx_qr_scan_history_timestamp ON public.qr_scan_history(scan_timestamp DESC);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_qr_codes_whitelist_updated_at
BEFORE UPDATE ON public.qr_codes_whitelist
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();