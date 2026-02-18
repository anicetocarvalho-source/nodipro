import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function fetchPlatformContext(supabase: any) {
  const [projects, tasks, documents, sprints, budgetSummary] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id, name, status, client, start_date, end_date, budget, spent, progress")
        .limit(50),
      supabase
        .from("tasks")
        .select("id, title, column_id, priority, assignee_name, due_date, project_id")
        .limit(100),
      supabase
        .from("documents")
        .select("id, title, document_type, status, project_id")
        .limit(50),
      supabase
        .from("sprints")
        .select("id, name, status, start_date, end_date, project_id")
        .limit(20),
      supabase
        .from("budget_entries")
        .select("id, description, planned_amount, actual_amount, status, project_id")
        .limit(50),
    ]);

  return {
    projects: projects.data || [],
    tasks: tasks.data || [],
    documents: documents.data || [],
    sprints: sprints.data || [],
    budget_entries: budgetSummary.data || [],
  };
}

function buildSystemPrompt(context: any) {
  const projectsSummary = context.projects
    .map(
      (p: any) =>
        `- "${p.name}" (${p.status}) | Cliente: ${p.client || "N/A"} | Progresso: ${p.progress ?? 0}% | Orçamento: ${p.budget ?? 0} / Gasto: ${p.spent ?? 0}`
    )
    .join("\n");

  const tasksByStatus: Record<string, number> = {};
  context.tasks.forEach((t: any) => {
    tasksByStatus[t.column_id] = (tasksByStatus[t.column_id] || 0) + 1;
  });
  const tasksSummary = Object.entries(tasksByStatus)
    .map(([status, count]) => `  ${status}: ${count}`)
    .join("\n");

  const urgentTasks = context.tasks
    .filter((t: any) => t.priority === "high" || t.priority === "urgent")
    .slice(0, 10)
    .map(
      (t: any) =>
        `- "${t.title}" (${t.priority}) → ${t.assignee_name || "Sem responsável"} | Prazo: ${t.due_date || "N/A"}`
    )
    .join("\n");

  const docsSummary = context.documents
    .slice(0, 15)
    .map((d: any) => `- "${d.title}" (${d.document_type}, ${d.status})`)
    .join("\n");

  const sprintsSummary = context.sprints
    .map(
      (s: any) =>
        `- "${s.name}" (${s.status}) | ${s.start_date} → ${s.end_date}`
    )
    .join("\n");

  return `Você é o NódiBot, o assistente inteligente da plataforma NódiPro — uma plataforma de gestão de projectos.
Responda SEMPRE em Português de Portugal. Seja conciso, profissional e útil.

DADOS ACTUAIS DA PLATAFORMA:

📁 PROJECTOS (${context.projects.length}):
${projectsSummary || "Nenhum projecto encontrado."}

📋 TAREFAS (${context.tasks.length} total):
${tasksSummary}

⚠️ TAREFAS URGENTES/ALTA PRIORIDADE:
${urgentTasks || "Nenhuma tarefa urgente."}

📄 DOCUMENTOS (${context.documents.length}):
${docsSummary || "Nenhum documento encontrado."}

🏃 SPRINTS (${context.sprints.length}):
${sprintsSummary || "Nenhum sprint encontrado."}

💰 ENTRADAS ORÇAMENTAIS: ${context.budget_entries.length} registos

INSTRUÇÕES:
- Responda com base nos dados reais acima.
- Use formatação Markdown para organizar as respostas.
- Quando o utilizador perguntar sobre projectos, tarefas, orçamentos, etc., consulte os dados acima.
- Se não encontrar informação específica, diga que não tem dados disponíveis e sugira verificar na secção correspondente da plataforma.
- Pode sugerir acções e navegar o utilizador para as secções relevantes.
- Nunca invente dados que não estejam listados acima.
- Seja amigável mas profissional.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Create supabase client with user's auth token
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { headers: { Authorization: authHeader || "" } },
      }
    );

    // Fetch platform data with user's RLS context
    const context = await fetchPlatformContext(supabase);
    const systemPrompt = buildSystemPrompt(context);

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de pedidos excedido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA insuficientes." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Erro no serviço de IA." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chatbot error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
