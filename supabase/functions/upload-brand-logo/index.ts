
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('logo')
    const materialId = formData.get('materialId')

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file uploaded' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate file type
    const fileType = file.name.split('.').pop()?.toLowerCase()
    if (!['png', 'jpg', 'jpeg', 'svg'].includes(fileType)) {
      return new Response(
        JSON.stringify({ error: 'Invalid file type. Only PNG, JPG, JPEG, and SVG files are allowed.' }),
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

    const fileName = `${userId}/logos/logo_${crypto.randomUUID()}.${fileType}`

    // Upload file to storage
    const { data: storageData, error: uploadError } = await supabase.storage
      .from('exports')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Failed to upload logo', details: uploadError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('exports')
      .getPublicUrl(fileName)

    if (materialId) {
      // Update the marketing material with the logo URL
      const { error: dbError } = await supabase
        .from('marketing_materials')
        .update({ brand_logo_url: publicUrl })
        .eq('id', materialId)

      if (dbError) {
        console.error('Database update error:', dbError)
        return new Response(
          JSON.stringify({ error: 'Failed to update material with logo', details: dbError }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'Logo uploaded successfully',
        url: publicUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
