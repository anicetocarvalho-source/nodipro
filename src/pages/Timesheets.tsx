import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Clock, TrendingUp } from "lucide-react";
import { useMyTimeEntries, useCreateTimeEntry, useDeleteTimeEntry, useUserCapacity, useUpsertCapacity } from "@/hooks/useTimesheets";
import { useProjects } from "@/hooks/useProjects";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { pt } from "date-fns/locale";

export default function Timesheets() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, "yyyy-MM-dd");
  const weekEndStr = format(weekEnd, "yyyy-MM-dd");

  const { data: entries = [] } = useMyTimeEntries(weekStartStr, weekEndStr);
  const { data: capacity } = useUserCapacity();
  const { data: projects = [] } = useProjects();
  const create = useCreateTimeEntry();
  const remove = useDeleteTimeEntry();
  const upsertCap = useUpsertCapacity();

  const [form, setForm] = useState({
    entry_date: format(today, "yyyy-MM-dd"),
    hours: "1",
    project_id: "",
    description: "",
    billable: false,
  });
  const [capInput, setCapInput] = useState(capacity?.weekly_hours?.toString() ?? "40");

  const totalHours = useMemo(
    () => entries.reduce((s, e) => s + Number(e.hours), 0),
    [entries]
  );
  const weeklyTarget = Number(capacity?.weekly_hours ?? 40);
  const utilization = weeklyTarget > 0 ? (totalHours / weeklyTarget) * 100 : 0;
  const utilizationColor =
    utilization > 100 ? "text-destructive" : utilization > 80 ? "text-warning" : "text-success";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate({
      entry_date: form.entry_date,
      hours: Number(form.hours),
      project_id: form.project_id || null,
      description: form.description || undefined,
      billable: form.billable,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Folhas de Horas</h1>
        <p className="text-muted-foreground">
          Semana de {format(weekStart, "d 'de' MMMM", { locale: pt })} a {format(weekEnd, "d 'de' MMMM", { locale: pt })}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Horas esta semana</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">de {weeklyTarget}h planeadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Utilização</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${utilizationColor}`}>{utilization.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              {utilization > 100 ? "Sobre-alocação" : "Capacidade disponível"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Capacidade semanal</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input
              type="number"
              min={0}
              max={168}
              value={capInput}
              onChange={(e) => setCapInput(e.target.value)}
              className="w-20"
            />
            <Button size="sm" onClick={() => upsertCap.mutate(Number(capInput))}>
              Guardar
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registar horas</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-5">
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                value={form.entry_date}
                onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Horas</Label>
              <Input
                type="number"
                step="0.25"
                min={0.25}
                max={24}
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Projecto</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sem projecto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Descrição</Label>
              <Textarea
                rows={1}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="md:col-span-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.billable}
                  onCheckedChange={(v) => setForm({ ...form, billable: v })}
                  id="billable"
                />
                <Label htmlFor="billable">Facturável</Label>
              </div>
              <Button type="submit" disabled={create.isPending}>Adicionar</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lançamentos da semana</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Sem registos esta semana.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Projecto</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                  <TableHead>Facturável</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => {
                  const proj = projects.find((p) => p.id === e.project_id);
                  return (
                    <TableRow key={e.id}>
                      <TableCell>{format(new Date(e.entry_date), "dd/MM")}</TableCell>
                      <TableCell>{proj?.name ?? "—"}</TableCell>
                      <TableCell className="max-w-xs truncate">{e.description ?? ""}</TableCell>
                      <TableCell className="text-right font-medium">{Number(e.hours).toFixed(2)}</TableCell>
                      <TableCell>
                        {e.billable ? <Badge>Sim</Badge> : <Badge variant="outline">Não</Badge>}
                      </TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => remove.mutate(e.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
