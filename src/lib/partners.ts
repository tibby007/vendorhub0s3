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

  // Get current user (email + id)
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user?.email || !user?.id) {
    throw new Error(userErr?.message || "No session");
  }
  const email = user.email;
  const userId = user.id;

  // Attempt full selection first (includes optional columns added by migration)
  const fullSelect = "id, contact_email, name, contact_phone, company_logo, brand_color, notification_email, notification_sms, auto_approval, approval_threshold";
  const primary = await supabase
    .from("partners")
    .select(fullSelect)
    .eq("contact_email", email)
    .limit(1);

  // If the error indicates missing columns (e.g., migration not yet applied),
  // fall back to a minimal selection that works against legacy schema and
  // provide sensible defaults for the new fields.
  if (primary.error && /column\s+partners\.[a-z_]+\s+does\s+not\s+exist/i.test(primary.error.message)) {
    console.warn("partners: optional columns missing in DB, falling back to minimal select:", primary.error.message);
    const fallback = await supabase
      .from("partners")
      .select("id, contact_email, name, contact_phone")
      .eq("contact_email", email)
      .limit(1);

    if (fallback.error || !fallback.data || fallback.data.length === 0) {
      throw new Error(fallback.error?.message || "Partner not found for " + email);
    }

    const base = fallback.data[0];
    return {
      ...base,
      company_logo: null,
      brand_color: '#10B981',
      notification_email: true,
      notification_sms: false,
      auto_approval: false,
      approval_threshold: 1000,
    } as any;
  }

  if (!primary.error && primary.data && Array.isArray(primary.data) && primary.data.length > 0) {
    return primary.data[0];
  }

  // If not found by contact_email, try matching by created_by (owner link)
  const byOwner = await supabase
    .from("partners")
    .select(fullSelect)
    .eq("created_by", userId)
    .limit(1);

  if (byOwner.error && /column\s+partners\.[a-z_]+\s+does\s+not\s+exist/i.test(byOwner.error.message)) {
    // Minimal fallback for owner lookup
    const fallbackOwner = await supabase
      .from("partners")
      .select("id, contact_email, name, contact_phone")
      .eq("created_by", userId)
      .limit(1);

    if (fallbackOwner.error || !fallbackOwner.data || fallbackOwner.data.length === 0) {
      throw new Error(fallbackOwner.error?.message || "Partner not found for " + email);
    }

    const base = fallbackOwner.data[0];
    return {
      ...base,
      company_logo: null,
      brand_color: '#10B981',
      notification_email: true,
      notification_sms: false,
      auto_approval: false,
      approval_threshold: 1000,
    } as any;
  }

  if (byOwner.error) {
    throw new Error(byOwner.error.message);
  }

  const row = byOwner.data && Array.isArray(byOwner.data) ? byOwner.data[0] : null;
  if (!row) {
    throw new Error("Partner not found for " + email);
  }

  return row;
}