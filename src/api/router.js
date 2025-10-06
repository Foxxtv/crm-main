import { handleProspectsAPI } from './prospects.js';
import { handleTablesAPI } from './tables.js';
import { createApiError } from '../lib/api-auth.js';

export const handleAPIRequest = async (request) => {
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
          version: '1.0.0',
          environment: 'bolt-hosting-fullstack',
          server: 'express'
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