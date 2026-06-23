import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useCurrentUser, useStore, roleLabel } from "@/lib/store";
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
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard, roles: ["diretor", "coord_area", "coord_curso"] as const },
  { to: "/docentes", label: "Docentes", icon: Users, roles: ["diretor", "coord_area", "coord_curso"] as const },
  { to: "/ambientes", label: "Ambientes", icon: Building2, roles: ["diretor", "coord_area"] as const },
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!user) return null;

  const items = nav.filter((n) => (n.roles as readonly string[]).includes(user.role));

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