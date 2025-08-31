import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCorsHeaders, handleCorsPrelight } from "../_shared/cors-config.ts";

const logStep = (step: string, details?: any) => {
  console.log(`[STORAGE-MANAGEMENT] ${step}${details ? ` - ${JSON.stringify(details)}` : ''}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPrelight(req);
  }
  
  const corsHeaders = getCorsHeaders(req.headers.get("origin"));

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Storage management function called");
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    logStep(`Processing ${method} ${path}`, { userId: user.id });

    // Route handling
    if (path.includes('/setup-buckets') && method === 'POST') {
      return await handleSetupStorageBuckets(supabase, user, corsHeaders);
    }
    else if (path.includes('/upload-url') && method === 'POST') {
      return await handleGetUploadUrl(req, supabase, user, corsHeaders);
    }
    else if (path.includes('/list-documents') && method === 'GET') {
      return await handleListDocuments(url, supabase, user, corsHeaders);
    }
    else if (path.includes('/delete-document') && method === 'DELETE') {
      return await handleDeleteDocument(url, supabase, user, corsHeaders);
    }
    else {
      return new Response(JSON.stringify({ 
        error: "Endpoint not found",
        available_endpoints: [
          "POST /setup-buckets",
          "POST /upload-url", 
          "GET /list-documents?vendor_id=<id>",
          "DELETE /delete-document?path=<path>"
        ]
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

  } catch (error) {
    logStep("ERROR", { error: error.message });
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function handleSetupStorageBuckets(
  supabase: any,
  user: any,
  corsHeaders: any
) {
  // Verify user is super admin
  if (user.email !== 'support@emergestack.dev') {
    throw new Error("Only super admin can setup storage buckets");
  }

  logStep("Setting up storage buckets");

  const buckets = [
    {
      id: 'vendor-documents',
      name: 'vendor-documents',
      public: false,
      file_size_limit: 10485760, // 10MB
      allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    },
    {
      id: 'deal-documents',
      name: 'deal-documents', 
      public: false,
      file_size_limit: 10485760, // 10MB
      allowed_mime_types: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    },
    {
      id: 'partner-assets',
      name: 'partner-assets',
      public: false,
      file_size_limit: 5242880, // 5MB
      allowed_mime_types: ['image/jpeg', 'image/png', 'image/jpg', 'image/svg+xml']
    }
  ];

  const results = [];

  for (const bucket of buckets) {
    try {
      // Try to create bucket
      const { data: bucketData, error: bucketError } = await supabase.storage
        .createBucket(bucket.id, {
          public: bucket.public,
          fileSizeLimit: bucket.file_size_limit,
          allowedMimeTypes: bucket.allowed_mime_types
        });

      if (bucketError && bucketError.message.includes('already exists')) {
        logStep(`Bucket ${bucket.id} already exists`);
        results.push({ bucket: bucket.id, status: 'exists', message: 'Already exists' });
      } else if (bucketError) {
        throw new Error(`Failed to create ${bucket.id}: ${bucketError.message}`);
      } else {
        logStep(`Created bucket ${bucket.id}`);
        results.push({ bucket: bucket.id, status: 'created', message: 'Created successfully' });
      }

      // Set up RLS policies for each bucket
      const policyQueries = [
        // Users can upload to their own folder
        `
        CREATE POLICY "Users can upload own documents" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = '${bucket.id}' AND
          (auth.uid()::text = (storage.foldername(name))[1] OR
           EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev'))
        );
        `,
        // Users can view their own documents
        `
        CREATE POLICY "Users can view own documents" ON storage.objects
        FOR SELECT USING (
          bucket_id = '${bucket.id}' AND
          (auth.uid()::text = (storage.foldername(name))[1] OR
           EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev'))
        );
        `,
        // Users can delete their own documents
        `
        CREATE POLICY "Users can delete own documents" ON storage.objects
        FOR DELETE USING (
          bucket_id = '${bucket.id}' AND
          (auth.uid()::text = (storage.foldername(name))[1] OR
           EXISTS (SELECT 1 FROM auth.users WHERE auth.users.id = auth.uid() AND auth.users.email = 'support@emergestack.dev'))
        );
        `
      ];

      // Execute policies (they will fail if they already exist, which is fine)
      for (const policy of policyQueries) {
        try {
          await supabase.rpc('exec_sql', { sql: policy });
        } catch (policyError) {
          // Ignore policy creation errors (likely already exist)
          logStep(`Policy creation skipped for ${bucket.id}`, { error: policyError.message });
        }
      }

    } catch (error) {
      results.push({ bucket: bucket.id, status: 'error', message: error.message });
    }
  }

  return new Response(JSON.stringify({
    success: true,
    message: "Storage buckets setup completed",
    results
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function handleGetUploadUrl(
  req: Request,
  supabase: any,
  user: any,
  corsHeaders: any
) {
  const requestBody = await req.json();
  const { bucket, file_name, file_type, vendor_id } = requestBody;

  if (!bucket || !file_name || !file_type) {
    throw new Error("bucket, file_name, and file_type are required");
  }

  // Verify user has access to this vendor
  if (vendor_id) {
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('user_id, partners(contact_email)')
      .eq('id', vendor_id)
      .single();

    if (vendorError) {
      throw new Error("Vendor not found");
    }

    const hasAccess = vendor.user_id === user.id || 
                     vendor.partners?.contact_email === user.email ||
                     user.email === 'support@emergestack.dev';

    if (!hasAccess) {
      throw new Error("Access denied");
    }
  }

  // Create file path: user_id/vendor_id/filename
  const filePath = vendor_id 
    ? `${user.id}/${vendor_id}/${file_name}`
    : `${user.id}/${file_name}`;

  // Create signed upload URL
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(filePath);

  if (uploadError) {
    throw new Error(`Failed to create upload URL: ${uploadError.message}`);
  }

  logStep("Created signed upload URL", { bucket, filePath });

  return new Response(JSON.stringify({
    success: true,
    upload_url: uploadData.signedUrl,
    file_path: filePath,
    bucket
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function handleListDocuments(
  url: URL,
  supabase: any,
  user: any,
  corsHeaders: any
) {
  const vendorId = url.searchParams.get('vendor_id');
  const bucket = url.searchParams.get('bucket') || 'vendor-documents';

  // Build folder path
  const folderPath = vendorId ? `${user.id}/${vendorId}` : `${user.id}`;

  const { data: files, error: filesError } = await supabase.storage
    .from(bucket)
    .list(folderPath);

  if (filesError) {
    throw new Error(`Failed to list documents: ${filesError.message}`);
  }

  return new Response(JSON.stringify({
    success: true,
    files: files || [],
    folder_path: folderPath
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function handleDeleteDocument(
  url: URL,
  supabase: any,
  user: any,
  corsHeaders: any
) {
  const filePath = url.searchParams.get('path');
  const bucket = url.searchParams.get('bucket') || 'vendor-documents';

  if (!filePath) {
    throw new Error("File path is required");
  }

  // Verify user owns this file (path should start with their user_id)
  if (!filePath.startsWith(user.id) && user.email !== 'support@emergestack.dev') {
    throw new Error("Access denied");
  }

  const { data: deleteData, error: deleteError } = await supabase.storage
    .from(bucket)
    .remove([filePath]);

  if (deleteError) {
    throw new Error(`Failed to delete document: ${deleteError.message}`);
  }

  logStep("Document deleted", { bucket, filePath });

  return new Response(JSON.stringify({
    success: true,
    message: "Document deleted successfully",
    deleted_path: filePath
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}