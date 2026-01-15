import { useState } from "react";
import { 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Plus, 
  Trash2,
  Upload,
  Download,
  ChevronDown,
  GripVertical,
  Pencil
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  useTemplatePhases, 
  useTemplateDeliverables,
  useTemplateDocuments,
  useDeleteTemplatePhase,
  useDeleteTemplateDeliverable,
  useDeleteTemplateDocument
} from "@/hooks/useMethodologies";
import { ProjectTemplate, TemplatePhase } from "@/types/methodology";
import { supabase } from "@/integrations/supabase/client";
import PhaseFormModal from "./PhaseFormModal";
import DeliverableFormModal from "./DeliverableFormModal";
import DocumentUploadModal from "./DocumentUploadModal";

interface TemplateDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: ProjectTemplate | null;
}

const PhaseSection = ({ 
  phase, 
  templateId,
  onEdit,
  onDelete 
}: { 
  phase: TemplatePhase;
  templateId: string;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const { data: deliverables = [] } = useTemplateDeliverables(phase.id);
  const deleteDeliverable = useDeleteTemplateDeliverable();
  
  const [isDeliverableModalOpen, setIsDeliverableModalOpen] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState<any>(null);
  
  const handleDeleteDeliverable = (deliverableId: string) => {
    deleteDeliverable.mutate({ deliverableId, phaseId: phase.id });
  };
  
  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
              <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
            </Button>
          </CollapsibleTrigger>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{phase.name}</span>
              {phase.duration_days && (
                <Badge variant="outline" className="text-xs shrink-0">
                  <Clock className="h-3 w-3 mr-1" />
                  {phase.duration_days} dias
                </Badge>
              )}
            </div>
            {phase.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {phase.description}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-destructive"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        
        <CollapsibleContent className="pl-8 space-y-1">
          {deliverables.map((deliverable) => (
            <div 
              key={deliverable.id}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 group/item"
            >
              <CheckCircle2 className={`h-4 w-4 shrink-0 ${deliverable.is_mandatory ? 'text-primary' : 'text-muted-foreground'}`} />
              <div className="flex-1 min-w-0">
                <span className="text-sm">{deliverable.name}</span>
                {!deliverable.is_mandatory && (
                  <Badge variant="secondary" className="ml-2 text-xs">Opcional</Badge>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6"
                  onClick={() => {
                    setSelectedDeliverable(deliverable);
                    setIsDeliverableModalOpen(true);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 text-destructive"
                  onClick={() => handleDeleteDeliverable(deliverable.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full justify-start text-muted-foreground hover:text-foreground text-xs h-8"
            onClick={() => {
              setSelectedDeliverable(null);
              setIsDeliverableModalOpen(true);
            }}
          >
            <Plus className="h-3 w-3 mr-1" />
            Adicionar entregável
          </Button>
        </CollapsibleContent>
      </Collapsible>
      
      <DeliverableFormModal
        open={isDeliverableModalOpen}
        onOpenChange={setIsDeliverableModalOpen}
        phaseId={phase.id}
        deliverable={selectedDeliverable}
        existingCount={deliverables.length}
      />
    </>
  );
};

export default function TemplateDetailModal({
  open,
  onOpenChange,
  template,
}: TemplateDetailModalProps) {
  const { data: phases = [] } = useTemplatePhases(template?.id);
  const { data: documents = [] } = useTemplateDocuments(template?.id);
  const deletePhase = useDeleteTemplatePhase();
  const deleteDocument = useDeleteTemplateDocument();
  
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<TemplatePhase | null>(null);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
  
  if (!template) return null;
  
  const totalDuration = phases.reduce((sum, p) => sum + (p.duration_days || 0), 0);
  
  const handleEditPhase = (phase: TemplatePhase) => {
    setSelectedPhase(phase);
    setIsPhaseModalOpen(true);
  };
  
  const handleDeletePhase = (phaseId: string) => {
    deletePhase.mutate({ phaseId, templateId: template.id });
  };
  
  const handleDownloadDocument = async (filePath: string, fileName: string) => {
    const { data } = await supabase.storage
      .from("document-templates")
      .createSignedUrl(filePath, 60);
    
    if (data?.signedUrl) {
      const link = document.createElement('a');
      link.href = data.signedUrl;
      link.download = fileName;
      link.click();
    }
  };
  
  const handleDeleteDocument = (documentId: string, filePath?: string) => {
    deleteDocument.mutate({ 
      documentId, 
      templateId: template.id, 
      filePath: filePath || undefined 
    });
  };
  
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl">{template.name}</DialogTitle>
                {template.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {template.description}
                  </p>
                )}
              </div>
              {template.is_default && (
                <Badge>Padrão</Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <ChevronRight className="h-4 w-4" />
                {phases.length} fases
              </span>
              {totalDuration > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {totalDuration} dias totais
                </span>
              )}
              <span className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                {documents.length} documentos
              </span>
            </div>
          </DialogHeader>
          
          <Separator />
          
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-6 py-4">
              {/* Phases Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Fases do Projecto</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedPhase(null);
                      setIsPhaseModalOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Nova Fase
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {phases.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhuma fase definida. Adicione fases para estruturar o template.
                    </p>
                  ) : (
                    phases.map((phase) => (
                      <PhaseSection
                        key={phase.id}
                        phase={phase}
                        templateId={template.id}
                        onEdit={() => handleEditPhase(phase)}
                        onDelete={() => handleDeletePhase(phase.id)}
                      />
                    ))
                  )}
                </div>
              </div>
              
              <Separator />
              
              {/* Documents Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Documentos Template</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsDocumentModalOpen(true)}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Upload
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {documents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum documento template. Faça upload de documentos modelo.
                    </p>
                  ) : (
                    documents.map((doc) => (
                      <div 
                        key={doc.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                      >
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.file_type} • {formatFileSize(doc.file_size)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {doc.file_path && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => handleDownloadDocument(doc.file_path!, doc.name)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteDocument(doc.id, doc.file_path || undefined)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      <PhaseFormModal
        open={isPhaseModalOpen}
        onOpenChange={setIsPhaseModalOpen}
        templateId={template.id}
        phase={selectedPhase}
        existingCount={phases.length}
      />
      
      <DocumentUploadModal
        open={isDocumentModalOpen}
        onOpenChange={setIsDocumentModalOpen}
        templateId={template.id}
        phases={phases}
      />
    </>
  );
}
