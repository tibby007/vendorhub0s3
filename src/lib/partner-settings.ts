import { createBrowserClient } from "./supabase-browser";
import { getCurrentPartner } from "./partners";

type PartnerUpdate = Partial<{
  name: string;
  contact_email: string;
  contact_phone: string;
  company_logo: string;
  brand_color: string;
  notification_email: boolean;
  notification_sms: boolean;
  auto_approval: boolean;
  approval_threshold: number;
}>;

export async function savePartnerSettings(update: PartnerUpdate) {
  const supabase = createBrowserClient();
  const partner = await getCurrentPartner();

  // Send only defined keys
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(update)) if (v !== undefined) payload[k] = v;

  console.log('Saving partner settings:', { partnerId: partner.id, payload });

  const { data, error, status } = await supabase
    .from("partners")
    .update(payload)
    .eq("id", partner.id)
    .select("*")
    .single();

  if (error) {
    console.error('Partner settings save error:', { error, status, partnerId: partner.id });
    throw new Error(`[${status}] ${error.message}`);
  }
  return data;
}