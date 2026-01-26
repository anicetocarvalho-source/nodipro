import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get existing sectors
    const { data: sectors } = await supabase.from("sectors").select("id, name");
    const sectorMap = new Map(sectors?.map(s => [s.name, s.id]) || []);

    // Get existing provinces
    const { data: provinces } = await supabase.from("provinces").select("id, name");
    const provinceMap = new Map(provinces?.map(p => [p.name, p.id]) || []);

    // Get existing funders
    const { data: funders } = await supabase.from("funders").select("id, name");
    const funderMap = new Map(funders?.map(f => [f.name, f.id]) || []);

    // Create demo portfolio
    const { data: portfolio, error: portfolioError } = await supabase
      .from("portfolios")
      .insert({
        name: "Portfólio de Desenvolvimento Nacional 2024-2026",
        description: "Portfólio principal contendo todos os programas estratégicos de desenvolvimento nacional",
        status: "active",
      })
      .select()
      .single();

    if (portfolioError) throw portfolioError;

    // Create demo programs
    const programsData = [
      {
        name: "Programa de Modernização Digital",
        description: "Iniciativa de transformação digital dos serviços públicos",
        portfolio_id: portfolio.id,
        status: "active",
        sector: "Tecnologia",
        start_date: "2024-01-01",
        end_date: "2026-12-31",
      },
      {
        name: "Programa de Infraestruturas Críticas",
        description: "Desenvolvimento e manutenção de infraestruturas essenciais",
        portfolio_id: portfolio.id,
        status: "active",
        sector: "Infraestrutura",
        start_date: "2024-03-01",
        end_date: "2026-06-30",
      },
      {
        name: "Programa de Capacitação Social",
        description: "Iniciativas de educação e formação profissional",
        portfolio_id: portfolio.id,
        status: "active",
        sector: "Educação",
        start_date: "2024-02-01",
        end_date: "2025-12-31",
      },
    ];

    const { data: programs, error: programsError } = await supabase
      .from("programs")
      .insert(programsData)
      .select();

    if (programsError) throw programsError;

    // Create demo projects
    const projectsData = [
      {
        name: "Sistema de Gestão Financeira Integrado",
        description: "Plataforma unificada para gestão de finanças públicas com módulos de orçamento, contabilidade e relatórios",
        client: "Ministério das Finanças",
        status: "active" as const,
        progress: 65,
        budget: 2500000,
        spent: 1625000,
        start_date: "2024-01-15",
        end_date: "2025-06-30",
        program_id: programs[0].id,
        sector_id: sectorMap.get("Tecnologia") || null,
        province_id: provinceMap.get("Luanda") || null,
      },
      {
        name: "Portal de Serviços ao Cidadão",
        description: "Portal online para acesso a serviços públicos digitais, incluindo certidões, pagamentos e agendamentos",
        client: "Governo Provincial de Luanda",
        status: "delayed" as const,
        progress: 35,
        budget: 1800000,
        spent: 900000,
        start_date: "2024-02-01",
        end_date: "2025-03-31",
        program_id: programs[0].id,
        sector_id: sectorMap.get("Tecnologia") || null,
        province_id: provinceMap.get("Luanda") || null,
      },
      {
        name: "Aplicação Mobile Bancária",
        description: "App móvel para serviços bancários com pagamentos, transferências e gestão de contas",
        client: "Banco Nacional de Angola",
        status: "active" as const,
        progress: 80,
        budget: 3200000,
        spent: 2560000,
        start_date: "2024-03-01",
        end_date: "2025-02-28",
        program_id: programs[0].id,
        sector_id: sectorMap.get("Tecnologia") || null,
        province_id: provinceMap.get("Luanda") || null,
      },
      {
        name: "Reabilitação da Rede Viária Provincial",
        description: "Projecto de reabilitação de 500km de estradas provinciais prioritárias",
        client: "Ministério das Obras Públicas",
        status: "active" as const,
        progress: 45,
        budget: 15000000,
        spent: 6750000,
        start_date: "2024-04-01",
        end_date: "2026-03-31",
        program_id: programs[1].id,
        sector_id: sectorMap.get("Infraestrutura") || null,
        province_id: provinceMap.get("Benguela") || null,
      },
      {
        name: "Centro de Formação Profissional",
        description: "Construção e equipamento de centro de formação técnica com capacidade para 2000 formandos",
        client: "Instituto Nacional de Emprego",
        status: "on_hold" as const,
        progress: 20,
        budget: 8500000,
        spent: 1700000,
        start_date: "2024-05-01",
        end_date: "2025-12-31",
        program_id: programs[2].id,
        sector_id: sectorMap.get("Educação") || null,
        province_id: provinceMap.get("Huíla") || null,
      },
      {
        name: "Sistema de Gestão Hospitalar",
        description: "Implementação de sistema integrado de gestão para rede hospitalar pública",
        client: "Ministério da Saúde",
        status: "active" as const,
        progress: 55,
        budget: 4200000,
        spent: 2310000,
        start_date: "2024-02-15",
        end_date: "2025-08-31",
        program_id: programs[0].id,
        sector_id: sectorMap.get("Saúde") || null,
        province_id: provinceMap.get("Luanda") || null,
      },
      {
        name: "Plataforma de E-Learning Nacional",
        description: "Sistema de ensino à distância para escolas secundárias e universidades",
        client: "Ministério da Educação",
        status: "completed" as const,
        progress: 100,
        budget: 2800000,
        spent: 2650000,
        start_date: "2023-06-01",
        end_date: "2024-12-15",
        program_id: programs[2].id,
        sector_id: sectorMap.get("Educação") || null,
        province_id: provinceMap.get("Luanda") || null,
      },
    ];

    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .insert(projectsData)
      .select();

    if (projectsError) throw projectsError;

    // Create team members for each project
    const teamMembersData = projects.flatMap(project => [
      {
        project_id: project.id,
        name: "João Martins",
        initials: "JM",
        role: "Gestor de Projecto",
      },
      {
        project_id: project.id,
        name: "Maria Santos",
        initials: "MS",
        role: "Analista Sénior",
      },
      {
        project_id: project.id,
        name: "Pedro Alves",
        initials: "PA",
        role: "Desenvolvedor",
      },
      {
        project_id: project.id,
        name: "Ana Costa",
        initials: "AC",
        role: "Designer UX",
      },
    ]);

    await supabase.from("team_members").insert(teamMembersData);

    // Create tasks for first 3 projects with dependencies
    const tasksToCreate = [];
    const projectTaskMap: Record<string, string[]> = {};

    for (let i = 0; i < 3; i++) {
      const project = projects[i];
      const baseDueDate = new Date();
      
      const projectTasks = [
        {
          project_id: project.id,
          title: "Análise de Requisitos",
          description: "Levantamento detalhado de requisitos funcionais e não-funcionais",
          priority: "high" as const,
          column_id: "done",
          position: 0,
          assignee_name: "Maria Santos",
          assignee_initials: "MS",
          due_date: new Date(baseDueDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          phase_name: "Planeamento",
          labels: ["documentação", "análise"],
        },
        {
          project_id: project.id,
          title: "Arquitectura do Sistema",
          description: "Definição da arquitectura técnica e padrões de desenvolvimento",
          priority: "high" as const,
          column_id: "done",
          position: 1,
          assignee_name: "João Martins",
          assignee_initials: "JM",
          due_date: new Date(baseDueDate.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          phase_name: "Planeamento",
          labels: ["arquitectura", "técnico"],
        },
        {
          project_id: project.id,
          title: "Design de Interface",
          description: "Criação de wireframes e protótipos de alta fidelidade",
          priority: "medium" as const,
          column_id: "done",
          position: 2,
          assignee_name: "Ana Costa",
          assignee_initials: "AC",
          due_date: new Date(baseDueDate.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          phase_name: "Design",
          labels: ["design", "UX"],
        },
        {
          project_id: project.id,
          title: "Desenvolvimento do Backend",
          description: "Implementação da API e lógica de negócio",
          priority: "high" as const,
          column_id: "in_progress",
          position: 0,
          assignee_name: "Pedro Alves",
          assignee_initials: "PA",
          due_date: new Date(baseDueDate.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          phase_name: "Desenvolvimento",
          labels: ["backend", "API"],
        },
        {
          project_id: project.id,
          title: "Desenvolvimento do Frontend",
          description: "Implementação da interface de utilizador",
          priority: "high" as const,
          column_id: "in_progress",
          position: 1,
          assignee_name: "Ana Costa",
          assignee_initials: "AC",
          due_date: new Date(baseDueDate.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          phase_name: "Desenvolvimento",
          labels: ["frontend", "React"],
        },
        {
          project_id: project.id,
          title: "Integração de Sistemas",
          description: "Integração com sistemas externos e APIs de terceiros",
          priority: "medium" as const,
          column_id: "todo",
          position: 0,
          assignee_name: "Pedro Alves",
          assignee_initials: "PA",
          due_date: new Date(baseDueDate.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          phase_name: "Desenvolvimento",
          labels: ["integração", "API"],
        },
        {
          project_id: project.id,
          title: "Testes de Qualidade",
          description: "Execução de testes unitários, integração e aceitação",
          priority: "high" as const,
          column_id: "todo",
          position: 1,
          assignee_name: "Maria Santos",
          assignee_initials: "MS",
          due_date: new Date(baseDueDate.getTime() + 35 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          phase_name: "Testes",
          labels: ["QA", "testes"],
        },
        {
          project_id: project.id,
          title: "Documentação Técnica",
          description: "Elaboração de documentação técnica e manual de utilizador",
          priority: "low" as const,
          column_id: "todo",
          position: 2,
          assignee_name: "João Martins",
          assignee_initials: "JM",
          due_date: new Date(baseDueDate.getTime() + 40 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          phase_name: "Documentação",
          labels: ["documentação"],
        },
        {
          project_id: project.id,
          title: "Formação de Utilizadores",
          description: "Preparação e execução de sessões de formação",
          priority: "medium" as const,
          column_id: "todo",
          position: 3,
          assignee_name: "Maria Santos",
          assignee_initials: "MS",
          due_date: new Date(baseDueDate.getTime() + 50 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          phase_name: "Implementação",
          labels: ["formação"],
        },
        {
          project_id: project.id,
          title: "Deploy em Produção",
          description: "Implementação em ambiente de produção e go-live",
          priority: "high" as const,
          column_id: "todo",
          position: 4,
          assignee_name: "Pedro Alves",
          assignee_initials: "PA",
          due_date: new Date(baseDueDate.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          phase_name: "Implementação",
          labels: ["deploy", "produção"],
        },
      ];

      tasksToCreate.push(...projectTasks);
    }

    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .insert(tasksToCreate)
      .select();

    if (tasksError) throw tasksError;

    // Group tasks by project
    for (const task of tasks) {
      if (!projectTaskMap[task.project_id]) {
        projectTaskMap[task.project_id] = [];
      }
      projectTaskMap[task.project_id].push(task.id);
    }

    // Create dependencies for each project's tasks
    const dependencies = [];
    for (const projectId of Object.keys(projectTaskMap)) {
      const taskIds = projectTaskMap[projectId];
      if (taskIds.length >= 10) {
        // Análise -> Arquitectura (FS)
        dependencies.push({
          task_id: taskIds[1],
          predecessor_id: taskIds[0],
          dependency_type: "FS",
          lag_days: 0,
        });
        // Arquitectura -> Design (FS)
        dependencies.push({
          task_id: taskIds[2],
          predecessor_id: taskIds[1],
          dependency_type: "FS",
          lag_days: 0,
        });
        // Design -> Backend (FS)
        dependencies.push({
          task_id: taskIds[3],
          predecessor_id: taskIds[2],
          dependency_type: "FS",
          lag_days: 0,
        });
        // Design -> Frontend (FS)
        dependencies.push({
          task_id: taskIds[4],
          predecessor_id: taskIds[2],
          dependency_type: "FS",
          lag_days: 0,
        });
        // Backend + Frontend -> Integração (FS)
        dependencies.push({
          task_id: taskIds[5],
          predecessor_id: taskIds[3],
          dependency_type: "FS",
          lag_days: 0,
        });
        dependencies.push({
          task_id: taskIds[5],
          predecessor_id: taskIds[4],
          dependency_type: "FS",
          lag_days: 0,
        });
        // Integração -> Testes (FS)
        dependencies.push({
          task_id: taskIds[6],
          predecessor_id: taskIds[5],
          dependency_type: "FS",
          lag_days: 2,
        });
        // Backend -> Documentação (SS - pode começar junto)
        dependencies.push({
          task_id: taskIds[7],
          predecessor_id: taskIds[3],
          dependency_type: "SS",
          lag_days: 5,
        });
        // Testes -> Formação (FS)
        dependencies.push({
          task_id: taskIds[8],
          predecessor_id: taskIds[6],
          dependency_type: "FS",
          lag_days: 0,
        });
        // Testes + Documentação -> Deploy (FS)
        dependencies.push({
          task_id: taskIds[9],
          predecessor_id: taskIds[6],
          dependency_type: "FS",
          lag_days: 0,
        });
        dependencies.push({
          task_id: taskIds[9],
          predecessor_id: taskIds[7],
          dependency_type: "FF",
          lag_days: 0,
        });
      }
    }

    await supabase.from("task_dependencies").insert(dependencies);

    // Create subtasks for some tasks
    const subtasksData = tasks.slice(0, 5).flatMap((task, index) => [
      {
        task_id: task.id,
        title: `Subtarefa 1 de ${task.title.substring(0, 20)}...`,
        completed: index < 3,
        position: 0,
      },
      {
        task_id: task.id,
        title: `Subtarefa 2 de ${task.title.substring(0, 20)}...`,
        completed: index < 2,
        position: 1,
      },
      {
        task_id: task.id,
        title: `Subtarefa 3 de ${task.title.substring(0, 20)}...`,
        completed: index < 1,
        position: 2,
      },
    ]);

    await supabase.from("subtasks").insert(subtasksData);

    // Create budget entries for projects
    const budgetEntries = projects.slice(0, 4).flatMap(project => [
      {
        project_id: project.id,
        description: "Consultoria técnica",
        planned_amount: 250000,
        actual_amount: 245000,
        phase_name: "Planeamento",
        status: "approved",
        entry_date: "2024-02-01",
      },
      {
        project_id: project.id,
        description: "Desenvolvimento de software",
        planned_amount: 800000,
        actual_amount: 750000,
        phase_name: "Desenvolvimento",
        status: "approved",
        entry_date: "2024-04-15",
      },
      {
        project_id: project.id,
        description: "Equipamentos e licenças",
        planned_amount: 150000,
        actual_amount: 165000,
        phase_name: "Implementação",
        status: "pending",
        entry_date: "2024-06-01",
      },
      {
        project_id: project.id,
        description: "Formação e capacitação",
        planned_amount: 80000,
        actual_amount: 0,
        phase_name: "Implementação",
        status: "pending",
        entry_date: "2024-08-01",
      },
    ]);

    await supabase.from("budget_entries").insert(budgetEntries);

    // Create documents for projects
    const documentsData = projects.slice(0, 4).flatMap(project => [
      {
        project_id: project.id,
        title: "Proposta Técnica e Comercial",
        description: "Documento de proposta inicial do projecto",
        document_type: "proposal",
        status: "approved",
        phase_name: "Planeamento",
      },
      {
        project_id: project.id,
        title: "Especificação de Requisitos",
        description: "Documento detalhado de requisitos funcionais",
        document_type: "specification",
        status: "approved",
        phase_name: "Planeamento",
      },
      {
        project_id: project.id,
        title: "Arquitectura de Sistema",
        description: "Documento de arquitectura técnica",
        document_type: "technical",
        status: "review",
        phase_name: "Design",
      },
      {
        project_id: project.id,
        title: "Relatório de Progresso Mensal",
        description: "Relatório de acompanhamento do mês actual",
        document_type: "report",
        status: "draft",
        phase_name: "Desenvolvimento",
      },
    ]);

    await supabase.from("documents").insert(documentsData);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Dados demo criados com sucesso!",
        data: {
          portfolios: 1,
          programs: programs.length,
          projects: projects.length,
          tasks: tasks.length,
          dependencies: dependencies.length,
          teamMembers: teamMembersData.length,
          budgetEntries: budgetEntries.length,
          documents: documentsData.length,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error seeding demo data:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
