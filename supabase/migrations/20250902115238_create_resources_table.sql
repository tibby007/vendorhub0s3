CREATE TABLE public.resources (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    title text NOT NULL,
    content text,
    type text NOT NULL,
    category text,
    file_url text,
    file_size bigint,
    mime_type text,
    is_published boolean DEFAULT false,
    publication_date timestamp with time zone,
    partner_id uuid REFERENCES public.partners(id),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- Create policies as needed
CREATE POLICY "Partners can manage their resources" ON public.resources
    FOR ALL
    USING (partner_id = (SELECT id FROM public.partners WHERE user_id = auth.uid()));