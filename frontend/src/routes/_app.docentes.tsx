import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore, type Docente } from "@/lib/store";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/docentes")({
  head: () => ({ meta: [{ title: "Docentes · HIFCG" }] }),
  component: DocentesPage,
});

function DocentesPage() {
  const docentes = useStore((s) => s.docentes);
  const add = useStore((s) => s.addDocente);
  const update = useStore((s) => s.updateDocente);
  const remove = useStore((s) => s.removeDocente);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Docente | null>(null);

  const filtered = useMemo(
    () => docentes.filter((d) => `${d.nome} ${d.email} ${d.matricula} ${d.area}`.toLowerCase().includes(q.toLowerCase())),
    [docentes, q],
  );

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = {
      nome: String(f.get("nome") || ""),
      email: String(f.get("email") || ""),
      matricula: String(f.get("matricula") || ""),
      area: String(f.get("area") || ""),
    };
    if (editing) { update(editing.id, payload); toast.success("Docente atualizado"); }
    else { add(payload); toast.success("Docente cadastrado"); }
    setOpen(false); setEditing(null);
  };

  return (
    <div>
      <PageHeader
        title="Docentes"
        description="Cadastro e gerenciamento dos docentes (RF1-RF7)."
        action={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4 mr-2" />Novo docente</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Editar docente" : "Novo docente"}</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2"><Label>Nome</Label><Input name="nome" required defaultValue={editing?.nome} /></div>
                <div className="space-y-2"><Label>E-mail</Label><Input name="email" type="email" required defaultValue={editing?.email} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Matrícula</Label><Input name="matricula" required defaultValue={editing?.matricula} /></div>
                  <div className="space-y-2"><Label>Área / Coordenação</Label><Input name="area" required defaultValue={editing?.area} /></div>
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
          <Input placeholder="Buscar docente (autocompletar)…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" list="docentes-list" />
          <datalist id="docentes-list">{docentes.map((d) => <option key={d.id} value={d.nome} />)}</datalist>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>E-mail</TableHead><TableHead>Matrícula</TableHead><TableHead>Área / Coordenação</TableHead><TableHead className="w-24 text-right">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium">{d.nome}</TableCell>
                <TableCell className="text-muted-foreground">{d.email}</TableCell>
                <TableCell>{d.matricula}</TableCell>
                <TableCell>{d.area}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(d); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Remover ${d.nome}?`)) { remove(d.id); toast.success("Removido"); } }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum docente encontrado.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}