const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ewxsolozmcjdoqyydlcu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV3eHNvbG96bWNqZG9xeXlkbGN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ1OTc4MSwiZXhwIjoyMDY2MDM1NzgxfQ.gTZz69KLpwh6304yLeML0-l6Nw4pgjU00mjQhYnbSlM'
);

async function updateUserMetadata() {
  const { data, error } = await supabase.auth.admin.updateUserById(
    '14e5b3a4-26d1-4874-aecb-3aeb4fb5d95d',
    {
      user_metadata: { partner_id: '466a2bb5-1343-4d51-a982-c45a1f6c595f' }
    }
  );
  console.log('data:', data, 'error:', error);
}

updateUserMetadata(); 