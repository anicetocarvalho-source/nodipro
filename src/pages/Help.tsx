import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, HelpCircle, Mail, MessageSquare, Search, Video } from "lucide-react";
import { useState } from "react";

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    {
      question: "Como criar um novo projeto?",
      answer: "Vá à página de Projetos e clique no botão 'Novo Projeto'. Preencha o formulário com o nome, descrição, datas e orçamento do projeto."
    },
    {
      question: "Como atribuir tarefas a membros da equipa?",
      answer: "Dentro de um projeto, vá ao quadro Kanban e crie uma nova tarefa. No formulário, selecione o membro da equipa no campo 'Responsável'."
    },
    {
      question: "Como visualizar o progresso dos projetos?",
      answer: "O Dashboard mostra uma visão geral de todos os projetos. Para detalhes específicos, aceda à página do projeto para ver o gráfico de Gantt e métricas."
    },
    {
      question: "Como gerir permissões de utilizadores?",
      answer: "Administradores podem gerir permissões na página de Administração, no separador 'Permissões'. Podem atribuir roles e permissões específicas."
    },
    {
      question: "Como exportar relatórios?",
      answer: "Na página de Relatórios, selecione o tipo de relatório desejado e clique em 'Exportar'. Os relatórios podem ser exportados em PDF ou Excel."
    },
    {
      question: "Como funciona a estrutura Portfolio > Programa > Projeto?",
      answer: "Portfolios agrupam programas relacionados. Programas contêm projetos com objetivos comuns. Esta hierarquia permite melhor organização e visibilidade."
    },
  ];

  const filteredFaqs = faqs.filter(
    faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Centro de Ajuda</h1>
        <p className="text-muted-foreground mt-1">
          Encontre respostas às suas dúvidas
        </p>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Pesquisar na ajuda..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardHeader className="text-center">
            <BookOpen className="h-10 w-10 mx-auto text-primary" />
            <CardTitle className="mt-2">Documentação</CardTitle>
            <CardDescription>
              Guias detalhados e tutoriais
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardHeader className="text-center">
            <Video className="h-10 w-10 mx-auto text-primary" />
            <CardTitle className="mt-2">Vídeos</CardTitle>
            <CardDescription>
              Tutoriais em vídeo passo-a-passo
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors">
          <CardHeader className="text-center">
            <MessageSquare className="h-10 w-10 mx-auto text-primary" />
            <CardTitle className="mt-2">Suporte</CardTitle>
            <CardDescription>
              Contacte a nossa equipa
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Perguntas Frequentes
          </CardTitle>
          <CardDescription>
            Respostas às dúvidas mais comuns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {filteredFaqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          {filteredFaqs.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhum resultado encontrado para "{searchQuery}"
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Ainda precisa de ajuda?
          </CardTitle>
          <CardDescription>
            Entre em contacto com a nossa equipa de suporte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button>
            <Mail className="h-4 w-4 mr-2" />
            Contactar Suporte
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Help;
