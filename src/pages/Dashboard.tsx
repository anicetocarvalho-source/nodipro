import {
  FolderKanban,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { TaskList } from "@/components/dashboard/TaskList";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { ProgressChart } from "@/components/dashboard/ProgressChart";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/ui/role-badge";
import { useAuthContext } from "@/contexts/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
const stats = [
  {
    title: "Projectos Activos",
    value: 24,
    change: "+3 este mês",
    changeType: "positive" as const,
    icon: FolderKanban,
  },
  {
    title: "Tarefas Concluídas",
    value: 156,
    change: "+12% vs mês anterior",
    changeType: "positive" as const,
    icon: CheckCircle,
  },
  {
    title: "Em Progresso",
    value: 48,
    change: "23 prioritárias",
    changeType: "neutral" as const,
    icon: Clock,
  },
  {
    title: "Em Risco",
    value: 5,
    change: "-2 esta semana",
    changeType: "positive" as const,
    icon: AlertTriangle,
  },
];

const projects = [
  {
    name: "Sistema de Gestão Financeira",
    client: "Ministério das Finanças",
    status: "on_track" as const,
    progress: 75,
    deadline: "15 Mar 2026",
    team: [
      { name: "João", initials: "JM" },
      { name: "Maria", initials: "MS" },
      { name: "Pedro", initials: "PA" },
    ],
    priority: "high" as const,
  },
  {
    name: "Portal de Serviços Públicos",
    client: "Governo Provincial",
    status: "at_risk" as const,
    progress: 45,
    deadline: "28 Fev 2026",
    team: [
      { name: "Ana", initials: "AC" },
      { name: "Carlos", initials: "CF" },
    ],
    priority: "high" as const,
  },
  {
    name: "App Mobile Bancário",
    client: "Banco Nacional",
    status: "on_track" as const,
    progress: 60,
    deadline: "10 Abr 2026",
    team: [
      { name: "Sofia", initials: "SL" },
      { name: "Miguel", initials: "MR" },
      { name: "Rita", initials: "RV" },
      { name: "Luís", initials: "LT" },
      { name: "Paula", initials: "PC" },
    ],
    priority: "medium" as const,
  },
  {
    name: "ERP Corporativo",
    client: "Sonangol",
    status: "delayed" as const,
    progress: 30,
    deadline: "20 Jan 2026",
    team: [
      { name: "Bruno", initials: "BM" },
      { name: "Clara", initials: "CS" },
    ],
    priority: "high" as const,
  },
];

const tasks = [
  {
    id: "1",
    title: "Revisar documentação técnica do módulo de pagamentos",
    project: "Sistema de Gestão Financeira",
    priority: "high" as const,
    deadline: "Hoje",
    status: "pending" as const,
  },
  {
    id: "2",
    title: "Reunião de alinhamento com stakeholders",
    project: "Portal de Serviços Públicos",
    priority: "high" as const,
    deadline: "Amanhã",
    status: "pending" as const,
  },
  {
    id: "3",
    title: "Testes de integração API",
    project: "App Mobile Bancário",
    priority: "medium" as const,
    deadline: "18 Jan",
    status: "in_progress" as const,
  },
  {
    id: "4",
    title: "Actualizar cronograma do projecto",
    project: "ERP Corporativo",
    priority: "medium" as const,
    deadline: "19 Jan",
    status: "pending" as const,
  },
  {
    id: "5",
    title: "Preparar relatório mensal",
    project: "Gestão Interna",
    priority: "low" as const,
    deadline: "25 Jan",
    status: "pending" as const,
  },
];

const activities = [
  {
    id: "1",
    user: { name: "Maria Santos", initials: "MS" },
    action: "completou a tarefa",
    target: "Análise de requisitos",
    time: "Há 5 minutos",
    type: "task" as const,
  },
  {
    id: "2",
    user: { name: "Pedro Alves", initials: "PA" },
    action: "comentou em",
    target: "Sprint Review",
    time: "Há 15 minutos",
    type: "comment" as const,
  },
  {
    id: "3",
    user: { name: "Ana Costa", initials: "AC" },
    action: "carregou documento em",
    target: "Proposta Comercial",
    time: "Há 1 hora",
    type: "upload" as const,
  },
  {
    id: "4",
    user: { name: "Carlos Ferreira", initials: "CF" },
    action: "adicionou membro à equipa",
    target: "Portal Gov",
    time: "Há 2 horas",
    type: "team" as const,
  },
  {
    id: "5",
    user: { name: "Sofia Lima", initials: "SL" },
    action: "criou documento",
    target: "Manual Técnico v2",
    time: "Há 3 horas",
    type: "document" as const,
  },
];

export default function Dashboard() {
  const { profile, role } = useAuthContext();
  const { canCreateProject } = usePermissions();
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const firstName = profile?.full_name?.split(" ")[0] || "Utilizador";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-foreground">
                {getGreeting()}, {firstName}! 👋
              </h1>
              <RoleBadge role={role} size="md" />
            </div>
            <p className="text-muted-foreground">
              Aqui está o resumo dos seus projectos e tarefas.
            </p>
          </div>
        </div>
        {canCreateProject && (
          <Button className="bg-primary hover:bg-primary/90">
            <FolderKanban className="h-4 w-4 mr-2" />
            Novo Projecto
          </Button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column - Projects & Chart */}
        <div className="xl:col-span-2 space-y-6">
          {/* Projects Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Projectos Recentes</h2>
              <Button variant="ghost" className="text-primary">
                Ver todos
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.name} {...project} />
              ))}
            </div>
          </div>

          {/* Chart */}
          <ProgressChart />
        </div>

        {/* Right Column - Tasks, Activity, Quick Actions */}
        <div className="space-y-6">
          <QuickActions />
          <TaskList tasks={tasks} />
          <ActivityFeed activities={activities} />
        </div>
      </div>
    </div>
  );
}
