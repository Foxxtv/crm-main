import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import API handlers
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase client - Use environment variables properly
const supabaseUrl = 'https://iajfqvvrhbvtgcufcige.supabase.co';
const supabaseServiceKey = 'sb_publishable_eLnEO-g5FuBpnGtPgSjtkA_EHbvEA1V';

console.log('🔧 Supabase URL:', supabaseUrl);
console.log('🔑 Using service key:', supabaseServiceKey ? 'Yes' : 'No');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Force production mode detection
console.log('🚀 Starting server on port', PORT);
console.log('📡 API endpoints available at /api/*');
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Helper functions
const createApiResponse = (data, success = true, status = 200) => ({
  success,
  data: success ? data : undefined,
  error: !success ? data : undefined
});

const createApiError = (message, code, status = 400) => ({
  success: false,
  error: { code, message }
});

// Authentication middleware
const authenticateAPI = async (req, res, next) => {
  const authHeader = req.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json(createApiError('API key required', 'MISSING_API_KEY', 401));
  }

  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json(createApiError('Invalid API key', 'INVALID_API_KEY', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json(createApiError('Authentication failed', 'AUTH_ERROR', 401));
  }
};
// API Routes

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
  res.json(createApiResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'bolt-hosting-fullstack',
    server: 'express'
  }));
});

// Prospects endpoints
app.get('/api/prospects', authenticateAPI, async (req, res) => {
  try {
    const { limit = '50', offset = '0', search, min_score, max_score } = req.query;

    let query = supabase
      .from('prospects')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (search) {
      query = query.or(`nom.ilike.%${search}%,telephone.ilike.%${search}%,adresse.ilike.%${search}%,site_web.ilike.%${search}%`);
    }

    if (min_score) {
      query = query.gte('score_seo', parseInt(min_score));
    }

    if (max_score) {
      query = query.lte('score_seo', parseInt(max_score));
    }

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json(createApiError(error.message, 'DATABASE_ERROR', 500));
    }

    res.json(createApiResponse({
      prospects: data,
      total: count,
      limit: parseInt(limit),
      offset: parseInt(offset)
    }));
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json(createApiError('Internal server error', 'INTERNAL_ERROR', 500));
  }
});

app.get('/api/prospects/:id', authenticateAPI, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('prospects')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json(createApiError('Prospect not found', 'NOT_FOUND', 404));
      }
      return res.status(500).json(createApiError(error.message, 'DATABASE_ERROR', 500));
    }

    res.json(createApiResponse(data));
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json(createApiError('Internal server error', 'INTERNAL_ERROR', 500));
  }
});

app.post('/api/prospects', authenticateAPI, async (req, res) => {
  try {
    const { nom, telephone, adresse, site_web, score_seo, message_personnalise } = req.body;

    if (!nom) {
      return res.status(400).json(createApiError('Name is required', 'VALIDATION_ERROR', 400));
    }

    if (score_seo && (score_seo < 0 || score_seo > 100)) {
      return res.status(400).json(createApiError('SEO score must be between 0 and 100', 'VALIDATION_ERROR', 400));
    }

    const prospectData = {
      nom,
      telephone: telephone || null,
      adresse: adresse || null,
      site_web: site_web || null,
      score_seo: score_seo || null,
      message_personnalise: message_personnalise || null,
      user_id: req.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('prospects')
      .insert(prospectData)
      .select()
      .single();

    if (error) {
      return res.status(500).json(createApiError(error.message, 'DATABASE_ERROR', 500));
    }

    res.status(201).json(createApiResponse(data));
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json(createApiError('Internal server error', 'INTERNAL_ERROR', 500));
  }
});

app.put('/api/prospects/:id', authenticateAPI, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, telephone, adresse, site_web, score_seo, message_personnalise } = req.body;

    if (score_seo && (score_seo < 0 || score_seo > 100)) {
      return res.status(400).json(createApiError('SEO score must be between 0 and 100', 'VALIDATION_ERROR', 400));
    }

    const updateData = {
      updated_at: new Date().toISOString(),
    };

    if (nom !== undefined) updateData.nom = nom;
    if (telephone !== undefined) updateData.telephone = telephone;
    if (adresse !== undefined) updateData.adresse = adresse;
    if (site_web !== undefined) updateData.site_web = site_web;
    if (score_seo !== undefined) updateData.score_seo = score_seo;
    if (message_personnalise !== undefined) updateData.message_personnalise = message_personnalise;

    const { data, error } = await supabase
      .from('prospects')
      .update(updateData)
      .eq('user_id', req.user.id)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json(createApiError('Prospect not found', 'NOT_FOUND', 404));
      }
      return res.status(500).json(createApiError(error.message, 'DATABASE_ERROR', 500));
    }

    res.json(createApiResponse(data));
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json(createApiError('Internal server error', 'INTERNAL_ERROR', 500));
  }
});

app.delete('/api/prospects/:id', authenticateAPI, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('prospects')
      .delete()
      .eq('user_id', req.user.id)
      .eq('id', id);

    if (error) {
      return res.status(500).json(createApiError(error.message, 'DATABASE_ERROR', 500));
    }

    res.json(createApiResponse({ message: 'Prospect deleted successfully' }));
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json(createApiError('Internal server error', 'INTERNAL_ERROR', 500));
  }
});

// Tables endpoints
app.get('/api/tables/:tableName', authenticateAPI, async (req, res) => {
  try {
    const { tableName } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    // Verify table exists and belongs to user
    const { data: tableInfo, error: tableError } = await supabase
      .from('custom_tables')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('name', tableName)
      .single();

    if (tableError || !tableInfo) {
      return res.status(404).json(createApiError('Table not found', 'TABLE_NOT_FOUND', 404));
    }

    // Mock response for now
    const mockData = {
      records: [],
      total: 0,
      limit: parseInt(limit),
      offset: parseInt(offset),
      table: tableName,
      schema: tableInfo.schema,
    };

    res.json(createApiResponse(mockData));
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json(createApiError('Internal server error', 'INTERNAL_ERROR', 500));
  }
});

app.post('/api/tables/:tableName', authenticateAPI, async (req, res) => {
  try {
    const { tableName } = req.params;

    // Verify table exists and belongs to user
    const { data: tableInfo, error: tableError } = await supabase
      .from('custom_tables')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('name', tableName)
      .single();

    if (tableError || !tableInfo) {
      return res.status(404).json(createApiError('Table not found', 'TABLE_NOT_FOUND', 404));
    }

    // Validate required fields
    const requiredFields = tableInfo.schema.fields?.filter(field => field.required) || [];
    
    for (const field of requiredFields) {
      if (!req.body[field.name]) {
        return res.status(400).json(createApiError(`Field '${field.name}' is required`, 'VALIDATION_ERROR', 400));
      }
    }

    // Mock response for now
    const mockRecord = {
      id: `mock-${Date.now()}`,
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    res.status(201).json(createApiResponse(mockRecord));
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json(createApiError('Internal server error', 'INTERNAL_ERROR', 500));
  }
});

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Handle client-side routing - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'Internal server error'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

export default app;