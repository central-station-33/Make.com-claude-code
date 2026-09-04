
import { createClient } from 'npm:@supabase/supabase-js@2'
import { S3Client, PutObjectCommand } from "npm:@aws-sdk/client-s3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase admin client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Initialize S3 client
    const s3Client = new S3Client({
      region: "us-east-1",
      credentials: {
        accessKeyId: Deno.env.get('S3_KEY') ?? '',
        secretAccessKey: Deno.env.get('S3_SECRET_KEY') ?? ''
      }
    });

    // Get the raw token from Authorization header
    const token = req.headers.get('Authorization');
    if (!token) {
      throw new Error('Missing authorization header');
    }

    // Verify the user's token
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      console.error('Authentication error:', authError);
      throw new Error('Invalid authentication');
    }

    console.log('Successfully authenticated user:', user.id);

    // Parse request body
    const { tableName, column, whereClause = {}, destinationPath } = await req.json();
    
    // Add user_id filter to ensure data ownership
    const finalWhereClause = {
      ...whereClause,
      user_id: user.id
    };

    // Fetch data from the database
    const { data: dbData, error: dbError } = await supabaseClient
      .from(tableName)
      .select(column)
      .match(finalWhereClause);

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    if (!dbData || dbData.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No data found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Prepare data for storage
    const dataString = JSON.stringify(dbData, null, 2);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(dataString);

    // Generate a unique file path
    const fileName = `exports/${user.id}/${destinationPath || ''}/${Date.now()}_export.json`;

    // Upload to S3
    try {
      const command = new PutObjectCommand({
        Bucket: "leads",  // Using "leads" as the bucket name
        Key: fileName,
        Body: dataBuffer,
        ContentType: "application/json"
      });

      await s3Client.send(command);

      // Generate the S3 URL
      const s3Url = `https://leads.s3.amazonaws.com/${fileName}`;

      return new Response(
        JSON.stringify({
          message: 'Data successfully exported to S3',
          fileName,
          url: s3Url
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );

    } catch (s3Error) {
      console.error('S3 upload error:', s3Error);
      throw s3Error;
    }

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
