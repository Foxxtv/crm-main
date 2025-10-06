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

    // Get user from Authorization header
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
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
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

    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(part => part !== '')
    const prospectId = pathParts[pathParts.length - 1]
    const isSpecificProspect = prospectId && prospectId !== 'prospects'

    switch (req.method) {
      case 'GET':
        if (isSpecificProspect) {
          // Get specific prospect
          const { data, error } = await supabaseClient
            .from('prospects')
            .select('*')
            .eq('user_id', user.id)
            .eq('id', prospectId)
            .single()

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
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

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
          user_id: user.id
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
        if (!isSpecificProspect) {
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

        const { data: updatedProspect, error: updateError } = await supabaseClient
          .from('prospects')
          .update(updateData)
          .eq('user_id', user.id)
          .eq('id', prospectId)
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
        if (!isSpecificProspect) {
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

        const { error: deleteError } = await supabaseClient
          .from('prospects')
          .delete()
          .eq('user_id', user.id)
          .eq('id', prospectId)

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