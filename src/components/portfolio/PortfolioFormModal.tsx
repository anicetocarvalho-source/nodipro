import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DbPortfolio, DbPortfolioInsert } from "@/types/portfolio";
import { useCreatePortfolio, useUpdatePortfolio } from "@/hooks/usePortfolios";

interface PortfolioFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolio?: DbPortfolio | null;
}

export function PortfolioFormModal({ open, onOpenChange, portfolio }: PortfolioFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "archived">("active");

  const createPortfolio = useCreatePortfolio();
  const updatePortfolio = useUpdatePortfolio();

  useEffect(() => {
    if (portfolio) {
      setName(portfolio.name);
      setDescription(portfolio.description || "");
      setStatus(portfolio.status);
    } else {
      setName("");
      setDescription("");
      setStatus("active");
    }
  }, [portfolio, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const portfolioData: DbPortfolioInsert = {
      name,
      description: description || null,
      status,
      manager_id: null,
    };

    if (portfolio) {
      await updatePortfolio.mutateAsync({ id: portfolio.id, ...portfolioData });
    } else {
      await createPortfolio.mutateAsync(portfolioData);
    }

    onOpenChange(false);
  };

  const isSubmitting = createPortfolio.isPending || updatePortfolio.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {portfolio ? "Editar Portfólio" : "Novo Portfólio"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do portfólio"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do portfólio"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
                <SelectItem value="archived">Arquivado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !name}>
              {isSubmitting ? "A guardar..." : portfolio ? "Guardar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
