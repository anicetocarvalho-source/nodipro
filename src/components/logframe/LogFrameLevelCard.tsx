import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LogFrameLevel, LogFrameIndicator, LOGFRAME_LEVEL_CONFIG, LOGFRAME_HIERARCHY, LogFrameLevelType } from "@/types/logframe";
import { LogFrameIndicatorRow } from "./LogFrameIndicatorRow";

interface Props {
  level: LogFrameLevel;
  projectId: string;
  depth?: number;
  onAddChild: (parentId: string, levelType: LogFrameLevelType) => void;
  onEdit: (level: LogFrameLevel) => void;
  onDelete: (id: string) => void;
  onAddIndicator: (levelId: string) => void;
  onEditIndicator: (indicator: LogFrameIndicator) => void;
  onDeleteIndicator: (id: string) => void;
}

export function LogFrameLevelCard({ level, projectId, depth = 0, onAddChild, onEdit, onDelete, onAddIndicator, onEditIndicator, onDeleteIndicator }: Props) {
  const [expanded, setExpanded] = useState(true);
  const config = LOGFRAME_LEVEL_CONFIG[level.level_type];
  const hasChildren = level.children && level.children.length > 0;
  const hasIndicators = level.indicators && level.indicators.length > 0;
  const currentIndex = LOGFRAME_HIERARCHY.indexOf(level.level_type);
  const childType = currentIndex < LOGFRAME_HIERARCHY.length - 1 ? LOGFRAME_HIERARCHY[currentIndex + 1] : null;

  return (
    <div className={cn("space-y-2", depth > 0 && "ml-6 border-l-2 border-border pl-4")}>
      <Card className="p-3 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          {/* Expand/collapse */}
          <Button variant="ghost" size="icon" className="h-6 w-6 mt-0.5 shrink-0" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>

          {/* Level badge + content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={cn("text-white text-[10px]", config.color)}>{config.label}</Badge>
              {level.indicators && level.indicators.length > 0 && (
                <Badge variant="outline" className="text-[10px] gap-1">
                  <Target className="h-3 w-3" /> {level.indicators.length} indicador{level.indicators.length > 1 ? 'es' : ''}
                </Badge>
              )}
            </div>
            <p className="mt-1.5 text-sm font-medium text-foreground">{level.narrative}</p>
            {level.assumptions && (
              <p className="text-xs text-muted-foreground mt-1"><span className="font-semibold">Pressupostos:</span> {level.assumptions}</p>
            )}
            {level.means_of_verification && (
              <p className="text-xs text-muted-foreground mt-0.5"><span className="font-semibold">Meios de Verificação:</span> {level.means_of_verification}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddIndicator(level.id)} title="Adicionar indicador">
              <Target className="h-3.5 w-3.5" />
            </Button>
            {childType && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddChild(level.id, childType)} title={`Adicionar ${LOGFRAME_LEVEL_CONFIG[childType].label}`}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(level)}>
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(level.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Indicators */}
        {expanded && hasIndicators && (
          <div className="mt-3 space-y-1 border-t pt-2">
            <p className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider mb-1">Indicadores</p>
            {level.indicators!.map(ind => (
              <LogFrameIndicatorRow key={ind.id} indicator={ind} onEdit={onEditIndicator} onDelete={onDeleteIndicator} />
            ))}
          </div>
        )}
      </Card>

      {/* Children */}
      {expanded && hasChildren && (
        <div className="space-y-2">
          {level.children!.map(child => (
            <LogFrameLevelCard
              key={child.id}
              level={child}
              projectId={projectId}
              depth={depth + 1}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddIndicator={onAddIndicator}
              onEditIndicator={onEditIndicator}
              onDeleteIndicator={onDeleteIndicator}
            />
          ))}
        </div>
      )}
    </div>
  );
}
