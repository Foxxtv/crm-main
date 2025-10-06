import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
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
    const tableName = pathParts[pathParts.length - 2] // /functions/v1/tables/[tableName]
    const recordId = pathParts[pathParts.length - 1] // /functions/v1/tables/[tableName]/[id]

    if (!tableName || tableName === 'tables') {
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

    // Verify the table exists and belongs to the user
    const { data: tableInfo, error: tableError } = await supabaseClient
      .from('custom_tables')
      .select('*')
      .eq('user_id', user.id)
      .eq('name', tableName)
      .single()

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

    switch (req.method) {
      case 'GET':
        if (recordId && recordId !== tableName) {
          // Get specific record - Mock response for now
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'NOT_FOUND', message: 'Record not found' }
            }),
            { 
              status: 404, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        } else {
          // Get all records with pagination
          const limit = parseInt(url.searchParams.get('limit') || '50')
          const offset = parseInt(url.searchParams.get('offset') || '0')

          // Mock response - In production, you would query the dynamic table
          const mockData = {
            records: [],
            total: 0,
            limit,
            offset,
            table: tableName,
            schema: tableInfo.schema
          }

          return new Response(
            JSON.stringify({ success: true, data: mockData }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

      case 'POST':
        const body = await req.json()

        // Validate required fields based on schema
        const requiredFields = tableInfo.schema.fields?.filter((field: any) => field.required) || []
        
        for (const field of requiredFields) {
          if (!body[field.name]) {
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

        // Mock response - In production, you would insert into the dynamic table
        const mockRecord = {
          id: `mock-${Date.now()}`,
          ...body,
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

      case 'PUT':
        if (!recordId || recordId === tableName) {
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'MISSING_ID', message: 'Record ID required for update' }
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        const updateBody = await req.json()

        // Mock response - In production, you would update the specific record
        const mockUpdatedRecord = {
          id: recordId,
          ...updateBody,
          updated_at: new Date().toISOString()
        }

        return new Response(
          JSON.stringify({ success: true, data: mockUpdatedRecord }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      case 'DELETE':
        if (!recordId || recordId === tableName) {
          return new Response(
            JSON.stringify({
              success: false,
              error: { code: 'MISSING_ID', message: 'Record ID required for deletion' }
            }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          )
        }

        // Mock response - In production, you would delete the specific record
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: { message: 'Record deleted successfully' } 
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