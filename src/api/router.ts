import { handleProspectsAPI } from './prospects';
import { handleTablesAPI } from './tables';
import { createApiError } from '../lib/api-auth';

export const handleAPIRequest = async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');

  // Remove empty parts and 'api'
  const cleanPath = pathParts.filter(part => part !== '' && part !== 'api');
  
  if (cleanPath.length === 0) {
    return createApiError('API endpoint not specified', 'MISSING_ENDPOINT', 400);
  }

  const endpoint = cleanPath[0];

  switch (endpoint) {
    case 'prospects':
      return await handleProspectsAPI(request, url);
    
    case 'tables':
      return await handleTablesAPI(request, url);
    
    case 'health':
      return new Response(JSON.stringify({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        }
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    
    default:
      return createApiError('Endpoint not found', 'ENDPOINT_NOT_FOUND', 404);
  }
};