import { useState, useCallback } from "react";
import {
  MessageSquare,
  Bell,
  Send,
  Search,
  MoreHorizontal,
  Paperclip,
  AtSign,
  Plus,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  useConversations,
  useMessages,
  useRealtimeMessages,
  useSendMessage,
  useMarkAsRead,
  type Conversation,
} from "@/hooks/useMessaging";
import { ConversationList } from "@/components/communication/ConversationList";
import { MessageList } from "@/components/communication/MessageList";
import { NewConversationModal } from "@/components/communication/NewConversationModal";
import { toast } from "sonner";

// Placeholder notifications (static for now, can be made dynamic later)
const notifications = [
  {
    id: "1",
    type: "mention",
    title: "Menção numa conversa",
    description: "Alguém mencionou você numa mensagem",
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
];

export default function Communication() {
  const { user } = useAuthContext();
  const { data: conversations = [], isLoading: convsLoading } = useConversations();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [newConvModalOpen, setNewConvModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedConvId = selectedConversation?.id || null;
  const { data: messages = [], isLoading: msgsLoading } = useMessages(selectedConvId);
  useRealtimeMessages(selectedConvId);

  const sendMessage = useSendMessage();
  const markAsRead = useMarkAsRead();

  const handleSelectConversation = useCallback(
    (conv: Conversation) => {
      setSelectedConversation(conv);
      if (conv.unread_count > 0) {
        markAsRead.mutate(conv.id);
      }
    },
    [markAsRead]
  );

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedConvId) return;

    try {
      await sendMessage.mutateAsync({
        conversationId: selectedConvId,
        content: newMessage.trim(),
      });
      setNewMessage("");
    } catch {
      toast.error("Erro ao enviar mensagem");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleConversationCreated = (convId: string) => {
    // After creating, select the new conversation (will appear after refetch)
    setTimeout(() => {
      const newConv = conversations.find((c) => c.id === convId);
      if (newConv) setSelectedConversation(newConv);
    }, 500);
  };

  // Filter conversations by search
  const filteredConversations = searchQuery.trim()
    ? conversations.filter((c) => {
        const name = c.name || c.participants.map((p) => p.user_name).join(", ");
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : conversations;

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  // Get display name for selected conversation
  const getSelectedDisplayName = () => {
    if (!selectedConversation) return "";
    if (selectedConversation.name) return selectedConversation.name;
    const other = selectedConversation.participants.find(
      (p) => p.user_id !== user?.id
    );
    return other?.user_name || "Conversa";
  };

  return (
    <div className="space-y-6 animate-fade-in">
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
            {totalUnread > 0 && (
              <Badge className="bg-primary text-primary-foreground ml-1 h-5 px-1.5">
                {totalUnread}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
            {/* Conversation List */}
            <Card className="lg:col-span-1 flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Conversas</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setNewConvModalOpen(true)}
                    title="Nova conversa"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <ConversationList
                  conversations={filteredConversations}
                  selectedId={selectedConvId}
                  onSelect={handleSelectConversation}
                  currentUserId={user?.id || ""}
                  isLoading={convsLoading}
                />
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="lg:col-span-2 flex flex-col">
              {selectedConversation ? (
                <>
                  <CardHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {selectedConversation.participants
                            .filter((p) => p.user_id !== user?.id)
                            .slice(0, 3)
                            .map((p) => (
                              <Avatar
                                key={p.id}
                                className="h-8 w-8 border-2 border-card"
                              >
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                  {p.user_initials || "?"}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                        </div>
                        <div>
                          <p className="font-semibold">
                            {getSelectedDisplayName()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {selectedConversation.participants.length} membro
                            {selectedConversation.participants.length !== 1
                              ? "s"
                              : ""}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  <MessageList
                    messages={messages}
                    currentUserId={user?.id || ""}
                    isLoading={msgsLoading}
                  />

                  <div className="p-4 border-t">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" disabled>
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Input
                        placeholder="Escrever mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1"
                        disabled={sendMessage.isPending}
                      />
                      <Button
                        onClick={handleSend}
                        disabled={
                          !newMessage.trim() || sendMessage.isPending
                        }
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-3">
                    <MessageSquare className="h-12 w-12 text-muted-foreground/40 mx-auto" />
                    <div>
                      <p className="font-medium text-muted-foreground">
                        Selecione uma conversa
                      </p>
                      <p className="text-sm text-muted-foreground/70">
                        ou crie uma nova para começar
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setNewConvModalOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Conversa
                    </Button>
                  </div>
                </div>
              )}
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
                      notif.type === "deadline" && "bg-warning/10"
                    )}
                  >
                    {notif.type === "mention" && (
                      <AtSign className="h-4 w-4 text-info" />
                    )}
                    {notif.type === "task" && (
                      <MessageSquare className="h-4 w-4 text-primary" />
                    )}
                    {notif.type === "deadline" && (
                      <Bell className="h-4 w-4 text-warning" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{notif.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {notif.description}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {notif.time}
                  </span>
                  {!notif.read && (
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <NewConversationModal
        open={newConvModalOpen}
        onOpenChange={setNewConvModalOpen}
        onCreated={handleConversationCreated}
      />
    </div>
  );
}
