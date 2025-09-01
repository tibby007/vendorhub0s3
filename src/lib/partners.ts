import { createBrowserClient } from "./supabase-browser";

export async function getCurrentUserEmail(): Promise<string> {
  const supabase = createBrowserClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email) throw new Error("No session");
  return user.email;
}

export async function getCurrentPartner() {
  if (sessionStorage.getItem('demoCredentials') !== null) {
    console.log('🎭 Using mock partner data in demo mode');
    const email = await getCurrentUserEmail();
    return {
      id: 'demo-partner-123',
      name: 'Demo Partner Company',
      contact_email: email,
      contact_phone: '(555) 123-4567',
      company_logo: null,
      brand_color: '#000000',
      notification_email: true,
      notification_sms: false,
      auto_approval: false,
      approval_threshold: 1000
    };
  }
  const supabase = createBrowserClient();
  const email = await getCurrentUserEmail();
  const { data, error } = await supabase
    .from("partners")
    .select("id, contact_email, name, contact_phone, company_logo, brand_color, notification_email, notification_sms, auto_approval, approval_threshold")
    .eq("contact_email", email)
    .single();
  if (error || !data) throw new Error(error?.message || "Partner not found for " + email);
  return data;
}