import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/Combobox";
import { DIAS, HORARIOS, useStore, type Alocacao } from "@/lib/store";
import { CalendarClock, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/publico")({
  head: () => ({ meta: [{ title: "Horários públicos · HIFCG" }, { name: "description", content: "Visualização pública dos horários do IFPB-CG." }] }),
  component: Page,
});

function Page() {
  const s = useStore();
  const [nivel, setNivel] = useState<string>("todos");
  const cursosFiltrados = useMemo(
    () => s.cursos.filter((c) => nivel === "todos" || c.nivel === nivel),
    [s.cursos, nivel],
  );

  const [cursoId, setCursoId] = useState<string>(s.cursos[0]?.id ?? "");
  const activeCursoId = useMemo(() => {
    if (cursosFiltrados.some((c) => c.id === cursoId)) return cursoId;
    return cursosFiltrados[0]?.id ?? "";
  }, [cursosFiltrados, cursoId]);

  const selectedCurso = useMemo(() => s.cursos.find((c) => c.id === activeCursoId), [s.cursos, activeCursoId]);
  const [periodoCurso, setPeriodoCurso] = useState<number>(1);

  const listaPeriodos = useMemo(
    () => Array.from({ length: selectedCurso?.periodos ?? 6 }, (_, i) => i + 1),
    [selectedCurso],
  );

  const map = useMemo(() => {
    const m: Record<string, Alocacao[]> = {};
    s.alocacoes
      .filter((a) => a.cursoId === activeCursoId && a.periodoCurso === periodoCurso)
      .forEach((a) => { (m[`${a.dia}-${a.horario}`] ||= []).push(a); });
    return m;
  }, [s.alocacoes, activeCursoId, periodoCurso]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b" style={{ background: "var(--gradient-primary)" }}>
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between text-primary-foreground">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-7 w-7" />
            <div>
              <div className="font-bold text-lg">HIFCG</div>
              <div className="text-xs opacity-90">Consulta pública de horários · IFPB-CG</div>
            </div>
          </div>
          <Link to="/" className="text-sm inline-flex items-center gap-1 hover:underline"><ArrowLeft className="h-4 w-4" /> Acessar sistema</Link>
        </div>
      </header>
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <Card className="p-4 grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Nível de ensino</Label>
            <Select value={nivel} onValueChange={(v) => { setNivel(v); setPeriodoCurso(1); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os níveis</SelectItem>
                <SelectItem value="Técnico Integrado">Técnico Integrado</SelectItem>
                <SelectItem value="Técnico Subsequente">Técnico Subsequente</SelectItem>
                <SelectItem value="Superior">Superior</SelectItem>
                <SelectItem value="Pós-Graduação">Pós-Graduação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Curso (Autocompletar)</Label>
            <Combobox
              options={cursosFiltrados.map((c) => ({ value: c.id, label: c.nome, hint: c.codigo }))}
              value={activeCursoId}
              onChange={(v) => { setCursoId(v); setPeriodoCurso(1); }}
              placeholder="Buscar curso…"
            />
          </div>
          <div className="space-y-2">
            <Label>Período do curso</Label>
            <Select value={String(periodoCurso)} onValueChange={(v) => setPeriodoCurso(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {listaPeriodos.map((p) => <SelectItem key={p} value={String(p)}>{p}º período</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </Card>
        <Card className="p-3 overflow-x-auto">
          <div className="mb-2 text-xs font-semibold text-muted-foreground px-1">
            Grade de Aulas: {selectedCurso ? `${selectedCurso.nome} (${selectedCurso.codigo}) · ${periodoCurso}º Período` : "Nenhum curso selecionado"}
          </div>
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
                        {items.map((a) => {
                          const d = s.disciplinas.find((x) => x.id === a.disciplinaId);
                          const doc = s.docentes.find((x) => x.id === a.docenteId);
                          const amb = s.ambientes.find((x) => x.id === a.ambienteId);
                          return (
                            <div key={a.id} className="rounded-md bg-primary/10 border border-primary/30 p-2 mb-1">
                              <div className="font-semibold">{d?.nome ?? d?.codigo}</div>
                              <div className="text-muted-foreground">{doc?.nome}</div>
                              <div className="text-[10px] text-muted-foreground">{amb?.codigo}</div>
                            </div>
                          );
                        })}
                        {items.length === 0 && <div className="text-muted-foreground/40 text-center py-3">—</div>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}