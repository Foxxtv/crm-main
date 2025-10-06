import express from 'express';
import cors from 'cors';
import { supabase } from '../lib/supabase';
import { validateApiKey, extractApiKey, createApiResponse, createApiError } from '../lib/api-auth';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Middleware d'authentification
const authenticateAPI = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const apiKey = extractApiKey(req);
  if (!apiKey) {
    return res.status(401).json(createApiError('API key required', 'MISSING_API_KEY', 401));
  }

  const user = await validateApiKey(apiKey);
  if (!user) {
    return res.status(401).json(createApiError('Invalid API key', 'INVALID_API_KEY', 401));
  }

  (req as any).user = user;
  next();
};

// Routes Prospects
app.get('/api/prospects', authenticateAPI, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const { limit = '50', offset = '0', search, min_score, max_score } = req.query;

    let query = supabase
      .from('prospects')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    if (search) {
      query = query.or(`nom.ilike.%${search}%,telephone.ilike.%${search}%,adresse.ilike.%${search}%,site_web.ilike.%${search}%`);
    }

    if (min_score) {
      query = query.gte('score_seo', parseInt(min_score as string));
    }

    if (max_score) {
      query = query.lte('score_seo', parseInt(max_score as string));
    }

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json(createApiError(error.message, 'DATABASE_ERROR', 500));
    }

    res.json(createApiResponse({
      prospects: data,
      total: count,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    }));
  } catch (error: any) {
    res.status(500).json(createApiError('Internal server error', 'INTERNAL_ERROR', 500));
  }
});

app.get('/api/prospects/:id', authenticateAPI, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('prospects')
      .select('*')
      .eq('user_id', user.id)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json(createApiError('Prospect not found', 'NOT_FOUND', 404));
      }
      return res.status(500).json(createApiError(error.message, 'DATABASE_ERROR', 500));
    }

    res.json(createApiResponse(data));
  } catch (error: any) {
    res.status(500).json(createApiError('Internal server error', 'INTERNAL_ERROR', 500));
  }
});

app.post('/api/prospects', authenticateAPI, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
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
      user_id: user.id,
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
  } catch (error: any) {
    res.status(500).json(createApiError('Internal server error', 'INTERNAL_ERROR', 500));
  }
});

app.put('/api/prospects/:id', authenticateAPI, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { nom, telephone, adresse, site_web, score_seo, message_personnalise } = req.body;

    if (score_seo && (score_seo < 0 || score_seo > 100)) {
      return res.status(400).json(createApiError('SEO score must be between 0 and 100', 'VALIDATION_ERROR', 400));
    }

    const updateData: any = {
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
      .eq('user_id', user.id)
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
  } catch (error: any) {
    res.status(500).json(createApiError('Internal server error', 'INTERNAL_ERROR', 500));
  }
});

app.delete('/api/prospects/:id', authenticateAPI, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const { error } = await supabase
      .from('prospects')
      .delete()
      .eq('user_id', user.id)
      .eq('id', id);

    if (error) {
      return res.status(500).json(createApiError(error.message, 'DATABASE_ERROR', 500));
    }

    res.json(createApiResponse({ message: 'Prospect deleted successfully' }));
  } catch (error: any) {
    res.status(500).json(createApiError('Internal server error', 'INTERNAL_ERROR', 500));
  }
});

// Routes Tables Personnalisées
app.get('/api/tables/:tableName', authenticateAPI, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const { tableName } = req.params;
    const { limit = '50', offset = '0' } = req.query;

    // Vérifier que la table existe et appartient à l'utilisateur
    const { data: tableInfo, error: tableError } = await supabase
      .from('custom_tables')
      .select('*')
      .eq('user_id', user.id)
      .eq('name', tableName)
      .single();

    if (tableError || !tableInfo) {
      return res.status(404).json(createApiError('Table not found', 'TABLE_NOT_FOUND', 404));
    }

    // Pour le moment, retourner une réponse simulée
    // En production, il faudrait interroger la vraie table dynamique
    const mockData = {
      records: [],
      total: 0,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      table: tableName,
      schema: tableInfo.schema,
    };

    res.json(createApiResponse(mockData));
  } catch (error: any) {
    res.status(500).json(createApiError('Internal server error', 'INTERNAL_ERROR', 500));
  }
});

app.post('/api/tables/:tableName', authenticateAPI, async (req: express.Request, res: express.Response) => {
  try {
    const user = (req as any).user;
    const { tableName } = req.params;

    // Vérifier que la table existe et appartient à l'utilisateur
    const { data: tableInfo, error: tableError } = await supabase
      .from('custom_tables')
      .select('*')
      .eq('user_id', user.id)
      .eq('name', tableName)
      .single();

    if (tableError || !tableInfo) {
      return res.status(404).json(createApiError('Table not found', 'TABLE_NOT_FOUND', 404));
    }

    // Valider les champs requis selon le schéma
    const requiredFields = tableInfo.schema.fields?.filter((field: any) => field.required) || [];
    
    for (const field of requiredFields) {
      if (!req.body[field.name]) {
        return res.status(400).json(createApiError(`Field '${field.name}' is required`, 'VALIDATION_ERROR', 400));
      }
    }

    // Pour le moment, retourner une réponse simulée
    const mockRecord = {
      id: `mock-${Date.now()}`,
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    res.status(201).json(createApiResponse(mockRecord));
  } catch (error: any) {
    res.status(500).json(createApiError('Internal server error', 'INTERNAL_ERROR', 500));
  }
});

// Route de test
app.get('/api/health', (req: express.Request, res: express.Response) => {
  res.json(createApiResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }));
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`API Server running on port ${PORT}`);
});

export default app;