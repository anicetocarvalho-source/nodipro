import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestUser {
  email: string;
  password: string;
  fullName: string;
  role: "admin" | "manager" | "member";
}

const testUsers: TestUser[] = [
  {
    email: "admin@nodipro.com",
    password: "Admin123!",
    fullName: "Administrador Sistema",
    role: "admin",
  },
  {
    email: "manager@nodipro.com",
    password: "Manager123!",
    fullName: "Gestor de Projectos",
    role: "manager",
  },
  {
    email: "member@nodipro.com",
    password: "Member123!",
    fullName: "Membro da Equipa",
    role: "member",
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const results: { email: string; status: string; error?: string }[] = [];

    for (const user of testUsers) {
      // Check if user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find((u) => u.email === user.email);

      if (existingUser) {
        // Update role if user exists
        await supabaseAdmin
          .from("user_roles")
          .update({ role: user.role })
          .eq("user_id", existingUser.id);

        results.push({
          email: user.email,
          status: "already_exists",
        });
        continue;
      }

      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.fullName,
        },
      });

      if (createError) {
        results.push({
          email: user.email,
          status: "error",
          error: createError.message,
        });
        continue;
      }

      if (newUser?.user) {
        // Update role (the trigger creates a default 'member' role)
        if (user.role !== "member") {
          await supabaseAdmin
            .from("user_roles")
            .update({ role: user.role })
            .eq("user_id", newUser.user.id);
        }

        results.push({
          email: user.email,
          status: "created",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Test users seeded successfully",
        users: results,
        credentials: testUsers.map((u) => ({
          email: u.email,
          password: u.password,
          role: u.role,
        })),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error seeding test users:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
