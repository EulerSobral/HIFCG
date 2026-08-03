import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
    if (user.role === "coord_area" && user.departamento) return s.cursos.filter((c) => c.departamento === user.departamento);
    return s.cursos;
  }, [s.cursos, user]);
  const [cursoId, setCursoId] = useState(cursosVisiveis[0]?.id ?? "");

  const [slot, setSlot] = useState<{ dia: number; horario: string } | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [disciplinaId, setDisciplinaId] = useState("");
  const [docenteId, setDocenteId] = useState("");
  const [ambienteId, setAmbienteId] = useState("");

  const alocacoesGrid = useMemo(() => {
    const map: Record<string, typeof s.alocacoes[number]> = {};
    s.alocacoes
      .filter((a) => a.periodoId === periodoId && a.cursoId === cursoId)
      .forEach((a) => { map[`${a.dia}-${a.horario}`] = a; });
    return map;
  }, [s.alocacoes, periodoId, cursoId]);

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
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Período letivo</Label>
            <Select value={periodoId} onValueChange={setPeriodoId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{s.periodos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}{p.ativo ? " (ativo)" : ""}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Curso</Label>
            <Select value={cursoId} onValueChange={setCursoId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{cursosVisiveis.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
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
            {s.disciplinas.filter((d) => d.cursoId === cursoId).map((d) => (
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
              <Select value={disciplinaId} onValueChange={setDisciplinaId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{s.disciplinas.filter((d) => d.cursoId === cursoId).map((d) => <SelectItem key={d.id} value={d.id}>{d.codigo} · {d.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Docente</Label>
              <Select value={docenteId} onValueChange={setDocenteId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{s.docentes.map((d) => <SelectItem key={d.id} value={d.id}>{d.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ambiente</Label>
              <Select value={ambienteId} onValueChange={setAmbienteId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{s.ambientes.map((a) => <SelectItem key={a.id} value={a.id}>{a.codigo} · {a.tipo}</SelectItem>)}</SelectContent>
              </Select>
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