import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DIAS, HORARIOS, useStore, type Alocacao } from "@/lib/store";

export const Route = createFileRoute("/_app/visualizar")({
  head: () => ({ meta: [{ title: "Visualizar Horários · HIFCG" }] }),
  component: Page,
});

function Page() {
  const s = useStore();
  const [periodoId, setPeriodoId] = useState(s.periodos.find((p) => p.ativo)?.id ?? s.periodos[0]?.id ?? "");
  const [cursoId, setCursoId] = useState(s.cursos[0]?.id ?? "");
  const [docenteId, setDocenteId] = useState(s.docentes[0]?.id ?? "");

  return (
    <div>
      <PageHeader title="Visualizar horários" description="Por curso, docente ou período (RF26-RF28, RF37)." />
      <Card className="p-4 mb-4">
        <Label className="mb-2 block">Período letivo</Label>
        <Select value={periodoId} onValueChange={setPeriodoId}>
          <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
          <SelectContent>{s.periodos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
        </Select>
      </Card>
      <Tabs defaultValue="curso">
        <TabsList>
          <TabsTrigger value="curso">Por curso</TabsTrigger>
          <TabsTrigger value="docente">Por docente</TabsTrigger>
          <TabsTrigger value="periodo">Período completo</TabsTrigger>
        </TabsList>
        <TabsContent value="curso" className="mt-4 space-y-4">
          <Select value={cursoId} onValueChange={setCursoId}>
            <SelectTrigger className="max-w-md"><SelectValue /></SelectTrigger>
            <SelectContent>{s.cursos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
          </Select>
          <Grid filter={(a) => a.periodoId === periodoId && a.cursoId === cursoId} showCurso={false} />
        </TabsContent>
        <TabsContent value="docente" className="mt-4 space-y-4">
          <Select value={docenteId} onValueChange={setDocenteId}>
            <SelectTrigger className="max-w-md"><SelectValue /></SelectTrigger>
            <SelectContent>{s.docentes.map((d) => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}</SelectContent>
          </Select>
          <Grid filter={(a) => a.periodoId === periodoId && a.docenteId === docenteId} showCurso />
        </TabsContent>
        <TabsContent value="periodo" className="mt-4">
          <Grid filter={(a) => a.periodoId === periodoId} showCurso />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Grid({ filter, showCurso }: { filter: (a: Alocacao) => boolean; showCurso: boolean }) {
  const s = useStore();
  const map = useMemo(() => {
    const m: Record<string, Alocacao[]> = {};
    s.alocacoes.filter(filter).forEach((a) => { (m[`${a.dia}-${a.horario}`] ||= []).push(a); });
    return m;
  }, [s.alocacoes, filter]);
  return (
    <Card className="p-3 overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead><tr><th className="p-2 text-left text-muted-foreground w-28">Horário</th>{DIAS.map((d) => <th key={d} className="p-2 text-left text-muted-foreground">{d}</th>)}</tr></thead>
        <tbody>
          {HORARIOS.map((h) => (
            <tr key={h}>
              <td className="p-2 font-mono text-muted-foreground border-t align-top">{h}</td>
              {DIAS.map((_, di) => {
                const items = map[`${di}-${h}`] ?? [];
                return (
                  <td key={di} className="p-1 border-t align-top">
                    <div className="space-y-1">
                      {items.map((a) => {
                        const d = s.disciplinas.find((x) => x.id === a.disciplinaId);
                        const doc = s.docentes.find((x) => x.id === a.docenteId);
                        const amb = s.ambientes.find((x) => x.id === a.ambienteId);
                        const curso = s.cursos.find((x) => x.id === a.cursoId);
                        return (
                          <div key={a.id} className="rounded-md bg-primary/10 border border-primary/30 p-2">
                            <div className="font-semibold">{d?.codigo}</div>
                            <div className="text-muted-foreground truncate">{doc?.nome}</div>
                            <div className="text-[10px] text-muted-foreground">{amb?.codigo}{showCurso && curso ? ` · ${curso.codigo}` : ""}</div>
                          </div>
                        );
                      })}
                      {items.length === 0 && <div className="text-muted-foreground/40 text-center py-3">—</div>}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}