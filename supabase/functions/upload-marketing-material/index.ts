
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string
    const type = formData.get('type') as string
    const is_premium = formData.get('is_premium') === 'true'

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file uploaded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate file type
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const allowedTypes = ['pdf', 'ppt', 'pptx', 'doc', 'docx']
    if (!fileExt || !allowedTypes.includes(fileExt)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user ID for path organization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) throw authError
    const userId = user?.id || 'system'

    // Generate unique filename
    const timestamp = new Date().getTime()
    const sanitizedFileName = `${timestamp}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = `${userId}/marketing/${sanitizedFileName}`

    // Upload file to storage
    const { data: storageData, error: storageError } = await supabase.storage
      .from('exports')
      .upload(filePath, file)

    if (storageError) {
      console.error('Storage error:', storageError)
      return new Response(
        JSON.stringify({ error: 'Failed to upload file' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('exports')
      .getPublicUrl(filePath)

    // Insert into database
    const { data: dbData, error: dbError } = await supabase
      .from('marketing_materials')
      .insert({
        title,
        description,
        category,
        type,
        is_premium,
        file_type: fileExt,
        file_url: publicUrl
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(
        JSON.stringify({ error: 'Failed to save material metadata' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ data: dbData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
