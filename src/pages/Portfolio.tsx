import { useState, useMemo } from "react";
import { TrendingUp, Target, DollarSign, AlertTriangle, Plus, Pencil, Trash2, FolderKanban, Layers, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/dashboard/StatCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { usePortfoliosWithStats, useDeletePortfolio } from "@/hooks/usePortfolios";
import { useProgramsWithStats, useDeleteProgram } from "@/hooks/usePrograms";
import { useProjects } from "@/hooks/useProjects";
import { PortfolioFormModal } from "@/components/portfolio/PortfolioFormModal";
import { ProgramFormModal } from "@/components/portfolio/ProgramFormModal";
import { AssignProjectModal } from "@/components/portfolio/AssignProjectModal";
import { DbPortfolio, DbProgram, ProgramWithStats } from "@/types/portfolio";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const chartConfig = {
  projectos: { label: "Projectos", color: "hsl(var(--chart-1))" },
  orcamento: { label: "Orçamento (M)", color: "hsl(var(--chart-2))" },
};

function formatCurrency(value: number) {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B AOA`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M AOA`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K AOA`;
  }
  return `${value.toLocaleString()} AOA`;
}

export default function Portfolio() {
  const { data: portfolios, isLoading: loadingPortfolios } = usePortfoliosWithStats();
  const { data: programs, isLoading: loadingPrograms } = useProgramsWithStats();
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const deletePortfolio = useDeletePortfolio();
  const deleteProgram = useDeleteProgram();

  const [portfolioModalOpen, setPortfolioModalOpen] = useState(false);
  const [programModalOpen, setProgramModalOpen] = useState(false);
  const [assignProjectModalOpen, setAssignProjectModalOpen] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<DbPortfolio | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<DbProgram | null>(null);
  const [selectedProgramForAssign, setSelectedProgramForAssign] = useState<{ id: string; name: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "portfolio" | "program"; id: string; name: string } | null>(null);

  // Calculate aggregated stats
  const aggregatedStats = useMemo(() => {
    if (!projects) return { total: 0, budget: 0, atRisk: 0, completed: 0 };

    const total = projects.length;
    const budget = projects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);
    const atRisk = projects.filter(p => p.status === 'delayed').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, budget, atRisk, completed, successRate };
  }, [projects]);

  // Calculate status distribution for chart
  const statusData = useMemo(() => {
    if (!projects) return [];
    
    const completed = projects.filter(p => p.status === 'completed').length;
    const inProgress = projects.filter(p => p.status === 'active').length;
    const atRisk = projects.filter(p => p.status === 'delayed').length;
    const onHold = projects.filter(p => p.status === 'on_hold').length;

    return [
      { name: "Concluídos", value: completed, color: "hsl(var(--chart-2))" },
      { name: "Em Progresso", value: inProgress, color: "hsl(var(--chart-1))" },
      { name: "Em Risco", value: atRisk, color: "hsl(var(--chart-4))" },
      { name: "Suspensos", value: onHold, color: "hsl(var(--chart-3))" },
    ].filter(s => s.value > 0);
  }, [projects]);

  // Calculate sector distribution
  const sectorData = useMemo(() => {
    if (!programs || !projects) return [];

    const sectorMap = new Map<string, { projectos: number; orcamento: number }>();

    programs.forEach(program => {
      const sector = program.sector || "Outros";
      const programProjects = projects.filter(p => p.program_id === program.id);
      const budget = programProjects.reduce((sum, p) => sum + (Number(p.budget) || 0), 0);

      if (sectorMap.has(sector)) {
        const current = sectorMap.get(sector)!;
        sectorMap.set(sector, {
          projectos: current.projectos + programProjects.length,
          orcamento: current.orcamento + budget,
        });
      } else {
        sectorMap.set(sector, {
          projectos: programProjects.length,
          orcamento: budget,
        });
      }
    });

    return Array.from(sectorMap.entries())
      .map(([sector, data]) => ({
        sector,
        projectos: data.projectos,
        orcamento: data.orcamento / 1_000_000, // Convert to millions
      }))
      .sort((a, b) => b.projectos - a.projectos)
      .slice(0, 6);
  }, [programs, projects]);

  const handleEditPortfolio = (portfolio: DbPortfolio) => {
    setSelectedPortfolio(portfolio);
    setPortfolioModalOpen(true);
  };

  const handleEditProgram = (program: DbProgram) => {
    setSelectedProgram(program);
    setProgramModalOpen(true);
  };

  const handleDeleteClick = (type: "portfolio" | "program", id: string, name: string) => {
    setItemToDelete({ type, id, name });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === "portfolio") {
      await deletePortfolio.mutateAsync(itemToDelete.id);
    } else {
      await deleteProgram.mutateAsync(itemToDelete.id);
    }

    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleAssignProject = (program: ProgramWithStats) => {
    setSelectedProgramForAssign({ id: program.id, name: program.name });
    setAssignProjectModalOpen(true);
  };

  const isLoading = loadingPortfolios || loadingPrograms || loadingProjects;

  const portfolioStats = [
    { title: "Total de Projectos", value: aggregatedStats.total, change: `${portfolios?.length || 0} portfólios`, changeType: "neutral" as const, icon: Target },
    { title: "Orçamento Total", value: formatCurrency(aggregatedStats.budget), change: `${programs?.length || 0} programas`, changeType: "neutral" as const, icon: DollarSign },
    { title: "Taxa de Sucesso", value: `${aggregatedStats.successRate}%`, change: `${aggregatedStats.completed} concluídos`, changeType: "positive" as const, icon: TrendingUp },
    { title: "Projectos em Risco", value: aggregatedStats.atRisk, change: "com atrasos", changeType: aggregatedStats.atRisk > 0 ? "negative" as const : "positive" as const, icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Portfólio de Projectos</h1>
          <p className="text-muted-foreground">
            Gestão de portfólios, programas e projectos da organização.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setSelectedProgram(null); setProgramModalOpen(true); }}>
            <Layers className="h-4 w-4 mr-2" />
            Novo Programa
          </Button>
          <Button onClick={() => { setSelectedPortfolio(null); setPortfolioModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Portfólio
          </Button>
        </div>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {portfolioStats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : statusData.length === 0 ? (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                Sem projectos para mostrar
              </div>
            ) : (
              <>
                <div className="flex items-center justify-center">
                  <ChartContainer config={{}} className="h-[250px] w-full max-w-[300px]">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  {statusData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-sm text-muted-foreground">
                        {item.name} ({item.value})
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sector Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Projectos por Sector</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : sectorData.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                Sem dados de sector disponíveis
              </div>
            ) : (
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <BarChart data={sectorData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="sector" className="text-xs fill-muted-foreground" angle={-45} textAnchor="end" height={60} />
                  <YAxis className="text-xs fill-muted-foreground" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="projectos" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Portfolios and Programs */}
      <Tabs defaultValue="portfolios" className="space-y-4">
        <TabsList>
          <TabsTrigger value="portfolios" className="gap-2">
            <FolderKanban className="h-4 w-4" />
            Portfólios ({portfolios?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="programs" className="gap-2">
            <Layers className="h-4 w-4" />
            Programas ({programs?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="portfolios">
          {loadingPortfolios ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48" />
              ))}
            </div>
          ) : portfolios?.length === 0 ? (
            <Card className="p-8 text-center">
              <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Sem portfólios</h3>
              <p className="text-muted-foreground mb-4">
                Crie o primeiro portfólio para organizar os seus programas e projectos.
              </p>
              <Button onClick={() => { setSelectedPortfolio(null); setPortfolioModalOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Portfólio
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {portfolios?.map((portfolio) => (
                <Card key={portfolio.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base">{portfolio.name}</CardTitle>
                        {portfolio.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {portfolio.description}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditPortfolio(portfolio)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick("portfolio", portfolio.id, portfolio.name)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-2xl font-bold">{portfolio.programs_count}</p>
                        <p className="text-xs text-muted-foreground">Programas</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{portfolio.projects_count}</p>
                        <p className="text-xs text-muted-foreground">Projectos</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{portfolio.average_progress}%</p>
                        <p className="text-xs text-muted-foreground">Progresso</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Orçamento Total</span>
                        <span className="font-medium">{formatCurrency(portfolio.total_budget)}</span>
                      </div>
                      <Progress value={portfolio.average_progress} className="h-2" />
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        portfolio.status === "active"
                          ? "bg-success/10 text-success border-success/20"
                          : portfolio.status === "inactive"
                          ? "bg-warning/10 text-warning border-warning/20"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {portfolio.status === "active" ? "Activo" : portfolio.status === "inactive" ? "Inactivo" : "Arquivado"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="programs">
          {loadingPrograms ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-56" />
              ))}
            </div>
          ) : programs?.length === 0 ? (
            <Card className="p-8 text-center">
              <Layers className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Sem programas</h3>
              <p className="text-muted-foreground mb-4">
                Crie o primeiro programa para agrupar projectos relacionados.
              </p>
              <Button onClick={() => { setSelectedProgram(null); setProgramModalOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Programa
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {programs?.map((program) => (
                <Card key={program.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base">{program.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {program.portfolio_name && (
                            <span className="text-xs text-muted-foreground">
                              {program.portfolio_name}
                            </span>
                          )}
                          {program.sector && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{program.sector}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge
                          className={
                            program.projects_at_risk === 0
                              ? "bg-success/10 text-success"
                              : "bg-warning/10 text-warning"
                          }
                        >
                          {program.projects_at_risk === 0 ? "No Prazo" : "Em Risco"}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleAssignProject(program)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Atribuir Projecto
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditProgram(program)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick("program", program.id, program.name)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Projectos</p>
                        <p className="font-semibold">{program.projects_count}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Orçamento</p>
                        <p className="font-semibold">{formatCurrency(program.total_budget)}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">{program.average_progress}%</span>
                      </div>
                      <Progress value={program.average_progress} className="h-2" />
                    </div>
                    {(program.start_date || program.end_date) && (
                      <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                        {program.start_date && (
                          <span>Início: {format(new Date(program.start_date), "MMM yyyy", { locale: pt })}</span>
                        )}
                        {program.end_date && (
                          <span>Fim: {format(new Date(program.end_date), "MMM yyyy", { locale: pt })}</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <PortfolioFormModal
        open={portfolioModalOpen}
        onOpenChange={setPortfolioModalOpen}
        portfolio={selectedPortfolio}
      />

      <ProgramFormModal
        open={programModalOpen}
        onOpenChange={setProgramModalOpen}
        program={selectedProgram}
      />

      {selectedProgramForAssign && (
        <AssignProjectModal
          open={assignProjectModalOpen}
          onOpenChange={setAssignProjectModalOpen}
          programId={selectedProgramForAssign.id}
          programName={selectedProgramForAssign.name}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja eliminar {itemToDelete?.type === "portfolio" ? "o portfólio" : "o programa"}{" "}
              <strong>{itemToDelete?.name}</strong>?
              {itemToDelete?.type === "portfolio" && (
                <span className="block mt-2 text-destructive">
                  Atenção: Todos os programas deste portfólio também serão eliminados.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
