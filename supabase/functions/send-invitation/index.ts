import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  role: "admin" | "manager" | "member";
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  manager: "Gestor",
  member: "Membro",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY não está configurada");
    }

    const resend = new Resend(resendApiKey);

    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Autorização necessária" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's token
    const supabaseUser = createClient(supabaseUrl, supabaseServiceRoleKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Check if user is admin
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem enviar convites" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { email, role }: InvitationRequest = await req.json();

    if (!email || !role) {
      return new Response(
        JSON.stringify({ error: "Email e role são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUsers?.users?.some((u) => u.email === email);

    if (userExists) {
      return new Response(
        JSON.stringify({ error: "Este email já está registado no sistema" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if there's already a pending invitation
    const { data: existingInvitation } = await supabaseAdmin
      .from("invitations")
      .select("*")
      .eq("email", email)
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (existingInvitation) {
      return new Response(
        JSON.stringify({ error: "Já existe um convite pendente para este email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create invitation
    const { data: invitation, error: insertError } = await supabaseAdmin
      .from("invitations")
      .insert({
        email,
        role,
        invited_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating invitation:", insertError);
      throw new Error("Erro ao criar convite");
    }

    // Get inviter's profile for the email
    const { data: inviterProfile } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .single();

    const inviterName = inviterProfile?.full_name || "Um administrador";
    const appUrl = req.headers.get("origin") || "https://your-app.com";
    const signupUrl = `${appUrl}/auth?email=${encodeURIComponent(email)}`;

    // Send invitation email
    const { error: emailError } = await resend.emails.send({
      from: "ProjectHub <onboarding@resend.dev>",
      to: [email],
      subject: "Convite para ProjectHub",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">ProjectHub</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1f2937; margin-top: 0;">Olá!</h2>
            <p style="color: #4b5563; font-size: 16px;">
              <strong>${inviterName}</strong> convidou-o para se juntar ao <strong>ProjectHub</strong> como <strong>${roleLabels[role]}</strong>.
            </p>
            <p style="color: #4b5563; font-size: 16px;">
              O ProjectHub é uma plataforma de gestão de projectos que permite colaborar de forma eficiente com a sua equipa.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${signupUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Aceitar Convite
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Este convite expira em 7 dias. Se não solicitou este convite, pode ignorar este email.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} ProjectHub. Todos os direitos reservados.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      // Delete the invitation if email fails
      await supabaseAdmin.from("invitations").delete().eq("id", invitation.id);
      throw new Error("Erro ao enviar email. Verifique se o domínio está validado no Resend.");
    }

    console.log(`Invitation sent successfully to ${email} with role ${role}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Convite enviado para ${email}`,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role,
          expires_at: invitation.expires_at,
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in send-invitation function:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro interno do servidor";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
