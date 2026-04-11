import { useState } from "react";
import { Shield, CheckCircle, Clock, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useDigitalApprovals, DigitalApproval } from "@/hooks/useDigitalApprovals";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface DigitalApprovalPanelProps {
  entityType: string;
  entityId: string;
  entityLabel?: string;
}

export function DigitalApprovalPanel({ entityType, entityId, entityLabel }: DigitalApprovalPanelProps) {
  const { approvals, loading, submitApproval } = useDigitalApprovals(entityType, entityId);
  const [showDialog, setShowDialog] = useState(false);
  const [comment, setComment] = useState("");

  const handleSubmit = async () => {
    if (!comment.trim()) return;
    await submitApproval.mutateAsync({
      entity_type: entityType,
      entity_id: entityId,
      comment: comment.trim(),
    });
    setComment("");
    setShowDialog(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Aprovações Digitais
          </CardTitle>
          <Button size="sm" onClick={() => setShowDialog(true)}>
            <CheckCircle className="h-4 w-4 mr-1" />
            Aprovar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">A carregar...</p>
        ) : approvals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem aprovações registadas.</p>
        ) : (
          <div className="space-y-3">
            {approvals.map((a: DigitalApproval) => (
              <div key={a.id} className="flex items-start gap-3 p-2 rounded border">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{a.approver_name || "Utilizador"}</span>
                    <Badge variant="outline" className="text-xs">{a.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{a.comment}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(a.approved_at), "dd/MM/yyyy HH:mm", { locale: pt })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registar Aprovação Digital</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {entityLabel && (
              <p className="text-sm text-muted-foreground">
                A aprovar: <strong>{entityLabel}</strong>
              </p>
            )}
            <div>
              <Textarea
                placeholder="Comentário de aprovação (obrigatório)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!comment.trim() || submitApproval.isPending}>
              <Shield className="h-4 w-4 mr-1" />
              Confirmar Aprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
