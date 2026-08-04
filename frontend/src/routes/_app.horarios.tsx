import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/Combobox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useStore, DIAS, HORARIOS, useCurrentUser } from "@/lib/store";
import { AlertTriangle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/horarios")({
  head: () => ({ meta: [{ title: "Alocar Horários · HIFCG" }] }),
  component: Page,
});

function Page() {
  const s = useStore();
  const user = useCurrentUser();
  const periodoAtivo = s.periodos.find((p) => p.ativo) ?? s.periodos[0];
  const [periodoId, setPeriodoId] = useState(periodoAtivo?.id ?? "");
  const cursosVisiveis = useMemo(() => {
    if (!user) return [];
    if (user.role === "coord_curso" && user.cursoId) return s.cursos.filter((c) => c.id === user.cursoId);
    if (user.role === "coord_area" && user.area) return s.cursos.filter((c) => c.area === user.area);
    return s.cursos;
  }, [s.cursos, user]);
  const [cursoId, setCursoId] = useState(cursosVisiveis[0]?.id ?? "");
  const [filtroTipo, setFiltroTipo] = useState<"curso" | "disciplina">("curso");
  const [filtroDisciplinaId, setFiltroDisciplinaId] = useState("");
  const [periodoCurso, setPeriodoCurso] = useState("todos");

  const disciplinasCurso = useMemo(
    () => s.disciplinas.filter((d) => d.cursoId === cursoId),
    [s.disciplinas, cursoId],
  );
  const disciplinasDisponiveis = useMemo(
    () => (periodoCurso === "todos" ? disciplinasCurso : disciplinasCurso.filter((d) => d.periodo === Number(periodoCurso))),
    [disciplinasCurso, periodoCurso],
  );
  const periodosCurso = useMemo(
    () => Array.from(new Set(disciplinasCurso.map((d) => d.periodo))).sort((a, b) => a - b),
    [disciplinasCurso],
  );

  const [slot, setSlot] = useState<{ dia: number; horario: string } | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [disciplinaId, setDisciplinaId] = useState("");
  const [docenteId, setDocenteId] = useState("");
  const [ambienteId, setAmbienteId] = useState("");

  const alocacoesGrid = useMemo(() => {
    const map: Record<string, typeof s.alocacoes[number]> = {};
    s.alocacoes
      .filter((a) =>
        a.periodoId === periodoId &&
        (filtroTipo === "disciplina" && filtroDisciplinaId
          ? a.disciplinaId === filtroDisciplinaId
          : a.cursoId === cursoId &&
            (periodoCurso === "todos" ||
              s.disciplinas.find((d) => d.id === a.disciplinaId)?.periodo === Number(periodoCurso))),
      )
      .forEach((a) => { map[`${a.dia}-${a.horario}`] = a; });
    return map;
  }, [s.alocacoes, s.disciplinas, periodoId, cursoId, filtroTipo, filtroDisciplinaId, periodoCurso]);

  const conflicts = useMemo(() => {
    const set = new Set<string>();
    const arr = s.alocacoes.filter((a) => a.periodoId === periodoId);
    for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) {
      const a = arr[i], b = arr[j];
      if (a.dia === b.dia && a.horario === b.horario && (a.docenteId === b.docenteId || a.ambienteId === b.ambienteId)) {
        set.add(a.id); set.add(b.id);
      }
    }
    return set;
  }, [s.alocacoes, periodoId]);

  const openSlot = (dia: number, horario: string) => {
    const existing = alocacoesGrid[`${dia}-${horario}`];
    setSlot({ dia, horario });
    setEditId(existing?.id ?? null);
    setDisciplinaId(existing?.disciplinaId ?? "");
    setDocenteId(existing?.docenteId ?? "");
    setAmbienteId(existing?.ambienteId ?? "");
  };

  const save = () => {
    if (!slot || !disciplinaId || !docenteId || !ambienteId) { toast.error("Preencha todos os campos"); return; }
    const conflictId = s.setAlocacao({
      id: editId ?? undefined,
      disciplinaId, docenteId, ambienteId, cursoId, periodoId,
      dia: slot.dia, horario: slot.horario,
    });
    if (conflictId) toast.warning("Atenção: choque de horário detectado!");
    else toast.success("Alocação salva");
    setSlot(null); setEditId(null);
  };

  const onDragStart = (e: React.DragEvent, type: string, id: string) => {
    e.dataTransfer.setData("type", type);
    e.dataTransfer.setData("id", id);
  };

  const onDrop = (e: React.DragEvent, dia: number, horario: string) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("type");
    const id = e.dataTransfer.getData("id");
    if (!type || !id) return;
    openSlot(dia, horario);
    if (type === "disciplina") setDisciplinaId(id);
    if (type === "docente") setDocenteId(id);
    if (type === "ambiente") setAmbienteId(id);
  };

  return (
    <div>
      <PageHeader
        title="Alocar horários"
        description="Monte o quadro do curso. Clique em uma célula ou arraste recursos (RF24, RF29, RF30)."
      />
      <Card className="p-4 mb-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Período letivo</Label>
            <Select value={periodoId} onValueChange={setPeriodoId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{s.periodos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}{p.ativo ? " (ativo)" : ""}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Filtrar por</Label>
            <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as "curso" | "disciplina")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="curso">Curso</SelectItem>
                <SelectItem value="disciplina">Disciplina</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Curso</Label>
            <Combobox
              options={cursosVisiveis.map((c) => ({ value: c.id, label: c.nome, hint: c.codigo }))}
              value={cursoId}
              onChange={(v) => { setCursoId(v); setFiltroDisciplinaId(""); }}
              placeholder="Buscar curso…"
            />
          </div>
          {filtroTipo === "disciplina" ? (
            <div className="space-y-2">
              <Label>Disciplina</Label>
              <Combobox
                options={disciplinasCurso.map((d) => ({ value: d.id, label: d.nome, hint: d.codigo }))}
                value={filtroDisciplinaId}
                onChange={setFiltroDisciplinaId}
                placeholder="Buscar disciplina…"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Período do curso</Label>
              <Select value={periodoCurso} onValueChange={setPeriodoCurso}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os períodos</SelectItem>
                  {periodosCurso.map((p) => <SelectItem key={p} value={String(p)}>{p}º período</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </Card>

      <div className="grid md:grid-cols-[1fr_280px] gap-4">
        <Card className="p-3 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left text-muted-foreground font-medium w-28">Horário</th>
                {DIAS.map((d) => <th key={d} className="p-2 text-left text-muted-foreground font-medium">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {HORARIOS.map((h) => (
                <tr key={h}>
                  <td className="p-2 align-top font-mono text-muted-foreground border-t">{h}</td>
                  {DIAS.map((_, di) => {
                    const a = alocacoesGrid[`${di}-${h}`];
                    const isConflict = a && conflicts.has(a.id);
                    const disc = a && s.disciplinas.find((x) => x.id === a.disciplinaId);
                    const doc = a && s.docentes.find((x) => x.id === a.docenteId);
                    const amb = a && s.ambientes.find((x) => x.id === a.ambienteId);
                    return (
                      <td key={di} className="p-1 align-top border-t">
                        <button
                          type="button"
                          onClick={() => openSlot(di, h)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => onDrop(e, di, h)}
                          className={cn(
                            "w-full min-h-[68px] rounded-md text-left p-2 transition-colors border",
                            a
                              ? isConflict
                                ? "bg-destructive/15 border-destructive/40 hover:bg-destructive/25"
                                : "bg-primary/10 border-primary/30 hover:bg-primary/15"
                              : "border-dashed border-border hover:bg-muted",
                          )}
                        >
                          {a ? (
                            <div className="space-y-0.5">
                              <div className="font-semibold text-foreground flex items-center gap-1">
                                {isConflict && <AlertTriangle className="h-3 w-3 text-destructive" />}
                                {disc?.codigo}
                              </div>
                              <div className="text-muted-foreground truncate">{doc?.nome}</div>
                              <div className="text-[10px] text-muted-foreground">{amb?.codigo}</div>
                            </div>
                          ) : (
                            <div className="text-muted-foreground flex items-center justify-center h-full opacity-50"><Plus className="h-4 w-4" /></div>
                          )}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-3">
          <div className="text-sm font-semibold mb-2">Recursos (arraste)</div>
          <Section title="Disciplinas">
            {disciplinasDisponiveis.map((d) => (
              <Chip key={d.id} onDragStart={(e) => onDragStart(e, "disciplina", d.id)}>{d.codigo} · {d.nome}</Chip>
            ))}
          </Section>
          <Section title="Docentes">
            {s.docentes.map((d) => <Chip key={d.id} onDragStart={(e) => onDragStart(e, "docente", d.id)}>{d.nome}</Chip>)}
          </Section>
          <Section title="Ambientes">
            {s.ambientes.map((a) => <Chip key={a.id} onDragStart={(e) => onDragStart(e, "ambiente", a.id)}>{a.codigo} · {a.tipo}</Chip>)}
          </Section>
        </Card>
      </div>

      <Dialog open={!!slot} onOpenChange={(o) => { if (!o) { setSlot(null); setEditId(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editId ? "Editar alocação" : "Nova alocação"} · {slot && DIAS[slot.dia]} {slot?.horario}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Disciplina</Label>
              <Combobox
                options={disciplinasDisponiveis.map((d) => ({ value: d.id, label: `${d.codigo} · ${d.nome}`, hint: `${d.periodo}º` }))}
                value={disciplinaId}
                onChange={setDisciplinaId}
                placeholder="Buscar disciplina…"
              />
            </div>
            <div className="space-y-2">
              <Label>Docente</Label>
              <Combobox
                options={s.docentes.map((d) => ({ value: d.id, label: d.nome, hint: d.area }))}
                value={docenteId}
                onChange={setDocenteId}
                placeholder="Buscar docente…"
              />
            </div>
            <div className="space-y-2">
              <Label>Ambiente</Label>
              <Combobox
                options={s.ambientes.map((a) => ({ value: a.id, label: `${a.codigo} · ${a.tipo}`, hint: `${a.capacidade} lug.` }))}
                value={ambienteId}
                onChange={setAmbienteId}
                placeholder="Buscar ambiente…"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editId && (
              <Button variant="destructive" onClick={() => { s.removeAlocacao(editId); toast.success("Alocação removida"); setSlot(null); setEditId(null); }}>
                <Trash2 className="h-4 w-4 mr-2" /> Remover
              </Button>
            )}
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{title}</div>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}
function Chip({ children, onDragStart }: { children: React.ReactNode; onDragStart: (e: React.DragEvent<HTMLDivElement>) => void }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="cursor-grab active:cursor-grabbing rounded-md border border-border bg-secondary/60 px-2 py-1 text-xs hover:bg-secondary"
    >
      {children}
    </div>
  );
}