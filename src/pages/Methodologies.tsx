import { useState } from "react";
import { 
  Building2, 
  Landmark, 
  GraduationCap, 
  Heart, 
  Cpu,
  Plus,
  ChevronRight,
  FileText,
  Clock,
  CheckCircle2,
  MoreVertical,
  Pencil,
  Trash2,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useSectors, useProjectTemplates, useTemplatePhases, useAllTemplateDeliverables, useDeleteProjectTemplate } from "@/hooks/useMethodologies";
import { ProjectTemplate, Sector } from "@/types/methodology";
import TemplateFormModal from "@/components/methodologies/TemplateFormModal";
import TemplateDetailModal from "@/components/methodologies/TemplateDetailModal";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  Landmark,
  GraduationCap,
  Heart,
  Cpu,
};

const SectorCard = ({ 
  sector, 
  templates,
  onSelectTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onCreateTemplate
}: { 
  sector: Sector;
  templates: ProjectTemplate[];
  onSelectTemplate: (template: ProjectTemplate) => void;
  onEditTemplate: (template: ProjectTemplate) => void;
  onDeleteTemplate: (template: ProjectTemplate) => void;
  onCreateTemplate: (sectorId: string) => void;
}) => {
  const IconComponent = iconMap[sector.icon || "FileText"] || FileText;
  
  return (
    <Card className="group hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div 
            className="p-3 rounded-xl"
            style={{ backgroundColor: sector.color ? `${sector.color.replace(')', ' / 0.15)')}` : 'hsl(var(--primary) / 0.15)' }}
          >
            <IconComponent 
              className="h-6 w-6" 
              style={{ color: sector.color || 'hsl(var(--primary))' }}
            />
          </div>
          <Badge variant="secondary" className="text-xs">
            {templates.length} {templates.length === 1 ? 'template' : 'templates'}
          </Badge>
        </div>
        <CardTitle className="text-lg mt-3">{sector.name}</CardTitle>
        <CardDescription className="text-sm">
          {sector.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {templates.map((template) => (
          <TemplateRow 
            key={template.id}
            template={template}
            sectorColor={sector.color}
            onSelect={() => onSelectTemplate(template)}
            onEdit={() => onEditTemplate(template)}
            onDelete={() => onDeleteTemplate(template)}
          />
        ))}
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-foreground"
          onClick={() => onCreateTemplate(sector.id)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo template
        </Button>
      </CardContent>
    </Card>
  );
};

const TemplateRow = ({ 
  template, 
  sectorColor,
  onSelect,
  onEdit,
  onDelete 
}: { 
  template: ProjectTemplate;
  sectorColor?: string | null;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const { data: phases = [] } = useTemplatePhases(template.id);
  const { data: deliverables = [] } = useAllTemplateDeliverables(template.id);
  
  const totalDuration = phases.reduce((sum, p) => sum + (p.duration_days || 0), 0);
  
  return (
    <div 
      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors group/row"
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{template.name}</span>
          {template.is_default && (
            <Badge variant="outline" className="text-xs shrink-0">Padrão</Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            {phases.length} fases
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {deliverables.length} entregáveis
          </span>
          {totalDuration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {totalDuration} dias
            </span>
          )}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect(); }}>
            <Eye className="h-4 w-4 mr-2" />
            Ver detalhes
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(); }}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default function Methodologies() {
  const { data: sectors = [], isLoading: loadingSectors } = useSectors();
  const { data: templates = [], isLoading: loadingTemplates } = useProjectTemplates();
  const deleteTemplate = useDeleteProjectTemplate();
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [selectedSectorId, setSelectedSectorId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<ProjectTemplate | null>(null);
  
  const isLoading = loadingSectors || loadingTemplates;
  
  const getTemplatesForSector = (sectorId: string) => {
    return templates.filter(t => t.sector_id === sectorId);
  };
  
  const handleCreateTemplate = (sectorId: string) => {
    setSelectedSectorId(sectorId);
    setSelectedTemplate(null);
    setIsFormModalOpen(true);
  };
  
  const handleEditTemplate = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setSelectedSectorId(template.sector_id);
    setIsFormModalOpen(true);
  };
  
  const handleSelectTemplate = (template: ProjectTemplate) => {
    setSelectedTemplate(template);
    setIsDetailModalOpen(true);
  };
  
  const handleDeleteTemplate = (template: ProjectTemplate) => {
    setDeleteConfirm(template);
  };
  
  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteTemplate.mutate(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Metodologias</h1>
          <p className="text-muted-foreground">
            Modelos de projecto por sector com fases, entregáveis e documentos
          </p>
        </div>
      </div>
      
      {/* Sectors Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-12 w-12 rounded-xl" />
                <Skeleton className="h-5 w-32 mt-3" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sectors.map((sector) => (
            <SectorCard
              key={sector.id}
              sector={sector}
              templates={getTemplatesForSector(sector.id)}
              onSelectTemplate={handleSelectTemplate}
              onEditTemplate={handleEditTemplate}
              onDeleteTemplate={handleDeleteTemplate}
              onCreateTemplate={handleCreateTemplate}
            />
          ))}
        </div>
      )}
      
      {/* Template Form Modal */}
      <TemplateFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        template={selectedTemplate}
        sectorId={selectedSectorId}
        sectors={sectors}
      />
      
      {/* Template Detail Modal */}
      <TemplateDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        template={selectedTemplate}
      />
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar template?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O template "{deleteConfirm?.name}" e todas as suas fases, entregáveis e documentos serão permanentemente eliminados.
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
