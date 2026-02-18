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

    // Create risks for projects
    const risksData = projects.slice(0, 4).flatMap(project => [
      {
        project_id: project.id,
        title: "Atraso na entrega de componentes",
        description: "Fornecedores podem não cumprir prazos de entrega de hardware/software",
        probability: "high",
        impact: "high",
        status: "active",
        category: "schedule",
        owner_name: "João Martins",
        mitigation: "Identificar fornecedores alternativos e negociar contratos com cláusulas de penalização",
        contingency: "Alocar equipa interna para desenvolvimento de soluções temporárias",
        trigger_conditions: "Atraso superior a 5 dias úteis na entrega",
      },
      {
        project_id: project.id,
        title: "Mudança de requisitos pelo cliente",
        description: "O cliente pode solicitar alterações significativas ao âmbito do projecto",
        probability: "medium",
        impact: "high",
        status: "active",
        category: "scope",
        owner_name: "Maria Santos",
        mitigation: "Realizar sessões frequentes de validação com stakeholders",
        contingency: "Processo formal de gestão de mudanças com avaliação de impacto",
        trigger_conditions: "Solicitação de mais de 3 alterações significativas num mês",
      },
      {
        project_id: project.id,
        title: "Rotatividade de pessoal técnico",
        description: "Risco de perda de membros-chave da equipa técnica",
        probability: "low",
        impact: "high",
        status: "monitoring",
        category: "resource",
        owner_name: "João Martins",
        mitigation: "Documentação detalhada e partilha de conhecimento entre equipa",
        contingency: "Base de dados de consultores externos pré-qualificados",
        trigger_conditions: "Saída de mais de 1 membro sénior da equipa",
      },
      {
        project_id: project.id,
        title: "Ultrapassagem do orçamento",
        description: "Custos reais podem exceder o orçamento planeado",
        probability: "medium",
        impact: "medium",
        status: "active",
        category: "cost",
        owner_name: "Maria Santos",
        mitigation: "Monitorização semanal de custos com alertas automáticos a 80%",
        contingency: "Reserva de contingência de 10% do orçamento total",
        trigger_conditions: "Desvio superior a 15% em qualquer categoria de custo",
      },
    ]);

    await supabase.from("risks").insert(risksData);

    // Create sprints for first 3 projects
    const today = new Date();
    const sprintsData = projects.slice(0, 3).flatMap(project => [
      {
        project_id: project.id,
        name: "Sprint 1 - Fundação",
        goal: "Configuração inicial do ambiente e implementação das funcionalidades base",
        start_date: new Date(today.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "completed",
        velocity: 34,
      },
      {
        project_id: project.id,
        name: "Sprint 2 - Funcionalidades Core",
        goal: "Desenvolvimento das funcionalidades principais do sistema",
        start_date: new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: today.toISOString().split('T')[0],
        status: "active",
        velocity: 28,
      },
      {
        project_id: project.id,
        name: "Sprint 3 - Integrações",
        goal: "Integração com sistemas externos e testes de aceitação",
        start_date: today.toISOString().split('T')[0],
        end_date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: "planning",
        velocity: 0,
      },
    ]);

    await supabase.from("sprints").insert(sprintsData);

    // Create stakeholders for projects
    const stakeholdersData = projects.slice(0, 4).flatMap(project => [
      {
        project_id: project.id,
        name: "Dr. António Fernandes",
        organization_name: "Ministério das Finanças",
        role: "Patrocinador Executivo",
        email: "a.fernandes@exemplo.gov.ao",
        phone: "+244 923 456 789",
        influence: 5,
        interest: 5,
        category: "internal",
        engagement_strategy: "Reuniões mensais de progresso e relatórios executivos",
        communication_frequency: "monthly",
        status: "active",
      },
      {
        project_id: project.id,
        name: "Eng. Carla Mendes",
        organization_name: "Direcção Nacional de TI",
        role: "Directora Técnica",
        email: "c.mendes@exemplo.gov.ao",
        phone: "+244 924 567 890",
        influence: 4,
        interest: 5,
        category: "internal",
        engagement_strategy: "Reuniões semanais técnicas e revisões de sprint",
        communication_frequency: "weekly",
        status: "active",
      },
      {
        project_id: project.id,
        name: "Prof. Manuel Silva",
        organization_name: "Universidade Agostinho Neto",
        role: "Consultor Académico",
        email: "m.silva@uan.ao",
        phone: "+244 925 678 901",
        influence: 2,
        interest: 3,
        category: "external",
        engagement_strategy: "Workshops trimestrais e revisão de documentação técnica",
        communication_frequency: "quarterly",
        status: "active",
      },
      {
        project_id: project.id,
        name: "Dra. Beatriz Neto",
        organization_name: "Banco Nacional de Angola",
        role: "Representante do Cliente",
        email: "b.neto@bna.ao",
        phone: "+244 926 789 012",
        influence: 4,
        interest: 4,
        category: "external",
        engagement_strategy: "Sessões de validação quinzenais e demos de funcionalidades",
        communication_frequency: "biweekly",
        status: "active",
      },
    ]);

    await supabase.from("stakeholders").insert(stakeholdersData);

    // ===== KPI Definitions & Measurements =====
    const kpiData = projects.slice(0, 4).flatMap(project => [
      { project_id: project.id, name: "Taxa de Conclusão de Tarefas", description: "Percentagem de tarefas concluídas vs planeadas", unit: "%", target_value: 95, direction: "up", frequency: "weekly", category: "performance", warning_threshold: 80, critical_threshold: 60, is_active: true },
      { project_id: project.id, name: "Variação de Custo (CV)", description: "Diferença entre custo planeado e real", unit: "USD", target_value: 0, direction: "up", frequency: "monthly", category: "financial", warning_threshold: -5, critical_threshold: -15, is_active: true },
      { project_id: project.id, name: "Satisfação do Cliente", description: "Índice de satisfação do cliente medido por inquéritos", unit: "pontos", target_value: 4.5, direction: "up", frequency: "quarterly", category: "quality", warning_threshold: 3.5, critical_threshold: 2.5, is_active: true },
      { project_id: project.id, name: "Velocidade da Equipa", description: "Story points completados por sprint", unit: "SP", target_value: 40, direction: "up", frequency: "biweekly", category: "performance", warning_threshold: 25, critical_threshold: 15, is_active: true },
    ]);

    const { data: kpis } = await supabase.from("kpi_definitions").insert(kpiData).select();

    // KPI measurements
    if (kpis && kpis.length > 0) {
      const measurementsData = kpis.flatMap(kpi => {
        const measurements = [];
        for (let i = 0; i < 6; i++) {
          const d = new Date(today.getTime() - i * 14 * 24 * 60 * 60 * 1000);
          const baseVal = kpi.target_value || 50;
          measurements.push({
            kpi_id: kpi.id,
            value: Math.round((baseVal * (0.6 + Math.random() * 0.5)) * 10) / 10,
            measured_at: d.toISOString(),
            notes: i === 0 ? "Última medição" : null,
          });
        }
        return measurements;
      });
      await supabase.from("kpi_measurements").insert(measurementsData);
    }

    // ===== LogFrame Levels & Indicators =====
    const logframeLevels: any[] = [];
    for (const project of projects.slice(0, 3)) {
      const goalData = { project_id: project.id, level_type: "goal", narrative: "Contribuir para a modernização e eficiência dos serviços públicos em Angola", means_of_verification: "Relatórios anuais de desempenho institucional", assumptions: "Estabilidade política e compromisso governamental contínuo", position: 0 };
      const { data: goal } = await supabase.from("logframe_levels").insert(goalData).select().single();
      if (!goal) continue;

      const purposeData = { project_id: project.id, parent_id: goal.id, level_type: "purpose", narrative: "Sistema implementado e operacional com adopção superior a 80% pelos utilizadores-alvo", means_of_verification: "Relatórios de utilização do sistema e inquéritos de satisfação", assumptions: "Utilizadores recebem formação adequada e têm acesso a infraestrutura tecnológica", position: 0 };
      const { data: purpose } = await supabase.from("logframe_levels").insert(purposeData).select().single();
      if (!purpose) continue;

      const outputsData = [
        { project_id: project.id, parent_id: purpose.id, level_type: "output", narrative: "Plataforma técnica desenvolvida e testada", means_of_verification: "Relatórios de testes e aceitação formal", assumptions: "Equipa técnica qualificada disponível", position: 0 },
        { project_id: project.id, parent_id: purpose.id, level_type: "output", narrative: "Capacidade institucional reforçada através de formação", means_of_verification: "Certificados de formação e avaliações de competências", assumptions: "Participantes disponíveis para formação", position: 1 },
      ];
      const { data: outputs } = await supabase.from("logframe_levels").insert(outputsData).select();
      if (!outputs) continue;

      const activitiesData = [
        { project_id: project.id, parent_id: outputs[0].id, level_type: "activity", narrative: "Análise de requisitos e design do sistema", means_of_verification: "Documento de requisitos aprovado", assumptions: "Stakeholders disponíveis para consulta", position: 0 },
        { project_id: project.id, parent_id: outputs[0].id, level_type: "activity", narrative: "Desenvolvimento e testes unitários", means_of_verification: "Relatórios de cobertura de testes", assumptions: "Ambiente de desenvolvimento operacional", position: 1 },
        { project_id: project.id, parent_id: outputs[1].id, level_type: "activity", narrative: "Elaboração de materiais de formação", means_of_verification: "Manuais e guias aprovados", assumptions: "Conteúdo técnico estabilizado", position: 0 },
        { project_id: project.id, parent_id: outputs[1].id, level_type: "activity", narrative: "Execução de sessões de formação", means_of_verification: "Listas de presença e avaliações", assumptions: "Salas e equipamentos disponíveis", position: 1 },
      ];
      await supabase.from("logframe_levels").insert(activitiesData);

      // LogFrame indicators
      const indicatorsData = [
        { level_id: goal.id, name: "Índice de eficiência institucional", unit: "%", baseline_value: 45, target_value: 80, current_value: 58, data_source: "Relatório anual", frequency: "annual", responsible: "Director Geral" },
        { level_id: purpose.id, name: "Taxa de adopção do sistema", unit: "%", baseline_value: 0, target_value: 80, current_value: 35, data_source: "Analytics do sistema", frequency: "monthly", responsible: "Gestor de Projecto" },
        { level_id: outputs[0].id, name: "Módulos desenvolvidos e testados", unit: "unidades", baseline_value: 0, target_value: 12, current_value: 7, data_source: "Relatório de progresso", frequency: "monthly", responsible: "Líder Técnico" },
        { level_id: outputs[1].id, name: "Profissionais formados", unit: "pessoas", baseline_value: 0, target_value: 200, current_value: 85, data_source: "Registos de formação", frequency: "quarterly", responsible: "Coordenador de Formação" },
      ];
      await supabase.from("logframe_indicators").insert(indicatorsData);
    }

    // ===== Procurement Plans, Suppliers & Contracts =====
    const suppliersData = [
      { name: "TechSolutions Angola Lda.", contact_name: "Eng. Ricardo Lopes", email: "ricardo@techsolutions.ao", phone: "+244 923 111 222", address: "Rua da Tecnologia, 45 - Luanda", tax_id: "5401234567", status: "active", category: "services", rating: 4, notes: "Fornecedor preferencial de desenvolvimento de software" },
      { name: "InfraMax S.A.", contact_name: "Arq. Sofia Neto", email: "sofia@inframax.ao", phone: "+244 924 333 444", address: "Av. das Obras, 120 - Luanda", tax_id: "5402345678", status: "active", category: "works", rating: 3, notes: "Especialista em infraestruturas de TI" },
      { name: "ConsultPro Lda.", contact_name: "Dr. Fernando Dias", email: "fernando@consultpro.ao", phone: "+244 925 555 666", address: "Edifício Business Center - Luanda", tax_id: "5403456789", status: "active", category: "consulting", rating: 5, notes: "Consultoria estratégica e gestão de projectos" },
      { name: "EquipTech S.A.", contact_name: "Eng. Teresa Machado", email: "teresa@equiptech.ao", phone: "+244 926 777 888", address: "Zona Industrial de Viana - Luanda", tax_id: "5404567890", status: "active", category: "goods", rating: 4, notes: "Fornecedor de hardware e equipamentos de rede" },
    ];
    const { data: suppliers } = await supabase.from("suppliers").insert(suppliersData).select();

    const procurementData = projects.slice(0, 3).flatMap(project => [
      { project_id: project.id, title: "Aquisição de Servidores e Storage", description: "Compra de infraestrutura de hardware para o projecto", procurement_method: "ncb", status: "completed", category: "goods", estimated_amount: 350000, currency: "USD", planned_start_date: "2024-01-15", planned_end_date: "2024-03-15" },
      { project_id: project.id, title: "Contratação de Equipa de Desenvolvimento", description: "Serviços de desenvolvimento de software especializado", procurement_method: "shopping", status: "in_progress", category: "services", estimated_amount: 500000, currency: "USD", planned_start_date: "2024-02-01", planned_end_date: "2024-04-30" },
    ]);
    const { data: procPlans } = await supabase.from("procurement_plans").insert(procurementData).select();

    if (procPlans && suppliers) {
      const contractsData = procPlans.slice(0, 3).map((plan, idx) => ({
        project_id: plan.project_id,
        procurement_plan_id: plan.id,
        supplier_id: suppliers[idx % suppliers.length].id,
        title: `Contrato - ${plan.title}`,
        contract_number: `CTR-2024-${String(idx + 1).padStart(3, '0')}`,
        contract_type: idx === 0 ? "fixed_price" : "time_material",
        status: idx === 0 ? "completed" : "active",
        amount: plan.estimated_amount,
        currency: "USD",
        start_date: plan.planned_start_date,
        end_date: plan.planned_end_date,
        payment_terms: "30 dias após entrega e aceitação",
        deliverables: "Conforme especificações técnicas do caderno de encargos",
      }));
      await supabase.from("contracts").insert(contractsData);
    }

    // ===== Change Requests =====
    const changeRequestsData = projects.slice(0, 3).flatMap(project => [
      { project_id: project.id, title: "Adicionar módulo de relatórios avançados", description: "O cliente solicitou funcionalidades adicionais de Business Intelligence", change_type: "scope", priority: "high", status: "approved", justification: "Necessidade crítica de dashboards executivos para tomada de decisão", impact_description: "Aumento de 3 semanas no cronograma e 15% no orçamento", impact_budget: 120000, impact_schedule: "+3 semanas", impact_scope: "Novo módulo de BI com 5 dashboards", requested_by_name: "Dr. António Fernandes" },
      { project_id: project.id, title: "Alteração do fluxo de autenticação", description: "Migração para autenticação SSO com Active Directory", change_type: "technical", priority: "medium", status: "pending", justification: "Conformidade com política de segurança institucional", impact_description: "2 semanas adicionais para integração com AD", impact_budget: 45000, impact_schedule: "+2 semanas", impact_scope: "Refactoring do módulo de autenticação", requested_by_name: "Eng. Carla Mendes" },
    ]);
    await supabase.from("change_requests").insert(changeRequestsData);

    // ===== Retrospectives =====
    // Get the completed sprints we just created
    const { data: completedSprints } = await supabase.from("sprints").select("id, project_id").eq("status", "completed");
    if (completedSprints && completedSprints.length > 0) {
      for (const sprint of completedSprints.slice(0, 3)) {
        const { data: retro } = await supabase.from("retrospectives").insert({
          sprint_id: sprint.id,
          project_id: sprint.project_id,
          status: "completed",
          facilitator_name: "João Martins",
          summary: "Sprint produtivo com boa colaboração. Necessidade de melhorar estimativas e comunicação com stakeholders.",
          completed_at: new Date().toISOString(),
        }).select().single();

        if (retro) {
          const retroItemsData = [
            { retrospective_id: retro.id, category: "went_well", content: "Equipa entregou todas as user stories comprometidas", author_name: "Pedro Alves", votes_count: 3 },
            { retrospective_id: retro.id, category: "went_well", content: "Code reviews foram consistentes e construtivos", author_name: "Ana Costa", votes_count: 2 },
            { retrospective_id: retro.id, category: "needs_improvement", content: "Estimativas de story points precisam ser mais precisas", author_name: "Maria Santos", votes_count: 4 },
            { retrospective_id: retro.id, category: "needs_improvement", content: "Daily standups demoram mais que 15 minutos", author_name: "João Martins", votes_count: 2 },
            { retrospective_id: retro.id, category: "keep_doing", content: "Pair programming para tarefas complexas", author_name: "Pedro Alves", votes_count: 3 },
            { retrospective_id: retro.id, category: "change", content: "Usar planning poker para melhorar estimativas", author_name: "Maria Santos", votes_count: 5 },
            { retrospective_id: retro.id, category: "props", content: "Excelente trabalho da Ana no redesign da interface", author_name: "João Martins", votes_count: 4 },
          ];
          await supabase.from("retrospective_items").insert(retroItemsData);

          const retroActionsData = [
            { retrospective_id: retro.id, description: "Implementar planning poker nas sessões de estimativa", assignee_name: "João Martins", status: "in_progress", due_date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
            { retrospective_id: retro.id, description: "Definir timebox de 15 min para dailies", assignee_name: "Maria Santos", status: "done", due_date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
          ];
          await supabase.from("retrospective_actions").insert(retroActionsData);

          const retroFeedbackData = [
            { retrospective_id: retro.id, user_id: "00000000-0000-0000-0000-000000000001", user_name: "João Martins", satisfaction_rating: 4, velocity_rating: 3, notes: "Bom sprint, mas precisamos melhorar a velocidade" },
            { retrospective_id: retro.id, user_id: "00000000-0000-0000-0000-000000000002", user_name: "Maria Santos", satisfaction_rating: 5, velocity_rating: 4, notes: "Muito satisfeita com a colaboração da equipa" },
          ];
          await supabase.from("retrospective_feedback").insert(retroFeedbackData);
        }
      }
    }

    // ===== Briefings =====
    const briefingsData = projects.slice(0, 3).map(project => ({
      project_id: project.id,
      title: `Briefing - ${project.name}`,
      description: "Documento de briefing com objectivos, requisitos e dependências do projecto",
      status: "published",
    }));
    const { data: briefings } = await supabase.from("project_briefings").insert(briefingsData).select();

    if (briefings) {
      const modulesData = briefings.flatMap(briefing => [
        { briefing_id: briefing.id, title: "Contexto e Objectivos", content: "Este projecto visa modernizar os processos operacionais da instituição, melhorando a eficiência e reduzindo custos operacionais.", module_type: "section", level: 0, position: 0, status: "approved" },
        { briefing_id: briefing.id, title: "Objectivo Principal", content: "Implementar um sistema integrado que automatize 80% dos processos manuais até ao final de 2025.", module_type: "objective", level: 1, position: 1, status: "approved" },
        { briefing_id: briefing.id, title: "Requisito Funcional 1", content: "O sistema deve suportar autenticação multi-factor e integração com Active Directory.", module_type: "requirement", level: 1, position: 2, status: "approved" },
        { briefing_id: briefing.id, title: "Dependência Externa", content: "Integração com o sistema SAP existente para dados financeiros.", module_type: "dependency", level: 1, position: 3, status: "pending" },
      ]);
      await supabase.from("briefing_modules").insert(modulesData);
    }

    // ===== Baselines =====
    const baselinesData = projects.slice(0, 4).map((project, idx) => ({
      project_id: project.id,
      name: `Baseline Inicial - ${project.name.substring(0, 30)}`,
      description: "Baseline aprovada no arranque do projecto",
      baseline_number: 1,
      baseline_date: project.start_date || "2024-01-01",
      is_active: true,
      created_by_name: "João Martins",
      scope_snapshot: { total_tasks: 10, total_story_points: 80, phases: ["Planeamento", "Desenvolvimento", "Testes", "Implementação"] },
      schedule_snapshot: { start_date: project.start_date, end_date: project.end_date, milestones: 4 },
      budget_snapshot: { total_budget: project.budget, contingency: (project.budget || 0) * 0.1 },
    }));
    await supabase.from("project_baselines").insert(baselinesData);

    // ===== Scrum Config =====
    const scrumConfigData = projects.slice(0, 3).map(project => ({
      project_id: project.id,
      default_sprint_duration_days: 14,
      definition_of_done: ["Código revisto por pelo menos 1 peer", "Testes unitários com cobertura > 80%", "Documentação actualizada", "Sem bugs críticos pendentes", "Aprovação do Product Owner"],
      sprint_planning_duration_hours: 2,
      daily_standup_duration_minutes: 15,
      sprint_review_duration_hours: 1,
      retrospective_duration_hours: 1,
    }));
    await supabase.from("project_scrum_config").insert(scrumConfigData);

    // ===== Lessons Learned =====
    const lessonsData = projects.slice(0, 3).flatMap(project => [
      { project_id: project.id, title: "Importância da prototipagem rápida", description: "Protótipos interactivos reduziram significativamente o número de revisões durante o desenvolvimento. Recomenda-se sempre investir tempo em protótipos antes de iniciar a codificação.", lesson_type: "success", author_name: "Ana Costa", tags: ["design", "UX", "prototipagem"] },
      { project_id: project.id, title: "Gestão de expectativas do cliente", description: "Comunicação frequente e demos regulares são essenciais para alinhar expectativas. Sessões quinzenais de demo foram mais eficazes que reuniões mensais formais.", lesson_type: "improvement", author_name: "João Martins", tags: ["comunicação", "stakeholders", "gestão"] },
    ]);
    await supabase.from("lessons_learned").insert(lessonsData);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Dados demo criados com sucesso (todos os módulos)!",
        data: {
          portfolios: 1,
          programs: programs.length,
          projects: projects.length,
          tasks: tasks.length,
          dependencies: dependencies.length,
          teamMembers: teamMembersData.length,
          budgetEntries: budgetEntries.length,
          documents: documentsData.length,
          risks: risksData.length,
          sprints: sprintsData.length,
          stakeholders: stakeholdersData.length,
          kpis: kpiData.length,
          logframeLevels: "3 projectos com hierarquia completa",
          procurementPlans: procurementData.length,
          suppliers: suppliersData.length,
          changeRequests: changeRequestsData.length,
          retrospectives: completedSprints?.length || 0,
          briefings: briefingsData.length,
          baselines: baselinesData.length,
          lessonsLearned: lessonsData.length,
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
