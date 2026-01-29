import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, FolderKanban, Users, Shield, Loader2 } from "lucide-react";
import logo from "@/assets/logo.svg";

const Index = () => {
  const { user, loading } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/projects", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <img src={logo} alt="NODIPRO" className="h-8 transition-all duration-300 hover:scale-105 hover:drop-shadow-md cursor-pointer" />
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/auth">
              <Button>
                Começar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Gestão de Projectos
          <br />
          Simplificada
        </h2>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Plataforma completa para gerir projectos, equipas e portfólios de forma eficiente e intuitiva.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/auth">
            <Button size="lg" className="w-full sm:w-auto">
              Começar Gratuitamente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="w-full sm:w-auto">
            Ver Demonstração
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h3 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Tudo o que precisa para gerir os seus projectos
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: FolderKanban,
              title: "Gestão de Projectos",
              description: "Organize projectos com quadros Kanban, Gantt e listas de tarefas.",
            },
            {
              icon: Users,
              title: "Equipas Colaborativas",
              description: "Atribua tarefas, partilhe documentos e comunique em tempo real.",
            },
            {
              icon: BarChart3,
              title: "KPIs e Relatórios",
              description: "Acompanhe métricas, progresso e gere relatórios detalhados.",
            },
            {
              icon: Shield,
              title: "Gestão de Riscos",
              description: "Identifique, avalie e mitigue riscos dos seus projectos.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors"
            >
              <feature.icon className="h-10 w-10 text-primary mb-4" />
              <h4 className="font-semibold mb-2">{feature.title}</h4>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-primary rounded-2xl p-8 md:p-12 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
            Pronto para começar?
          </h3>
          <p className="text-primary-foreground/80 mb-6 max-w-xl mx-auto">
            Junte-se a milhares de equipas que já utilizam o NODIPRO para gerir os seus projectos.
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary">
              Criar Conta Gratuita
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2026 NODIPRO. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
