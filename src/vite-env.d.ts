/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_APP_URL: string
  readonly VITE_STRIPE_PUBLIC_KEY: string
  readonly VITE_RESEND_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare global {
  interface Window {
    Stripe: (publishableKey: string) => {
      redirectToCheckout: (options: { sessionId: string }) => Promise<{ error?: { message: string } }>;
    };
  }
}