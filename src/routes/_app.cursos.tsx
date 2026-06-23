import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore, type Curso } from "@/lib/store";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/cursos")({
  head: () => ({ meta: [{ title: "Cursos · HIFCG" }] }),
  component: Page,
});

function Page() {
  const cursos = useStore((s) => s.cursos);
  const add = useStore((s) => s.addCurso);
  const update = useStore((s) => s.updateCurso);
  const remove = useStore((s) => s.removeCurso);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Curso | null>(null);
  const [turno, setTurno] = useState<Curso["turno"]>("Matutino");
  const [nivel, setNivel] = useState<Curso["nivel"]>("Superior");

  const filtered = useMemo(
    () => cursos.filter((c) => `${c.codigo} ${c.nome} ${c.departamento}`.toLowerCase().includes(q.toLowerCase())),
    [cursos, q],
  );

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload: Omit<Curso, "id"> = {
      codigo: String(f.get("codigo") || ""),
      nome: String(f.get("nome") || ""),
      turno, nivel,
      departamento: String(f.get("departamento") || ""),
    };
    if (editing) { update(editing.id, payload); toast.success("Curso atualizado"); }
    else { add(payload); toast.success("Curso cadastrado"); }
    setOpen(false); setEditing(null);
  };

  return (
    <div>
      <PageHeader
        title="Cursos"
        description="Cursos vinculados a um departamento (RF13-RF20)."
        action={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null); setTurno("Matutino"); setNivel("Superior"); }}><Plus className="h-4 w-4 mr-2" />Novo curso</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Editar curso" : "Novo curso"}</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Código</Label><Input name="codigo" required defaultValue={editing?.codigo} /></div>
                  <div className="space-y-2"><Label>Departamento</Label><Input name="departamento" required defaultValue={editing?.departamento} /></div>
                </div>
                <div className="space-y-2"><Label>Nome</Label><Input name="nome" required defaultValue={editing?.nome} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Turno</Label>
                    <Select value={turno} onValueChange={(v) => setTurno(v as Curso["turno"])}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(["Integral","Matutino","Vespertino","Noturno"] as const).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Nível</Label>
                    <Select value={nivel} onValueChange={(v) => setNivel(v as Curso["nivel"])}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(["Técnico Subsequente","Técnico Integrado","Superior","Pós-Graduação"] as const).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar curso…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" list="curs-list" />
          <datalist id="curs-list">{cursos.map((c) => <option key={c.id} value={c.nome} />)}</datalist>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Nome</TableHead><TableHead>Turno</TableHead><TableHead>Nível</TableHead><TableHead>Departamento</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.codigo}</TableCell>
                <TableCell>{c.nome}</TableCell>
                <TableCell>{c.turno}</TableCell>
                <TableCell>{c.nivel}</TableCell>
                <TableCell>{c.departamento}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setTurno(c.turno); setNivel(c.nivel); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Remover ${c.nome}?`)) { remove(c.id); toast.success("Removido"); } }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum curso.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}