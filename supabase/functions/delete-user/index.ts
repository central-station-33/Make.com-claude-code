
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse the request body
    const { userId } = await req.json()
    console.log('Attempting to delete user:', userId)

    if (!userId) {
      console.error('No userId provided')
      throw new Error('userId is required')
    }

    // First, verify the user exists in auth.users
    const { data: user, error: userError } = await supabaseClient.auth.admin.getUserById(
      userId
    )

    if (userError || !user) {
      console.error('Error loading user:', userError)
      throw new Error('User not found')
    }

    // Get user role before deletion to check permissions
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single()

    if (roleError) {
      console.error('Error checking user role:', roleError)
      throw new Error('Failed to verify user role')
    }

    // First clean up user data using the database function
    console.log('Cleaning up user data...')
    const { error: dbError } = await supabaseClient.rpc('delete_user_data', {
      input_user_id: userId
    })

    if (dbError) {
      console.error('Error cleaning up user data:', dbError)
      throw new Error('Failed to clean up user data: ' + dbError.message)
    }
    console.log('User data cleaned up successfully')

    // Now delete the user from auth
    console.log('Deleting user from auth system...')
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(
      userId
    )

    if (deleteError) {
      console.error('Error deleting user from auth:', deleteError)
      throw deleteError
    }

    console.log('User deleted successfully:', userId)

    // Log successful deletion
    await supabaseClient.from('system_logs').insert({
      action: 'user_deleted',
      details: `User ${userId} deleted successfully`,
      type: 'system'
    })

    return new Response(
      JSON.stringify({ message: 'User deleted successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Function error:', error.message)
    
    // Log the error
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    
    await supabaseClient.from('system_logs').insert({
      action: 'user_deletion_error',
      details: error.message,
      type: 'error'
    })

    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred while deleting the user'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
