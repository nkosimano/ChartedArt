// @ts-ignore: Unreachable code error
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get and validate request body
    const { messageId, replyContent } = await req.json();

    if (!messageId || !replyContent) {
      throw new Error('messageId and replyContent are required');
    }

    // Get the message details
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .single();

    if (messageError) {
      throw new Error('Failed to fetch message details');
    }

    if (!message) {
      throw new Error('Message not found');
    }

    if (!message.email) {
      throw new Error('Message has no associated email address');
    }

    // Update message status first
    const { error: updateError } = await supabase
      .from('messages')
      .update({
        status: 'replied',
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (updateError) {
      throw new Error('Failed to update message status');
    }

    // Send email using Supabase's built-in email service
    const { error: emailError } = await supabase.auth.admin.sendRawEmail({
      to: message.email,
      from: {
        email: 'support@chartedart.co.za',
        name: 'ChartedArt Support'
      },
      subject: 'Re: Your Message to ChartedArt Support',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h2 style="color: #4A794A; margin-top: 0;">Response to Your Message</h2>
              <div style="margin: 20px 0;">
                ${replyContent.replace(/\n/g, '<br/>')}
              </div>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
              <p style="color: #666; font-size: 0.9em; margin-bottom: 0;">
                This is a response to your message sent to ChartedArt Support.
                Please do not reply to this email.
              </p>
            </div>
          </body>
        </html>
      `,
      text: replyContent // Plain text fallback
    });

    if (emailError) {
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('Error:', error);
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unexpected error occurred'
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 400
      }
    );
  }
});