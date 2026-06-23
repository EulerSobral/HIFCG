import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore, type Disciplina } from "@/lib/store";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/disciplinas")({
  head: () => ({ meta: [{ title: "Disciplinas · HIFCG" }] }),
  component: Page,
});

function Page() {
  const disciplinas = useStore((s) => s.disciplinas);
  const cursos = useStore((s) => s.cursos);
  const add = useStore((s) => s.addDisciplina);
  const update = useStore((s) => s.updateDisciplina);
  const remove = useStore((s) => s.removeDisciplina);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Disciplina | null>(null);
  const [cursoId, setCursoId] = useState(cursos[0]?.id ?? "");

  const filtered = useMemo(
    () => disciplinas.filter((d) => `${d.codigo} ${d.nome} ${d.especialidade}`.toLowerCase().includes(q.toLowerCase())),
    [disciplinas, q],
  );

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload: Omit<Disciplina, "id"> = {
      codigo: String(f.get("codigo") || ""),
      nome: String(f.get("nome") || ""),
      cursoId,
      ementa: String(f.get("ementa") || ""),
      especialidade: String(f.get("especialidade") || ""),
      cargaHoraria: Number(f.get("ch") || 60),
    };
    if (editing) { update(editing.id, payload); toast.success("Disciplina atualizada"); }
    else { add(payload); toast.success("Disciplina cadastrada"); }
    setOpen(false); setEditing(null);
  };

  return (
    <div>
      <PageHeader
        title="Disciplinas"
        description="Disciplinas vinculadas a cursos (RF16-RF18)."
        action={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null); setCursoId(cursos[0]?.id ?? ""); }}><Plus className="h-4 w-4 mr-2" />Nova disciplina</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Editar disciplina" : "Nova disciplina"}</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Código</Label><Input name="codigo" required defaultValue={editing?.codigo} /></div>
                  <div className="space-y-2"><Label>Carga horária</Label><Input name="ch" type="number" required defaultValue={editing?.cargaHoraria ?? 60} /></div>
                </div>
                <div className="space-y-2"><Label>Nome</Label><Input name="nome" required defaultValue={editing?.nome} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Curso</Label>
                    <Select value={cursoId} onValueChange={setCursoId}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{cursos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Especialidade</Label><Input name="especialidade" required defaultValue={editing?.especialidade} /></div>
                </div>
                <div className="space-y-2"><Label>Ementa</Label><Textarea name="ementa" rows={3} defaultValue={editing?.ementa} /></div>
                <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar disciplina…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Nome</TableHead><TableHead>Curso</TableHead><TableHead>Especialidade</TableHead><TableHead>CH</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.codigo}</TableCell>
                <TableCell>{d.nome}</TableCell>
                <TableCell className="text-muted-foreground">{cursos.find((c) => c.id === d.cursoId)?.nome ?? "—"}</TableCell>
                <TableCell>{d.especialidade}</TableCell>
                <TableCell>{d.cargaHoraria}h</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(d); setCursoId(d.cursoId); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Remover ${d.nome}?`)) { remove(d.id); toast.success("Removido"); } }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhuma disciplina.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}