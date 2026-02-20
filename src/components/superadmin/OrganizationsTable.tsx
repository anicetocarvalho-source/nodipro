import { useState } from 'react';
import { Building2, Users, FolderKanban, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { OrganizationDetailSheet } from './OrganizationDetailSheet';
import type { PlatformOrganization, OrgDetail } from '@/hooks/usePlatformAdmin';

interface Props {
  organizations: PlatformOrganization[];
  loading: boolean;
  getOrgDetail: (orgId: string) => Promise<OrgDetail | null>;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  trial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-muted text-muted-foreground',
};

export function OrganizationsTable({ organizations, loading, getOrgDetail }: Props) {
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = organizations.filter(o => {
    if (search && !o.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (planFilter !== 'all' && o.plan_slug !== planFilter) return false;
    if (statusFilter !== 'all' && o.subscription_status !== statusFilter) return false;
    return true;
  });

  const plans = [...new Set(organizations.map(o => o.plan_slug).filter(Boolean))];

  const handleRowClick = (orgId: string) => {
    setSelectedOrgId(orgId);
    setSheetOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Organizações ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Pesquisar organização…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Plano" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os planos</SelectItem>
                {plans.map(p => <SelectItem key={p} value={p!}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="expired">Expirado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Sector</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center"><Users className="h-4 w-4 inline" /></TableHead>
                  <TableHead className="text-center"><FolderKanban className="h-4 w-4 inline" /></TableHead>
                  <TableHead>Criada em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">A carregar…</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma organização encontrada.</TableCell></TableRow>
                ) : (
                  filtered.map(o => (
                    <TableRow key={o.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleRowClick(o.id)}>
                      <TableCell className="font-medium">{o.name}</TableCell>
                      <TableCell className="capitalize">{o.entity_type?.replace('_', ' ')}</TableCell>
                      <TableCell>{o.sector_name || '—'}</TableCell>
                      <TableCell><Badge variant="outline">{o.plan_name || 'Sem plano'}</Badge></TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[o.subscription_status || ''] || 'bg-muted text-muted-foreground'}`}>
                          {o.subscription_status || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">{o.member_count}</TableCell>
                      <TableCell className="text-center">{o.project_count}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString('pt-AO')}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <OrganizationDetailSheet
        orgId={selectedOrgId}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        getOrgDetail={getOrgDetail}
      />
    </>
  );
}
