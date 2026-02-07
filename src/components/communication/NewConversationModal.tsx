import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { useOrgMembers, useCreateConversation } from "@/hooks/useMessaging";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Search, Users } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NewConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (conversationId: string) => void;
}

export function NewConversationModal({
  open,
  onOpenChange,
  onCreated,
}: NewConversationModalProps) {
  const { user } = useAuthContext();
  const { data: members = [], isLoading } = useOrgMembers();
  const createConversation = useCreateConversation();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [search, setSearch] = useState("");

  const filteredMembers = members.filter(
    (m) =>
      m.id !== user?.id &&
      m.name.toLowerCase().includes(search.toLowerCase())
  );

  const isGroup = selectedIds.length > 1;

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (selectedIds.length === 0) {
      toast.error("Selecione pelo menos um participante");
      return;
    }

    try {
      const participantNames = members.filter((m) =>
        selectedIds.includes(m.id)
      );
      const type = isGroup ? "group" : "direct";
      const name = isGroup
        ? groupName || participantNames.map((p) => p.name.split(" ")[0]).join(", ")
        : null;

      const conv = await createConversation.mutateAsync({
        name: name || undefined,
        type,
        participantIds: selectedIds,
        participantNames,
      });

      toast.success("Conversa criada com sucesso");
      setSelectedIds([]);
      setGroupName("");
      setSearch("");
      onOpenChange(false);
      onCreated?.(conv.id);
    } catch (error) {
      toast.error("Erro ao criar conversa");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Nova Conversa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isGroup && (
            <div className="space-y-2">
              <Label>Nome do grupo</Label>
              <Input
                placeholder="Nome do grupo (opcional)"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar membros..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[280px]">
            {isLoading ? (
              <p className="text-sm text-muted-foreground p-4 text-center">
                A carregar membros...
              </p>
            ) : filteredMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">
                Nenhum membro encontrado
              </p>
            ) : (
              <div className="space-y-1">
                {filteredMembers.map((member) => (
                  <label
                    key={member.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg cursor-pointer hover:bg-accent transition-colors"
                  >
                    <Checkbox
                      checked={selectedIds.includes(member.id)}
                      onCheckedChange={() => handleToggle(member.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {member.initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{member.name}</span>
                  </label>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={selectedIds.length === 0 || createConversation.isPending}
          >
            {createConversation.isPending ? "A criar..." : "Criar Conversa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
