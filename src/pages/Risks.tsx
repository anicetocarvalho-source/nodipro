import { useState } from "react";
import { Plus, AlertTriangle, Shield, TrendingUp, TrendingDown, Filter, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const risks = [
  {
    id: "1",
    title: "Atraso na entrega de requisitos pelo cliente",
    project: "Portal de Serviços Públicos",
    probability: "high",
    impact: "high",
    status: "active",
    owner: "João Miguel",
    mitigation: "Estabelecer reuniões semanais de acompanhamento com stakeholders",
    createdAt: "15 Dez 2025",
  },
  {
    id: "2",
    title: "Indisponibilidade de recursos técnicos especializados",
    project: "ERP Corporativo",
    probability: "medium",
    impact: "high",
    status: "active",
    owner: "Maria Silva",
    mitigation: "Contratar consultores externos como backup",
    createdAt: "10 Jan 2026",
  },
  {
    id: "3",
    title: "Alterações no escopo sem aprovação formal",
    project: "App Mobile Bancário",
    probability: "medium",
    impact: "medium",
    status: "mitigated",
    owner: "Pedro Alves",
    mitigation: "Implementar processo formal de gestão de mudanças",
    createdAt: "05 Nov 2025",
  },
  {
    id: "4",
    title: "Falha na integração com sistemas legados",
    project: "Sistema de Gestão Financeira",
    probability: "low",
    impact: "high",
    status: "active",
    owner: "Carlos Ferreira",
    mitigation: "Realizar POC de integração antecipada",
    createdAt: "20 Dez 2025",
  },
  {
    id: "5",
    title: "Orçamento insuficiente para testes",
    project: "Portal de Serviços Públicos",
    probability: "high",
    impact: "medium",
    status: "active",
    owner: "Sofia Lima",
    mitigation: "Solicitar revisão orçamental ao sponsor",
    createdAt: "08 Jan 2026",
  },
];

const lessons = [
  {
    id: "1",
    title: "Importância de documentação técnica completa",
    project: "Plataforma E-commerce",
    type: "success",
    description: "A documentação detalhada reduziu o tempo de onboarding de novos developers em 40%.",
    tags: ["Documentação", "Onboarding", "Eficiência"],
    createdAt: "31 Dez 2025",
  },
  {
    id: "2",
    title: "Reuniões diárias de 15 minutos aumentam alinhamento",
    project: "App Mobile Bancário",
    type: "success",
    description: "Daily standups ajudaram a identificar bloqueios mais cedo e resolver problemas rapidamente.",
    tags: ["Comunicação", "Agile", "Equipa"],
    createdAt: "15 Dez 2025",
  },
  {
    id: "3",
    title: "Evitar estimativas sem análise técnica",
    project: "ERP Corporativo",
    type: "improvement",
    description: "Estimativas feitas sem envolver a equipa técnica resultaram em atrasos de 3 meses.",
    tags: ["Estimativas", "Planeamento", "Lições"],
    createdAt: "10 Jan 2026",
  },
];

const probabilityConfig = {
  low: { label: "Baixa", value: 1, className: "bg-success/10 text-success" },
  medium: { label: "Média", value: 2, className: "bg-warning/10 text-warning" },
  high: { label: "Alta", value: 3, className: "bg-destructive/10 text-destructive" },
};

const impactConfig = {
  low: { label: "Baixo", value: 1, className: "bg-success/10 text-success" },
  medium: { label: "Médio", value: 2, className: "bg-warning/10 text-warning" },
  high: { label: "Alto", value: 3, className: "bg-destructive/10 text-destructive" },
};

const getRiskLevel = (probability: string, impact: string) => {
  const p = probabilityConfig[probability as keyof typeof probabilityConfig].value;
  const i = impactConfig[impact as keyof typeof impactConfig].value;
  const score = p * i;
  if (score >= 6) return { label: "Crítico", className: "bg-destructive text-destructive-foreground" };
  if (score >= 4) return { label: "Alto", className: "bg-destructive/20 text-destructive" };
  if (score >= 2) return { label: "Médio", className: "bg-warning/20 text-warning" };
  return { label: "Baixo", className: "bg-success/20 text-success" };
};

export default function Risks() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestão de Riscos e Lições</h1>
          <p className="text-muted-foreground">
            Identificar, monitorar riscos e documentar lições aprendidas.
          </p>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Registar Risco
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Riscos Activos</p>
                <p className="text-2xl font-bold">{risks.filter((r) => r.status === "active").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <TrendingUp className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Risco Alto</p>
                <p className="text-2xl font-bold">
                  {risks.filter((r) => r.probability === "high" && r.impact === "high").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <Shield className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Mitigados</p>
                <p className="text-2xl font-bold">{risks.filter((r) => r.status === "mitigated").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Lightbulb className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lições</p>
                <p className="text-2xl font-bold">{lessons.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="risks">
        <TabsList>
          <TabsTrigger value="risks">Mapa de Riscos</TabsTrigger>
          <TabsTrigger value="lessons">Lições Aprendidas</TabsTrigger>
        </TabsList>

        <TabsContent value="risks" className="mt-6 space-y-6">
          {/* Risk Matrix */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Matriz de Risco</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-1 max-w-lg">
                <div className="text-xs text-muted-foreground text-center py-2"></div>
                <div className="text-xs text-muted-foreground text-center py-2">Baixo</div>
                <div className="text-xs text-muted-foreground text-center py-2">Médio</div>
                <div className="text-xs text-muted-foreground text-center py-2">Alto</div>
                
                <div className="text-xs text-muted-foreground flex items-center justify-end pr-2">Alta</div>
                <div className="h-16 bg-warning/30 rounded flex items-center justify-center text-xs">
                  {risks.filter((r) => r.probability === "high" && r.impact === "low").length || "-"}
                </div>
                <div className="h-16 bg-destructive/30 rounded flex items-center justify-center text-xs">
                  {risks.filter((r) => r.probability === "high" && r.impact === "medium").length || "-"}
                </div>
                <div className="h-16 bg-destructive/50 rounded flex items-center justify-center text-xs font-bold">
                  {risks.filter((r) => r.probability === "high" && r.impact === "high").length || "-"}
                </div>

                <div className="text-xs text-muted-foreground flex items-center justify-end pr-2">Média</div>
                <div className="h-16 bg-success/30 rounded flex items-center justify-center text-xs">
                  {risks.filter((r) => r.probability === "medium" && r.impact === "low").length || "-"}
                </div>
                <div className="h-16 bg-warning/30 rounded flex items-center justify-center text-xs">
                  {risks.filter((r) => r.probability === "medium" && r.impact === "medium").length || "-"}
                </div>
                <div className="h-16 bg-destructive/30 rounded flex items-center justify-center text-xs">
                  {risks.filter((r) => r.probability === "medium" && r.impact === "high").length || "-"}
                </div>

                <div className="text-xs text-muted-foreground flex items-center justify-end pr-2">Baixa</div>
                <div className="h-16 bg-success/20 rounded flex items-center justify-center text-xs">
                  {risks.filter((r) => r.probability === "low" && r.impact === "low").length || "-"}
                </div>
                <div className="h-16 bg-success/30 rounded flex items-center justify-center text-xs">
                  {risks.filter((r) => r.probability === "low" && r.impact === "medium").length || "-"}
                </div>
                <div className="h-16 bg-warning/30 rounded flex items-center justify-center text-xs">
                  {risks.filter((r) => r.probability === "low" && r.impact === "high").length || "-"}
                </div>
              </div>
              <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
                <span>Eixo X: Impacto</span>
                <span>Eixo Y: Probabilidade</span>
              </div>
            </CardContent>
          </Card>

          {/* Risk List */}
          <div className="space-y-3">
            {risks.map((risk) => (
              <Card key={risk.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "p-2 rounded-lg",
                        risk.status === "active" ? "bg-destructive/10" : "bg-success/10"
                      )}
                    >
                      {risk.status === "active" ? (
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      ) : (
                        <Shield className="h-5 w-5 text-success" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold">{risk.title}</h3>
                          <p className="text-sm text-muted-foreground">{risk.project}</p>
                        </div>
                        <Badge className={getRiskLevel(risk.probability, risk.impact).className}>
                          {getRiskLevel(risk.probability, risk.impact).label}
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="outline" className={probabilityConfig[risk.probability as keyof typeof probabilityConfig].className}>
                          Prob: {probabilityConfig[risk.probability as keyof typeof probabilityConfig].label}
                        </Badge>
                        <Badge variant="outline" className={impactConfig[risk.impact as keyof typeof impactConfig].className}>
                          Impacto: {impactConfig[risk.impact as keyof typeof impactConfig].label}
                        </Badge>
                        <Badge variant="secondary">{risk.owner}</Badge>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        <strong>Mitigação:</strong> {risk.mitigation}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="lessons" className="mt-6 space-y-4">
          {lessons.map((lesson) => (
            <Card key={lesson.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      lesson.type === "success" ? "bg-success/10" : "bg-warning/10"
                    )}
                  >
                    <Lightbulb className={cn("h-5 w-5", lesson.type === "success" ? "text-success" : "text-warning")} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{lesson.title}</h3>
                        <p className="text-sm text-muted-foreground">{lesson.project}</p>
                      </div>
                      <Badge className={lesson.type === "success" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>
                        {lesson.type === "success" ? "Sucesso" : "Melhoria"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{lesson.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {lesson.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
