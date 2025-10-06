import { supabase } from '../lib/supabase.js';
import { validateApiKey, extractApiKey, createApiResponse, createApiError } from '../lib/api-auth.js';

export const handleProspectsAPI = async (request, url) => {
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
  const prospectId = pathParts[3]; // /api/prospects/[id]

  try {
    switch (request.method) {
      case 'GET':
        if (prospectId) {
          return await getProspect(user.id, prospectId);
        } else {
          return await getProspects(user.id, url.searchParams);
        }

      case 'POST':
        return await createProspect(user.id, request);

      case 'PUT':
        if (!prospectId) {
          return createApiError('Prospect ID required for update', 'MISSING_ID', 400);
        }
        return await updateProspect(user.id, prospectId, request);

      case 'DELETE':
        if (!prospectId) {
          return createApiError('Prospect ID required for deletion', 'MISSING_ID', 400);
        }
        return await deleteProspect(user.id, prospectId);

      default:
        return createApiError('Method not allowed', 'METHOD_NOT_ALLOWED', 405);
    }
  } catch (error) {
    console.error('API Error:', error);
    return createApiError('Internal server error', 'INTERNAL_ERROR', 500);
  }
};

const getProspects = async (userId, searchParams) => {
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');
  const search = searchParams.get('search');
  const minScore = searchParams.get('min_score');
  const maxScore = searchParams.get('max_score');

  let query = supabase
    .from('prospects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search) {
    query = query.or(`nom.ilike.%${search}%,telephone.ilike.%${search}%,adresse.ilike.%${search}%,site_web.ilike.%${search}%`);
  }

  if (minScore) {
    query = query.gte('score_seo', parseInt(minScore));
  }

  if (maxScore) {
    query = query.lte('score_seo', parseInt(maxScore));
  }

  const { data, error, count } = await query;

  if (error) {
    return createApiError(error.message, 'DATABASE_ERROR', 500);
  }

  return createApiResponse({
    prospects: data,
    total: count,
    limit,
    offset,
  });
};

const getProspect = async (userId, prospectId) => {
  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('user_id', userId)
    .eq('id', prospectId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return createApiError('Prospect not found', 'NOT_FOUND', 404);
    }
    return createApiError(error.message, 'DATABASE_ERROR', 500);
  }

  return createApiResponse(data);
};

const createProspect = async (userId, request) => {
  const body = await request.json();

  // Validation
  if (!body.nom) {
    return createApiError('Name is required', 'VALIDATION_ERROR', 400);
  }

  if (body.score_seo && (body.score_seo < 0 || body.score_seo > 100)) {
    return createApiError('SEO score must be between 0 and 100', 'VALIDATION_ERROR', 400);
  }

  const prospectData = {
    nom: body.nom,
    telephone: body.telephone || null,
    adresse: body.adresse || null,
    site_web: body.site_web || null,
    score_seo: body.score_seo || null,
    message_personnalise: body.message_personnalise || null,
    user_id: userId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('prospects')
    .insert(prospectData)
    .select()
    .single();

  if (error) {
    return createApiError(error.message, 'DATABASE_ERROR', 500);
  }

  return createApiResponse(data, 201);
};

const updateProspect = async (userId, prospectId, request) => {
  const body = await request.json();

  // Validation
  if (body.score_seo && (body.score_seo < 0 || body.score_seo > 100)) {
    return createApiError('SEO score must be between 0 and 100', 'VALIDATION_ERROR', 400);
  }

  const updateData = {
    ...(body.nom && { nom: body.nom }),
    ...(body.telephone !== undefined && { telephone: body.telephone }),
    ...(body.adresse !== undefined && { adresse: body.adresse }),
    ...(body.site_web !== undefined && { site_web: body.site_web }),
    ...(body.score_seo !== undefined && { score_seo: body.score_seo }),
    ...(body.message_personnalise !== undefined && { message_personnalise: body.message_personnalise }),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('prospects')
    .update(updateData)
    .eq('user_id', userId)
    .eq('id', prospectId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return createApiError('Prospect not found', 'NOT_FOUND', 404);
    }
    return createApiError(error.message, 'DATABASE_ERROR', 500);
  }

  return createApiResponse(data);
};

const deleteProspect = async (userId, prospectId) => {
  const { error } = await supabase
    .from('prospects')
    .delete()
    .eq('user_id', userId)
    .eq('id', prospectId);

  if (error) {
    return createApiError(error.message, 'DATABASE_ERROR', 500);
  }

  return createApiResponse({ message: 'Prospect deleted successfully' });
};