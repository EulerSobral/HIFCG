import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DIAS, HORARIOS, useStore, type Alocacao } from "@/lib/store";
import { CalendarClock, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/publico")({
  head: () => ({ meta: [{ title: "Horários públicos · HIFCG" }, { name: "description", content: "Visualização pública dos horários do IFPB-CG." }] }),
  component: Page,
});

function Page() {
  const s = useStore();
  const [periodoId, setPeriodoId] = useState(s.periodos.find((p) => p.ativo)?.id ?? s.periodos[0]?.id ?? "");
  const [cursoId, setCursoId] = useState(s.cursos[0]?.id ?? "");
  const map = useMemo(() => {
    const m: Record<string, Alocacao[]> = {};
    s.alocacoes
      .filter((a) => a.periodoId === periodoId && a.cursoId === cursoId)
      .forEach((a) => { (m[`${a.dia}-${a.horario}`] ||= []).push(a); });
    return m;
  }, [s.alocacoes, periodoId, cursoId]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b" style={{ background: "var(--gradient-primary)" }}>
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between text-primary-foreground">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-7 w-7" />
            <div>
              <div className="font-bold text-lg">HIFCG</div>
              <div className="text-xs opacity-90">Consulta pública · IFPB-CG</div>
            </div>
          </div>
          <Link to="/" className="text-sm inline-flex items-center gap-1 hover:underline"><ArrowLeft className="h-4 w-4" /> Acessar sistema</Link>
        </div>
      </header>
      <div className="max-w-5xl mx-auto p-6 space-y-4">
        <Card className="p-4 grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Período</Label>
            <Select value={periodoId} onValueChange={setPeriodoId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{s.periodos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Curso</Label>
            <Select value={cursoId} onValueChange={setCursoId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{s.cursos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </Card>
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
                        {items.map((a) => {
                          const d = s.disciplinas.find((x) => x.id === a.disciplinaId);
                          const doc = s.docentes.find((x) => x.id === a.docenteId);
                          const amb = s.ambientes.find((x) => x.id === a.ambienteId);
                          return (
                            <div key={a.id} className="rounded-md bg-primary/10 border border-primary/30 p-2 mb-1">
                              <div className="font-semibold">{d?.nome}</div>
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