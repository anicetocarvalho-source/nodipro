import { useState, useMemo } from "react";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Plus,
  FileText,
  Filter,
  Download,
  Bell,
  CheckCircle,
  Clock,
  XCircle,
  MoreVertical,
  Pencil,
  Trash2,
  Eye
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer, 
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useProjects } from "@/hooks/useProjects";
import { 
  useBudgetEntries, 
  useBudgetSummary,
  useBudgetEntriesByCategory,
  useBudgetEntriesByMonth,
  useBudgetEntriesByPhase,
  useBudgetAlerts,
  useDeleteBudgetEntry,
  useUpdateBudgetEntryStatus,
  useResolveAlert
} from "@/hooks/useBudget";
import { BudgetEntry, BudgetAlert } from "@/types/budget";
import { useAuthContext } from "@/contexts/AuthContext";
import BudgetEntryModal from "@/components/budget/BudgetEntryModal";
import BudgetReportModal from "@/components/budget/BudgetReportModal";

const COLORS = ['hsl(217, 91%, 60%)', 'hsl(142, 76%, 36%)', 'hsl(25, 95%, 53%)', 'hsl(262, 83%, 58%)', 'hsl(0, 84%, 60%)', 'hsl(45, 93%, 47%)'];

const statusConfig: Record<string, { label: string; icon: React.ComponentType<any>; className: string }> = {
  pending: { label: 'Pendente', icon: Clock, className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  approved: { label: 'Aprovado', icon: CheckCircle, className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  rejected: { label: 'Rejeitado', icon: XCircle, className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' },
  paid: { label: 'Pago', icon: Wallet, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
};

const formatCurrency = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B AOA`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M AOA`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K AOA`;
  return `${value.toLocaleString()} AOA`;
};

const AlertCard = ({ 
  alert, 
  onResolve 
}: { 
  alert: BudgetAlert; 
  onResolve: () => void;
}) => {
  const alertStyles = {
    critical: 'border-red-500 bg-red-50 dark:bg-red-950/20',
    warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20',
    info: 'border-blue-500 bg-blue-50 dark:bg-blue-950/20',
  };
  
  return (
    <div className={`p-4 rounded-lg border-l-4 ${alertStyles[alert.alert_type]}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className={`h-5 w-5 mt-0.5 ${
            alert.alert_type === 'critical' ? 'text-red-500' : 
            alert.alert_type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
          }`} />
          <div>
            <h4 className="font-medium">{alert.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {format(new Date(alert.created_at), "dd MMM yyyy 'às' HH:mm", { locale: pt })}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onResolve}>
          Resolver
        </Button>
      </div>
    </div>
  );
};

export default function Budget() {
  const { user } = useAuthContext();
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<BudgetEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<BudgetEntry | null>(null);
  
  const { data: entries = [], isLoading: loadingEntries } = useBudgetEntries(selectedProjectId);
  const { data: summary, isLoading: loadingSummary } = useBudgetSummary(selectedProjectId);
  const { data: categoryData = [] } = useBudgetEntriesByCategory(selectedProjectId);
  const { data: monthlyData = {} } = useBudgetEntriesByMonth(selectedProjectId);
  const { data: phaseData = [] } = useBudgetEntriesByPhase(selectedProjectId);
  const { data: alerts = [] } = useBudgetAlerts(selectedProjectId);
  
  const deleteEntry = useDeleteBudgetEntry();
  const updateStatus = useUpdateBudgetEntryStatus();
  const resolveAlert = useResolveAlert();
  
  const isLoading = loadingProjects || loadingEntries || loadingSummary;
  
  // Prepare chart data
  const monthlyChartData = useMemo(() => {
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, values]) => ({
        month: format(new Date(month + '-01'), 'MMM yy', { locale: pt }),
        planeado: values.planned,
        executado: values.actual,
      }));
  }, [monthlyData]);
  
  const pieChartData = useMemo(() => {
    return categoryData.map((cat, index) => ({
      name: cat.name,
      value: cat.actual,
      fill: COLORS[index % COLORS.length],
    }));
  }, [categoryData]);
  
  const handleEditEntry = (entry: BudgetEntry) => {
    setSelectedEntry(entry);
    setIsEntryModalOpen(true);
  };
  
  const handleDeleteEntry = (entry: BudgetEntry) => {
    setDeleteConfirm(entry);
  };
  
  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteEntry.mutate({ entryId: deleteConfirm.id, projectId: deleteConfirm.project_id });
      setDeleteConfirm(null);
    }
  };
  
  const handleStatusChange = (entryId: string, status: string) => {
    updateStatus.mutate({ 
      id: entryId, 
      status: status as any,
      approvedBy: user?.id
    });
  };
  
  const handleResolveAlert = (alertId: string) => {
    if (user?.id) {
      resolveAlert.mutate({ alertId, userId: user.id });
    }
  };
  
  const chartConfig = {
    planeado: { label: "Planeado", color: "hsl(217, 91%, 60%)" },
    executado: { label: "Executado", color: "hsl(142, 76%, 36%)" },
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestão Orçamental</h1>
          <p className="text-muted-foreground">
            Centro de custos, planeado vs executado e alertas de desvio
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedProjectId || "all"} onValueChange={(v) => setSelectedProjectId(v === "all" ? undefined : v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todos os projectos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os projectos</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => setIsReportModalOpen(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Relatório
          </Button>
          <Button onClick={() => { setSelectedEntry(null); setIsEntryModalOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Entrada
          </Button>
        </div>
      </div>
      
      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <Card className="border-yellow-500/50">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-yellow-500" />
              <CardTitle className="text-lg">Alertas de Orçamento ({alerts.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.slice(0, 3).map((alert) => (
              <AlertCard 
                key={alert.id} 
                alert={alert} 
                onResolve={() => handleResolveAlert(alert.id)}
              />
            ))}
          </CardContent>
        </Card>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Wallet className="h-4 w-4" />
                  <span className="text-sm font-medium">Orçamento Planeado</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(summary?.totalPlanned || 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Executado</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(summary?.totalActual || 0)}</p>
                <Progress value={summary?.executionPercentage || 0} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {(summary?.executionPercentage || 0).toFixed(1)}% executado
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  {(summary?.variance || 0) >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm font-medium">Variação</span>
                </div>
                <p className={`text-2xl font-bold ${(summary?.variance || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(summary?.variance || 0))}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(summary?.variancePercentage || 0) >= 0 ? 'Abaixo' : 'Acima'} do planeado
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm font-medium">Pendente Aprovação</span>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(summary?.pendingAmount || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {entries.filter(e => e.status === 'pending').length} entradas pendentes
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
            <CardDescription>Planeado vs Executado por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value).replace(' AOA', '')} 
                    className="text-xs" 
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="planeado" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="executado" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Categoria</CardTitle>
            <CardDescription>Custos executados por centro de custo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Phase Breakdown */}
      {phaseData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Orçamento por Fase</CardTitle>
            <CardDescription>Comparação planeado vs executado por fase do projecto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {phaseData.map((phase) => {
                const variance = phase.planned - phase.actual;
                const percentage = phase.planned > 0 ? (phase.actual / phase.planned) * 100 : 0;
                
                return (
                  <div key={phase.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{phase.name}</span>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span>Plan: {formatCurrency(phase.planned)}</span>
                        <span>Exec: {formatCurrency(phase.actual)}</span>
                        <span className={variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <Progress value={Math.min(percentage, 100)} className="h-3" />
                      {percentage > 100 && (
                        <div 
                          className="absolute top-0 left-0 h-3 bg-red-500/30 rounded-full"
                          style={{ width: `${Math.min(percentage, 150)}%` }}
                        />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground text-right">
                      {percentage.toFixed(1)}% executado
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Entries Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Entradas Orçamentais</CardTitle>
              <CardDescription>Histórico de custos planeados e executados</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Todas ({entries.length})</TabsTrigger>
              <TabsTrigger value="pending">
                Pendentes ({entries.filter(e => e.status === 'pending').length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Aprovadas ({entries.filter(e => e.status === 'approved').length})
              </TabsTrigger>
              <TabsTrigger value="paid">
                Pagas ({entries.filter(e => e.status === 'paid').length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <EntriesTable 
                entries={entries}
                onEdit={handleEditEntry}
                onDelete={handleDeleteEntry}
                onStatusChange={handleStatusChange}
              />
            </TabsContent>
            <TabsContent value="pending" className="mt-4">
              <EntriesTable 
                entries={entries.filter(e => e.status === 'pending')}
                onEdit={handleEditEntry}
                onDelete={handleDeleteEntry}
                onStatusChange={handleStatusChange}
              />
            </TabsContent>
            <TabsContent value="approved" className="mt-4">
              <EntriesTable 
                entries={entries.filter(e => e.status === 'approved')}
                onEdit={handleEditEntry}
                onDelete={handleDeleteEntry}
                onStatusChange={handleStatusChange}
              />
            </TabsContent>
            <TabsContent value="paid" className="mt-4">
              <EntriesTable 
                entries={entries.filter(e => e.status === 'paid')}
                onEdit={handleEditEntry}
                onDelete={handleDeleteEntry}
                onStatusChange={handleStatusChange}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Modals */}
      <BudgetEntryModal
        open={isEntryModalOpen}
        onOpenChange={setIsEntryModalOpen}
        entry={selectedEntry}
        projects={projects}
        defaultProjectId={selectedProjectId}
      />
      
      <BudgetReportModal
        open={isReportModalOpen}
        onOpenChange={setIsReportModalOpen}
        projects={projects}
        defaultProjectId={selectedProjectId}
      />
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar entrada?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A entrada "{deleteConfirm?.description}" será permanentemente eliminada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
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

// Entries Table Component
function EntriesTable({ 
  entries, 
  onEdit, 
  onDelete,
  onStatusChange
}: { 
  entries: BudgetEntry[];
  onEdit: (entry: BudgetEntry) => void;
  onDelete: (entry: BudgetEntry) => void;
  onStatusChange: (entryId: string, status: string) => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Nenhuma entrada orçamental encontrada.</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Fase</TableHead>
            <TableHead className="text-right">Planeado</TableHead>
            <TableHead className="text-right">Executado</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const status = statusConfig[entry.status];
            const StatusIcon = status.icon;
            const variance = Number(entry.planned_amount) - Number(entry.actual_amount);
            
            return (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">
                  {format(new Date(entry.entry_date), 'dd/MM/yyyy')}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{entry.description}</p>
                    {entry.supplier && (
                      <p className="text-xs text-muted-foreground">{entry.supplier}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {entry.category?.name || '-'}
                </TableCell>
                <TableCell>
                  {entry.phase_name || '-'}
                </TableCell>
                <TableCell className="text-right">
                  {Number(entry.planned_amount).toLocaleString()} AOA
                </TableCell>
                <TableCell className="text-right">
                  <div>
                    <p>{Number(entry.actual_amount).toLocaleString()} AOA</p>
                    {variance !== 0 && (
                      <p className={`text-xs ${variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {variance > 0 ? '+' : ''}{variance.toLocaleString()}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Select 
                    value={entry.status} 
                    onValueChange={(v) => onStatusChange(entry.id, v)}
                  >
                    <SelectTrigger className="w-[120px] h-8">
                      <Badge className={`${status.className} flex items-center gap-1`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </Badge>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="approved">Aprovado</SelectItem>
                      <SelectItem value="rejected">Rejeitado</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(entry)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete(entry)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
