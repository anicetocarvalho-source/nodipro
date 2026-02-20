import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Shield, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePlatformAdmin } from '@/hooks/usePlatformAdmin';
import { OrganizationsTable } from '@/components/superadmin/OrganizationsTable';
import { SubscriptionsManager } from '@/components/superadmin/SubscriptionsManager';
import { GlobalPaymentsManager } from '@/components/superadmin/GlobalPaymentsManager';
import { PlatformMetricsView } from '@/components/superadmin/PlatformMetrics';
import { PlansManager } from '@/components/superadmin/PlansManager';
import { PlatformAuditLogs } from '@/components/superadmin/PlatformAuditLogs';

export default function SuperAdmin() {
  const {
    isPlatformAdmin, loading, organizations, payments, metrics, plans,
    dataLoading, fetchAll, confirmPayment, cancelPayment, changeSubscription,
    getOrgDetail, createPlan, updatePlan, togglePlanActive, fetchAuditLogs, createOrganization,
  } = usePlatformAdmin();

  useEffect(() => {
    if (isPlatformAdmin) fetchAll();
  }, [isPlatformAdmin, fetchAll]);

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">A verificar permissões…</div>;
  }

  if (!isPlatformAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const pendingCount = payments.filter(p => p.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Backoffice da Plataforma</h1>
            <p className="text-sm text-muted-foreground">Gestão global de organizações, subscrições e pagamentos</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll} disabled={dataLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${dataLoading ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      <Tabs defaultValue="metrics">
        <TabsList>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="organizations">Organizações</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscrições</TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-1.5">
            Pagamentos
            {pendingCount > 0 && <Badge variant="destructive" className="h-5 min-w-5 text-xs">{pendingCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="mt-6">
          <PlatformMetricsView metrics={metrics} loading={dataLoading} />
        </TabsContent>

        <TabsContent value="organizations" className="mt-6">
          <OrganizationsTable organizations={organizations} plans={plans} loading={dataLoading} getOrgDetail={getOrgDetail} createOrganization={createOrganization} />
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-6">
          <SubscriptionsManager organizations={organizations} loading={dataLoading} onChangeSubscription={changeSubscription} />
        </TabsContent>

        <TabsContent value="payments" className="mt-6">
          <GlobalPaymentsManager payments={payments} loading={dataLoading} onConfirm={confirmPayment} onCancel={cancelPayment} />
        </TabsContent>

        <TabsContent value="plans" className="mt-6">
          <PlansManager plans={plans} loading={dataLoading} onCreatePlan={createPlan} onUpdatePlan={updatePlan} onTogglePlan={togglePlanActive} />
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
          <PlatformAuditLogs fetchAuditLogs={fetchAuditLogs} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
