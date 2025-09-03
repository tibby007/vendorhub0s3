
-- Create a table to store demo lead registrations
CREATE TABLE public.demo_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  employees TEXT,
  use_case TEXT,
  session_id TEXT,
  demo_credentials JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  demo_started_at TIMESTAMP WITH TIME ZONE,
  demo_completed_at TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  engagement_score INTEGER DEFAULT 0,
  follow_up_status TEXT DEFAULT 'pending',
  notes TEXT
);

-- Add Row Level Security (RLS) to ensure only Super Admins can access demo leads
ALTER TABLE public.demo_leads ENABLE ROW LEVEL SECURITY;

-- Create policy that allows Super Admins to view all demo leads
CREATE POLICY "Super Admins can view all demo leads" 
  ON public.demo_leads 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'Super Admin'
    )
  );

-- Create policy that allows Super Admins to update demo leads
CREATE POLICY "Super Admins can update demo leads" 
  ON public.demo_leads 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'Super Admin'
    )
  );

-- Create policy that allows the system to insert demo leads (for edge functions)
CREATE POLICY "System can insert demo leads" 
  ON public.demo_leads 
  FOR INSERT 
  WITH CHECK (true);

-- Create an index for faster queries
CREATE INDEX idx_demo_leads_email ON public.demo_leads(email);
CREATE INDEX idx_demo_leads_created_at ON public.demo_leads(created_at DESC);
CREATE INDEX idx_demo_leads_follow_up_status ON public.demo_leads(follow_up_status);
