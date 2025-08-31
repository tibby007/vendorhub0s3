import { createBrowserClient } from "./supabase-browser";
import { getCurrentPartner } from "./partners";

export async function listVendorsForPartner() {
  const supabase = createBrowserClient();
  const partner = await getCurrentPartner();
  const { data, error, status } = await supabase
    .from("vendors")
    .select("*")
    .eq("partner_id", partner.id);
  if (error) throw new Error(`[${status}] ${error.message}`);
  return data ?? [];
}