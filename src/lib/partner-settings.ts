import { createBrowserClient } from "./supabase-browser";
import { getCurrentPartner } from "./partners";

type PartnerUpdate = Partial<{
  name: string;
  support_email: string;
  support_phone: string;
  brand_color_primary: string;
  brand_color_secondary: string;
  company_logo: string;
}>;

export async function savePartnerSettings(update: PartnerUpdate) {
  const supabase = createBrowserClient();
  const partner = await getCurrentPartner();

  // Send only defined keys
  const payload: Record<string, any> = {};
  for (const [k, v] of Object.entries(update)) if (v !== undefined) payload[k] = v;

  const { data, error, status } = await supabase
    .from("partners")
    .update(payload)
    .eq("id", partner.id)
    .select("*")
    .single();

  if (error) throw new Error(`[${status}] ${error.message}`);
  return data;
}