import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, X, CheckSquare } from "lucide-react";
import { useScrumConfig, useUpsertScrumConfig } from "@/hooks/useScrum";
import { Skeleton } from "@/components/ui/skeleton";

interface DefinitionOfDoneProps {
  projectId: string;
}

export function DefinitionOfDone({ projectId }: DefinitionOfDoneProps) {
  const { data: config, isLoading } = useScrumConfig(projectId);
  const upsertConfig = useUpsertScrumConfig();
  const [newItem, setNewItem] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const items = config?.definition_of_done || [];

  const handleAdd = () => {
    if (!newItem.trim()) return;
    const updated = [...items, newItem.trim()];
    upsertConfig.mutate({
      projectId,
      definition_of_done: updated,
    });
    setNewItem("");
    setIsAdding(false);
  };

  const handleRemove = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    upsertConfig.mutate({
      projectId,
      definition_of_done: updated,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <CheckSquare className="h-4 w-4" />
            Definition of Done
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setIsAdding(!isAdding)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 && !isAdding && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Nenhum critério definido. Adicione critérios de conclusão.
          </p>
        )}
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-2 group">
            <Checkbox checked disabled className="mt-0.5" />
            <span className="text-xs flex-1">{item}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0"
              onClick={() => handleRemove(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
        {isAdding && (
          <div className="flex items-center gap-2">
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Ex: Testes unitários passam"
              className="h-7 text-xs"
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              autoFocus
            />
            <Button size="sm" className="h-7 text-xs" onClick={handleAdd}>
              Adicionar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
