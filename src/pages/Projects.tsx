import { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List,
  MoreHorizontal,
  Calendar,
  Users,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const projects = [
  {
    id: "1",
    name: "Sistema de Gestão Financeira",
    client: "Ministério das Finanças",
    status: "active",
    phase: "Desenvolvimento",
    progress: 75,
    startDate: "01 Jan 2026",
    deadline: "15 Mar 2026",
    budget: "45.000.000 AOA",
    spent: "32.500.000 AOA",
    team: [
      { initials: "JM" },
      { initials: "MS" },
      { initials: "PA" },
    ],
    tasks: { total: 48, completed: 36 },
    risk: "low",
  },
  {
    id: "2",
    name: "Portal de Serviços Públicos",
    client: "Governo Provincial de Luanda",
    status: "active",
    phase: "Análise",
    progress: 45,
    startDate: "15 Nov 2025",
    deadline: "28 Fev 2026",
    budget: "120.000.000 AOA",
    spent: "48.000.000 AOA",
    team: [
      { initials: "AC" },
      { initials: "CF" },
    ],
    tasks: { total: 65, completed: 29 },
    risk: "high",
  },
  {
    id: "3",
    name: "App Mobile Bancário",
    client: "Banco Nacional de Angola",
    status: "active",
    phase: "Testes",
    progress: 88,
    startDate: "01 Set 2025",
    deadline: "10 Abr 2026",
    budget: "85.000.000 AOA",
    spent: "72.250.000 AOA",
    team: [
      { initials: "SL" },
      { initials: "MR" },
      { initials: "RV" },
      { initials: "LT" },
    ],
    tasks: { total: 92, completed: 81 },
    risk: "low",
  },
  {
    id: "4",
    name: "ERP Corporativo Integrado",
    client: "Sonangol EP",
    status: "delayed",
    phase: "Desenvolvimento",
    progress: 30,
    startDate: "01 Jun 2025",
    deadline: "20 Jan 2026",
    budget: "250.000.000 AOA",
    spent: "125.000.000 AOA",
    team: [
      { initials: "BM" },
      { initials: "CS" },
    ],
    tasks: { total: 156, completed: 47 },
    risk: "critical",
  },
  {
    id: "5",
    name: "Sistema de Recursos Humanos",
    client: "TAAG Angola Airlines",
    status: "active",
    phase: "Planeamento",
    progress: 15,
    startDate: "01 Jan 2026",
    deadline: "30 Jun 2026",
    budget: "35.000.000 AOA",
    spent: "5.250.000 AOA",
    team: [
      { initials: "PG" },
      { initials: "AT" },
      { initials: "LM" },
    ],
    tasks: { total: 34, completed: 5 },
    risk: "medium",
  },
  {
    id: "6",
    name: "Plataforma E-commerce",
    client: "Kero Supermercados",
    status: "completed",
    phase: "Concluído",
    progress: 100,
    startDate: "01 Mar 2025",
    deadline: "31 Dez 2025",
    budget: "65.000.000 AOA",
    spent: "62.400.000 AOA",
    team: [
      { initials: "RC" },
      { initials: "FM" },
    ],
    tasks: { total: 78, completed: 78 },
    risk: "low",
  },
];

const statusConfig = {
  active: { label: "Activo", className: "bg-success/10 text-success" },
  delayed: { label: "Atrasado", className: "bg-destructive/10 text-destructive" },
  completed: { label: "Concluído", className: "bg-primary/10 text-primary" },
  paused: { label: "Pausado", className: "bg-warning/10 text-warning" },
};

const riskConfig = {
  low: { label: "Baixo", className: "bg-success/10 text-success" },
  medium: { label: "Médio", className: "bg-warning/10 text-warning" },
  high: { label: "Alto", className: "bg-destructive/10 text-destructive" },
  critical: { label: "Crítico", className: "bg-destructive text-destructive-foreground" },
};

export default function Projects() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projectos</h1>
          <p className="text-muted-foreground">
            Gerir e acompanhar todos os projectos da organização.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Novo Projecto
        </Button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar projectos..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Todos</DropdownMenuItem>
              <DropdownMenuItem>Activos</DropdownMenuItem>
              <DropdownMenuItem>Atrasados</DropdownMenuItem>
              <DropdownMenuItem>Concluídos</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos ({projects.length})</TabsTrigger>
          <TabsTrigger value="active">
            Activos ({projects.filter((p) => p.status === "active").length})
          </TabsTrigger>
          <TabsTrigger value="delayed">
            Atrasados ({projects.filter((p) => p.status === "delayed").length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Concluídos ({projects.filter((p) => p.status === "completed").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProjects.map((project) => (
                <Card
                  key={project.id}
                  className="hover:shadow-md transition-all hover:border-primary/30 cursor-pointer group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                          {project.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          {project.client}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Ver detalhes</DropdownMenuItem>
                          <DropdownMenuItem>Editar</DropdownMenuItem>
                          <DropdownMenuItem>Relatório</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Badge className={cn("text-xs", statusConfig[project.status as keyof typeof statusConfig].className)}>
                        {statusConfig[project.status as keyof typeof statusConfig].label}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {project.phase}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <Progress value={project.progress} className="h-2" />
                    </div>

                    {/* Tasks */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Tarefas</span>
                      <span>
                        {project.tasks.completed}/{project.tasks.total}
                      </span>
                    </div>

                    {/* Deadline & Risk */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{project.deadline}</span>
                      </div>
                      <Badge className={cn("text-xs", riskConfig[project.risk as keyof typeof riskConfig].className)}>
                        Risco {riskConfig[project.risk as keyof typeof riskConfig].label}
                      </Badge>
                    </div>

                    {/* Team */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex -space-x-2">
                        {project.team.slice(0, 4).map((member, i) => (
                          <Avatar key={i} className="h-7 w-7 border-2 border-card">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {member.initials}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {project.team.length > 4 && (
                          <div className="h-7 w-7 rounded-full bg-muted border-2 border-card flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">
                              +{project.team.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {project.team.length} membros
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium text-muted-foreground">Projecto</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Estado</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Progresso</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Prazo</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Risco</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Equipa</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects.map((project) => (
                      <tr key={project.id} className="border-b hover:bg-accent/50 cursor-pointer">
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{project.name}</p>
                            <p className="text-sm text-muted-foreground">{project.client}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={cn("text-xs", statusConfig[project.status as keyof typeof statusConfig].className)}>
                            {statusConfig[project.status as keyof typeof statusConfig].label}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3 min-w-[120px]">
                            <Progress value={project.progress} className="h-2 flex-1" />
                            <span className="text-sm font-medium">{project.progress}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm">{project.deadline}</td>
                        <td className="p-4">
                          <Badge className={cn("text-xs", riskConfig[project.risk as keyof typeof riskConfig].className)}>
                            {riskConfig[project.risk as keyof typeof riskConfig].label}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex -space-x-2">
                            {project.team.slice(0, 3).map((member, i) => (
                              <Avatar key={i} className="h-7 w-7 border-2 border-card">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {member.initials}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
