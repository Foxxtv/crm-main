import { supabase } from '../lib/supabase.js';
import { validateApiKey, extractApiKey, createApiResponse, createApiError } from '../lib/api-auth.js';

export const handleTablesAPI = async (request, url) => {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return createApiResponse(null);
  }

  // Extract and validate API key
  const apiKey = extractApiKey(request);
  if (!apiKey) {
    return createApiError('API key required', 'MISSING_API_KEY', 401);
  }

  const user = await validateApiKey(apiKey);
  if (!user) {
    return createApiError('Invalid API key', 'INVALID_API_KEY', 401);
  }

  const pathParts = url.pathname.split('/');
  const tableName = pathParts[3]; // /api/tables/[tableName]
  const recordId = pathParts[4]; // /api/tables/[tableName]/[id]

  if (!tableName) {
    return createApiError('Table name required', 'MISSING_TABLE_NAME', 400);
  }

  try {
    // First, verify the table exists and belongs to the user
    const { data: tableInfo, error: tableError } = await supabase
      .from('custom_tables')
      .select('*')
      .eq('user_id', user.id)
      .eq('name', tableName)
      .single();

    if (tableError || !tableInfo) {
      return createApiError('Table not found', 'TABLE_NOT_FOUND', 404);
    }

    switch (request.method) {
      case 'GET':
        if (recordId) {
          return await getTableRecord(tableName, recordId, user.id);
        } else {
          return await getTableRecords(tableName, user.id, url.searchParams);
        }

      case 'POST':
        return await createTableRecord(tableName, tableInfo.schema, user.id, request);

      case 'PUT':
        if (!recordId) {
          return createApiError('Record ID required for update', 'MISSING_ID', 400);
        }
        return await updateTableRecord(tableName, recordId, tableInfo.schema, user.id, request);

      case 'DELETE':
        if (!recordId) {
          return createApiError('Record ID required for deletion', 'MISSING_ID', 400);
        }
        return await deleteTableRecord(tableName, recordId, user.id);

      default:
        return createApiError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
    }
  } catch (error) {
    console.error('API Error:', error);
    return createApiError('Internal server error', 'INTERNAL_ERROR', 500);
  }
};

const getTableRecords = async (tableName, userId, searchParams) => {
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  // Note: In a real implementation, you would query a dynamic table
  // For now, we'll simulate this with a generic response
  const mockData = {
    records: [],
    total: 0,
    limit,
    offset,
    table: tableName,
  };

  return createApiResponse(mockData);
};

const getTableRecord = async (tableName, recordId, userId) => {
  // Note: In a real implementation, you would query the specific record
  // For now, we'll return a mock response
  return createApiError('Record not found', 'NOT_FOUND', 404);
};

const createTableRecord = async (tableName, schema, userId, request) => {
  const body = await request.json();

  // Validate required fields based on schema
  const requiredFields = schema.fields?.filter((field) => field.required) || [];
  
  for (const field of requiredFields) {
    if (!body[field.name]) {
      return createApiError(`Field '${field.name}' is required`, 'VALIDATION_ERROR', 400);
    }
  }

  // Note: In a real implementation, you would insert into the dynamic table
  // For now, we'll return a mock response
  const mockRecord = {
    id: `mock-${Date.now()}`,
    ...body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return createApiResponse(mockRecord, 201);
};

const updateTableRecord = async (tableName, recordId, schema, userId, request) => {
  const body = await request.json();

  // Note: In a real implementation, you would update the specific record
  // For now, we'll return a mock response
  const mockRecord = {
    id: recordId,
    ...body,
    updated_at: new Date().toISOString(),
  };

  return createApiResponse(mockRecord);
};

const deleteTableRecord = async (tableName, recordId, userId) => {
  // Note: In a real implementation, you would delete the specific record
  // For now, we'll return a success response
  return createApiResponse({ message: 'Record deleted successfully' });
};