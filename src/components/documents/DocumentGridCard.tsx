import { useState, useCallback } from 'react';
import {
  Upload,
  MoreHorizontal,
  GitBranch,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  File,
  FileSpreadsheet,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  DOCUMENT_STATUS_LABELS,
  type Document,
  type DocumentStatus,
} from '@/types/document';

const statusConfig: Record<DocumentStatus, { icon: typeof Clock; color: string; bgColor: string }> = {
  draft: { icon: FileText, color: 'text-muted-foreground', bgColor: 'bg-muted' },
  pending_review: { icon: Clock, color: 'text-warning', bgColor: 'bg-warning/10' },
  in_review: { icon: AlertCircle, color: 'text-info', bgColor: 'bg-info/10' },
  approved: { icon: CheckCircle2, color: 'text-success', bgColor: 'bg-success/10' },
  rejected: { icon: XCircle, color: 'text-destructive', bgColor: 'bg-destructive/10' },
  archived: { icon: FolderOpen, color: 'text-muted-foreground', bgColor: 'bg-muted' },
};

const typeConfig: Record<string, { icon: typeof FileText; color: string }> = {
  general: { icon: File, color: 'text-muted-foreground' },
  report: { icon: FileText, color: 'text-primary' },
  contract: { icon: FileText, color: 'text-destructive' },
  proposal: { icon: FileText, color: 'text-warning' },
  policy: { icon: FileText, color: 'text-info' },
  procedure: { icon: FileText, color: 'text-success' },
  template: { icon: FileSpreadsheet, color: 'text-primary' },
  memo: { icon: FileText, color: 'text-muted-foreground' },
  minutes: { icon: FileText, color: 'text-info' },
  invoice: { icon: FileSpreadsheet, color: 'text-success' },
};

interface DocumentGridCardProps {
  doc: Document;
  onView: (doc: Document) => void;
  onUploadVersion: (doc: Document) => void;
  onStartWorkflow: (doc: Document) => void;
  onDownload: (doc: Document) => void;
  onDelete: (doc: Document) => void;
  onFileDrop: (doc: Document, file: File) => void;
}

export function DocumentGridCard({
  doc,
  onView,
  onUploadVersion,
  onStartWorkflow,
  onDownload,
  onDelete,
  onFileDrop,
}: DocumentGridCardProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFileDrop(doc, files[0]);
    }
  }, [doc, onFileDrop]);

  const TypeIcon = typeConfig[doc.document_type]?.icon || File;
  const typeColor = typeConfig[doc.document_type]?.color || 'text-muted-foreground';
  const StatusIcon = statusConfig[doc.status as DocumentStatus]?.icon || Clock;
  const statusColor = statusConfig[doc.status as DocumentStatus]?.color || 'text-muted-foreground';
  const statusBg = statusConfig[doc.status as DocumentStatus]?.bgColor || 'bg-muted';

  return (
    <Card
      className={cn(
        'hover:shadow-md transition-all cursor-pointer group relative',
        isDragOver && 'ring-2 ring-primary ring-offset-2'
      )}
      onClick={() => onView(doc)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <CardContent className="p-4">
        <div className="flex flex-col h-full">
          <div className="flex items-start justify-between mb-3">
            <div className={cn('p-3 rounded-lg', statusBg)}>
              <TypeIcon className={cn('h-6 w-6', typeColor)} />
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
                <DropdownMenuItem onClick={() => onUploadVersion(doc)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Nova Versão
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStartWorkflow(doc)}>
                  <GitBranch className="h-4 w-4 mr-2" />
                  Iniciar Workflow
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onDownload(doc)}>
                  <Download className="h-4 w-4 mr-2" />
                  Descarregar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(doc)}>
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
            <Badge className={cn('gap-1 text-xs', statusBg, statusColor, 'border-0')}>
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

      {/* Drop overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center pointer-events-none">
          <div className="bg-background/95 px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary">Soltar para nova versão</span>
          </div>
        </div>
      )}
    </Card>
  );
}
