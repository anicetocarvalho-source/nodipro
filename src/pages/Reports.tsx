import { useState } from "react";
import { FileText, Download, Calendar, Filter, Clock, User, Activity, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const reportTemplates = [
  { id: "1", name: "Relatório de Status do Projecto", type: "project", format: "PDF" },
  { id: "2", name: "Relatório de Portfólio Executivo", type: "portfolio", format: "PDF" },
  { id: "3", name: "Relatório de Desempenho da Equipa", type: "team", format: "Excel" },
  { id: "4", name: "Relatório Financeiro Mensal", type: "financial", format: "PDF" },
  { id: "5", name: "Relatório de Riscos Activos", type: "risk", format: "PDF" },
  { id: "6", name: "Relatório de KPIs", type: "kpi", format: "Excel" },
];

const recentReports = [
  {
    id: "1",
    name: "Status Projecto - Sistema Financeiro",
    type: "project",
    generatedBy: "João Miguel",
    generatedAt: "10 Jan 2026, 14:30",
    format: "PDF",
    size: "2.4 MB",
  },
  {
    id: "2",
    name: "Portfólio Q4 2025",
    type: "portfolio",
    generatedBy: "Maria Silva",
    generatedAt: "09 Jan 2026, 11:15",
    format: "PDF",
    size: "5.8 MB",
  },
  {
    id: "3",
    name: "Desempenho Equipa Alpha - Dezembro",
    type: "team",
    generatedBy: "Pedro Alves",
    generatedAt: "08 Jan 2026, 09:00",
    format: "Excel",
    size: "1.2 MB",
  },
];

const auditLogs = [
  {
    id: "1",
    action: "Documento carregado",
    details: "Proposta Comercial v2.pdf",
    user: "João Miguel",
    timestamp: "10 Jan 2026, 15:45",
    module: "Documentos",
  },
  {
    id: "2",
    action: "Tarefa concluída",
    details: "Análise de requisitos - Sprint 4",
    user: "Maria Silva",
    timestamp: "10 Jan 2026, 14:30",
    module: "Projectos",
  },
  {
    id: "3",
    action: "Risco registado",
    details: "Atraso na entrega de requisitos",
    user: "Carlos Ferreira",
    timestamp: "10 Jan 2026, 11:20",
    module: "Riscos",
  },
  {
    id: "4",
    action: "Relatório gerado",
    details: "Status Projecto - Sistema Financeiro",
    user: "João Miguel",
    timestamp: "10 Jan 2026, 10:00",
    module: "Relatórios",
  },
  {
    id: "5",
    action: "Membro adicionado",
    details: "Ana Costa → Equipa Portal Gov",
    user: "Pedro Alves",
    timestamp: "09 Jan 2026, 16:45",
    module: "Equipa",
  },
  {
    id: "6",
    action: "Orçamento actualizado",
    details: "ERP Corporativo +15%",
    user: "Sofia Lima",
    timestamp: "09 Jan 2026, 15:30",
    module: "Orçamento",
  },
  {
    id: "7",
    action: "Projecto criado",
    details: "Sistema de Recursos Humanos - TAAG",
    user: "João Miguel",
    timestamp: "09 Jan 2026, 09:00",
    module: "Projectos",
  },
];

const typeConfig = {
  project: { label: "Projecto", className: "bg-primary/10 text-primary" },
  portfolio: { label: "Portfólio", className: "bg-success/10 text-success" },
  team: { label: "Equipa", className: "bg-info/10 text-info" },
  financial: { label: "Financeiro", className: "bg-warning/10 text-warning" },
  risk: { label: "Riscos", className: "bg-destructive/10 text-destructive" },
  kpi: { label: "KPIs", className: "bg-chart-5/10 text-chart-5" },
};

export default function Reports() {
  const [selectedProject, setSelectedProject] = useState("");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios e Auditoria</h1>
          <p className="text-muted-foreground">
            Gerar relatórios e consultar logs de actividade.
          </p>
        </div>
      </div>

      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate">Gerar Relatório</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="audit">Logs de Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="mt-6 space-y-6">
          {/* Report Generator */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gerar Novo Relatório</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo de Relatório</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="project">Status do Projecto</SelectItem>
                      <SelectItem value="portfolio">Portfólio Executivo</SelectItem>
                      <SelectItem value="team">Desempenho da Equipa</SelectItem>
                      <SelectItem value="financial">Financeiro</SelectItem>
                      <SelectItem value="risk">Riscos</SelectItem>
                      <SelectItem value="kpi">KPIs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Projecto</label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os projectos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os projectos</SelectItem>
                      <SelectItem value="1">Sistema de Gestão Financeira</SelectItem>
                      <SelectItem value="2">Portal de Serviços Públicos</SelectItem>
                      <SelectItem value="3">App Mobile Bancário</SelectItem>
                      <SelectItem value="4">ERP Corporativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Formato</label>
                  <Select defaultValue="pdf">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="bg-primary hover:bg-primary/90">
                <FileText className="h-4 w-4 mr-2" />
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>

          {/* Report Templates */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Templates Disponíveis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{template.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={cn("text-xs", typeConfig[template.type as keyof typeof typeConfig].className)}>
                            {typeConfig[template.type as keyof typeof typeConfig].label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{template.format}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Relatórios Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentReports.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{report.name}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {report.generatedBy}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {report.generatedAt}
                          </span>
                          <span>{report.size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{report.format}</Badge>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="mt-6 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Input placeholder="Pesquisar nos logs..." />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Módulo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os módulos</SelectItem>
                    <SelectItem value="projects">Projectos</SelectItem>
                    <SelectItem value="documents">Documentos</SelectItem>
                    <SelectItem value="team">Equipa</SelectItem>
                    <SelectItem value="budget">Orçamento</SelectItem>
                    <SelectItem value="risks">Riscos</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Calendar className="h-4 w-4 mr-2" />
                  Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Logs de Actividade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent/30 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-muted">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{log.action}</span>
                        <Badge variant="secondary" className="text-xs">
                          {log.module}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{log.details}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {log.user}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {log.timestamp}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
