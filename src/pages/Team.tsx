import { useState } from "react";
import { Plus, Search, Mail, Phone, MoreHorizontal, Calendar, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const teamMembers = [
  {
    id: "1",
    name: "João Miguel Santos",
    role: "Gestor de Projectos Sénior",
    department: "PMO",
    email: "joao.santos@nodipro.ao",
    phone: "+244 923 456 789",
    avatar: "",
    initials: "JM",
    status: "available",
    projects: 5,
    tasks: { assigned: 12, completed: 8 },
    workload: 85,
  },
  {
    id: "2",
    name: "Maria da Silva",
    role: "Analista de Negócios",
    department: "Análise",
    email: "maria.silva@nodipro.ao",
    phone: "+244 924 567 890",
    avatar: "",
    initials: "MS",
    status: "busy",
    projects: 3,
    tasks: { assigned: 18, completed: 14 },
    workload: 95,
  },
  {
    id: "3",
    name: "Pedro Alves",
    role: "Desenvolvedor Full Stack",
    department: "Tecnologia",
    email: "pedro.alves@nodipro.ao",
    phone: "+244 925 678 901",
    avatar: "",
    initials: "PA",
    status: "available",
    projects: 4,
    tasks: { assigned: 24, completed: 20 },
    workload: 70,
  },
  {
    id: "4",
    name: "Ana Costa",
    role: "UX Designer",
    department: "Design",
    email: "ana.costa@nodipro.ao",
    phone: "+244 926 789 012",
    avatar: "",
    initials: "AC",
    status: "away",
    projects: 2,
    tasks: { assigned: 8, completed: 6 },
    workload: 55,
  },
  {
    id: "5",
    name: "Carlos Ferreira",
    role: "Arquitecto de Soluções",
    department: "Tecnologia",
    email: "carlos.ferreira@nodipro.ao",
    phone: "+244 927 890 123",
    avatar: "",
    initials: "CF",
    status: "available",
    projects: 6,
    tasks: { assigned: 15, completed: 12 },
    workload: 80,
  },
  {
    id: "6",
    name: "Sofia Lima",
    role: "Gestora de Qualidade",
    department: "QA",
    email: "sofia.lima@nodipro.ao",
    phone: "+244 928 901 234",
    avatar: "",
    initials: "SL",
    status: "busy",
    projects: 4,
    tasks: { assigned: 22, completed: 18 },
    workload: 90,
  },
];

const statusConfig = {
  available: { label: "Disponível", className: "bg-success" },
  busy: { label: "Ocupado", className: "bg-destructive" },
  away: { label: "Ausente", className: "bg-warning" },
};

export default function Team() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  const departments = ["all", ...new Set(teamMembers.map((m) => m.department))];

  const filteredMembers = teamMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === "all" || member.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Equipa</h1>
          <p className="text-muted-foreground">
            Gerir membros da equipa, disponibilidade e carga de trabalho.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Membro
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Membros</p>
            <p className="text-2xl font-bold">{teamMembers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Disponíveis</p>
            <p className="text-2xl font-bold text-success">
              {teamMembers.filter((m) => m.status === "available").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Carga Média</p>
            <p className="text-2xl font-bold">
              {Math.round(teamMembers.reduce((acc, m) => acc + m.workload, 0) / teamMembers.length)}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Tarefas Activas</p>
            <p className="text-2xl font-bold">
              {teamMembers.reduce((acc, m) => acc + (m.tasks.assigned - m.tasks.completed), 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar membros..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Tabs value={selectedDepartment} onValueChange={setSelectedDepartment}>
          <TabsList>
            {departments.map((dept) => (
              <TabsTrigger key={dept} value={dept}>
                {dept === "all" ? "Todos" : dept}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="relative">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {member.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-card",
                      statusConfig[member.status as keyof typeof statusConfig].className
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold truncate">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                        <DropdownMenuItem>Atribuir tarefa</DropdownMenuItem>
                        <DropdownMenuItem>Enviar mensagem</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {member.department}
                  </Badge>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {/* Contact */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{member.email}</span>
                  </div>
                </div>

                {/* Workload */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Carga de trabalho</span>
                    <span
                      className={cn(
                        "font-medium",
                        member.workload >= 90
                          ? "text-destructive"
                          : member.workload >= 75
                          ? "text-warning"
                          : "text-success"
                      )}
                    >
                      {member.workload}%
                    </span>
                  </div>
                  <Progress
                    value={member.workload}
                    className={cn(
                      "h-2",
                      member.workload >= 90 && "[&>div]:bg-destructive",
                      member.workload >= 75 && member.workload < 90 && "[&>div]:bg-warning"
                    )}
                  />
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-2 border-t text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{member.projects} projectos</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>
                      {member.tasks.completed}/{member.tasks.assigned} tarefas
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
