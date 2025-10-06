import { supabase } from './supabase.js';

export const validateApiKey = async (apiKey) => {
  try {
    // Pour le moment, on utilise le token Supabase comme clé API
    // En production, il faudrait un système de clés API dédié
    const { data: { user }, error } = await supabase.auth.getUser(apiKey);
    
    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || '',
    };
  } catch (error) {
    return null;
  }
};

export const extractApiKey = (request) => {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
};

export const createApiResponse = (data, status = 200) => {
  return new Response(JSON.stringify({
    success: status < 400,
    data: status < 400 ? data : undefined,
    error: status >= 400 ? data : undefined,
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};

export const createApiError = (message, code, status = 400) => {
  return createApiResponse({
    code,
    message,
  }, status);
};