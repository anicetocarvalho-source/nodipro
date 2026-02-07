import { useState } from "react";
import { Plus, ChevronRight, ChevronDown, Trash2, Pencil, Check, X, FileText, Target, Link2, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DbBriefingModule, BriefingModuleType } from "@/types/database";
import { useBriefingModules, useAddBriefingModule, useUpdateBriefingModule, useDeleteBriefingModule } from "@/hooks/useBriefings";

const moduleTypeConfig: Record<BriefingModuleType, { icon: React.ElementType; label: string; color: string }> = {
  section: { icon: FileText, label: "Secção", color: "text-blue-500" },
  objective: { icon: Target, label: "Objectivo", color: "text-green-500" },
  requirement: { icon: Layers, label: "Requisito", color: "text-orange-500" },
  dependency: { icon: Link2, label: "Dependência", color: "text-red-500" },
};

interface Props {
  briefingId: string;
  readOnly?: boolean;
}

export function BriefingEditor({ briefingId, readOnly }: Props) {
  const { data: modules = [], isLoading } = useBriefingModules(briefingId);
  const addModule = useAddBriefingModule();
  const updateModule = useUpdateBriefingModule();
  const deleteModule = useDeleteBriefingModule();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [newModuleParent, setNewModuleParent] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<BriefingModuleType>("section");

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const buildTree = (parentId: string | null, level: number): DbBriefingModule[] => {
    return modules
      .filter((m) => m.parent_id === parentId)
      .sort((a, b) => a.position - b.position)
      .map((m) => ({ ...m, level }));
  };

  const handleAdd = (parentId: string | null) => {
    if (!newTitle.trim()) return;
    const siblings = modules.filter((m) => m.parent_id === parentId);
    addModule.mutate({
      briefing_id: briefingId,
      title: newTitle.trim(),
      level: parentId ? (modules.find((m) => m.id === parentId)?.level || 0) + 1 : 0,
      parent_id: parentId || undefined,
      position: siblings.length,
      module_type: newType,
    });
    setNewTitle("");
    setNewModuleParent(null);
  };

  const handleStartEdit = (mod: DbBriefingModule) => {
    setEditingId(mod.id);
    setEditTitle(mod.title);
    setEditContent(mod.content || "");
  };

  const handleSaveEdit = () => {
    if (!editingId) return;
    updateModule.mutate({
      id: editingId,
      briefingId,
      title: editTitle,
      content: editContent || undefined,
    });
    setEditingId(null);
  };

  const renderModule = (mod: DbBriefingModule, depth: number): React.ReactNode => {
    const children = modules.filter((m) => m.parent_id === mod.id);
    const isExpanded = expandedIds.has(mod.id);
    const isEditing = editingId === mod.id;
    const TypeIcon = moduleTypeConfig[mod.module_type as BriefingModuleType]?.icon || FileText;
    const typeColor = moduleTypeConfig[mod.module_type as BriefingModuleType]?.color || "text-muted-foreground";

    return (
      <div key={mod.id} className="border-l-2 border-border/50" style={{ marginLeft: depth > 0 ? 16 : 0 }}>
        <div className={cn("flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 group transition-colors", isEditing && "bg-muted/50")}>
          {/* Expand button */}
          <button onClick={() => toggleExpand(mod.id)} className="mt-0.5 shrink-0">
            {children.length > 0 ? (
              isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            ) : (
              <span className="w-4" />
            )}
          </button>

          <TypeIcon className={cn("h-4 w-4 mt-0.5 shrink-0", typeColor)} />

          {isEditing ? (
            <div className="flex-1 space-y-2">
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-7 text-sm" />
              <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={2} className="text-sm" placeholder="Conteúdo..." />
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleSaveEdit}><Check className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingId(null)}><X className="h-3 w-3" /></Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{mod.title}</span>
                <Badge variant="outline" className="text-[10px] h-4">
                  {moduleTypeConfig[mod.module_type as BriefingModuleType]?.label || mod.module_type}
                </Badge>
                {mod.status === "completed" && <Badge className="text-[10px] h-4 bg-green-500/20 text-green-700">Concluído</Badge>}
              </div>
              {mod.content && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{mod.content}</p>}
            </div>
          )}

          {/* Actions */}
          {!readOnly && !isEditing && (
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleStartEdit(mod)}>
                <Pencil className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setNewModuleParent(mod.id); setExpandedIds((p) => new Set(p).add(mod.id)); }}>
                <Plus className="h-3 w-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => deleteModule.mutate({ id: mod.id, briefingId })}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Add child module inline */}
        {newModuleParent === mod.id && (
          <div className="ml-8 p-2 flex gap-2 items-center">
            <Select value={newType} onValueChange={(v) => setNewType(v as BriefingModuleType)}>
              <SelectTrigger className="w-[120px] h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(moduleTypeConfig).map(([k, v]) => (
                  <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input placeholder="Título..." className="h-7 text-sm flex-1" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd(mod.id)} />
            <Button size="sm" className="h-7 text-xs" onClick={() => handleAdd(mod.id)} disabled={addModule.isPending}>Adicionar</Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setNewModuleParent(null)}>Cancelar</Button>
          </div>
        )}

        {/* Children */}
        {isExpanded && children.map((child) => renderModule(child, depth + 1))}
      </div>
    );
  };

  const rootModules = modules.filter((m) => !m.parent_id).sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-3">
      {rootModules.map((mod) => renderModule(mod, 0))}

      {/* Add root module */}
      {!readOnly && newModuleParent === null && (
        <div className="flex gap-2 items-center pt-2 border-t">
          <Select value={newType} onValueChange={(v) => setNewType(v as BriefingModuleType)}>
            <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(moduleTypeConfig).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-xs">{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Novo módulo raiz..." className="h-8 text-sm flex-1" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAdd(null)} />
          <Button size="sm" className="h-8" onClick={() => handleAdd(null)} disabled={addModule.isPending}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
          </Button>
        </div>
      )}

      {modules.length === 0 && !isLoading && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Sem módulos definidos. Adicione o primeiro módulo do briefing.
        </div>
      )}
    </div>
  );
}
