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
import { useStore, type Ambiente } from "@/lib/store";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/ambientes")({
  head: () => ({ meta: [{ title: "Ambientes · HIFCG" }] }),
  component: Page,
});

function Page() {
  const ambientes = useStore((s) => s.ambientes);
  const add = useStore((s) => s.addAmbiente);
  const update = useStore((s) => s.updateAmbiente);
  const remove = useStore((s) => s.removeAmbiente);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Ambiente | null>(null);
  const [tipo, setTipo] = useState<Ambiente["tipo"]>("Sala");

  const filtered = useMemo(
    () => ambientes.filter((a) => `${a.codigo} ${a.tipo} ${a.bloco}`.toLowerCase().includes(q.toLowerCase())),
    [ambientes, q],
  );

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload: Omit<Ambiente, "id"> = {
      codigo: String(f.get("codigo") || ""),
      tipo,
      capacidade: Number(f.get("capacidade") || 0),
      bloco: String(f.get("bloco") || ""),
    };
    if (editing) { update(editing.id, payload); toast.success("Ambiente atualizado"); }
    else { add(payload); toast.success("Ambiente cadastrado"); }
    setOpen(false); setEditing(null);
  };

  return (
    <div>
      <PageHeader
        title="Ambientes"
        description="Salas, laboratórios, auditórios e quadras (RF8-RF12)."
        action={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditing(null); setTipo("Sala"); }}><Plus className="h-4 w-4 mr-2" />Novo ambiente</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Editar ambiente" : "Novo ambiente"}</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Código</Label><Input name="codigo" required defaultValue={editing?.codigo} /></div>
                  <div className="space-y-2"><Label>Bloco</Label><Input name="bloco" required defaultValue={editing?.bloco} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={tipo} onValueChange={(v) => setTipo(v as Ambiente["tipo"])}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sala">Sala</SelectItem>
                        <SelectItem value="Laboratório">Laboratório</SelectItem>
                        <SelectItem value="Auditório">Auditório</SelectItem>
                        <SelectItem value="Quadra">Quadra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Capacidade</Label><Input name="capacidade" type="number" required defaultValue={editing?.capacidade} /></div>
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
          <Input placeholder="Buscar ambiente…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" list="amb-list" />
          <datalist id="amb-list">{ambientes.map((a) => <option key={a.id} value={a.codigo} />)}</datalist>
        </div>
        <Table>
          <TableHeader><TableRow><TableHead>Código</TableHead><TableHead>Tipo</TableHead><TableHead>Bloco</TableHead><TableHead>Capacidade</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {filtered.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.codigo}</TableCell>
                <TableCell>{a.tipo}</TableCell>
                <TableCell>{a.bloco}</TableCell>
                <TableCell>{a.capacidade}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(a); setTipo(a.tipo); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Remover ${a.codigo}?`)) { remove(a.id); toast.success("Removido"); } }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum ambiente.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}