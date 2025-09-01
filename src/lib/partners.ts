import { createBrowserClient } from "./supabase-browser";

export async function getCurrentUserEmail(): Promise<string> {
  const supabase = createBrowserClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email) throw new Error("No session");
  return user.email;
}

export async function getCurrentPartner() {
  const supabase = createBrowserClient();
  const email = await getCurrentUserEmail();
  const { data, error } = await supabase
    .from("partners")
    .select("id, contact_email, name, contact_phone")
    .eq("contact_email", email)
    .single();
  if (error || !data) throw new Error(error?.message || "Partner not found for " + email);
  return data;
}