import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FolderKanban, CheckSquare, FileText, Loader2 } from "lucide-react";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { useGlobalSearch, SearchResult } from "@/hooks/useGlobalSearch";

interface GlobalSearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TYPE_CONFIG = {
  project: { label: "Projectos", icon: FolderKanban },
  task: { label: "Tarefas", icon: CheckSquare },
  document: { label: "Documentos", icon: FileText },
} as const;

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  completed: "secondary",
  delayed: "destructive",
  on_hold: "outline",
  high: "destructive",
  medium: "default",
  low: "secondary",
  draft: "outline",
  approved: "secondary",
};

export function GlobalSearchCommand({ open, onOpenChange }: GlobalSearchCommandProps) {
  const navigate = useNavigate();
  const { query, setQuery, results, isLoading, debouncedQuery } = useGlobalSearch();

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) setQuery("");
  }, [open, setQuery]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      onOpenChange(false);
      navigate(result.href);
    },
    [navigate, onOpenChange]
  );

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.type] ??= []).push(r);
    return acc;
  }, {});

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Pesquisar projectos, tarefas, documentos..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {isLoading && debouncedQuery.length >= 2 && (
          <div className="flex items-center justify-center py-6 text-sm text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            A pesquisar...
          </div>
        )}

        {!isLoading && debouncedQuery.length >= 2 && results.length === 0 && (
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        )}

        {debouncedQuery.length < 2 && (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Digite pelo menos 2 caracteres para pesquisar...
          </div>
        )}

        {Object.entries(grouped).map(([type, items], idx) => {
          const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG];
          const Icon = config.icon;
          return (
            <div key={type}>
              {idx > 0 && <CommandSeparator />}
              <CommandGroup heading={config.label}>
                {items.map((item) => (
                  <CommandItem
                    key={`${item.type}-${item.id}`}
                    value={`${item.type}-${item.title}`}
                    onSelect={() => handleSelect(item)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="truncate font-medium">{item.title}</span>
                      {item.subtitle && (
                        <span className="text-xs text-muted-foreground truncate">
                          {item.subtitle}
                        </span>
                      )}
                    </div>
                    {item.status && (
                      <Badge
                        variant={STATUS_VARIANT[item.status] ?? "outline"}
                        className="shrink-0 text-[10px]"
                      >
                        {item.status}
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
