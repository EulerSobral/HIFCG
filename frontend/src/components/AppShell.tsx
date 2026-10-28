import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useCurrentUser, useStore, roleLabel, getStatusCredenciaisDiretor } from "@/lib/store";
import {
  LayoutDashboard,
  Users,
  Building2,
  GraduationCap,
  BookOpen,
  CalendarRange,
  CalendarClock,
  Eye,
  ShieldCheck,
  ScrollText,
  LogOut,
  GanttChartSquare,
  KeyRound,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const nav = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard, roles: ["diretor", "coord_area", "coord_curso"] as const },
  { to: "/docentes", label: "Docentes", icon: Users, roles: ["diretor", "coord_area", "coord_curso"] as const },
  { to: "/ambientes", label: "Ambientes", icon: Building2, roles: ["diretor", "coord_area", "coord_curso"] as const },
  { to: "/cursos", label: "Cursos", icon: GraduationCap, roles: ["diretor", "coord_area"] as const },
  { to: "/disciplinas", label: "Disciplinas", icon: BookOpen, roles: ["diretor", "coord_area", "coord_curso"] as const },
  { to: "/periodos", label: "Períodos Letivos", icon: CalendarRange, roles: ["diretor", "coord_area"] as const },
  { to: "/horarios", label: "Alocar Horários", icon: GanttChartSquare, roles: ["diretor", "coord_area", "coord_curso"] as const },
  { to: "/visualizar", label: "Visualizar Horários", icon: Eye, roles: ["diretor", "coord_area", "coord_curso"] as const },
  { to: "/coordenadores", label: "Coordenadores", icon: ShieldCheck, roles: ["diretor", "coord_area", "coord_curso"] as const },
  { to: "/logs", label: "Registros (Logs)", icon: ScrollText, roles: ["diretor"] as const },
];

export function AppShell({ children }: { children: ReactNode }) {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const logout = useStore((s) => s.logout);
  const renovarCredenciaisDiretor = useStore((s) => s.renovarCredenciaisDiretor);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [openRenovacaoModal, setOpenRenovacaoModal] = useState(false);

  if (!user) return null;

  const items = nav.filter((n) => (n.roles as readonly string[]).includes(user.role));
  const statusDiretor = getStatusCredenciaisDiretor(user);
  const modalObrigatorio = statusDiretor.isDiretor && statusDiretor.expirado;
  const dialogAberto = modalObrigatorio || openRenovacaoModal;

  const handleRenovarSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const nome = String(f.get("nome") || "").trim();
    const email = String(f.get("email") || "").trim();
    const novaSenha = String(f.get("novaSenha") || "").trim();
    const confirmarSenha = String(f.get("confirmarSenha") || "").trim();

    if (!novaSenha) {
      toast.error("A nova senha é obrigatória para renovar o ciclo de 1 semana.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast.error("A confirmação da nova senha não confere.");
      return;
    }

    const res = await renovarCredenciaisDiretor({
      nome: nome || user.nome,
      email: email || user.email,
      novaSenha,
    });

    if (!res.ok) {
      toast.error(res.error || "Não foi possível atualizar as credenciais.");
      return;
    }

    toast.success("Senha e credenciais renovadas com sucesso! Novo ciclo de 7 dias iniciado.");
    setOpenRenovacaoModal(false);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground">
        <div className="px-6 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-sidebar-primary" />
            <div>
              <div className="text-lg font-bold tracking-tight">HIFCG</div>
              <div className="text-xs opacity-70">IFPB · Campina Grande</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                    : "hover:bg-sidebar-accent",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <div className="px-3 py-2 text-xs">
            <div className="font-semibold truncate">{user.nome}</div>
            <div className="opacity-70 truncate">{roleLabel(user.role)}</div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            onClick={() => {
              logout();
              navigate({ to: "/" });
            }}
          >
            <LogOut className="h-4 w-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-sidebar text-sidebar-foreground">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            <span className="font-bold">HIFCG</span>
          </div>
          <Button size="sm" variant="ghost" className="text-sidebar-foreground" onClick={() => { logout(); navigate({ to: "/" }); }}>
            Sair
          </Button>
        </header>

        {statusDiretor.isDiretor && (
          <div
            className={cn(
              "border-b px-6 py-3 text-sm flex flex-wrap items-center justify-between gap-3",
              statusDiretor.expirado
                ? "bg-destructive/15 border-destructive/40 text-destructive"
                : statusDiretor.emPeriodoDeAviso
                  ? "bg-amber-500/15 border-amber-500/40 text-foreground"
                  : "bg-muted/50 border-border text-muted-foreground",
            )}
          >
            <div className="flex items-center gap-2.5">
              {statusDiretor.expirado || statusDiretor.emPeriodoDeAviso ? (
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
              ) : (
                <Clock className="h-4 w-4 shrink-0 text-primary" />
              )}
              <span>
                {statusDiretor.expirado ? (
                  <>
                    <strong>Prazo semanal atingido (7 dias):</strong> Por segurança e rotatividade do cargo de Diretor, a alteração da senha é obrigatória.
                  </>
                ) : (
                  <>
                    <strong>Política Semanal da Direção:</strong> Solicita-se a troca obrigatória de senha no período de 1 semana (restam{" "}
                    <strong>{statusDiretor.diasRestantes} dia(s)</strong> — vencimento em{" "}
                    {statusDiretor.proximaRenovacao.toLocaleDateString("pt-BR")}).
                  </>
                )}
              </span>
            </div>
            <Button
              size="sm"
              variant={statusDiretor.expirado || statusDiretor.emPeriodoDeAviso ? "default" : "outline"}
              onClick={() => setOpenRenovacaoModal(true)}
            >
              <KeyRound className="h-3.5 w-3.5 mr-1.5" />
              Alterar senha / credenciais
            </Button>
          </div>
        )}

        <Dialog
          open={dialogAberto}
          onOpenChange={(nextOpen) => {
            if (modalObrigatorio && !nextOpen) return;
            setOpenRenovacaoModal(nextOpen);
          }}
        >
          <DialogContent
            onEscapeKeyDown={(e) => {
              if (modalObrigatorio) e.preventDefault();
            }}
            onPointerDownOutside={(e) => {
              if (modalObrigatorio) e.preventDefault();
            }}
          >
            <DialogHeader>
              <DialogTitle>Renovação Semanal de Credenciais do Diretor</DialogTitle>
              <DialogDescription>
                Por motivos de segurança e rotatividade na gestão, a <strong>senha do Diretor deve ser obrigatoriamente alterada</strong> no período de 1 semana (7 dias). O nome e o e-mail podem ser mantidos caso o titular permaneça o mesmo.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRenovarSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dir-nova-senha">Nova senha (obrigatória) *</Label>
                  <Input
                    id="dir-nova-senha"
                    name="novaSenha"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Mínimo de 6 caracteres"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dir-confirmar-senha">Confirmar nova senha *</Label>
                  <Input
                    id="dir-confirmar-senha"
                    name="confirmarSenha"
                    type="password"
                    required
                    minLength={6}
                    placeholder="Repita a nova senha"
                  />
                </div>
              </div>

              <div className="rounded-md border bg-muted/30 p-3 space-y-3">
                <div className="text-xs text-muted-foreground">
                  <strong>Dados do titular (opcional):</strong> altere apenas caso outra pessoa tenha assumido a Direção ou o e-mail tenha mudado.
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dir-nome">Nome do Diretor</Label>
                  <Input id="dir-nome" name="nome" defaultValue={user.nome} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dir-email">E-mail institucional</Label>
                  <Input id="dir-email" name="email" type="email" defaultValue={user.email} />
                </div>
              </div>

              <DialogFooter>
                {!modalObrigatorio && (
                  <Button type="button" variant="outline" onClick={() => setOpenRenovacaoModal(false)}>
                    Fazer depois ({statusDiretor.diasRestantes}d restantes)
                  </Button>
                )}
                <Button type="submit">
                  <KeyRound className="h-4 w-4 mr-2" />
                  Confirmar nova senha (renovar 7 dias)
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="p-6 md:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6 pb-4 border-b">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action}
    </div>
  );
}