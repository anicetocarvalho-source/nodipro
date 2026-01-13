import { useParams, useNavigate } from "react-router-dom";
import { useProgram } from "@/hooks/usePrograms";
import { useProjects } from "@/hooks/useProjects";
import { usePortfolios } from "@/hooks/usePortfolios";
import { DraggableProjectsSection } from "@/components/program/DraggableProjectsSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  FolderKanban,
  TrendingUp,
  AlertTriangle,
  Clock,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  ArrowLeftRight,
} from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { DbProject } from "@/types/database";

const statusColors: Record<string, string> = {
  active: "bg-success/20 text-success border-success/30",
  delayed: "bg-destructive/20 text-destructive border-destructive/30",
  completed: "bg-info/20 text-info border-info/30",
  on_hold: "bg-warning/20 text-warning border-warning/30",
};

const statusLabels: Record<string, string> = {
  active: "Ativo",
  delayed: "Atrasado",
  completed: "Concluído",
  on_hold: "Em Espera",
};

export default function ProgramDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: program, isLoading: programLoading } = useProgram(id);
  const { data: allProjects, isLoading: projectsLoading } = useProjects();
  const { data: portfolios } = usePortfolios();

  // Filter projects for this program
  const programProjects = useMemo(() => {
    return allProjects?.filter((p) => p.program_id === id) || [];
  }, [allProjects, id]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalBudget = programProjects.reduce(
      (sum, p) => sum + (Number(p.budget) || 0),
      0
    );
    const totalSpent = programProjects.reduce(
      (sum, p) => sum + (Number(p.spent) || 0),
      0
    );
    const avgProgress =
      programProjects.length > 0
        ? programProjects.reduce((sum, p) => sum + (p.progress || 0), 0) /
          programProjects.length
        : 0;
    const projectsAtRisk = programProjects.filter(
      (p) => p.status === "delayed"
    ).length;
    const completedProjects = programProjects.filter(
      (p) => p.status === "completed"
    ).length;

    return {
      totalProjects: programProjects.length,
      totalBudget,
      totalSpent,
      avgProgress: Math.round(avgProgress),
      projectsAtRisk,
      completedProjects,
      budgetUsage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
    };
  }, [programProjects]);

  const portfolioName = useMemo(() => {
    return portfolios?.find((p) => p.id === program?.portfolio_id)?.name;
  }, [portfolios, program?.portfolio_id]);

  if (programLoading || projectsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <p className="text-muted-foreground">Programa não encontrado</p>
        <Button variant="outline" onClick={() => navigate("/portfolio")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Portfolio
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/portfolio")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{program.name}</h1>
              <Badge
                variant="outline"
                className={cn(
                  statusColors[program.status] || statusColors.active
                )}
              >
                {statusLabels[program.status] || program.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              {portfolioName && <span>Portfolio: {portfolioName}</span>}
              {program.sector && (
                <>
                  <span>•</span>
                  <span>{program.sector}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <Button onClick={() => navigate(`/projects`)}>
          <FolderKanban className="h-4 w-4 mr-2" />
          Gerir Projectos
        </Button>
      </div>

      {/* Description */}
      {program.description && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">{program.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total de Projectos
                </p>
                <p className="text-3xl font-bold">{metrics.totalProjects}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.completedProjects} concluídos
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FolderKanban className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Progresso Médio</p>
                <p className="text-3xl font-bold">{metrics.avgProgress}%</p>
                <Progress value={metrics.avgProgress} className="mt-2 h-2" />
              </div>
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Orçamento</p>
                <p className="text-3xl font-bold">
                  €{(metrics.totalBudget / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  €{(metrics.totalSpent / 1000).toFixed(0)}K gastos (
                  {metrics.budgetUsage.toFixed(0)}%)
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-info/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Projectos em Risco
                </p>
                <p className="text-3xl font-bold">{metrics.projectsAtRisk}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {metrics.projectsAtRisk > 0 ? "Requerem atenção" : "Tudo OK"}
                </p>
              </div>
              <div
                className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center",
                  metrics.projectsAtRisk > 0
                    ? "bg-destructive/10"
                    : "bg-success/10"
                )}
              >
                <AlertTriangle
                  className={cn(
                    "h-6 w-6",
                    metrics.projectsAtRisk > 0
                      ? "text-destructive"
                      : "text-success"
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Program Timeline */}
      {program.start_date && program.end_date && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Período do Programa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Início</p>
                <p className="font-medium">
                  {format(parseISO(program.start_date), "dd MMM yyyy", {
                    locale: pt,
                  })}
                </p>
              </div>
              <div className="flex-1 h-2 bg-muted rounded-full relative">
                <div
                  className="absolute inset-y-0 left-0 bg-primary rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        0,
                        (differenceInDays(new Date(), parseISO(program.start_date)) /
                          differenceInDays(
                            parseISO(program.end_date),
                            parseISO(program.start_date)
                          )) *
                          100
                      )
                    )}%`,
                  }}
                />
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Fim</p>
                <p className="font-medium">
                  {format(parseISO(program.end_date), "dd MMM yyyy", {
                    locale: pt,
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projects Timeline / Gantt */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Cronograma de Projectos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {programProjects.length > 0 ? (
            <ProjectsGantt projects={programProjects} />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FolderKanban className="h-12 w-12 mb-4 opacity-50" />
              <p>Nenhum projecto associado a este programa</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate("/projects")}
              >
                Associar Projectos
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Drag and Drop Projects Section */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <ArrowLeftRight className="h-5 w-5" />
          Gerir Projectos
        </h2>
        <DraggableProjectsSection
          programId={id!}
          programName={program.name}
          allProjects={allProjects || []}
        />
      </div>

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5" />
            Projectos do Programa ({programProjects.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {programProjects.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead>Orçamento</TableHead>
                  <TableHead>Período</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programProjects.map((project) => (
                  <TableRow
                    key={project.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {project.client || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          statusColors[project.status] || statusColors.active
                        )}
                      >
                        {statusLabels[project.status] || project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={project.progress}
                          className="w-16 h-2"
                        />
                        <span className="text-sm text-muted-foreground">
                          {project.progress}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      €{((Number(project.budget) || 0) / 1000).toFixed(0)}K
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {project.start_date && project.end_date ? (
                        <>
                          {format(parseISO(project.start_date), "dd/MM/yy")} -{" "}
                          {format(parseISO(project.end_date), "dd/MM/yy")}
                        </>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum projecto associado
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Projects Gantt Chart Component
function ProjectsGantt({ projects }: { projects: DbProject[] }) {
  const [daysToShow, setDaysToShow] = useState(90);

  // Calculate date range from projects
  const { viewStart, viewEnd } = useMemo(() => {
    const projectsWithDates = projects.filter(
      (p) => p.start_date && p.end_date
    );
    if (projectsWithDates.length === 0) {
      const now = new Date();
      return {
        viewStart: new Date(now.getFullYear(), now.getMonth(), 1),
        viewEnd: new Date(now.getFullYear(), now.getMonth() + 3, 0),
      };
    }

    const starts = projectsWithDates.map((p) => parseISO(p.start_date!));
    const ends = projectsWithDates.map((p) => parseISO(p.end_date!));

    const minDate = new Date(Math.min(...starts.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...ends.map((d) => d.getTime())));

    // Add some padding
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 7);

    return { viewStart: minDate, viewEnd: maxDate };
  }, [projects]);

  const [currentViewStart, setCurrentViewStart] = useState(viewStart);

  const days = useMemo(() => {
    const result = [];
    const current = new Date(currentViewStart);
    for (let i = 0; i < daysToShow; i++) {
      result.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return result;
  }, [currentViewStart, daysToShow]);

  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  const monthGroups = useMemo(() => {
    const groups: { month: string; days: Date[] }[] = [];
    days.forEach((day) => {
      const monthKey = `${months[day.getMonth()]} ${day.getFullYear()}`;
      const lastGroup = groups[groups.length - 1];
      if (lastGroup?.month === monthKey) {
        lastGroup.days.push(day);
      } else {
        groups.push({ month: monthKey, days: [day] });
      }
    });
    return groups;
  }, [days]);

  const getProjectPosition = (project: DbProject) => {
    if (!project.start_date || !project.end_date) return null;

    const start = parseISO(project.start_date);
    const end = parseISO(project.end_date);
    const viewEndDate = days[days.length - 1];

    const projectStart = Math.max(start.getTime(), currentViewStart.getTime());
    const projectEnd = Math.min(end.getTime(), viewEndDate.getTime());

    if (projectStart > viewEndDate.getTime() || projectEnd < currentViewStart.getTime()) {
      return null;
    }

    const totalMs = daysToShow * 24 * 60 * 60 * 1000;
    const startOffset = (projectStart - currentViewStart.getTime()) / totalMs;
    const duration = (projectEnd - projectStart) / totalMs;

    return {
      left: `${startOffset * 100}%`,
      width: `${Math.max(duration * 100, 2)}%`,
    };
  };

  const handlePrev = () => {
    const newDate = new Date(currentViewStart);
    newDate.setDate(newDate.getDate() - 14);
    setCurrentViewStart(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentViewStart);
    newDate.setDate(newDate.getDate() + 14);
    setCurrentViewStart(newDate);
  };

  const handleZoomIn = () => setDaysToShow(Math.max(30, daysToShow - 15));
  const handleZoomOut = () => setDaysToShow(Math.min(180, daysToShow + 15));

  const projectsWithDates = projects.filter((p) => p.start_date && p.end_date);

  if (projectsWithDates.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Projectos sem datas definidas</p>
        <p className="text-sm mt-1">
          Defina datas de início e fim nos projectos para ver o cronograma
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground ml-2">
            {months[currentViewStart.getMonth()]} {currentViewStart.getFullYear()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="border rounded-lg overflow-hidden">
        <div className="flex">
          {/* Project Names Column */}
          <div className="w-48 flex-shrink-0 bg-muted/30 border-r">
            <div className="h-12 border-b flex items-center px-3 bg-muted/50">
              <span className="text-sm font-medium">Projecto</span>
            </div>
            {projectsWithDates.map((project) => (
              <div
                key={project.id}
                className="h-10 border-b flex items-center px-3 gap-2"
              >
                <div
                  className={cn(
                    "w-2 h-2 rounded-full",
                    project.status === "active" && "bg-success",
                    project.status === "delayed" && "bg-destructive",
                    project.status === "completed" && "bg-info",
                    project.status === "on_hold" && "bg-warning"
                  )}
                />
                <span className="text-sm truncate">{project.name}</span>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-x-auto">
            {/* Month Headers */}
            <div className="flex h-6 border-b bg-muted/50">
              {monthGroups.map((group, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 border-r flex items-center justify-center"
                  style={{ width: `${(group.days.length / daysToShow) * 100}%` }}
                >
                  <span className="text-xs font-medium">{group.month}</span>
                </div>
              ))}
            </div>

            {/* Day Headers */}
            <div className="flex h-6 border-b bg-muted/30">
              {days.map((day, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-shrink-0 text-center border-r",
                    day.getDay() === 0 || day.getDay() === 6
                      ? "bg-muted/50"
                      : ""
                  )}
                  style={{ width: `${100 / daysToShow}%` }}
                >
                  <span className="text-[10px] text-muted-foreground">
                    {day.getDate()}
                  </span>
                </div>
              ))}
            </div>

            {/* Project Bars */}
            {projectsWithDates.map((project) => {
              const position = getProjectPosition(project);

              return (
                <div key={project.id} className="h-10 border-b relative">
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex">
                    {days.map((day, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex-shrink-0 border-r border-muted/50",
                          day.getDay() === 0 || day.getDay() === 6
                            ? "bg-muted/30"
                            : ""
                        )}
                        style={{ width: `${100 / daysToShow}%` }}
                      />
                    ))}
                  </div>

                  {/* Project Bar */}
                  {position && (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 cursor-pointer group"
                      style={{ left: position.left, width: position.width }}
                      onClick={() => {}}
                    >
                      <div
                        className={cn(
                          "h-6 rounded relative overflow-hidden",
                          project.status === "active" && "bg-success",
                          project.status === "delayed" && "bg-destructive",
                          project.status === "completed" && "bg-info",
                          project.status === "on_hold" && "bg-warning"
                        )}
                      >
                        {/* Progress */}
                        <div
                          className="absolute inset-0 bg-foreground/20"
                          style={{ width: `${project.progress}%` }}
                        />
                        <span className="absolute inset-0 flex items-center px-2 text-[10px] text-white font-medium truncate">
                          {project.progress}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded bg-success" />
          <span className="text-muted-foreground">Ativo</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded bg-destructive" />
          <span className="text-muted-foreground">Atrasado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded bg-info" />
          <span className="text-muted-foreground">Concluído</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 rounded bg-warning" />
          <span className="text-muted-foreground">Em Espera</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-1 bg-foreground/20" />
          <span className="text-muted-foreground">Progresso</span>
        </div>
      </div>
    </div>
  );
}
