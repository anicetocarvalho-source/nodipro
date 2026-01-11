import { Plus, FolderPlus, FileUp, Users, CalendarPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const actions = [
  { icon: Plus, label: "Nova Tarefa", color: "bg-primary hover:bg-primary/90" },
  { icon: FolderPlus, label: "Novo Projecto", color: "bg-success hover:bg-success/90" },
  { icon: FileUp, label: "Upload", color: "bg-info hover:bg-info/90" },
  { icon: CalendarPlus, label: "Agendar", color: "bg-warning hover:bg-warning/90" },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Acções Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              className={`${action.color} text-white flex items-center gap-2 h-auto py-3`}
            >
              <action.icon className="h-4 w-4" />
              <span className="text-sm">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
