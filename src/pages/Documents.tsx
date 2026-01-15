import { useState } from "react";
import {
  Plus,
  Search,
  Upload,
  FolderOpen,
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  Download,
  MoreHorizontal,
  Grid,
  List,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  GitBranch,
  MessageSquare,
  Loader2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { useDocuments, useDeleteDocument, usePendingWorkflows, useDownloadFile } from "@/hooks/useDocuments";
import { useProjects } from "@/hooks/useProjects";
import { DocumentFormModal } from "@/components/documents/DocumentFormModal";
import { VersionUploadModal } from "@/components/documents/VersionUploadModal";
import { WorkflowModal } from "@/components/documents/WorkflowModal";
import { DocumentDetailModal } from "@/components/documents/DocumentDetailModal";
import { 
  DOCUMENT_STATUS_LABELS, 
  DOCUMENT_TYPE_OPTIONS,
  type Document,
  type DocumentStatus 
} from "@/types/document";
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
import { toast } from "sonner";

const statusConfig: Record<DocumentStatus, { icon: typeof Clock; color: string; bgColor: string }> = {
  draft: { icon: FileText, color: "text-muted-foreground", bgColor: "bg-muted" },
  pending_review: { icon: Clock, color: "text-warning", bgColor: "bg-warning/10" },
  in_review: { icon: AlertCircle, color: "text-info", bgColor: "bg-info/10" },
  approved: { icon: CheckCircle2, color: "text-success", bgColor: "bg-success/10" },
  rejected: { icon: XCircle, color: "text-destructive", bgColor: "bg-destructive/10" },
  archived: { icon: FolderOpen, color: "text-muted-foreground", bgColor: "bg-muted" },
};

const typeConfig: Record<string, { icon: typeof FileText; color: string }> = {
  general: { icon: File, color: "text-muted-foreground" },
  report: { icon: FileText, color: "text-primary" },
  contract: { icon: FileText, color: "text-destructive" },
  proposal: { icon: FileText, color: "text-warning" },
  policy: { icon: FileText, color: "text-info" },
  procedure: { icon: FileText, color: "text-success" },
  template: { icon: FileSpreadsheet, color: "text-primary" },
  memo: { icon: FileText, color: "text-muted-foreground" },
  minutes: { icon: FileText, color: "text-info" },
  invoice: { icon: FileSpreadsheet, color: "text-success" },
};

export default function Documents() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Queries
  const { data: documents = [], isLoading } = useDocuments();
  const { data: pendingWorkflows = [] } = usePendingWorkflows();
  const { data: projects = [] } = useProjects();
  const deleteDocument = useDeleteDocument();
  const downloadFile = useDownloadFile();

  // Filter documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.project?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    const matchesProject = projectFilter === "all" || doc.project_id === projectFilter;
    const matchesType = typeFilter === "all" || doc.document_type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesProject && matchesType;
  });

  // Stats
  const stats = {
    total: documents.length,
    pending: documents.filter(d => d.status === 'pending_review' || d.status === 'in_review').length,
    approved: documents.filter(d => d.status === 'approved').length,
    myWorkflows: pendingWorkflows.length,
  };

  const handleViewDocument = (doc: Document) => {
    setSelectedDocument(doc);
    setShowDetailModal(true);
  };

  const handleUploadVersion = (doc: Document) => {
    setSelectedDocument(doc);
    setShowVersionModal(true);
  };

  const handleStartWorkflow = (doc: Document) => {
    setSelectedDocument(doc);
    setShowWorkflowModal(true);
  };

  const handleDeleteClick = (doc: Document) => {
    setSelectedDocument(doc);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDocument) return;
    try {
      await deleteDocument.mutateAsync(selectedDocument.id);
      setShowDeleteDialog(false);
      setSelectedDocument(null);
    } catch (error) {
      // Error handled in hook
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      await downloadFile.mutateAsync(doc.id);
    } catch (error) {
      toast.error("Erro ao descarregar ficheiro");
    }
  };

  const getTypeIcon = (type: string) => {
    return typeConfig[type]?.icon || File;
  };

  const getTypeColor = (type: string) => {
    return typeConfig[type]?.color || "text-muted-foreground";
  };

  const getTypeLabel = (type: string) => {
    return DOCUMENT_TYPE_OPTIONS.find(t => t.value === type)?.label || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão Documental</h1>
          <p className="text-muted-foreground">
            Gerir documentos, versões, workflows e aprovações.
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Novo Documento
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Em Revisão</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Aprovados</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <AlertCircle className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Meus Workflows</p>
                <p className="text-2xl font-bold">{stats.myWorkflows}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Todos os Documentos</TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pendentes
            {stats.myWorkflows > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {stats.myWorkflows}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6 space-y-4">
          {/* Search & Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar documentos..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Estados</SelectItem>
                  {Object.entries(DOCUMENT_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Projecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Projectos</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Tipos</SelectItem>
                  {DOCUMENT_TYPE_OPTIONS.map((type) => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
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

          {/* Document List */}
          {filteredDocs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum documento encontrado</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== "all" || projectFilter !== "all" || typeFilter !== "all"
                    ? "Tente ajustar os filtros de pesquisa."
                    : "Comece por criar um novo documento."}
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Documento
                </Button>
              </CardContent>
            </Card>
          ) : viewMode === "list" ? (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium text-muted-foreground">Documento</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Projecto</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Tipo</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Versão</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Estado</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Atualizado</th>
                      <th className="p-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocs.map((doc) => {
                      const TypeIcon = getTypeIcon(doc.document_type);
                      const StatusIcon = statusConfig[doc.status as DocumentStatus]?.icon || Clock;
                      const statusColor = statusConfig[doc.status as DocumentStatus]?.color || "text-muted-foreground";
                      const statusBg = statusConfig[doc.status as DocumentStatus]?.bgColor || "bg-muted";
                      
                      return (
                        <tr 
                          key={doc.id} 
                          className="border-b hover:bg-accent/50 cursor-pointer transition-colors"
                          onClick={() => handleViewDocument(doc)}
                        >
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={cn("p-2 rounded-lg", statusBg)}>
                                <TypeIcon className={cn("h-5 w-5", getTypeColor(doc.document_type))} />
                              </div>
                              <div>
                                <p className="font-medium">{doc.title}</p>
                                {doc.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-1">{doc.description}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="text-sm">{doc.project?.name || "—"}</span>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline">{getTypeLabel(doc.document_type)}</Badge>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1 text-sm">
                              <GitBranch className="h-4 w-4 text-muted-foreground" />
                              v{doc.current_version}
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge className={cn("gap-1", statusBg, statusColor, "border-0")}>
                              <StatusIcon className="h-3 w-3" />
                              {DOCUMENT_STATUS_LABELS[doc.status as DocumentStatus]}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {format(new Date(doc.updated_at), "dd MMM yyyy", { locale: pt })}
                          </td>
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDocument(doc)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUploadVersion(doc)}>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Nova Versão
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStartWorkflow(doc)}>
                                  <GitBranch className="h-4 w-4 mr-2" />
                                  Iniciar Workflow
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Descarregar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={() => handleDeleteClick(doc)}
                                >
                                  Eliminar
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocs.map((doc) => {
                const TypeIcon = getTypeIcon(doc.document_type);
                const StatusIcon = statusConfig[doc.status as DocumentStatus]?.icon || Clock;
                const statusColor = statusConfig[doc.status as DocumentStatus]?.color || "text-muted-foreground";
                const statusBg = statusConfig[doc.status as DocumentStatus]?.bgColor || "bg-muted";
                
                return (
                  <Card 
                    key={doc.id} 
                    className="hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => handleViewDocument(doc)}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col h-full">
                        <div className="flex items-start justify-between mb-3">
                          <div className={cn("p-3 rounded-lg", statusBg)}>
                            <TypeIcon className={cn("h-6 w-6", getTypeColor(doc.document_type))} />
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleUploadVersion(doc)}>
                                <Upload className="h-4 w-4 mr-2" />
                                Nova Versão
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleStartWorkflow(doc)}>
                                <GitBranch className="h-4 w-4 mr-2" />
                                Iniciar Workflow
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                <Download className="h-4 w-4 mr-2" />
                                Descarregar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDeleteClick(doc)}
                              >
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <h3 className="font-medium line-clamp-2 mb-1">{doc.title}</h3>
                        {doc.project?.name && (
                          <p className="text-sm text-muted-foreground mb-2">{doc.project.name}</p>
                        )}
                        <div className="mt-auto pt-3 flex items-center justify-between">
                          <Badge className={cn("gap-1 text-xs", statusBg, statusColor, "border-0")}>
                            <StatusIcon className="h-3 w-3" />
                            {DOCUMENT_STATUS_LABELS[doc.status as DocumentStatus]}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <GitBranch className="h-3 w-3" />
                            v{doc.current_version}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pending" className="mt-6 space-y-4">
          {pendingWorkflows.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Tudo em dia!</h3>
                <p className="text-muted-foreground">
                  Não tem workflows pendentes de ação.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingWorkflows.map((workflow: any) => (
                <Card key={workflow.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-lg bg-warning/10">
                          <AlertCircle className="h-6 w-6 text-warning" />
                        </div>
                        <div>
                          <h4 className="font-medium">{workflow.document?.title || "Documento"}</h4>
                          <p className="text-sm text-muted-foreground">
                            {workflow.document?.project?.name || "Sem projecto"}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {workflow.workflow_type === 'approval' ? 'Aprovação' : 
                               workflow.workflow_type === 'review' ? 'Revisão' : 'Assinatura'}
                            </Badge>
                            {workflow.due_date && (
                              <span className="text-xs text-muted-foreground">
                                Prazo: {format(new Date(workflow.due_date), "dd/MM/yyyy")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button 
                        onClick={() => {
                          const doc = documents.find(d => d.id === workflow.document_id);
                          if (doc) handleViewDocument(doc);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Analisar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <DocumentFormModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal} 
      />
      
      {selectedDocument && (
        <>
          <VersionUploadModal
            open={showVersionModal}
            onOpenChange={setShowVersionModal}
            documentId={selectedDocument.id}
            documentTitle={selectedDocument.title}
            currentVersion={selectedDocument.current_version}
          />
          <WorkflowModal
            open={showWorkflowModal}
            onOpenChange={setShowWorkflowModal}
            documentId={selectedDocument.id}
            documentTitle={selectedDocument.title}
          />
          <DocumentDetailModal
            open={showDetailModal}
            onOpenChange={setShowDetailModal}
            documentId={selectedDocument.id}
          />
        </>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar Documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem a certeza que deseja eliminar o documento "{selectedDocument?.title}"? 
              Esta ação irá eliminar todas as versões e histórico associados e não pode ser revertida.
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
