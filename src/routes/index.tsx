import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CalendarClock, KeyRound, Eye } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Entrar · HIFCG" },
      { name: "description", content: "Acesso ao Sistema de Gestão de Horários do IFPB-CG." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const login = useStore((s) => s.login);
  const [email, setEmail] = useState("diretor@ifpb.edu.br");
  const [senha, setSenha] = useState("123456");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = login(email, senha);
    if (u) {
      toast.success(`Bem-vindo, ${u.nome}`);
      navigate({ to: "/dashboard" });
    } else {
      toast.error("Credenciais inválidas");
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="hidden md:flex flex-col justify-between p-12 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
        <div className="flex items-center gap-3">
          <CalendarClock className="h-8 w-8" />
          <div>
            <div className="text-2xl font-bold">HIFCG</div>
            <div className="text-sm opacity-90">IFPB · Campina Grande</div>
          </div>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold leading-tight">Gestão de alocação de horários acadêmicos</h1>
          <p className="opacity-90 max-w-md">
            Organize docentes, ambientes, cursos, disciplinas e períodos letivos em um único lugar — com detecção
            automática de choques e controle por perfil.
          </p>
        </div>
        <div className="text-xs opacity-80">© Instituto Federal da Paraíba — Campina Grande</div>
      </div>
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="md:hidden flex items-center gap-2 mb-6">
              <CalendarClock className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">HIFCG</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Acessar o sistema</h2>
            <p className="text-sm text-muted-foreground mt-1">Entre com seu e-mail institucional.</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <Input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full">
              <KeyRound className="h-4 w-4 mr-2" /> Entrar
            </Button>
          </form>
          <div className="mt-6 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground space-y-1">
            <div className="font-semibold text-foreground">Contas de demonstração (senha: 123456)</div>
            <div>diretor@ifpb.edu.br · Diretor</div>
            <div>area.info@ifpb.edu.br · Coord. de Área</div>
            <div>curso.tads@ifpb.edu.br · Coord. de Curso</div>
          </div>
          <div className="mt-6 text-center">
            <Link to="/publico" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
              <Eye className="h-3 w-3" /> Visualizar horários publicamente
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
