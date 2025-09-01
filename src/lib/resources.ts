import { createBrowserClient } from "./supabase-browser";
import { getCurrentPartner } from "./partners";

export async function listResourcesForPartner() {
  const supabase = createBrowserClient();
  const partner = await getCurrentPartner();
  const { data, error, status } = await supabase
    .from("resources")
    .select("id,title,content,type,category,file_url,file_size,mime_type,is_published,publication_date,partner_admin_id,created_at,updated_at")
    .eq("partner_admin_id", partner.id)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`[${status}] ${error.message}`);
  return data ?? [];
}

export async function createResourceForPartner(input: {
  title: string;
  category?: string | null;
  file_url: string;
  file_size?: number | null;
  mime_type?: string | null;
  is_published?: boolean;
}) {
  const supabase = createBrowserClient();
  const partner = await getCurrentPartner();
  const { data: { user } } = await supabase.auth.getUser();

  const payload = {
    ...input,
    is_published: input.is_published ?? true,
    partner_admin_id: partner.id,
    uploaded_by: user?.id ?? null
  };

  const { data, error, status } = await supabase
    .from("resources")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw new Error(`[${status}] ${error.message}`);
  return data?.id as string;
}

export async function createNewsForPartner(input: {
  title: string;
  content?: string;
  category?: string | null;
  is_published?: boolean;
}) {
  const supabase = createBrowserClient();
  const partner = await getCurrentPartner();
  const { data: { user } } = await supabase.auth.getUser();

  const payload = {
    ...input,
    is_published: input.is_published ?? true,
    partner_admin_id: partner.id,
    uploaded_by: user?.id ?? null
  };

  const { data, error, status } = await supabase
    .from("resources")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw new Error(`[${status}] ${error.message}`);
  return data?.id as string;
}