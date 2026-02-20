import { useState, useEffect } from 'react';
import { Building2, Users, FolderKanban, Receipt, Loader2, Globe, MapPin, Calendar } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { OrgDetail } from '@/hooks/usePlatformAdmin';

interface Props {
  orgId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getOrgDetail: (orgId: string) => Promise<OrgDetail | null>;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  trial: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-muted text-muted-foreground',
};

function QuotaBar({ label, current, max }: { label: string; current: number; max: number }) {
  const pct = max === -1 ? 0 : Math.min((current / max) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{current} / {max === -1 ? '∞' : max}</span>
      </div>
      {max !== -1 && <Progress value={pct} className="h-2" />}
    </div>
  );
}

export function OrganizationDetailSheet({ orgId, open, onOpenChange, getOrgDetail }: Props) {
  const [detail, setDetail] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orgId || !open) { setDetail(null); return; }
    setLoading(true);
    getOrgDetail(orgId).then(d => { setDetail(d); setLoading(false); });
  }, [orgId, open, getOrgDetail]);

  const org = detail?.organization;
  const sub = detail?.subscription;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !detail || !org ? (
          <div className="text-center py-12 text-muted-foreground">Erro ao carregar dados.</div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                {org.name}
              </SheetTitle>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span className="capitalize">{org.entity_type?.replace('_', ' ')}</span>
                {org.sector_name && <span>· {org.sector_name}</span>}
                {org.province_name && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{org.province_name}</span>}
              </div>
              {org.website && (
                <a href={org.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary flex items-center gap-1">
                  <Globe className="h-3 w-3" />{org.website}
                </a>
              )}
            </SheetHeader>

            {/* Quotas */}
            {sub && (
              <div className="mt-4 p-4 rounded-lg border bg-muted/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Plano: <Badge variant="outline">{sub.plan_name}</Badge></span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[sub.status] || ''}`}>{sub.status}</span>
                </div>
                <QuotaBar label="Projectos" current={detail.quotas.projects} max={sub.max_projects} />
                <QuotaBar label="Membros" current={detail.quotas.members} max={sub.max_members} />
                <QuotaBar label="Portfólios" current={detail.quotas.portfolios} max={sub.max_portfolios} />
              </div>
            )}

            <Tabs defaultValue="members" className="mt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="members" className="text-xs">
                  <Users className="h-3.5 w-3.5 mr-1" />Membros ({detail.members.length})
                </TabsTrigger>
                <TabsTrigger value="projects" className="text-xs">
                  <FolderKanban className="h-3.5 w-3.5 mr-1" />Projectos ({detail.projects.length})
                </TabsTrigger>
                <TabsTrigger value="payments" className="text-xs">
                  <Receipt className="h-3.5 w-3.5 mr-1" />Pagamentos ({detail.payments.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="members" className="mt-4 space-y-2">
                {detail.members.length === 0 ? (
                  <p className="text-center py-4 text-sm text-muted-foreground">Sem membros.</p>
                ) : detail.members.map(m => (
                  <div key={m.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {m.full_name ? m.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.full_name || 'Sem nome'}</p>
                      <p className="text-xs text-muted-foreground capitalize">{m.role}{m.is_primary ? ' · Primário' : ''}</p>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(m.joined_at).toLocaleDateString('pt-AO')}
                    </span>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="projects" className="mt-4">
                {detail.projects.length === 0 ? (
                  <p className="text-center py-4 text-sm text-muted-foreground">Sem projectos.</p>
                ) : (
                  <div className="rounded-md border overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Progresso</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.projects.map(p => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium text-sm">{p.name}</TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{p.status}</Badge></TableCell>
                            <TableCell className="text-right text-sm">{p.progress || 0}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="payments" className="mt-4">
                {detail.payments.length === 0 ? (
                  <p className="text-center py-4 text-sm text-muted-foreground">Sem pagamentos.</p>
                ) : (
                  <div className="rounded-md border overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Referência</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Data</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.payments.map(p => (
                          <TableRow key={p.id}>
                            <TableCell className="font-mono text-sm">{p.reference_code}</TableCell>
                            <TableCell className="text-sm">{Number(p.amount).toLocaleString('pt-AO')} {p.currency}</TableCell>
                            <TableCell>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[p.status] || 'bg-muted text-muted-foreground'}`}>
                                {p.status}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString('pt-AO')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
