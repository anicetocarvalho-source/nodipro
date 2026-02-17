import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Target, Zap, Package, Activity, Info, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { LogFrameLevel, LogFrameIndicator, LogFrameLevelType, LOGFRAME_LEVEL_CONFIG } from "@/types/logframe";
import { buildLogFrameTree } from "@/hooks/useLogFrame";

interface TheoryOfChangeProps {
  levels: LogFrameLevel[];
  indicators: LogFrameIndicator[];
}

const levelIcons: Record<LogFrameLevelType, React.ComponentType<{ className?: string }>> = {
  goal: Target,
  purpose: Zap,
  output: Package,
  activity: Activity,
};

const levelColors: Record<LogFrameLevelType, {
  bg: string; border: string; accent: string; text: string; line: string;
}> = {
  activity: {
    bg: "bg-amber-500/10", border: "border-amber-500/30", accent: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400", line: "from-amber-500",
  },
  output: {
    bg: "bg-emerald-500/10", border: "border-emerald-500/30", accent: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400", line: "from-emerald-500",
  },
  purpose: {
    bg: "bg-blue-500/10", border: "border-blue-500/30", accent: "bg-blue-500",
    text: "text-blue-700 dark:text-blue-400", line: "from-blue-500",
  },
  goal: {
    bg: "bg-purple-500/10", border: "border-purple-500/30", accent: "bg-purple-500",
    text: "text-purple-700 dark:text-purple-400", line: "from-purple-500",
  },
};

// ToC flows bottom-to-top: Activities → Outputs → Purposes → Goals
const TOC_ORDER: LogFrameLevelType[] = ["activity", "output", "purpose", "goal"];

export function TheoryOfChange({ levels, indicators }: TheoryOfChangeProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  // Group levels by type
  const levelsByType = useMemo(() => {
    const grouped: Record<LogFrameLevelType, (LogFrameLevel & { _indicators: LogFrameIndicator[] })[]> = {
      goal: [], purpose: [], output: [], activity: [],
    };
    levels.forEach(l => {
      const levelIndicators = indicators.filter(i => i.level_id === l.id);
      grouped[l.level_type]?.push({ ...l, _indicators: levelIndicators });
    });
    return grouped;
  }, [levels, indicators]);

  // Build connections: child → parent relationships
  const connections = useMemo(() => {
    return levels
      .filter(l => l.parent_id)
      .map(l => ({ from: l.id, to: l.parent_id! }));
  }, [levels]);

  if (levels.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Target className="h-12 w-12 mx-auto text-muted-foreground/40" />
        <p className="text-muted-foreground mt-4">
          Adicione níveis ao Quadro Lógico para visualizar a Teoria da Mudança.
        </p>
      </Card>
    );
  }

  const selectedLevel = selectedNode ? levels.find(l => l.id === selectedNode) : null;
  const selectedIndicators = selectedNode ? indicators.filter(i => i.level_id === selectedNode) : [];

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="text-muted-foreground font-medium">Cadeia de Resultados:</span>
        {TOC_ORDER.map((type, i) => {
          const cfg = LOGFRAME_LEVEL_CONFIG[type];
          const colors = levelColors[type];
          return (
            <span key={type} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/50" />}
              <span className={cn("h-2.5 w-2.5 rounded-full", colors.accent)} />
              <span className={colors.text}>{cfg.pluralLabel}</span>
              <Badge variant="secondary" className="text-[10px] h-4 px-1">
                {levelsByType[type].length}
              </Badge>
            </span>
          );
        })}
      </div>

      {/* Flow Diagram - Bottom to Top */}
      <div className="relative space-y-2">
        {TOC_ORDER.map((type, tierIndex) => {
          const items = levelsByType[type];
          if (items.length === 0) return null;
          const cfg = LOGFRAME_LEVEL_CONFIG[type];
          const colors = levelColors[type];

          return (
            <div key={type}>
              {/* Connector arrows between tiers */}
              {tierIndex > 0 && levelsByType[TOC_ORDER[tierIndex - 1]].length > 0 && (
                <div className="flex justify-center py-1">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className={cn("w-0.5 h-6 bg-gradient-to-t", colors.line, "to-muted-foreground/20")} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 -rotate-90" />
                  </div>
                </div>
              )}

              {/* Tier Label */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className={cn("h-1.5 w-6 rounded-full", colors.accent)} />
                <span className={cn("text-xs font-semibold uppercase tracking-wider", colors.text)}>
                  {cfg.pluralLabel}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  — {cfg.description}
                </span>
              </div>

              {/* Nodes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {items.map((item, i) => {
                  const Icon = levelIcons[type];
                  const progress = getIndicatorProgress(item._indicators);
                  const isSelected = selectedNode === item.id;
                  const hasChildren = levels.some(l => l.parent_id === item.id);
                  const parentLevel = item.parent_id ? levels.find(l => l.id === item.parent_id) : null;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: tierIndex * 0.1 + i * 0.05 }}
                    >
                      <Card
                        className={cn(
                          "p-4 cursor-pointer transition-all duration-200 border-2 hover:shadow-md",
                          colors.bg, colors.border,
                          isSelected && "ring-2 ring-primary shadow-lg scale-[1.02]",
                          !isSelected && "hover:scale-[1.01]"
                        )}
                        onClick={() => setSelectedNode(isSelected ? null : item.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("p-2 rounded-lg shrink-0", colors.accent, "text-white")}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <p className="text-sm font-medium leading-snug line-clamp-2">
                              {item.narrative}
                            </p>

                            {/* Indicator progress */}
                            {item._indicators.length > 0 && (
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                  <span>{item._indicators.length} indicador{item._indicators.length > 1 ? "es" : ""}</span>
                                  <span className="font-medium">{progress}%</span>
                                </div>
                                <Progress value={progress} className="h-1.5" />
                              </div>
                            )}

                            {/* Connection info */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {parentLevel && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="text-[9px] px-1.5 h-4 cursor-default">
                                      ↑ {LOGFRAME_LEVEL_CONFIG[parentLevel.level_type].label}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" className="max-w-xs text-xs">
                                    Contribui para: {parentLevel.narrative}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {hasChildren && (
                                <Badge variant="outline" className="text-[9px] px-1.5 h-4">
                                  ↓ {levels.filter(l => l.parent_id === item.id).length} dependentes
                                </Badge>
                              )}
                              {item.assumptions && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="bottom" className="max-w-xs text-xs">
                                    <strong>Pressupostos:</strong> {item.assumptions}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Panel */}
      {selectedLevel && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6 border-2 border-primary/20">
            <div className="flex items-start gap-4">
              <div className={cn("p-3 rounded-lg text-white", levelColors[selectedLevel.level_type].accent)}>
                {(() => { const Icon = levelIcons[selectedLevel.level_type]; return <Icon className="h-5 w-5" />; })()}
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <Badge className={cn("text-white text-[10px] mb-2", LOGFRAME_LEVEL_CONFIG[selectedLevel.level_type].color)}>
                    {LOGFRAME_LEVEL_CONFIG[selectedLevel.level_type].label}
                  </Badge>
                  <p className="text-sm font-medium">{selectedLevel.narrative}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {selectedLevel.means_of_verification && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Meios de Verificação</p>
                      <p className="text-sm">{selectedLevel.means_of_verification}</p>
                    </div>
                  )}
                  {selectedLevel.assumptions && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pressupostos</p>
                      <p className="text-sm">{selectedLevel.assumptions}</p>
                    </div>
                  )}
                </div>

                {/* Indicators table */}
                {selectedIndicators.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <BarChart3 className="h-3.5 w-3.5" />
                      Indicadores ({selectedIndicators.length})
                    </p>
                    <div className="border rounded-lg overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/50">
                            <th className="text-left p-2 font-medium">Indicador</th>
                            <th className="text-right p-2 font-medium">Base</th>
                            <th className="text-right p-2 font-medium">Actual</th>
                            <th className="text-right p-2 font-medium">Meta</th>
                            <th className="text-right p-2 font-medium">Progresso</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedIndicators.map(ind => {
                            const pct = getProgress(ind);
                            return (
                              <tr key={ind.id} className="border-t">
                                <td className="p-2">
                                  <span className="font-medium">{ind.name}</span>
                                  {ind.unit && <span className="text-muted-foreground ml-1">({ind.unit})</span>}
                                </td>
                                <td className="text-right p-2">{ind.baseline_value ?? "—"}</td>
                                <td className="text-right p-2 font-medium">{ind.current_value ?? "—"}</td>
                                <td className="text-right p-2">{ind.target_value ?? "—"}</td>
                                <td className="text-right p-2">
                                  {pct !== null ? (
                                    <span className={cn(
                                      "font-medium",
                                      pct >= 80 ? "text-success" : pct >= 40 ? "text-warning" : "text-destructive"
                                    )}>
                                      {pct}%
                                    </span>
                                  ) : "—"}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Connected levels */}
                {(() => {
                  const children = levels.filter(l => l.parent_id === selectedLevel.id);
                  const parent = selectedLevel.parent_id ? levels.find(l => l.id === selectedLevel.parent_id) : null;
                  if (!children.length && !parent) return null;
                  return (
                    <div className="flex flex-wrap gap-2 pt-2 border-t">
                      {parent && (
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => setSelectedNode(parent.id)}
                        >
                          ↑ {parent.narrative.slice(0, 50)}…
                        </Badge>
                      )}
                      {children.map(c => (
                        <Badge
                          key={c.id}
                          variant="outline"
                          className="cursor-pointer hover:bg-accent"
                          onClick={() => setSelectedNode(c.id)}
                        >
                          ↓ {c.narrative.slice(0, 50)}…
                        </Badge>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

function getProgress(ind: LogFrameIndicator): number | null {
  if (ind.target_value == null || ind.target_value === 0) return null;
  const current = ind.current_value ?? 0;
  const baseline = ind.baseline_value ?? 0;
  const range = ind.target_value - baseline;
  if (range <= 0) return current >= ind.target_value ? 100 : 0;
  return Math.min(100, Math.max(0, Math.round(((current - baseline) / range) * 100)));
}

function getIndicatorProgress(indicators: LogFrameIndicator[]): number {
  const progresses = indicators.map(getProgress).filter((p): p is number => p !== null);
  if (progresses.length === 0) return 0;
  return Math.round(progresses.reduce((s, p) => s + p, 0) / progresses.length);
}
