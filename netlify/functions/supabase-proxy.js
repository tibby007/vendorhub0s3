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
  // The path comes as /functions/v1/function-name, we need just function-name
  let functionPath = path;
  
  // Remove various possible prefixes
  functionPath = functionPath.replace('/.netlify/functions/supabase-proxy/', '');
  functionPath = functionPath.replace('/functions/v1/', '');
  functionPath = functionPath.replace('.netlify/functions/supabase-proxy/', '');
  
  // If it still starts with /, remove it
  if (functionPath.startsWith('/')) {
    functionPath = functionPath.substring(1);
  }
  
  // Get Supabase configuration from environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  console.log('Proxy function called:', {
    originalPath: path,
    extractedFunction: functionPath,
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    method: httpMethod,
    hasAuthHeader: !!(headers.authorization || headers.Authorization),
    urlValue: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'undefined'
  });
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Missing Supabase configuration',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseAnonKey
        }
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    };
  }
  
  try {
    // Forward the request to Supabase Edge Function
    const targetUrl = `${supabaseUrl}/functions/v1/${functionPath}`;
    console.log('Proxying to:', targetUrl);
    
    // Pass through the authorization header from the client
    const authHeader = headers.authorization || headers.Authorization;
    
    // Debug the auth header
    console.log('Auth header details:', {
      hasAuth: !!authHeader,
      authPrefix: authHeader ? authHeader.substring(0, 20) + '...' : 'none',
      contentType: headers['content-type'],
    });
    
    // Build headers for Supabase
    const supabaseHeaders = {
      'Authorization': authHeader || `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,
    };
    
    console.log('Sending to Supabase with headers:', {
      hasAuth: !!supabaseHeaders.Authorization,
      hasApiKey: !!supabaseHeaders.apikey,
    });
    
    const response = await fetch(targetUrl, {
      method: httpMethod,
      headers: supabaseHeaders,
      body: body,
    });
    
    const data = await response.text();
    
    console.log('Supabase response:', {
      status: response.status,
      statusText: response.statusText,
      hasData: !!data,
      dataPreview: data.substring(0, 100) + (data.length > 100 ? '...' : '')
    });
    
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
      body: JSON.stringify({ 
        error: 'Failed to proxy request',
        details: error.message,
        functionPath,
        supabaseUrl
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    };
  }
};