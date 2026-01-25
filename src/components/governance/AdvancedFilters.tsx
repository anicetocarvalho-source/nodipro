import { useState } from "react";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Sector, SDG, Province, Funder } from "@/hooks/useGovernance";

export interface GovernanceFilters {
  sectorId?: string;
  sdgId?: string;
  provinceId?: string;
  funderId?: string;
}

interface AdvancedFiltersProps {
  sectors: Sector[];
  sdgs: SDG[];
  provinces: Province[];
  funders: Funder[];
  filters: GovernanceFilters;
  onFiltersChange: (filters: GovernanceFilters) => void;
  isLoading?: boolean;
}

export function AdvancedFilters({
  sectors,
  sdgs,
  provinces,
  funders,
  filters,
  onFiltersChange,
  isLoading,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const clearFilter = (key: keyof GovernanceFilters) => {
    onFiltersChange({ ...filters, [key]: undefined });
  };

  const updateFilter = (key: keyof GovernanceFilters, value: string | undefined) => {
    onFiltersChange({ ...filters, [key]: value === "all" ? undefined : value });
  };

  const getActiveFilterLabels = () => {
    const labels: { key: keyof GovernanceFilters; label: string; color?: string }[] = [];
    
    if (filters.sectorId) {
      const sector = sectors.find(s => s.id === filters.sectorId);
      if (sector) labels.push({ key: "sectorId", label: sector.name, color: sector.color || undefined });
    }
    if (filters.sdgId) {
      const sdg = sdgs.find(s => s.id === filters.sdgId);
      if (sdg) labels.push({ key: "sdgId", label: `ODS ${sdg.number}`, color: sdg.color || undefined });
    }
    if (filters.provinceId) {
      const province = provinces.find(p => p.id === filters.provinceId);
      if (province) labels.push({ key: "provinceId", label: province.name });
    }
    if (filters.funderId) {
      const funder = funders.find(f => f.id === filters.funderId);
      if (funder) labels.push({ key: "funderId", label: funder.acronym || funder.name });
    }
    
    return labels;
  };

  return (
    <div className="space-y-3">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center gap-2">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros Avançados
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          
          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpar todos
            </Button>
          )}
        </div>

        <CollapsibleContent className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border">
            {/* Sector Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Pilar Estratégico
              </label>
              <Select
                value={filters.sectorId || "all"}
                onValueChange={(value) => updateFilter("sectorId", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os pilares" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os pilares</SelectItem>
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
            </div>

            {/* SDG Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                ODS
              </label>
              <Select
                value={filters.sdgId || "all"}
                onValueChange={(value) => updateFilter("sdgId", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os ODS" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os ODS</SelectItem>
                  {sdgs.map((sdg) => (
                    <SelectItem key={sdg.id} value={sdg.id}>
                      <div className="flex items-center gap-2">
                        {sdg.color && (
                          <div 
                            className="w-3 h-3 rounded-sm flex items-center justify-center text-[8px] font-bold text-white" 
                            style={{ backgroundColor: sdg.color }}
                          >
                            {sdg.number}
                          </div>
                        )}
                        <span className="truncate max-w-[180px]">{sdg.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Province Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Província
              </label>
              <Select
                value={filters.provinceId || "all"}
                onValueChange={(value) => updateFilter("provinceId", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as províncias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as províncias</SelectItem>
                  {provinces.map((province) => (
                    <SelectItem key={province.id} value={province.id}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-8">{province.code}</span>
                        {province.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Funder Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Financiador
              </label>
              <Select
                value={filters.funderId || "all"}
                onValueChange={(value) => updateFilter("funderId", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os financiadores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os financiadores</SelectItem>
                  {funders.map((funder) => (
                    <SelectItem key={funder.id} value={funder.id}>
                      <div className="flex items-center gap-2">
                        {funder.acronym && (
                          <span className="text-xs font-medium text-muted-foreground w-12">
                            {funder.acronym}
                          </span>
                        )}
                        <span className="truncate max-w-[150px]">{funder.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Active Filters Badges */}
      {activeFiltersCount > 0 && !isOpen && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filtros activos:</span>
          {getActiveFilterLabels().map(({ key, label, color }) => (
            <Badge 
              key={key} 
              variant="secondary" 
              className="gap-1 pr-1"
              style={color ? { borderLeft: `3px solid ${color}` } : undefined}
            >
              {label}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => clearFilter(key)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
