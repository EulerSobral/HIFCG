import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore, type Periodo } from "@/lib/store";
import { Pencil, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/periodos")({
  head: () => ({ meta: [{ title: "Períodos · HIFCG" }] }),
  component: Page,
});

function Page() {
  const periodos = useStore((s) => s.periodos);
  const add = useStore((s) => s.addPeriodo);
  const update = useStore((s) => s.updatePeriodo);
  const remove = useStore((s) => s.removePeriodo);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Periodo | null>(null);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload: Omit<Periodo, "id"> = {
      nome: String(f.get("nome") || ""),
      inicio: String(f.get("inicio") || ""),
      fim: String(f.get("fim") || ""),
      inicioMatricula: String(f.get("imat") || ""),
      fimMatricula: String(f.get("fmat") || ""),
      ativo: f.get("ativo") === "on",
    };
    if (editing) { update(editing.id, payload); toast.success("Período atualizado"); }
    else { add(payload); toast.success("Período cadastrado"); }
    setOpen(false); setEditing(null);
  };

  return (
    <div>
      <PageHeader
        title="Períodos letivos"
        description="Períodos em que os horários são construídos (RF21-RF23)."
        action={
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditing(null)}><Plus className="h-4 w-4 mr-2" />Novo período</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Editar período" : "Novo período"}</DialogTitle></DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2"><Label>Nome (ex: 2026.1)</Label><Input name="nome" required defaultValue={editing?.nome} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Início letivo</Label><Input type="date" name="inicio" required defaultValue={editing?.inicio} /></div>
                  <div className="space-y-2"><Label>Fim letivo</Label><Input type="date" name="fim" required defaultValue={editing?.fim} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2"><Label>Início matrícula</Label><Input type="date" name="imat" required defaultValue={editing?.inicioMatricula} /></div>
                  <div className="space-y-2"><Label>Fim matrícula</Label><Input type="date" name="fmat" required defaultValue={editing?.fimMatricula} /></div>
                </div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="ativo" defaultChecked={editing?.ativo} /> Período ativo</label>
                <DialogFooter><Button type="submit">Salvar</Button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />
      <Card className="p-4">
        <Table>
          <TableHeader><TableRow><TableHead>Período</TableHead><TableHead>Letivo</TableHead><TableHead>Matrícula</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {periodos.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.nome}</TableCell>
                <TableCell className="text-muted-foreground">{p.inicio} → {p.fim}</TableCell>
                <TableCell className="text-muted-foreground">{p.inicioMatricula} → {p.fimMatricula}</TableCell>
                <TableCell>{p.ativo ? <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="h-4 w-4" />Ativo</span> : <span className="text-muted-foreground">Arquivado</span>}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Remover ${p.nome}?`)) { remove(p.id); toast.success("Removido"); } }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}