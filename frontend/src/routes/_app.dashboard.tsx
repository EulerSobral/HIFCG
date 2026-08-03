import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useStore, useCurrentUser, roleLabel } from "@/lib/store";
import { Users, Building2, GraduationCap, BookOpen, CalendarRange, GanttChartSquare, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Painel · HIFCG" }] }),
  component: Dashboard,
});

function Dashboard() {
  const user = useCurrentUser();
  const s = useStore();

  const conflicts: string[] = [];
  for (let i = 0; i < s.alocacoes.length; i++) {
    for (let j = i + 1; j < s.alocacoes.length; j++) {
      const a = s.alocacoes[i], b = s.alocacoes[j];
      if (a.periodoId === b.periodoId && a.dia === b.dia && a.horario === b.horario &&
          (a.docenteId === b.docenteId || a.ambienteId === b.ambienteId || a.cursoId === b.cursoId)) {
        conflicts.push(`${a.id}-${b.id}`);
      }
    }
  }

  const stats = [
    { label: "Docentes", value: s.docentes.length, icon: Users, to: "/docentes" as const },
    { label: "Ambientes", value: s.ambientes.length, icon: Building2, to: "/ambientes" as const },
    { label: "Cursos", value: s.cursos.length, icon: GraduationCap, to: "/cursos" as const },
    { label: "Disciplinas", value: s.disciplinas.length, icon: BookOpen, to: "/disciplinas" as const },
    { label: "Períodos", value: s.periodos.length, icon: CalendarRange, to: "/periodos" as const },
    { label: "Alocações", value: s.alocacoes.length, icon: GanttChartSquare, to: "/horarios" as const },
  ];

  return (
    <div>
      <PageHeader
        title={`Olá, ${user?.nome.split(" ")[0] ?? ""}`}
        description={`Perfil: ${user ? roleLabel(user.role) : ""}. Panorama do sistema HIFCG.`}
      />
      {conflicts.length > 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-md border border-warning/40 bg-warning/10 p-4">
          <AlertTriangle className="h-5 w-5 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold">{conflicts.length} choque(s) detectado(s)</div>
            <div className="text-muted-foreground">Verifique em <Link to="/horarios" className="underline">Alocar Horários</Link>.</div>
          </div>
        </div>
      )}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
        {stats.map((st) => (
          <Link to={st.to} key={st.label}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{st.label}</CardTitle>
                <st.icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{st.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <div className="grid md:grid-cols-2 gap-4 mt-8">
        <Card>
          <CardHeader><CardTitle>Atividade recente</CardTitle><CardDescription>Últimas ações registradas.</CardDescription></CardHeader>
          <CardContent className="space-y-2 text-sm max-h-72 overflow-y-auto">
            {s.logs.length === 0 && <p className="text-muted-foreground">Nenhuma atividade ainda.</p>}
            {s.logs.slice(0, 10).map((l) => (
              <div key={l.id} className="flex justify-between gap-3 py-1 border-b last:border-0">
                <div>
                  <div className="font-medium">{l.acao}</div>
                  <div className="text-xs text-muted-foreground">{l.userName} · {l.detalhe}</div>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(l.timestamp).toLocaleString("pt-BR")}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Período ativo</CardTitle><CardDescription>Período corrente de alocação.</CardDescription></CardHeader>
          <CardContent className="text-sm">
            {s.periodos.filter((p) => p.ativo).map((p) => (
              <div key={p.id} className="space-y-1">
                <div className="text-2xl font-bold">{p.nome}</div>
                <div className="text-muted-foreground">{p.inicio} → {p.fim}</div>
                <div className="text-muted-foreground">Matrícula: {p.inicioMatricula} → {p.fimMatricula}</div>
              </div>
            ))}
            {!s.periodos.some((p) => p.ativo) && <p className="text-muted-foreground">Nenhum período ativo.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}