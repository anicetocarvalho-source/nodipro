import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProjects } from "@/hooks/useProjects";
import { usePrograms, useAssignProjectToProgram } from "@/hooks/usePrograms";
import { Loader2 } from "lucide-react";

interface AssignProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programId: string;
  programName: string;
}

export function AssignProjectModal({ open, onOpenChange, programId, programName }: AssignProjectModalProps) {
  const [selectedProjectId, setSelectedProjectId] = useState("");

  const { data: allProjects, isLoading: loadingProjects } = useProjects();
  const { data: programs } = usePrograms();
  const assignProject = useAssignProjectToProgram();

  // Get projects not assigned to any program
  const unassignedProjects = allProjects?.filter(p => !p.program_id) || [];

  const handleAssign = async () => {
    if (!selectedProjectId) return;

    await assignProject.mutateAsync({
      projectId: selectedProjectId,
      programId,
    });

    setSelectedProjectId("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Atribuir Projecto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Atribuir um projecto ao programa <strong>{programName}</strong>
          </p>

          <div className="space-y-2">
            <Label>Projecto</Label>
            {loadingProjects ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                A carregar projectos...
              </div>
            ) : unassignedProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todos os projectos já estão atribuídos a programas.
              </p>
            ) : (
              <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar projecto" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={!selectedProjectId || assignProject.isPending}
            >
              {assignProject.isPending ? "A atribuir..." : "Atribuir"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
