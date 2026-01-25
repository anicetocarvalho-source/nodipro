import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sector } from "@/hooks/useGovernance";

interface SectorFilterProps {
  sectors: Sector[];
  selectedSector: string | undefined;
  onSectorChange: (sectorId: string | undefined) => void;
  isLoading?: boolean;
}

export function SectorFilter({
  sectors,
  selectedSector,
  onSectorChange,
  isLoading,
}: SectorFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <Filter className="h-4 w-4 text-muted-foreground" />
      <Select
        value={selectedSector || "all"}
        onValueChange={(value) => onSectorChange(value === "all" ? undefined : value)}
        disabled={isLoading}
      >
        <SelectTrigger className="w-[220px]">
          <SelectValue placeholder="Todos os Pilares Estratégicos" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os Pilares Estratégicos</SelectItem>
          {sectors.map((sector) => (
            <SelectItem key={sector.id} value={sector.id}>
              <div className="flex items-center gap-2">
                {sector.color && (
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: sector.color }}
                  />
                )}
                {sector.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedSector && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSectorChange(undefined)}
          className="text-muted-foreground hover:text-foreground"
        >
          Limpar
        </Button>
      )}
    </div>
  );
}
