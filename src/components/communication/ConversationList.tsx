import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import type { Conversation } from "@/hooks/useMessaging";

interface ConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conv: Conversation) => void;
  currentUserId: string;
  isLoading: boolean;
}

function formatTimeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d`;
}

function getConversationDisplayName(
  conv: Conversation,
  currentUserId: string
): string {
  if (conv.name) return conv.name;
  // For direct conversations, show the other participant's name
  const other = conv.participants.find((p) => p.user_id !== currentUserId);
  return other?.user_name || "Conversa";
}

function getConversationInitials(
  conv: Conversation,
  currentUserId: string
): string[] {
  if (conv.type === "direct") {
    const other = conv.participants.find((p) => p.user_id !== currentUserId);
    return [other?.user_initials || "?"];
  }
  return conv.participants
    .filter((p) => p.user_id !== currentUserId)
    .slice(0, 2)
    .map((p) => p.user_initials || "?");
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  currentUserId,
  isLoading,
}: ConversationListProps) {
  if (isLoading) {
    return (
      <div className="p-2 space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-sm text-muted-foreground text-center px-4">
          Sem conversas ainda.
          <br />
          Clique em "Nova Conversa" para começar.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[480px]">
      <div className="p-2">
        {conversations.map((conv) => {
          const displayName = getConversationDisplayName(conv, currentUserId);
          const initials = getConversationInitials(conv, currentUserId);
          const lastMsgPreview = conv.last_message
            ? conv.last_message.sender_id === currentUserId
              ? `Eu: ${conv.last_message.content}`
              : conv.type !== "direct"
                ? `${conv.last_message.sender_name?.split(" ")[0]}: ${conv.last_message.content}`
                : conv.last_message.content
            : "Nenhuma mensagem";

          return (
            <div
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                selectedId === conv.id ? "bg-accent" : "hover:bg-accent/50"
              )}
            >
              <div className="relative">
                <div className="flex -space-x-2">
                  {initials.map((init, i) => (
                    <Avatar
                      key={i}
                      className="h-10 w-10 border-2 border-card"
                    >
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {init}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                {conv.unread_count > 0 && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive flex items-center justify-center">
                    <span className="text-xs text-destructive-foreground">
                      {conv.unread_count}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm truncate">{displayName}</p>
                  {conv.last_message && (
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(conv.last_message.created_at)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {lastMsgPreview}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
