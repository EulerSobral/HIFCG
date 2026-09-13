import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useStore, DIAS, SLOTS_HORARIOS } from "@/lib/store";
import { User, MapPin, Mail, Hash, BookOpen, Layers, Users } from "lucide-react";

interface ResourceDetailsModalProps {
  docenteId: string | null;
  ambienteId: string | null;
  onClose: () => void;
}

export function ResourceDetailsModal({ docenteId, ambienteId, onClose }: ResourceDetailsModalProps) {
  const s = useStore();

  const docente = s.docentes.find((d) => d.id === docenteId) ?? null;
  const ambiente = s.ambientes.find((a) => a.id === ambienteId) ?? null;

  const isOpen = !!docente || !!ambiente;

  const alocacoesDocente = docente
    ? s.alocacoes.filter((a) => a.docenteId === docente.id)
    : [];

  const alocacoesAmbiente = ambiente
    ? s.alocacoes.filter((a) => a.ambienteId === ambiente.id)
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {docente && (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <User className="h-5 w-5 text-primary" />
                {docente.nome}
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-muted/40 p-3 rounded-lg text-xs">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground block">E-mail</span>
                  <span className="font-medium">{docente.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground block">Matrícula</span>
                  <span className="font-medium">{docente.matricula}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground block">Área / Coordenação</span>
                  <span className="font-medium">{docente.area}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-primary" />
                Grade Semanal do Docente
              </h4>
              <ScheduleGrid
                alocacoes={alocacoesDocente}
                renderItem={(a) => {
                  const disc = s.disciplinas.find((d) => d.id === a.disciplinaId);
                  const amb = s.ambientes.find((amb) => amb.id === a.ambienteId);
                  const curso = s.cursos.find((c) => c.id === a.cursoId);
                  return (
                    <div className="text-[11px] leading-tight space-y-0.5">
                      <div className="font-bold text-primary">{disc?.codigo ?? disc?.nome}</div>
                      <div className="text-muted-foreground truncate">{curso?.codigo} ({a.periodoCurso}º per)</div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{amb?.codigo}</div>
                    </div>
                  );
                }}
              />
            </div>
          </div>
        )}

        {ambiente && (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                <MapPin className="h-5 w-5 text-primary" />
                Ambiente {ambiente.codigo}
              </DialogTitle>
            </DialogHeader>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-muted/40 p-3 rounded-lg text-xs">
              <div>
                <span className="text-muted-foreground block">Tipo</span>
                <span className="font-medium">{ambiente.tipo}</span>
              </div>
              <div>
                <span className="text-muted-foreground block">Bloco</span>
                <span className="font-medium">{ambiente.bloco}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground block">Capacidade</span>
                  <span className="font-medium">{ambiente.capacidade} lugares</span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground block">Descrição</span>
                <span className="font-medium truncate">{ambiente.descricao || "—"}</span>
              </div>
            </div>

            {ambiente.recursos && ambiente.recursos.length > 0 && (
              <div className="flex flex-wrap gap-1.5 items-center text-xs">
                <span className="text-muted-foreground mr-1">Recursos:</span>
                {ambiente.recursos.map((r) => (
                  <Badge key={r} variant="secondary" className="text-[10px]">
                    {r}
                  </Badge>
                ))}
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-primary" />
                Ocupação do Ambiente
              </h4>
              <ScheduleGrid
                alocacoes={alocacoesAmbiente}
                renderItem={(a) => {
                  const disc = s.disciplinas.find((d) => d.id === a.disciplinaId);
                  const doc = s.docentes.find((doc) => doc.id === a.docenteId);
                  const curso = s.cursos.find((c) => c.id === a.cursoId);
                  return (
                    <div className="text-[11px] leading-tight space-y-0.5">
                      <div className="font-bold text-primary">{disc?.codigo ?? disc?.nome}</div>
                      <div className="text-muted-foreground truncate">{doc?.nome}</div>
                      <div className="text-[10px] text-muted-foreground">{curso?.codigo} ({a.periodoCurso}º per)</div>
                    </div>
                  );
                }}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ScheduleGrid({
  alocacoes,
  renderItem,
}: {
  alocacoes: ReturnType<typeof useStore.getState>["alocacoes"];
  renderItem: (a: ReturnType<typeof useStore.getState>["alocacoes"][number]) => React.ReactNode;
}) {
  const s = useStore();
  const map: Record<string, ReturnType<typeof useStore.getState>["alocacoes"][number][]> = {};
  alocacoes.forEach((a) => {
    (map[`${a.dia}-${a.horario}`] ||= []).push(a);
  });

  const turnos: Array<"Manhã" | "Tarde" | "Noite"> = ["Manhã", "Tarde", "Noite"];

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="p-2 text-left text-muted-foreground font-medium w-28">Horário</th>
            {DIAS.map((d) => (
              <th key={d} className="p-2 text-left text-muted-foreground font-medium">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {turnos.map((turno) => {
            const slotsDoTurno = SLOTS_HORARIOS.filter((s) => s.turno === turno);
            return (
              <React.Fragment key={turno}>
                <tr className="bg-muted/30 border-t border-b">
                  <td colSpan={7} className="px-2 py-1 text-[11px] font-bold text-primary tracking-wide uppercase">
                    Turno {turno} ({slotsDoTurno.length} horários de 50 min)
                  </td>
                </tr>
                {slotsDoTurno.map((slot) => (
                  <tr key={slot.id} className="border-t">
                    <td className="p-2 font-mono text-[11px] text-muted-foreground align-top bg-muted/10">
                      <span className="font-semibold text-foreground mr-1">{slot.code}</span>
                      <div className="text-[10px]">{slot.horario}</div>
                    </td>
                    {DIAS.map((_, di) => {
                      const items = map[`${di}-${slot.horario}`] ?? [];
                      return (
                        <td key={di} className="p-1 border-t align-top min-w-[100px]">
                          {items.map((a) => (
                            <div
                              key={a.id}
                              className="rounded-md bg-primary/10 border border-primary/30 p-1.5 shadow-xs"
                            >
                              {renderItem(a)}
                            </div>
                          ))}
                          {items.length === 0 && (
                            <div className="text-muted-foreground/30 text-center py-2 text-[11px]">—</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
