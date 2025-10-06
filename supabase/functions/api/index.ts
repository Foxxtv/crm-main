import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

interface Database {
  public: {
    Tables: {
      prospects: {
        Row: {
          id: string
          nom: string
          telephone: string | null
          adresse: string | null
          site_web: string | null
          score_seo: number | null
          message_personnalise: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          nom: string
          telephone?: string | null
          adresse?: string | null
          site_web?: string | null
          score_seo?: number | null
          message_personnalise?: string | null
          user_id: string
        }
        Update: {
          nom?: string
          telephone?: string | null
          adresse?: string | null
          site_web?: string | null
          score_seo?: number | null
          message_personnalise?: string | null
        }
      }
      custom_tables: {
        Row: {
          id: string
          name: string
          schema: any
          user_id: string
          created_at: string
          updated_at: string
        }
      }
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(part => part !== '')
    
    // Remove 'functions', 'v1', 'api' from path
    const cleanPath = pathParts.slice(3) // /functions/v1/api/[endpoint]
    const endpoint = cleanPath[0]

    // Health check endpoint (no auth required)
    if (endpoint === 'health') {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            environment: 'supabase-edge-functions'
          }
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Authentication for other endpoints - Service Role Key validation
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'MISSING_API_KEY', message: 'API key required' }
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const token = authHeader.substring(7)
    
    // Validate Service Role Key
    const expectedServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (token !== expectedServiceKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: { code: 'INVALID_API_KEY', message: 'Invalid API key' }
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // For Service Role Key, we bypass user authentication and use admin access
    // Extract user_id from request body or query params for data filtering
    let userId = null
    
    // Try to get user_id from query params first
    userId = url.searchParams.get('user_id')
    
    // If not in query, try to get from request body for POST/PUT
    if (!userId && (req.method === 'POST' || req.method === 'PUT')) {
      try {
        const bodyText = await req.text()
        if (bodyText) {
          const body = JSON.parse(bodyText)
          userId = body.user_id
          // Re-create request with body for later use
          req = new Request(req.url, {
            method: req.method,
            headers: req.headers,
            body: bodyText
          })
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    }
    // Route to prospects endpoints
    if (endpoint === 'prospects') {
      const prospectId = cleanPath[1] // prospects/[id]
      
      switch (req.method) {
        case 'GET':
          if (prospectId) {
            // Get specific prospect
            let query = supabaseClient
              .from('prospects')
              .select('*')
              .eq('id', prospectId)
            
            // If user_id provided, filter by it
            if (userId) {
              query = query.eq('user_id', userId)
            }
            
            const { data, error } = await query.single()

            if (error) {
              return new Response(
                JSON.stringify({
                  success: false,
                  error: { 
                    code: error.code === 'PGRST116' ? 'NOT_FOUND' : 'DATABASE_ERROR', 
                    message: error.message 
                  }
                }),
                { 
                  status: error.code === 'PGRST116' ? 404 : 500, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
              )
            }

            return new Response(
              JSON.stringify({ success: true, data }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          } else {
            // Get all prospects with filters
            const limit = parseInt(url.searchParams.get('limit') || '50')
            const offset = parseInt(url.searchParams.get('offset') || '0')
            const search = url.searchParams.get('search')
            const minScore = url.searchParams.get('min_score')
            const maxScore = url.searchParams.get('max_score')

            let query = supabaseClient
              .from('prospects')
              .select('*', { count: 'exact' })
              .order('created_at', { ascending: false })
              .range(offset, offset + limit - 1)

            // If user_id provided, filter by it
            if (userId) {
              query = query.eq('user_id', userId)
            }
            if (search) {
              query = query.or(`nom.ilike.%${search}%,telephone.ilike.%${search}%,adresse.ilike.%${search}%,site_web.ilike.%${search}%`)
            }

            if (minScore) {
              query = query.gte('score_seo', parseInt(minScore))
            }

            if (maxScore) {
              query = query.lte('score_seo', parseInt(maxScore))
            }

            const { data, error, count } = await query

            if (error) {
              return new Response(
                JSON.stringify({
                  success: false,
                  error: { code: 'DATABASE_ERROR', message: error.message }
                }),
                { 
                  status: 500, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
              )
            }

            return new Response(
              JSON.stringify({
                success: true,
                data: {
                  prospects: data,
                  total: count,
                  limit,
                  offset
                }
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
          }

        case 'POST':
          const body = await req.json()

          if (!body.nom) {
            return new Response(
              JSON.stringify({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'Name is required' }
              }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }

          if (!body.user_id) {
            return new Response(
              JSON.stringify({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'user_id is required' }
              }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }
          if (body.score_seo && (body.score_seo < 0 || body.score_seo > 100)) {
            return new Response(
              JSON.stringify({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'SEO score must be between 0 and 100' }
              }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }

          const prospectData = {
            nom: body.nom,
            telephone: body.telephone || null,
            adresse: body.adresse || null,
            site_web: body.site_web || null,
            score_seo: body.score_seo || null,
            message_personnalise: body.message_personnalise || null,
            user_id: body.user_id
          }

          const { data: newProspect, error: insertError } = await supabaseClient
            .from('prospects')
            .insert(prospectData)
            .select()
            .single()

          if (insertError) {
            return new Response(
              JSON.stringify({
                success: false,
                error: { code: 'DATABASE_ERROR', message: insertError.message }
              }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }

          return new Response(
            JSON.stringify({ success: true, data: newProspect }),
            { 
              status: 201, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )

        case 'PUT':
          if (!prospectId) {
            return new Response(
              JSON.stringify({
                success: false,
                error: { code: 'MISSING_ID', message: 'Prospect ID required for update' }
              }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }

          const updateBody = await req.json()

          if (updateBody.score_seo && (updateBody.score_seo < 0 || updateBody.score_seo > 100)) {
            return new Response(
              JSON.stringify({
                success: false,
                error: { code: 'VALIDATION_ERROR', message: 'SEO score must be between 0 and 100' }
              }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }

          const updateData: any = { updated_at: new Date().toISOString() }
          if (updateBody.nom !== undefined) updateData.nom = updateBody.nom
          if (updateBody.telephone !== undefined) updateData.telephone = updateBody.telephone
          if (updateBody.adresse !== undefined) updateData.adresse = updateBody.adresse
          if (updateBody.site_web !== undefined) updateData.site_web = updateBody.site_web
          if (updateBody.score_seo !== undefined) updateData.score_seo = updateBody.score_seo
          if (updateBody.message_personnalise !== undefined) updateData.message_personnalise = updateBody.message_personnalise

          let updateQuery = supabaseClient
            .from('prospects')
            .update(updateData)
            .eq('id', prospectId)
          
          // If user_id provided, filter by it
          if (userId) {
            updateQuery = updateQuery.eq('user_id', userId)
          }
          
          const { data: updatedProspect, error: updateError } = await updateQuery
            .select()
            .single()

          if (updateError) {
            return new Response(
              JSON.stringify({
                success: false,
                error: { 
                  code: updateError.code === 'PGRST116' ? 'NOT_FOUND' : 'DATABASE_ERROR', 
                  message: updateError.message 
                }
              }),
              { 
                status: updateError.code === 'PGRST116' ? 404 : 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }

          return new Response(
            JSON.stringify({ success: true, data: updatedProspect }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )

        case 'DELETE':
          if (!prospectId) {
            return new Response(
              JSON.stringify({
                success: false,
                error: { code: 'MISSING_ID', message: 'Prospect ID required for deletion' }
              }),
              { 
                status: 400, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }

          let deleteQuery = supabaseClient
            .from('prospects')
            .delete()
            .eq('id', prospectId)
          
          // If user_id provided, filter by it
          if (userId) {
            deleteQuery = deleteQuery.eq('user_id', userId)
          }
          
          const { error: deleteError } = await deleteQuery

          if (deleteError) {
            return new Response(
              JSON.stringify({
                success: false,
                error: { code: 'DATABASE_ERROR', message: deleteError.message }
              }),
              { 
                status: 500, 
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              }
            )
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              data: { message: 'Prospect deleted successfully' } 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )

        default:
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
            }),
            { 
              status: 405, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
      }
    }

    // Tables endpoint
    if (endpoint === 'tables') {
      const tableName = cleanPath[1] // tables/[tableName]
      const recordId = cleanPath[2] // tables/[tableName]/[id]

      if (!tableName) {
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'MISSING_TABLE_NAME', message: 'Table name required' }
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Verify table exists
      let tableQuery = supabaseClient
        .from('custom_tables')
        .select('*')
        .eq('name', tableName)
      
      // If user_id provided, filter by it
      if (userId) {
        tableQuery = tableQuery.eq('user_id', userId)
      }
      
      const { data: tableInfo, error: tableError } = await tableQuery.single()

      if (tableError || !tableInfo) {
        return new Response(
          JSON.stringify({
            success: false,
            error: { code: 'TABLE_NOT_FOUND', message: 'Table not found' }
          }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Mock responses for tables (implement actual logic as needed)
      switch (req.method) {
        case 'GET':
          const limit = parseInt(url.searchParams.get('limit') || '50')
          const offset = parseInt(url.searchParams.get('offset') || '0')

          return new Response(
            JSON.stringify({
              success: true,
              data: {
                records: [],
                total: 0,
                limit,
                offset,
                table: tableName,
                schema: tableInfo.schema
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )

        case 'POST':
          const tableBody = await req.json()
          const requiredFields = tableInfo.schema.fields?.filter((field: any) => field.required) || []
          
          for (const field of requiredFields) {
            if (!tableBody[field.name]) {
              return new Response(
                JSON.stringify({
                  success: false,
                  error: { code: 'VALIDATION_ERROR', message: `Field '${field.name}' is required` }
                }),
                { 
                  status: 400, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                }
              )
            }
          }

          const mockRecord = {
            id: `mock-${Date.now()}`,
            ...tableBody,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }

          return new Response(
            JSON.stringify({ success: true, data: mockRecord }),
            { 
              status: 201, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )

        default:
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
            }),
            { 
              status: 405, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
      }
    }

    // Default 404 for unknown endpoints
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'ENDPOINT_NOT_FOUND', message: 'Endpoint not found' }
      }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' }
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})