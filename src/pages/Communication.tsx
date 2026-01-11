import { useState } from "react";
import {
  MessageSquare,
  Bell,
  Mail,
  Send,
  Search,
  MoreHorizontal,
  AtSign,
  Paperclip,
  Check,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const conversations = [
  {
    id: "1",
    name: "Sistema de Gestão Financeira",
    type: "project",
    lastMessage: "João: Documentação técnica actualizada",
    time: "5 min",
    unread: 3,
    members: ["JM", "MS", "PA"],
  },
  {
    id: "2",
    name: "Maria Silva",
    type: "direct",
    lastMessage: "Podemos agendar uma reunião?",
    time: "15 min",
    unread: 1,
    members: ["MS"],
  },
  {
    id: "3",
    name: "Equipa Alpha",
    type: "team",
    lastMessage: "Pedro: Sprint review concluída",
    time: "1h",
    unread: 0,
    members: ["PA", "AC", "CF"],
  },
  {
    id: "4",
    name: "Portal de Serviços Públicos",
    type: "project",
    lastMessage: "Ana: Novos requisitos adicionados",
    time: "2h",
    unread: 5,
    members: ["AC", "CF", "SL"],
  },
];

const messages = [
  {
    id: "1",
    sender: "João Miguel",
    initials: "JM",
    message: "Bom dia equipa! A documentação técnica foi actualizada no repositório.",
    time: "09:30",
    isOwn: false,
    status: "read",
  },
  {
    id: "2",
    sender: "Maria Silva",
    initials: "MS",
    message: "Excelente! Vou revisar e dar feedback até ao final do dia.",
    time: "09:45",
    isOwn: false,
    status: "read",
  },
  {
    id: "3",
    sender: "Eu",
    initials: "PA",
    message: "Perfeito. @Maria, por favor verificar a secção de integração com o API.",
    time: "10:00",
    isOwn: true,
    status: "read",
  },
  {
    id: "4",
    sender: "Ana Costa",
    initials: "AC",
    message: "Já agendei a reunião de review para amanhã às 10h. Confirmam presença?",
    time: "10:15",
    isOwn: false,
    status: "read",
  },
  {
    id: "5",
    sender: "Eu",
    initials: "PA",
    message: "Confirmado da minha parte.",
    time: "10:20",
    isOwn: true,
    status: "sent",
  },
];

const notifications = [
  {
    id: "1",
    type: "mention",
    title: "Maria Silva mencionou você",
    description: "em 'Revisão de requisitos'",
    time: "5 min",
    read: false,
  },
  {
    id: "2",
    type: "task",
    title: "Nova tarefa atribuída",
    description: "Implementar módulo de autenticação",
    time: "30 min",
    read: false,
  },
  {
    id: "3",
    type: "deadline",
    title: "Prazo próximo",
    description: "Entrega do Sprint 4 em 2 dias",
    time: "1h",
    read: false,
  },
  {
    id: "4",
    type: "comment",
    title: "Novo comentário",
    description: "Carlos respondeu ao seu comentário",
    time: "2h",
    read: true,
  },
  {
    id: "5",
    type: "approval",
    title: "Documento aprovado",
    description: "Proposta comercial foi aprovada",
    time: "3h",
    read: true,
  },
];

export default function Communication() {
  const [selectedConversation, setSelectedConversation] = useState(conversations[0]);
  const [newMessage, setNewMessage] = useState("");

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comunicação</h1>
        <p className="text-muted-foreground">
          Mensagens, notificações e colaboração em tempo real.
        </p>
      </div>

      <Tabs defaultValue="messages">
        <TabsList>
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Mensagens
            <Badge className="bg-primary text-primary-foreground ml-1 h-5 px-1.5">4</Badge>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
            <Badge className="bg-destructive text-destructive-foreground ml-1 h-5 px-1.5">3</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Conversation List */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Conversas</CardTitle>
                  <Button variant="ghost" size="icon">
                    <Mail className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Pesquisar..." className="pl-9" />
                </div>
              </CardHeader>
              <CardContent className="p-2 overflow-y-auto max-h-[480px]">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                      selectedConversation.id === conv.id
                        ? "bg-accent"
                        : "hover:bg-accent/50"
                    )}
                  >
                    <div className="relative">
                      <div className="flex -space-x-2">
                        {conv.members.slice(0, 2).map((member, i) => (
                          <Avatar key={i} className="h-10 w-10 border-2 border-card">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {member}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                      {conv.unread > 0 && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive flex items-center justify-center">
                          <span className="text-xs text-destructive-foreground">{conv.unread}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{conv.name}</p>
                        <span className="text-xs text-muted-foreground">{conv.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="lg:col-span-2 flex flex-col">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {selectedConversation.members.slice(0, 3).map((member, i) => (
                        <Avatar key={i} className="h-8 w-8 border-2 border-card">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {member}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <div>
                      <p className="font-semibold">{selectedConversation.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedConversation.members.length} membros
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn("flex gap-3", msg.isOwn && "flex-row-reverse")}
                  >
                    {!msg.isOwn && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {msg.initials}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "max-w-[70%] rounded-lg p-3",
                        msg.isOwn
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {!msg.isOwn && (
                        <p className="text-xs font-medium mb-1">{msg.sender}</p>
                      )}
                      <p className="text-sm">{msg.message}</p>
                      <div className={cn(
                        "flex items-center gap-1 mt-1",
                        msg.isOwn ? "justify-end" : "justify-start"
                      )}>
                        <span className={cn(
                          "text-xs",
                          msg.isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {msg.time}
                        </span>
                        {msg.isOwn && (
                          msg.status === "read" ? (
                            <CheckCheck className="h-3 w-3 text-primary-foreground/70" />
                          ) : (
                            <Check className="h-3 w-3 text-primary-foreground/70" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <AtSign className="h-4 w-4" />
                  </Button>
                  <Input
                    placeholder="Escrever mensagem..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button className="bg-primary hover:bg-primary/90">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg">Notificações</CardTitle>
              <Button variant="ghost" size="sm" className="text-primary">
                Marcar todas como lidas
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg transition-colors cursor-pointer",
                    notif.read ? "bg-background" : "bg-accent/50",
                    "hover:bg-accent"
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      notif.type === "mention" && "bg-info/10",
                      notif.type === "task" && "bg-primary/10",
                      notif.type === "deadline" && "bg-warning/10",
                      notif.type === "comment" && "bg-success/10",
                      notif.type === "approval" && "bg-success/10"
                    )}
                  >
                    {notif.type === "mention" && <AtSign className="h-4 w-4 text-info" />}
                    {notif.type === "task" && <MessageSquare className="h-4 w-4 text-primary" />}
                    {notif.type === "deadline" && <Bell className="h-4 w-4 text-warning" />}
                    {notif.type === "comment" && <MessageSquare className="h-4 w-4 text-success" />}
                    {notif.type === "approval" && <Check className="h-4 w-4 text-success" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{notif.title}</p>
                    <p className="text-sm text-muted-foreground">{notif.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{notif.time}</span>
                  {!notif.read && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
