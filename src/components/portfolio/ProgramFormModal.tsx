import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DbProgram, DbProgramInsert } from "@/types/portfolio";
import { useCreateProgram, useUpdateProgram } from "@/hooks/usePrograms";
import { usePortfolios } from "@/hooks/usePortfolios";

interface ProgramFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program?: DbProgram | null;
  defaultPortfolioId?: string;
}

const SECTORS = [
  "Governo",
  "Banca",
  "Energia",
  "Telecomunicações",
  "Retalho",
  "Saúde",
  "Educação",
  "Transportes",
  "Tecnologia",
  "Outro",
];

export function ProgramFormModal({ open, onOpenChange, program, defaultPortfolioId }: ProgramFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [portfolioId, setPortfolioId] = useState("");
  const [sector, setSector] = useState("");
  const [status, setStatus] = useState<"active" | "inactive" | "completed">("active");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: portfolios } = usePortfolios();
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();

  useEffect(() => {
    if (program) {
      setName(program.name);
      setDescription(program.description || "");
      setPortfolioId(program.portfolio_id);
      setSector(program.sector || "");
      setStatus(program.status);
      setStartDate(program.start_date || "");
      setEndDate(program.end_date || "");
    } else {
      setName("");
      setDescription("");
      setPortfolioId(defaultPortfolioId || "");
      setSector("");
      setStatus("active");
      setStartDate("");
      setEndDate("");
    }
  }, [program, defaultPortfolioId, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const programData: DbProgramInsert = {
      name,
      description: description || null,
      portfolio_id: portfolioId,
      sector: sector || null,
      status,
      start_date: startDate || null,
      end_date: endDate || null,
      manager_id: null,
    };

    if (program) {
      await updateProgram.mutateAsync({ id: program.id, ...programData });
    } else {
      await createProgram.mutateAsync(programData);
    }

    onOpenChange(false);
  };

  const isSubmitting = createProgram.isPending || updateProgram.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {program ? "Editar Programa" : "Novo Programa"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do programa"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="portfolio">Portfólio *</Label>
            <Select value={portfolioId} onValueChange={setPortfolioId} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar portfólio" />
              </SelectTrigger>
              <SelectContent>
                {portfolios?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do programa"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sector">Sector</Label>
              <Select value={sector} onValueChange={setSector}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sector" />
                </SelectTrigger>
                <SelectContent>
                  {SECTORS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <SelectItem value="completed">Concluído</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Data de Início</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Data de Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !name || !portfolioId}>
              {isSubmitting ? "A guardar..." : program ? "Guardar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
