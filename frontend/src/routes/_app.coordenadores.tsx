import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/Combobox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useStore, useCurrentUser, roleLabel, type Role, type User } from "@/lib/store";
import { KeyRound, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/coordenadores")({
  head: () => ({ meta: [{ title: "Coordenadores · HIFCG" }] }),
  component: Page,
});

function Page() {
  const me = useCurrentUser();
  const users = useStore((s) => s.users);
  const cursos = useStore((s) => s.cursos);
  const addUser = useStore((s) => s.addUser);
  const removeUser = useStore((s) => s.removeUser);
  const setUserPassword = useStore((s) => s.setUserPassword);
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<Role>("coord_curso");
  const [cursoId, setCursoId] = useState(cursos[0]?.id ?? "");

  const allowedToCreate: Role[] =
    me?.role === "diretor"
      ? ["coord_area", "coord_curso"]
      : me?.role === "coord_area"
      ? ["coord_curso"]
      : me?.role === "coord_curso"
      ? ["coord_curso"]
      : [];

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await addUser({
      nome: String(f.get("nome") || ""),
      email: String(f.get("email") || ""),
      senha: String(f.get("senha") || ""),
      role,
      area: String(f.get("area") || "") || undefined,
      cursoId: role === "coord_curso" ? cursoId : undefined,
    });
    toast.success("Coordenador cadastrado");
    setOpen(false);
  };

  const resetPassword = async (u: User) => {
    const nova = prompt(`Nova senha para ${u.nome}`, "123456");
    if (nova) { await setUserPassword(u.id, nova); toast.success("Senha redefinida"); }
  };

  return (
    <div>
      <PageHeader
        title="Coordenadores e senhas root"
        description="Diretor cria coord. de área e curso. Coord. de área cria coord. de curso (RF31-RF33, RF38)."
        action={
          allowedToCreate.length > 0 && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Novo coordenador</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Cadastrar coordenador</DialogTitle></DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                  <div className="space-y-2"><Label>Nome</Label><Input name="nome" required /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>E-mail</Label><Input type="email" name="email" required /></div>
                    <div className="space-y-2"><Label>Senha root</Label><Input name="senha" defaultValue="123456" required /></div>
                  </div>
                  <div className="space-y-2"><Label>Tipo de perfil</Label>
                    <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{allowedToCreate.map((r) => <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2"><Label>Área</Label><Input name="area" defaultValue={me?.area ?? ""} /></div>
                    {role === "coord_curso" && (
                      <div className="space-y-2"><Label>Curso</Label>
                        <Combobox
                          options={cursos.map((c) => ({ value: c.id, label: c.nome, hint: c.codigo }))}
                          value={cursoId}
                          onChange={setCursoId}
                          placeholder="Buscar curso…"
                        />
                      </div>
                    )}
                  </div>
                  <DialogFooter><Button type="submit">Cadastrar</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )
        }
      />
      <Card className="p-4">
        <Table>
          <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>E-mail</TableHead><TableHead>Perfil</TableHead><TableHead>Área</TableHead><TableHead>Curso</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />{u.nome}</TableCell>
                <TableCell className="text-muted-foreground">{u.email}</TableCell>
                <TableCell>{roleLabel(u.role)}</TableCell>
                <TableCell>{u.area ?? "—"}</TableCell>
                <TableCell>{cursos.find((c) => c.id === u.cursoId)?.nome ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => resetPassword(u)}><KeyRound className="h-4 w-4 mr-1" />Senha</Button>
                  {me?.role === "diretor" && u.id !== me.id && (
                    <Button size="icon" variant="ghost" onClick={() => { if (confirm(`Remover ${u.nome}?`)) { removeUser(u.id); toast.success("Removido"); } }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}