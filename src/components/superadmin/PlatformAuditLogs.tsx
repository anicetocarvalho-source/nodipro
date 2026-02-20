import { useState, useEffect, useCallback } from 'react';
import { ScrollText, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { AuditLog, AuditLogsResult } from '@/hooks/usePlatformAdmin';

interface Props {
  fetchAuditLogs: (params: {
    limit?: number; offset?: number; action_filter?: string | null;
    target_filter?: string | null; search?: string | null;
    date_from?: string | null; date_to?: string | null;
  }) => Promise<AuditLogsResult>;
}

const PAGE_SIZE = 30;

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  update: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  delete: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export function PlatformAuditLogs({ fetchAuditLogs }: Props) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [targetFilter, setTargetFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchAuditLogs({
      limit: PAGE_SIZE, offset: page * PAGE_SIZE,
      action_filter: actionFilter === 'all' ? null : actionFilter,
      target_filter: targetFilter === 'all' ? null : targetFilter,
      search: search || null,
    });
    setLogs(result.logs);
    setTotal(result.total);
    setLoading(false);
  }, [fetchAuditLogs, page, actionFilter, targetFilter, search]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-primary" />
          Logs de Auditoria ({total})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por utilizador ou alvo…"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={v => { setActionFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Acção" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="create">Criar</SelectItem>
              <SelectItem value="update">Editar</SelectItem>
              <SelectItem value="delete">Eliminar</SelectItem>
            </SelectContent>
          </Select>
          <Select value={targetFilter} onValueChange={v => { setTargetFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Entidade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="projects">Projectos</SelectItem>
              <SelectItem value="tasks">Tarefas</SelectItem>
              <SelectItem value="organizations">Organizações</SelectItem>
              <SelectItem value="organization_members">Membros</SelectItem>
              <SelectItem value="portfolios">Portfólios</SelectItem>
              <SelectItem value="risks">Riscos</SelectItem>
              <SelectItem value="documents">Documentos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Acção</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Alvo</TableHead>
                <TableHead>Utilizador</TableHead>
                <TableHead>Data/Hora</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">A carregar…</TableCell></TableRow>
              ) : logs.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum registo encontrado.</TableCell></TableRow>
              ) : logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionColors[log.action] || 'bg-muted text-muted-foreground'}`}>
                      {log.action}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{log.target_type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm max-w-[200px] truncate" title={log.target_name || ''}>
                    {log.target_name || log.target_id || '—'}
                  </TableCell>
                  <TableCell className="text-sm">{log.user_name || 'Sistema'}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('pt-AO')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Página {page + 1} de {totalPages}
            </span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
