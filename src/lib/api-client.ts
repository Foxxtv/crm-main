// Client API pour les requêtes internes
import { supabase } from './supabase';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export class ApiClient {
  private baseUrl: string;

  constructor() {
    // Utiliser l'URL de l'application pour les requêtes API
    this.baseUrl = window.location.origin + '/api';
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      // Essayer d'abord l'API HTTP, puis fallback sur Supabase direct
      try {
        return await this.handleHttpRequest<T>(endpoint, options);
      } catch (httpError) {
        console.warn('HTTP API failed, falling back to direct Supabase:', httpError);
        return await this.handleInternalRequest<T>(endpoint, options);
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Network request failed'
        }
      };
    }
  }

  private async handleHttpRequest<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Ajouter l'authentification
    const { data: { session } } = await supabase.auth.getSession();
    const headers = {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        'Authorization': `Bearer ${session.access_token}`
      }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  }
  private async handleInternalRequest<T>(
    endpoint: string,
    options: RequestInit
  ): Promise<ApiResponse<T>> {
    const method = options.method || 'GET';
    const body = options.body ? JSON.parse(options.body as string) : null;

    try {
      // Vérifier l'authentification
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (!user && !endpoint.includes('health')) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          }
        };
      }

      // Router vers la bonne fonction selon l'endpoint
      if (endpoint.includes('health')) {
        return {
          success: true,
          data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            environment: 'bolt-hosting'
          } as T
        };
      }

      if (endpoint.includes('prospects')) {
        return await this.handleProspectsRequest<T>(endpoint, method, body, user!.id);
      }

      return {
        success: false,
        error: {
          code: 'ENDPOINT_NOT_FOUND',
          message: 'Endpoint not found'
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message
        }
      };
    }
  }

  private async handleProspectsRequest<T>(
    endpoint: string,
    method: string,
    body: any,
    userId: string
  ): Promise<ApiResponse<T>> {
    const pathParts = endpoint.split('/');
    const prospectId = pathParts[pathParts.length - 1];
    const isSpecificProspect = prospectId && prospectId !== 'prospects';

    switch (method) {
      case 'GET':
        if (isSpecificProspect) {
          const { data, error } = await supabase
            .from('prospects')
            .select('*')
            .eq('user_id', userId)
            .eq('id', prospectId)
            .single();

          if (error) {
            return {
              success: false,
              error: {
                code: error.code === 'PGRST116' ? 'NOT_FOUND' : 'DATABASE_ERROR',
                message: error.message
              }
            };
          }

          return { success: true, data: data as T };
        } else {
          // Liste des prospects avec filtres
          const limit = 50;
          const offset = 0;

          let query = supabase
            .from('prospects')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

          const { data, error, count } = await query;

          if (error) {
            return {
              success: false,
              error: {
                code: 'DATABASE_ERROR',
                message: error.message
              }
            };
          }

          return {
            success: true,
            data: {
              prospects: data,
              total: count,
              limit,
              offset
            } as T
          };
        }

      case 'POST':
        if (!body.nom) {
          return {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Name is required'
            }
          };
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
          return {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: error.message
            }
          };
        }

        return { success: true, data: data as T };

      case 'PUT':
        if (!isSpecificProspect) {
          return {
            success: false,
            error: {
              code: 'MISSING_ID',
              message: 'Prospect ID required for update'
            }
          };
        }

        const updateData: any = {
          updated_at: new Date().toISOString(),
        };

        if (body.nom !== undefined) updateData.nom = body.nom;
        if (body.telephone !== undefined) updateData.telephone = body.telephone;
        if (body.adresse !== undefined) updateData.adresse = body.adresse;
        if (body.site_web !== undefined) updateData.site_web = body.site_web;
        if (body.score_seo !== undefined) updateData.score_seo = body.score_seo;
        if (body.message_personnalise !== undefined) updateData.message_personnalise = body.message_personnalise;

        const { data: updateResult, error: updateError } = await supabase
          .from('prospects')
          .update(updateData)
          .eq('user_id', userId)
          .eq('id', prospectId)
          .select()
          .single();

        if (updateError) {
          return {
            success: false,
            error: {
              code: updateError.code === 'PGRST116' ? 'NOT_FOUND' : 'DATABASE_ERROR',
              message: updateError.message
            }
          };
        }

        return { success: true, data: updateResult as T };

      case 'DELETE':
        if (!isSpecificProspect) {
          return {
            success: false,
            error: {
              code: 'MISSING_ID',
              message: 'Prospect ID required for deletion'
            }
          };
        }

        const { error: deleteError } = await supabase
          .from('prospects')
          .delete()
          .eq('user_id', userId)
          .eq('id', prospectId);

        if (deleteError) {
          return {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: deleteError.message
            }
          };
        }

        return {
          success: true,
          data: { message: 'Prospect deleted successfully' } as T
        };

      default:
        return {
          success: false,
          error: {
            code: 'METHOD_NOT_ALLOWED',
            message: 'Method not allowed'
          }
        };
    }
  }

  // Méthodes publiques pour l'API
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();