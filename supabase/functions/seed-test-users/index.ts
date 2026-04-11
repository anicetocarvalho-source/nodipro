import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestUser {
  email: string;
  password: string;
  fullName: string;
  systemRole: "admin" | "manager" | "member";
  orgRole: "owner" | "admin" | "manager" | "member";
  isPlatformAdmin: boolean;
}

const SHARED_ORG_NAME = "Ministério das Infraestruturas de Angola";
const SHARED_ORG_SLUG = "ministerio-das-infraestruturas-de-angola";
const SHARED_ORG_ENTITY_TYPE = "public";

const testUsers: TestUser[] = [
  {
    email: "superadmin@nodipro.com",
    password: "SuperAdmin123!",
    fullName: "Super Administrador",
    systemRole: "admin",
    orgRole: "admin",
    isPlatformAdmin: true,
  },
  {
    email: "admin@nodipro.com",
    password: "Admin123!",
    fullName: "Administrador Sistema",
    systemRole: "admin",
    orgRole: "owner",
    isPlatformAdmin: false,
  },
  {
    email: "manager@nodipro.com",
    password: "Manager123!",
    fullName: "Gestor de Projectos",
    systemRole: "manager",
    orgRole: "manager",
    isPlatformAdmin: false,
  },
  {
    email: "member@nodipro.com",
    password: "Member123!",
    fullName: "Membro da Equipa",
    systemRole: "member",
    orgRole: "member",
    isPlatformAdmin: false,
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

    // ── Step 1: Ensure shared organization exists ──
    let { data: sharedOrg } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .eq("name", SHARED_ORG_NAME)
      .single();

    if (!sharedOrg) {
      const { data: newOrg, error: orgErr } = await supabaseAdmin
        .from("organizations")
        .insert({
          name: SHARED_ORG_NAME,
          slug: `${SHARED_ORG_SLUG}-${Date.now().toString(36)}`,
          entity_type: SHARED_ORG_ENTITY_TYPE,
          size: "large",
          country: "Angola",
          onboarding_completed: true,
          onboarding_step: 5,
        })
        .select("id")
        .single();

      if (orgErr) throw new Error(`Failed to create shared org: ${orgErr.message}`);
      sharedOrg = newOrg;
    }

    const sharedOrgId = sharedOrg!.id;

    // ── Step 2: Ensure trial subscription exists ──
    const { data: existingSub } = await supabaseAdmin
      .from("organization_subscriptions")
      .select("id")
      .eq("organization_id", sharedOrgId)
      .limit(1)
      .single();

    if (!existingSub) {
      // Get a plan (prefer free/starter)
      const { data: plans } = await supabaseAdmin
        .from("subscription_plans")
        .select("id")
        .order("price_monthly", { ascending: true })
        .limit(1);

      if (plans && plans.length > 0) {
        await supabaseAdmin.from("organization_subscriptions").insert({
          organization_id: sharedOrgId,
          plan_id: plans[0].id,
          status: "trial",
          trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
    }

    // ── Step 3: Create/update users ──
    const results: { email: string; status: string; error?: string }[] = [];
    const userIds: { email: string; userId: string; user: TestUser }[] = [];

    for (const user of testUsers) {
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find((u) => u.email === user.email);

      if (existingUser) {
        userIds.push({ email: user.email, userId: existingUser.id, user });

        // Update system role
        await supabaseAdmin
          .from("user_roles")
          .update({ role: user.systemRole })
          .eq("user_id", existingUser.id);

        results.push({ email: user.email, status: "already_exists" });
      } else {
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { full_name: user.fullName },
        });

        if (createError) {
          results.push({ email: user.email, status: "error", error: createError.message });
          continue;
        }

        if (newUser?.user) {
          userIds.push({ email: user.email, userId: newUser.user.id, user });

          if (user.systemRole !== "member") {
            await supabaseAdmin
              .from("user_roles")
              .update({ role: user.systemRole })
              .eq("user_id", newUser.user.id);
          }

          results.push({ email: user.email, status: "created" });
        }
      }
    }

    // ── Step 4: Consolidate all users into shared org ──
    for (const { userId, user } of userIds) {
      // Remove memberships from any OTHER organizations
      await supabaseAdmin
        .from("organization_members")
        .delete()
        .eq("user_id", userId)
        .neq("organization_id", sharedOrgId);

      // Check if membership in shared org exists
      const { data: existingMember } = await supabaseAdmin
        .from("organization_members")
        .select("id")
        .eq("user_id", userId)
        .eq("organization_id", sharedOrgId)
        .single();

      if (existingMember) {
        // Update role and set as primary
        await supabaseAdmin
          .from("organization_members")
          .update({ role: user.orgRole, is_primary: true })
          .eq("id", existingMember.id);
      } else {
        // Create membership
        await supabaseAdmin.from("organization_members").insert({
          organization_id: sharedOrgId,
          user_id: userId,
          role: user.orgRole,
          is_primary: true,
        });
      }

      // Handle platform_admins
      if (user.isPlatformAdmin) {
        await supabaseAdmin
          .from("platform_admins")
          .upsert({ user_id: userId }, { onConflict: "user_id" });
      }
    }

    // ── Step 5: Delete orphaned organizations (no members left) ──
    const { data: orphanedOrgs } = await supabaseAdmin
      .from("organizations")
      .select("id")
      .neq("id", sharedOrgId);

    if (orphanedOrgs) {
      for (const org of orphanedOrgs) {
        const { data: members } = await supabaseAdmin
          .from("organization_members")
          .select("id")
          .eq("organization_id", org.id)
          .limit(1);

        if (!members || members.length === 0) {
          // Clean up related data first
          await supabaseAdmin.from("organization_subscriptions").delete().eq("organization_id", org.id);
          await supabaseAdmin.from("portfolios").delete().eq("organization_id", org.id);
          await supabaseAdmin.from("organizations").delete().eq("id", org.id);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Test users seeded and consolidated into shared organization",
        sharedOrganization: { id: sharedOrgId, name: SHARED_ORG_NAME },
        users: results,
        credentials: testUsers.map((u) => ({
          email: u.email,
          password: u.password,
          systemRole: u.systemRole,
          orgRole: u.orgRole,
          isPlatformAdmin: u.isPlatformAdmin,
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
      JSON.stringify({ success: false, error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
