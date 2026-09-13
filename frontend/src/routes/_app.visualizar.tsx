import React, { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/Combobox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResourceDetailsModal } from "@/components/ResourceDetailsModal";
import { DIAS, SLOTS_HORARIOS, getTurnosParaCurso, useStore, type Alocacao } from "@/lib/store";

export const Route = createFileRoute("/_app/visualizar")({
  head: () => ({ meta: [{ title: "Visualizar Horários · HIFCG" }] }),
  component: Page,
});

function Page() {
  const s = useStore();
  const [cursoId, setCursoId] = useState(s.cursos[0]?.id ?? "");
  const selectedCurso = useMemo(() => s.cursos.find((c) => c.id === cursoId), [s.cursos, cursoId]);
  const [periodoCurso, setPeriodoCurso] = useState<number>(1);
  const listaPeriodosCurso = useMemo(
    () => Array.from({ length: selectedCurso?.periodos ?? 6 }, (_, i) => i + 1),
    [selectedCurso],
  );

  const [docenteId, setDocenteId] = useState(s.docentes[0]?.id ?? "");
  const [ambienteId, setAmbienteId] = useState(s.ambientes[0]?.id ?? "");
  const [periodoGeral, setPeriodoGeral] = useState<number>(1);

  const [detailsDocenteId, setDetailsDocenteId] = useState<string | null>(null);
  const [detailsAmbienteId, setDetailsAmbienteId] = useState<string | null>(null);

  const turnosCurso = useMemo(() => getTurnosParaCurso(selectedCurso?.turno), [selectedCurso]);

  return (
    <div>
      <PageHeader title="Visualizar horários" description="Por curso, docente, ambiente ou período do curso. Clique no docente ou ambiente para ver a agenda detalhada." />
      <Tabs defaultValue="curso">
        <TabsList>
          <TabsTrigger value="curso">Por curso e período</TabsTrigger>
          <TabsTrigger value="docente">Por docente</TabsTrigger>
          <TabsTrigger value="ambiente">Por ambiente / sala</TabsTrigger>
          <TabsTrigger value="periodo">Geral por período do curso</TabsTrigger>
        </TabsList>
        <TabsContent value="curso" className="mt-4 space-y-4">
          <div className="grid md:grid-cols-2 gap-4 max-w-xl">
            <div className="space-y-2">
              <Label>Curso</Label>
              <Combobox
                options={s.cursos.map((c) => ({ value: c.id, label: c.nome, hint: `${c.codigo} (${c.turno})` }))}
                value={cursoId}
                onChange={(v) => { setCursoId(v); setPeriodoCurso(1); }}
                placeholder="Buscar curso…"
              />
            </div>
            <div className="space-y-2">
              <Label>Período do curso</Label>
              <Select value={String(periodoCurso)} onValueChange={(v) => setPeriodoCurso(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {listaPeriodosCurso.map((p) => <SelectItem key={p} value={String(p)}>{p}º período</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Grid
            filter={(a) => a.cursoId === cursoId && a.periodoCurso === periodoCurso}
            showCurso={false}
            turnosVisiveis={turnosCurso}
            onSelectDocente={setDetailsDocenteId}
            onSelectAmbiente={setDetailsAmbienteId}
          />
        </TabsContent>
        <TabsContent value="docente" className="mt-4 space-y-4">
          <div className="space-y-2 max-w-md">
            <Label>Docente</Label>
            <Combobox
              options={s.docentes.map((d) => ({ value: d.id, label: d.nome, hint: d.area }))}
              value={docenteId}
              onChange={setDocenteId}
              placeholder="Buscar docente…"
            />
          </div>
          <Grid
            filter={(a) => a.docenteId === docenteId}
            showCurso
            onSelectDocente={setDetailsDocenteId}
            onSelectAmbiente={setDetailsAmbienteId}
          />
        </TabsContent>
        <TabsContent value="ambiente" className="mt-4 space-y-4">
          <div className="space-y-2 max-w-md">
            <Label>Ambiente / Sala</Label>
            <Combobox
              options={s.ambientes.map((a) => ({ value: a.id, label: `${a.codigo} · ${a.tipo}`, hint: `Bloco ${a.bloco}` }))}
              value={ambienteId}
              onChange={setAmbienteId}
              placeholder="Buscar ambiente…"
            />
          </div>
          <Grid
            filter={(a) => a.ambienteId === ambienteId}
            showCurso
            onSelectDocente={setDetailsDocenteId}
            onSelectAmbiente={setDetailsAmbienteId}
          />
        </TabsContent>
        <TabsContent value="periodo" className="mt-4 space-y-4">
          <div className="space-y-2 max-w-xs">
            <Label>Período do curso (todos os cursos)</Label>
            <Select value={String(periodoGeral)} onValueChange={(v) => setPeriodoGeral(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((p) => <SelectItem key={p} value={String(p)}>{p}º período</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Grid
            filter={(a) => a.periodoCurso === periodoGeral}
            showCurso
            onSelectDocente={setDetailsDocenteId}
            onSelectAmbiente={setDetailsAmbienteId}
          />
        </TabsContent>
      </Tabs>

      <ResourceDetailsModal
        docenteId={detailsDocenteId}
        ambienteId={detailsAmbienteId}
        onClose={() => {
          setDetailsDocenteId(null);
          setDetailsAmbienteId(null);
        }}
      />
    </div>
  );
}

function Grid({
  filter,
  showCurso,
  turnosVisiveis = ["Manhã", "Tarde", "Noite"],
  onSelectDocente,
  onSelectAmbiente,
}: {
  filter: (a: Alocacao) => boolean;
  showCurso: boolean;
  turnosVisiveis?: Array<"Manhã" | "Tarde" | "Noite">;
  onSelectDocente: (id: string) => void;
  onSelectAmbiente: (id: string) => void;
}) {
  const s = useStore();
  const map = useMemo(() => {
    const m: Record<string, Alocacao[]> = {};
    s.alocacoes.filter(filter).forEach((a) => { (m[`${a.dia}-${a.horario}`] ||= []).push(a); });
    return m;
  }, [s.alocacoes, filter]);

  return (
    <Card className="p-3 overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr>
            <th className="p-2 text-left text-muted-foreground w-32">Horário (50 min)</th>
            {DIAS.map((d) => <th key={d} className="p-2 text-left text-muted-foreground">{d}</th>)}
          </tr>
        </thead>
        <tbody>
          {turnosVisiveis.map((turno) => {
            const slotsDoTurno = SLOTS_HORARIOS.filter((s) => s.turno === turno);
            return (
              <React.Fragment key={turno}>
                <tr className="bg-muted/40 border-t border-b">
                  <td colSpan={7} className="px-2 py-1.5 text-[11px] font-bold text-primary tracking-wide uppercase">
                    Turno {turno} ({slotsDoTurno.length} aulas)
                  </td>
                </tr>
                {slotsDoTurno.map((slotObj) => {
                  const h = slotObj.horario;
                  return (
                    <tr key={slotObj.id}>
                      <td className="p-2 font-mono text-muted-foreground border-t align-top bg-muted/10">
                        <div className="font-semibold text-foreground text-xs">{slotObj.code}</div>
                        <div className="text-[10px]">{h}</div>
                      </td>
                      {DIAS.map((_, di) => {
                        const items = map[`${di}-${h}`] ?? [];
                        return (
                          <td key={di} className="p-1 border-t align-top min-w-[110px]">
                            <div className="space-y-1">
                              {items.map((a) => {
                                const d = s.disciplinas.find((x) => x.id === a.disciplinaId);
                                const doc = s.docentes.find((x) => x.id === a.docenteId);
                                const amb = s.ambientes.find((x) => x.id === a.ambienteId);
                                const curso = s.cursos.find((x) => x.id === a.cursoId);
                                return (
                                  <div key={a.id} className="rounded-md bg-primary/10 border border-primary/30 p-2 shadow-xs space-y-0.5">
                                    <div className="font-semibold text-foreground">{d?.codigo ?? d?.nome}</div>
                                    <div>
                                      <button
                                        type="button"
                                        onClick={() => doc?.id && onSelectDocente(doc.id)}
                                        className="text-primary hover:underline font-medium text-left truncate block w-full cursor-pointer text-xs"
                                        title="Ver detalhes do docente"
                                      >
                                        {doc?.nome || "Docente"}
                                      </button>
                                    </div>
                                    <div className="text-[10px]">
                                      <button
                                        type="button"
                                        onClick={() => amb?.id && onSelectAmbiente(amb.id)}
                                        className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                                        title="Ver detalhes do ambiente"
                                      >
                                        {amb?.codigo || "Ambiente"}
                                      </button>
                                      {showCurso && curso ? <span className="text-muted-foreground"> · {curso.codigo} ({a.periodoCurso}º per.)</span> : ""}
                                    </div>
                                  </div>
                                );
                              })}
                              {items.length === 0 && <div className="text-muted-foreground/40 text-center py-3">—</div>}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}