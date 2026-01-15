import { useState } from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import {
  FileText,
  Download,
  Upload,
  Clock,
  MessageSquare,
  History,
  CheckCircle,
  XCircle,
  Send,
  GitBranch,
  User,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  useDocument,
  useDocumentVersions,
  useDocumentWorkflows,
  useDocumentComments,
  useDocumentHistory,
  useAddComment,
  useResolveComment,
  useUpdateWorkflowStatus,
  downloadDocumentVersion,
} from '@/hooks/useDocuments';
import { VersionUploadModal } from './VersionUploadModal';
import { WorkflowModal } from './WorkflowModal';
import {
  DOCUMENT_STATUS_LABELS,
  WORKFLOW_STATUS_LABELS,
  WORKFLOW_TYPE_LABELS,
  type DocumentStatus,
  type WorkflowStatus,
  type WorkflowType,
} from '@/types/document';

interface DocumentDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-500',
  pending_review: 'bg-yellow-500',
  in_review: 'bg-blue-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  archived: 'bg-gray-400',
};

const workflowStatusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  in_progress: 'bg-blue-500',
  approved: 'bg-green-500',
  rejected: 'bg-red-500',
  cancelled: 'bg-gray-400',
};

export function DocumentDetailModal({
  open,
  onOpenChange,
  documentId,
}: DocumentDetailModalProps) {
  const [showVersionUpload, setShowVersionUpload] = useState(false);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [newComment, setNewComment] = useState('');

  const { data: document } = useDocument(documentId);
  const { data: versions = [] } = useDocumentVersions(documentId);
  const { data: workflows = [] } = useDocumentWorkflows(documentId);
  const { data: comments = [] } = useDocumentComments(documentId);
  const { data: history = [] } = useDocumentHistory(documentId);

  const addComment = useAddComment();
  const resolveComment = useResolveComment();
  const updateWorkflowStatus = useUpdateWorkflowStatus();

  if (!document) return null;

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await addComment.mutateAsync({
      document_id: documentId,
      content: newComment,
    });
    setNewComment('');
  };

  const handleWorkflowAction = async (workflowId: string, action: 'approved' | 'rejected') => {
    await updateWorkflowStatus.mutateAsync({
      workflowId,
      status: action,
      documentId,
    });
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      created: 'Documento criado',
      version_uploaded: 'Nova versão carregada',
      status_changed: 'Estado alterado',
      workflow_started: 'Workflow iniciado',
      workflow_completed: 'Workflow concluído',
      comment_added: 'Comentário adicionado',
    };
    return labels[action] || action;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {document.title}
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {document.project?.name || 'Sem projecto'} 
                  {document.phase_name && ` • ${document.phase_name}`}
                </p>
              </div>
              <Badge className={statusColors[document.status]}>
                {DOCUMENT_STATUS_LABELS[document.status as DocumentStatus]}
              </Badge>
            </div>
          </DialogHeader>

          <div className="flex gap-2 mb-4">
            <Button onClick={() => setShowVersionUpload(true)} size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Nova Versão
            </Button>
            <Button onClick={() => setShowWorkflow(true)} size="sm" variant="outline">
              <GitBranch className="h-4 w-4 mr-2" />
              Iniciar Workflow
            </Button>
          </div>

          <Tabs defaultValue="versions" className="flex-1 overflow-hidden flex flex-col">
            <TabsList>
              <TabsTrigger value="versions" className="gap-2">
                <FileText className="h-4 w-4" />
                Versões ({versions.length})
              </TabsTrigger>
              <TabsTrigger value="workflows" className="gap-2">
                <GitBranch className="h-4 w-4" />
                Workflows ({workflows.length})
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Comentários ({comments.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                Histórico
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-4">
              <TabsContent value="versions" className="m-0">
                <div className="space-y-3">
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2 rounded">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            v{version.version_number} - {version.file_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(version.file_size)} •{' '}
                            {format(new Date(version.created_at), "dd MMM yyyy 'às' HH:mm", { locale: pt })}
                          </p>
                          {version.change_summary && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {version.change_summary}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadDocumentVersion(version.file_path, version.file_name)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                  {versions.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma versão carregada. Clique em "Nova Versão" para adicionar.
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="workflows" className="m-0">
                <div className="space-y-3">
                  {workflows.map((workflow) => (
                    <div
                      key={workflow.id}
                      className="p-4 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className={workflowStatusColors[workflow.status]}>
                            {WORKFLOW_STATUS_LABELS[workflow.status as WorkflowStatus]}
                          </Badge>
                          <span className="font-medium">
                            {WORKFLOW_TYPE_LABELS[workflow.workflow_type as WorkflowType]}
                          </span>
                        </div>
                        {workflow.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600"
                              onClick={() => handleWorkflowAction(workflow.id, 'approved')}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600"
                              onClick={() => handleWorkflowAction(workflow.id, 'rejected')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Rejeitar
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(workflow.created_at), "dd MMM yyyy", { locale: pt })}
                          </span>
                          {workflow.due_date && (
                            <span>Prazo: {format(new Date(workflow.due_date), "dd MMM yyyy", { locale: pt })}</span>
                          )}
                        </div>
                        {workflow.notes && <p className="mt-1">{workflow.notes}</p>}
                      </div>
                    </div>
                  ))}
                  {workflows.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum workflow. Clique em "Iniciar Workflow" para criar.
                    </p>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="comments" className="m-0">
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Adicionar comentário..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim() || addComment.isPending}
                      size="icon"
                      className="self-end"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div
                        key={comment.id}
                        className={`p-4 rounded-lg ${comment.is_resolved ? 'bg-green-50 dark:bg-green-900/20' : 'bg-muted/50'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{comment.user_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(comment.created_at), "dd MMM 'às' HH:mm", { locale: pt })}
                            </span>
                          </div>
                          {!comment.is_resolved && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => resolveComment.mutate({ commentId: comment.id, documentId })}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolver
                            </Button>
                          )}
                        </div>
                        <p className="text-sm">{comment.content}</p>
                        {comment.is_resolved && (
                          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Resolvido
                          </p>
                        )}
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum comentário ainda.
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="m-0">
                <div className="space-y-2">
                  {history.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg"
                    >
                      <History className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{getActionLabel(entry.action)}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(entry.created_at), "dd MMM yyyy 'às' HH:mm", { locale: pt })}
                        </p>
                        {entry.action_details && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {JSON.stringify(entry.action_details)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum histórico disponível.
                    </p>
                  )}
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      <VersionUploadModal
        open={showVersionUpload}
        onOpenChange={setShowVersionUpload}
        documentId={documentId}
        documentTitle={document.title}
        currentVersion={document.current_version}
      />

      <WorkflowModal
        open={showWorkflow}
        onOpenChange={setShowWorkflow}
        documentId={documentId}
        documentTitle={document.title}
      />
    </>
  );
}
