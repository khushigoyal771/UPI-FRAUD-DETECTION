-- Create fraud_alerts table to store alert history
CREATE TABLE public.fraud_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id TEXT,
  user_id TEXT,
  amount DECIMAL NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  transaction_type TEXT NOT NULL,
  risk_level TEXT NOT NULL CHECK (risk_level IN ('high', 'medium', 'low')),
  fraud_probability DECIMAL NOT NULL,
  alert_sent BOOLEAN NOT NULL DEFAULT false,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  sms_sent BOOLEAN NOT NULL DEFAULT false,
  whatsapp_sent BOOLEAN NOT NULL DEFAULT false,
  alert_settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for fraud_alerts (public read access for demo purposes)
CREATE POLICY "Anyone can view fraud alerts" 
ON public.fraud_alerts 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert fraud alerts" 
ON public.fraud_alerts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update fraud alerts" 
ON public.fraud_alerts 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_fraud_alerts_updated_at
BEFORE UPDATE ON public.fraud_alerts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_fraud_alerts_created_at ON public.fraud_alerts(created_at DESC);
CREATE INDEX idx_fraud_alerts_risk_level ON public.fraud_alerts(risk_level);