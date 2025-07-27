// Proxy function to handle Supabase Edge Function calls
exports.handler = async (event, context) => {
  const { path, httpMethod, headers, body } = event;
  
  // Handle CORS preflight requests
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }
  
  // Extract the function name from the path
  const functionPath = path.replace('/.netlify/functions/supabase-proxy/', '');
  
  // Get Supabase configuration from environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Missing Supabase configuration' }),
    };
  }
  
  try {
    // Forward the request to Supabase Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/${functionPath}`, {
      method: httpMethod,
      headers: {
        ...headers,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: body,
    });
    
    const data = await response.text();
    
    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
      },
      body: data,
    };
  } catch (error) {
    console.error('Error proxying to Supabase:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to proxy request' }),
    };
  }
};