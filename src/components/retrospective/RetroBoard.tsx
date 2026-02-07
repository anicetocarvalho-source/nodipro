import { useState } from "react";
import { Plus, ThumbsUp, Loader2, MessageSquare, Target, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { RETRO_CATEGORIES, RetroCategory, DbRetroItem, DbRetroFeedback, DbRetroAction } from "@/types/database";
import {
  useRetroItems, useRetroFeedback, useRetroActions,
  useAddRetroItem, useVoteRetroItem, useSubmitRetroFeedback,
  useAddRetroAction, useUpdateRetroAction, useCompleteRetrospective,
} from "@/hooks/useRetrospectives";

interface Props {
  retroId: string;
  sprintId: string;
  userId: string;
  userName: string;
  isCompleted?: boolean;
}

export function RetroBoard({ retroId, sprintId, userId, userName, isCompleted }: Props) {
  const { data: items = [], isLoading: itemsLoading } = useRetroItems(retroId);
  const { data: feedback = [] } = useRetroFeedback(retroId);
  const { data: actions = [] } = useRetroActions(retroId);
  const addItem = useAddRetroItem();
  const voteItem = useVoteRetroItem();
  const submitFeedback = useSubmitRetroFeedback();
  const addAction = useAddRetroAction();
  const updateAction = useUpdateRetroAction();
  const completeRetro = useCompleteRetrospective();

  const [newItems, setNewItems] = useState<Record<string, string>>({});
  const [satisfaction, setSatisfaction] = useState(3);
  const [velocity, setVelocity] = useState(3);
  const [notes, setNotes] = useState("");
  const [newActionDesc, setNewActionDesc] = useState("");

  const myFeedback = feedback.find((f) => f.user_id === userId);
  const avgSatisfaction = feedback.length > 0
    ? (feedback.reduce((sum, f) => sum + (f.satisfaction_rating || 0), 0) / feedback.length).toFixed(1)
    : "-";
  const avgVelocity = feedback.length > 0
    ? (feedback.reduce((sum, f) => sum + (f.velocity_rating || 0), 0) / feedback.length).toFixed(1)
    : "-";

  const handleAddItem = (category: RetroCategory) => {
    const content = newItems[category]?.trim();
    if (!content) return;
    addItem.mutate({
      retrospective_id: retroId,
      category,
      content,
      author_id: userId,
      author_name: userName,
    });
    setNewItems((prev) => ({ ...prev, [category]: "" }));
  };

  const handleVote = (itemId: string) => {
    voteItem.mutate({ itemId, userId, retroId });
  };

  const handleSubmitFeedback = () => {
    submitFeedback.mutate({
      retrospective_id: retroId,
      user_id: userId,
      user_name: userName,
      satisfaction_rating: satisfaction,
      velocity_rating: velocity,
      notes: notes || undefined,
    });
  };

  const handleAddAction = () => {
    if (!newActionDesc.trim()) return;
    addAction.mutate({ retrospective_id: retroId, description: newActionDesc.trim() });
    setNewActionDesc("");
  };

  if (itemsLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Category columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {RETRO_CATEGORIES.map(({ value, label, icon, color }) => {
          const categoryItems = items.filter((i) => i.category === value);
          return (
            <Card key={value} className={cn("border-2", color)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span>{icon}</span> {label}
                  <Badge variant="outline" className="ml-auto">{categoryItems.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Items */}
                {categoryItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 p-2 rounded-md bg-background/80 border text-sm">
                    <div className="flex-1">
                      <p>{item.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">{item.author_name || "Anónimo"}</p>
                    </div>
                    <Button
                      variant="ghost" size="sm"
                      className="shrink-0 h-7 gap-1 text-xs"
                      onClick={() => handleVote(item.id)}
                      disabled={isCompleted}
                    >
                      <ThumbsUp className="h-3 w-3" />
                      {item.votes_count}
                    </Button>
                  </div>
                ))}

                {/* Add new */}
                {!isCompleted && (
                  <div className="flex gap-1.5">
                    <Input
                      placeholder="Adicionar..."
                      className="text-sm h-8"
                      value={newItems[value] || ""}
                      onChange={(e) => setNewItems((prev) => ({ ...prev, [value]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && handleAddItem(value)}
                    />
                    <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={() => handleAddItem(value)} disabled={addItem.isPending}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator />

      {/* Feedback section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My feedback */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" /> Meu Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {myFeedback ? (
              <div className="space-y-2 text-sm">
                <p>Satisfação: <strong>{myFeedback.satisfaction_rating}/5</strong></p>
                <p>Velocidade: <strong>{myFeedback.velocity_rating}/5</strong></p>
                {myFeedback.notes && <p className="text-muted-foreground">{myFeedback.notes}</p>}
                <Badge variant="outline" className="text-green-600">Submetido</Badge>
              </div>
            ) : !isCompleted ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Satisfação do Sprint ({satisfaction}/5)</label>
                  <Slider value={[satisfaction]} onValueChange={([v]) => setSatisfaction(v)} min={1} max={5} step={1} className="mt-2" />
                </div>
                <div>
                  <label className="text-sm font-medium">Velocidade da Equipa ({velocity}/5)</label>
                  <Slider value={[velocity]} onValueChange={([v]) => setVelocity(v)} min={1} max={5} step={1} className="mt-2" />
                </div>
                <Textarea placeholder="Notas ou observações..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                <Button onClick={handleSubmitFeedback} disabled={submitFeedback.isPending} className="w-full">
                  Submeter Feedback
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sem feedback submetido.</p>
            )}
          </CardContent>
        </Card>

        {/* Team metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4" /> Métricas da Equipa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">{avgSatisfaction}</p>
                <p className="text-xs text-muted-foreground">Satisfação Média</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">{avgVelocity}</p>
                <p className="text-xs text-muted-foreground">Velocidade Média</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50 col-span-2">
                <p className="text-2xl font-bold">{feedback.length}</p>
                <p className="text-xs text-muted-foreground">Respostas Recebidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Action items */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-4 w-4" /> Action Items
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {actions.map((action) => (
            <div key={action.id} className="flex items-center gap-3 p-2 border rounded-md">
              <input
                type="checkbox"
                checked={action.status === "done"}
                onChange={() => updateAction.mutate({ id: action.id, retroId, status: action.status === "done" ? "pending" : "done" })}
                disabled={isCompleted}
                className="h-4 w-4 rounded border-border"
              />
              <span className={cn("flex-1 text-sm", action.status === "done" && "line-through text-muted-foreground")}>
                {action.description}
              </span>
              {action.assignee_name && (
                <Badge variant="outline" className="text-xs">{action.assignee_name}</Badge>
              )}
            </div>
          ))}
          {!isCompleted && (
            <div className="flex gap-2">
              <Input placeholder="Nova acção..." className="text-sm" value={newActionDesc} onChange={(e) => setNewActionDesc(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddAction()} />
              <Button size="sm" onClick={handleAddAction} disabled={addAction.isPending}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete retro */}
      {!isCompleted && (
        <div className="flex justify-end">
          <Button
            variant="default"
            onClick={() => completeRetro.mutate({ id: retroId, sprintId })}
            disabled={completeRetro.isPending}
          >
            Concluir Retrospetiva
          </Button>
        </div>
      )}
    </div>
  );
}
