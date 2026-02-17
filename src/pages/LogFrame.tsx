import { useState, useMemo } from "react";
import { Plus, Grid3X3, TreePine, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useProjects } from "@/hooks/useProjects";
import {
  useLogFrameLevels, useLogFrameIndicators, useCreateLogFrameLevel,
  useUpdateLogFrameLevel, useDeleteLogFrameLevel, useCreateLogFrameIndicator,
  useUpdateLogFrameIndicator, useDeleteLogFrameIndicator, buildLogFrameTree,
} from "@/hooks/useLogFrame";
import { LogFrameLevel, LogFrameIndicator, LOGFRAME_LEVEL_CONFIG, LOGFRAME_HIERARCHY, LogFrameLevelType } from "@/types/logframe";
import { LogFrameLevelCard } from "@/components/logframe/LogFrameLevelCard";
import { LogFrameLevelFormModal } from "@/components/logframe/LogFrameLevelFormModal";
import { LogFrameIndicatorFormModal } from "@/components/logframe/LogFrameIndicatorFormModal";
import { cn } from "@/lib/utils";
import { TheoryOfChange } from "@/components/logframe/TheoryOfChange";

export default function LogFrame() {
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const { data: levels = [], isLoading: levelsLoading } = useLogFrameLevels(selectedProjectId || undefined);
  const { data: indicators = [], isLoading: indicatorsLoading } = useLogFrameIndicators(selectedProjectId || undefined);

  // Modal state
  const [levelModal, setLevelModal] = useState(false);
  const [levelType, setLevelType] = useState<LogFrameLevelType>("goal");
  const [parentId, setParentId] = useState<string | null>(null);
  const [editingLevel, setEditingLevel] = useState<LogFrameLevel | null>(null);
  const [indicatorModal, setIndicatorModal] = useState(false);
  const [indicatorLevelId, setIndicatorLevelId] = useState<string>("");
  const [editingIndicator, setEditingIndicator] = useState<LogFrameIndicator | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "level" | "indicator"; id: string } | null>(null);

  // Mutations
  const createLevel = useCreateLogFrameLevel();
  const updateLevel = useUpdateLogFrameLevel();
  const deleteLevel = useDeleteLogFrameLevel();
  const createIndicator = useCreateLogFrameIndicator();
  const updateIndicator = useUpdateLogFrameIndicator();
  const deleteIndicator = useDeleteLogFrameIndicator();

  const tree = useMemo(() => buildLogFrameTree(levels, indicators), [levels, indicators]);
  const isLoading = levelsLoading || indicatorsLoading;

  const handleAddRoot = (type: LogFrameLevelType) => {
    setLevelType(type);
    setParentId(null);
    setEditingLevel(null);
    setLevelModal(true);
  };

  const handleAddChild = (pid: string, type: LogFrameLevelType) => {
    setLevelType(type);
    setParentId(pid);
    setEditingLevel(null);
    setLevelModal(true);
  };

  const handleEditLevel = (level: LogFrameLevel) => {
    setLevelType(level.level_type);
    setParentId(level.parent_id);
    setEditingLevel(level);
    setLevelModal(true);
  };

  const handleLevelSubmit = (values: { narrative: string; means_of_verification: string; assumptions: string }) => {
    if (editingLevel) {
      updateLevel.mutate({ id: editingLevel.id, project_id: selectedProjectId, ...values }, { onSuccess: () => setLevelModal(false) });
    } else {
      const position = levels.filter(l => l.level_type === levelType && l.parent_id === parentId).length;
      createLevel.mutate({ project_id: selectedProjectId, parent_id: parentId, level_type: levelType, position, ...values }, { onSuccess: () => setLevelModal(false) });
    }
  };

  const handleAddIndicator = (levelId: string) => {
    setIndicatorLevelId(levelId);
    setEditingIndicator(null);
    setIndicatorModal(true);
  };

  const handleEditIndicator = (ind: LogFrameIndicator) => {
    setIndicatorLevelId(ind.level_id);
    setEditingIndicator(ind);
    setIndicatorModal(true);
  };

  const handleIndicatorSubmit = (values: any) => {
    const parsed = {
      level_id: editingIndicator?.level_id || indicatorLevelId,
      name: values.name,
      description: values.description || null,
      unit: values.unit || null,
      baseline_value: values.baseline_value ? Number(values.baseline_value) : null,
      target_value: values.target_value ? Number(values.target_value) : null,
      current_value: values.current_value ? Number(values.current_value) : null,
      data_source: values.data_source || null,
      frequency: values.frequency || null,
      responsible: values.responsible || null,
    };
    if (editingIndicator) {
      updateIndicator.mutate({ id: editingIndicator.id, projectId: selectedProjectId, ...parsed }, { onSuccess: () => setIndicatorModal(false) });
    } else {
      createIndicator.mutate({ projectId: selectedProjectId, ...parsed } as any, { onSuccess: () => setIndicatorModal(false) });
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "level") {
      deleteLevel.mutate({ id: deleteConfirm.id, projectId: selectedProjectId });
    } else {
      deleteIndicator.mutate({ id: deleteConfirm.id, projectId: selectedProjectId });
    }
    setDeleteConfirm(null);
  };

  // Matrix view data
  const matrixRows = useMemo(() => {
    const rows: { level: LogFrameLevel; depth: number }[] = [];
    const flatten = (items: LogFrameLevel[], depth: number) => {
      items.forEach(item => {
        rows.push({ level: item, depth });
        if (item.children) flatten(item.children, depth + 1);
      });
    };
    flatten(tree, 0);
    return rows;
  }, [tree]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Quadro Lógico (LogFrame)</h1>
          <p className="text-sm text-muted-foreground mt-1">Hierarquia de objectivos, resultados e indicadores conforme padrão do Banco Mundial</p>
        </div>
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="w-72">
            <SelectValue placeholder="Seleccionar projecto" />
          </SelectTrigger>
          <SelectContent>
            {(projects || []).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {!selectedProjectId ? (
        <Card className="p-12 text-center">
          <Grid3X3 className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <p className="text-muted-foreground mt-4">Seleccione um projecto para visualizar ou criar o Quadro Lógico.</p>
        </Card>
      ) : (
        <Tabs defaultValue="tree">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="tree" className="gap-2"><TreePine className="h-4 w-4" /> Hierarquia</TabsTrigger>
              <TabsTrigger value="toc" className="gap-2"><GitBranch className="h-4 w-4" /> Teoria da Mudança</TabsTrigger>
              <TabsTrigger value="matrix" className="gap-2"><Grid3X3 className="h-4 w-4" /> Matriz</TabsTrigger>
            </TabsList>
            <Button onClick={() => handleAddRoot("goal")} className="gap-2">
              <Plus className="h-4 w-4" /> Objectivo Geral
            </Button>
          </div>

          <TabsContent value="tree">
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
            ) : tree.length === 0 ? (
              <Card className="p-12 text-center">
                <TreePine className="h-12 w-12 mx-auto text-muted-foreground/40" />
                <p className="text-muted-foreground mt-4">Nenhum nível definido. Comece adicionando um Objectivo Geral.</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {tree.map(level => (
                  <LogFrameLevelCard
                    key={level.id}
                    level={level}
                    projectId={selectedProjectId}
                    onAddChild={handleAddChild}
                    onEdit={handleEditLevel}
                    onDelete={(id) => setDeleteConfirm({ type: "level", id })}
                    onAddIndicator={handleAddIndicator}
                    onEditIndicator={handleEditIndicator}
                    onDeleteIndicator={(id) => setDeleteConfirm({ type: "indicator", id })}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="toc">
            {isLoading ? (
              <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
            ) : (
              <TheoryOfChange levels={levels} indicators={indicators} />
            )}
          </TabsContent>

          <TabsContent value="matrix">
            <Card>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Nível</TableHead>
                      <TableHead>Narrativa</TableHead>
                      <TableHead>Indicadores</TableHead>
                      <TableHead>Meios de Verificação</TableHead>
                      <TableHead>Pressupostos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matrixRows.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum dado</TableCell></TableRow>
                    ) : (
                      matrixRows.map(({ level, depth }) => {
                        const cfg = LOGFRAME_LEVEL_CONFIG[level.level_type];
                        return (
                          <TableRow key={level.id}>
                            <TableCell>
                              <div style={{ paddingLeft: depth * 16 }}>
                                <Badge className={cn("text-white text-[10px]", cfg.color)}>{cfg.label}</Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{level.narrative}</TableCell>
                            <TableCell className="text-xs">
                              {level.indicators && level.indicators.length > 0 ? (
                                <ul className="space-y-1">
                                  {level.indicators.map(ind => (
                                    <li key={ind.id}>
                                      <span className="font-medium">{ind.name}</span>
                                      {ind.target_value != null && <span className="text-muted-foreground"> (Meta: {ind.target_value}{ind.unit ? ` ${ind.unit}` : ''})</span>}
                                    </li>
                                  ))}
                                </ul>
                              ) : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="text-xs">{level.means_of_verification || <span className="text-muted-foreground">—</span>}</TableCell>
                            <TableCell className="text-xs">{level.assumptions || <span className="text-muted-foreground">—</span>}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Modals */}
      <LogFrameLevelFormModal
        open={levelModal}
        onOpenChange={setLevelModal}
        levelType={levelType}
        editingLevel={editingLevel}
        onSubmit={handleLevelSubmit}
        isLoading={createLevel.isPending || updateLevel.isPending}
      />
      <LogFrameIndicatorFormModal
        open={indicatorModal}
        onOpenChange={setIndicatorModal}
        editingIndicator={editingIndicator}
        onSubmit={handleIndicatorSubmit}
        isLoading={createIndicator.isPending || updateIndicator.isPending}
      />
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminação</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === "level"
                ? "Isto irá remover este nível e todos os seus sub-níveis e indicadores."
                : "Isto irá remover permanentemente este indicador."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
