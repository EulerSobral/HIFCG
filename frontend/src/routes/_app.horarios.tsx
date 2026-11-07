import React, { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/Combobox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ResourceDetailsModal } from "@/components/ResourceDetailsModal";
import { useStore, DIAS, SLOTS_HORARIOS, getTurnosParaCurso, useCurrentUser, useActivePeriodo } from "@/lib/store";
import { AlertTriangle, CalendarRange, CheckCircle2, MousePointerClick, Plus, Trash2, UserCheck, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/horarios")({
  head: () => ({ meta: [{ title: "Alocar Horários · HIFCG" }] }),
  component: Page,
});

function Page() {
  const s = useStore();
  const user = useCurrentUser();
  const periodoAtivoObj = useActivePeriodo();
  const periodoLetivoAtivo = periodoAtivoObj?.nome || "2026.1";

  const cursosVisiveis = useMemo(() => {
    if (!user) return [];
    if (user.role === "coord_curso" && user.cursoId) return s.cursos.filter((c) => c.id === user.cursoId);
    if (user.role === "coord_area" && user.area) return s.cursos.filter((c) => c.area === user.area);
    return s.cursos;
  }, [s.cursos, user]);

  const [cursoId, setCursoId] = useState(cursosVisiveis[0]?.id ?? "");
  const selectedCurso = useMemo(() => s.cursos.find((c) => c.id === cursoId), [s.cursos, cursoId]);

  const [periodoCurso, setPeriodoCurso] = useState<number>(1);
  const listaPeriodosCurso = useMemo(
    () => Array.from({ length: selectedCurso?.periodos ?? 6 }, (_, i) => i + 1),
    [selectedCurso],
  );

  const [filtroTipo, setFiltroTipo] = useState<"curso" | "disciplina">("curso");
  const [filtroDisciplinaId, setFiltroDisciplinaId] = useState("");
  const [ambientePadraoId, setAmbientePadraoId] = useState(s.ambientes[0]?.id ?? "");

  const disciplinasCurso = useMemo(
    () => s.disciplinas.filter((d) => d.cursoId === cursoId),
    [s.disciplinas, cursoId],
  );
  const disciplinasDisponiveis = useMemo(
    () => disciplinasCurso.filter((d) => d.periodo === periodoCurso),
    [disciplinasCurso, periodoCurso],
  );

  // Alocações pertencentes exclusivamente ao Período Letivo Ativo (ex.: 2026.1 vs 2025.2)
  const alocacoesDoPeriodoLetivo = useMemo(
    () => s.alocacoes.filter((a) => (a.periodoLetivo || "2026.1") === periodoLetivoAtivo),
    [s.alocacoes, periodoLetivoAtivo],
  );

  // Gera os blocos de aulas semanais para cada disciplina do período no Período Letivo Ativo
  const blocosPorDisciplina = useMemo(() => {
    return disciplinasDisponiveis.map((d) => {
      const totalAulas = Math.max(1, Number(d.aulasSemanais) || Math.round((d.cargaHoraria || 60) / 20));
      const alocacoesDaDisc = alocacoesDoPeriodoLetivo
        .filter(
          (a) =>
            a.disciplinaId === d.id &&
            a.cursoId === cursoId &&
            a.periodoCurso === periodoCurso,
        )
        .sort((a, b) => a.dia - b.dia || a.horario.localeCompare(b.horario));

      const docVinculadoId = d.docenteId || alocacoesDaDisc[0]?.docenteId || "";
      const docVinculado = s.docentes.find((doc) => doc.id === docVinculadoId);

      const blocos = Array.from({ length: totalAulas }, (_, idx) => {
        const aloc = alocacoesDaDisc[idx];
        const slotInfo = aloc ? SLOTS_HORARIOS.find((sl) => sl.horario === aloc.horario) : undefined;
        return {
          disciplina: d,
          indice: idx + 1,
          total: totalAulas,
          alocacaoId: aloc?.id,
          dia: aloc?.dia,
          horario: aloc?.horario,
          slotCode: slotInfo?.code,
          docenteId: aloc?.docenteId || docVinculadoId,
          ambienteId: aloc?.ambienteId,
        };
      });

      return {
        disciplina: d,
        docenteVinculadoId: docVinculadoId,
        docenteVinculado: docVinculado,
        totalAulas,
        alocadasCount: alocacoesDaDisc.length,
        blocos,
      };
    });
  }, [disciplinasDisponiveis, alocacoesDoPeriodoLetivo, cursoId, periodoCurso, s.docentes]);

  const [selectedBloco, setSelectedBloco] = useState<{
    disciplinaId: string;
    indice: number;
    alocacaoId?: string;
  } | null>(null);

  const [slot, setSlot] = useState<{ dia: number; horario: string } | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [disciplinaId, setDisciplinaId] = useState("");
  const [docenteId, setDocenteId] = useState("");
  const [ambienteId, setAmbienteId] = useState("");

  // Estado para os modais interativos de Docente e Ambiente
  const [detailsDocenteId, setDetailsDocenteId] = useState<string | null>(null);
  const [detailsAmbienteId, setDetailsAmbienteId] = useState<string | null>(null);

  const alocacoesGrid = useMemo(() => {
    const map: Record<string, typeof s.alocacoes[number]> = {};
    alocacoesDoPeriodoLetivo
      .filter((a) =>
        filtroTipo === "disciplina" && filtroDisciplinaId
          ? a.disciplinaId === filtroDisciplinaId
          : a.cursoId === cursoId && a.periodoCurso === periodoCurso,
      )
      .forEach((a) => {
        map[`${a.dia}-${a.horario}`] = a;
      });
    return map;
  }, [alocacoesDoPeriodoLetivo, cursoId, periodoCurso, filtroTipo, filtroDisciplinaId]);

  const conflicts = useMemo(() => {
    const set = new Set<string>();
    const arr = alocacoesDoPeriodoLetivo;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i], b = arr[j];
        if (
          a.dia === b.dia &&
          a.horario === b.horario &&
          (a.docenteId === b.docenteId ||
            a.ambienteId === b.ambienteId ||
            (a.cursoId === b.cursoId && a.periodoCurso === b.periodoCurso))
        ) {
          set.add(a.id);
          set.add(b.id);
        }
      }
    }
    return set;
  }, [alocacoesDoPeriodoLetivo]);

  const handleChangeDisciplinaModal = (novaDiscId: string) => {
    setDisciplinaId(novaDiscId);
    const disc = s.disciplinas.find((d) => d.id === novaDiscId);
    const prevAloc = alocacoesDoPeriodoLetivo.find(
      (a) => a.disciplinaId === novaDiscId && a.cursoId === cursoId && a.periodoCurso === periodoCurso,
    );
    const docDaDisciplina = disc?.docenteId || prevAloc?.docenteId || "";
    if (docDaDisciplina) {
      setDocenteId(docDaDisciplina);
    }
  };

  const openSlot = (dia: number, horario: string, preDiscId?: string, moveAlocId?: string) => {
    const existing = alocacoesGrid[`${dia}-${horario}`];
    const primeiraComSaldo =
      blocosPorDisciplina.find((b) => b.alocadasCount < b.totalAulas)?.disciplina.id ??
      disciplinasDisponiveis[0]?.id ??
      "";
    const targetDiscId = preDiscId ?? existing?.disciplinaId ?? primeiraComSaldo;
    const discObj = s.disciplinas.find((d) => d.id === targetDiscId);

    const prevAlocDisc = targetDiscId
      ? alocacoesDoPeriodoLetivo.find(
          (a) =>
            a.disciplinaId === targetDiscId &&
            a.cursoId === cursoId &&
            a.periodoCurso === periodoCurso,
        )
      : undefined;

    setSlot({ dia, horario });
    setEditId(moveAlocId ?? existing?.id ?? null);
    setDisciplinaId(targetDiscId);
    // O professor já vem definido da disciplina!
    setDocenteId(
      discObj?.docenteId ?? existing?.docenteId ?? prevAlocDisc?.docenteId ?? s.docentes[0]?.id ?? "",
    );
    setAmbienteId(
      existing?.ambienteId ?? prevAlocDisc?.ambienteId ?? ambientePadraoId ?? s.ambientes[0]?.id ?? "",
    );
  };

  const alocarBlocoDireto = (
    discId: string,
    dia: number,
    horario: string,
    moveAlocId?: string,
  ) => {
    const disc = s.disciplinas.find((d) => d.id === discId);
    if (!disc) return;

    const prevAlocDisc = alocacoesDoPeriodoLetivo.find(
      (a) => a.disciplinaId === disc.id && a.cursoId === cursoId && a.periodoCurso === periodoCurso,
    );
    const docDefinido = disc.docenteId || prevAlocDisc?.docenteId;

    if (!docDefinido) {
      toast.error(
        `Defina primeiro o professor da disciplina "${disc.nome}" no painel ao lado antes de alocar o horário.`,
      );
      return;
    }

    const limite = Math.max(1, Number(disc.aulasSemanais) || Math.round((disc.cargaHoraria || 60) / 20));
    const jaAlocadas = alocacoesDoPeriodoLetivo.filter(
      (a) =>
        a.disciplinaId === disc.id &&
        a.cursoId === cursoId &&
        a.periodoCurso === periodoCurso &&
        a.id !== moveAlocId,
    );
    const existingInCell = alocacoesGrid[`${dia}-${horario}`];
    if (existingInCell?.disciplinaId !== disc.id && jaAlocadas.length >= limite) {
      toast.warning(`Todas as ${limite} aulas semanais de "${disc.nome}" já estão alocadas neste período.`);
      setSelectedBloco(null);
      return;
    }

    const ambFinal =
      existingInCell?.ambienteId || prevAlocDisc?.ambienteId || ambientePadraoId || s.ambientes[0]?.id || "";
    if (!ambFinal) {
      openSlot(dia, horario, disc.id, moveAlocId);
      return;
    }

    if (moveAlocId && existingInCell && existingInCell.id !== moveAlocId) {
      s.removeAlocacao(moveAlocId);
    }

    const conflictId = s.setAlocacao({
      id: moveAlocId ?? existingInCell?.id ?? undefined,
      disciplinaId: disc.id,
      docenteId: docDefinido,
      ambienteId: ambFinal,
      cursoId,
      periodoCurso,
      periodoLetivo: periodoLetivoAtivo,
      dia,
      horario,
    });

    const slotCode = SLOTS_HORARIOS.find((sl) => sl.horario === horario)?.code ?? horario;
    if (conflictId) {
      toast.warning(`Horário alocado para "${disc.nome}" em ${DIAS[dia]} (${slotCode}), mas há choque de horário!`);
    } else {
      toast.success(`"${disc.nome}" alocada em ${DIAS[dia]} · ${slotCode} (${ periodoLetivoAtivo })`);
    }
    setSelectedBloco(null);
  };

  const handleCellClick = (dia: number, horario: string) => {
    if (selectedBloco) {
      alocarBlocoDireto(selectedBloco.disciplinaId, dia, horario, selectedBloco.alocacaoId);
      return;
    }
    openSlot(dia, horario);
  };

  const save = () => {
    if (!slot || !disciplinaId || !docenteId || !ambienteId) {
      toast.error("Preencha todos os campos");
      return;
    }

    const disc = s.disciplinas.find((d) => d.id === disciplinaId);
    if (disc) {
      // Se a disciplina ainda não tinha professor vinculado ou mudou, atualiza o vínculo professor -> disciplina
      if (disc.docenteId !== docenteId) {
        s.updateDisciplina(disc.id, { docenteId });
      }
      const limite = Math.max(1, Number(disc.aulasSemanais) || Math.round((disc.cargaHoraria || 60) / 20));
      const jaAlocadas = alocacoesDoPeriodoLetivo.filter(
        (a) =>
          a.disciplinaId === disc.id &&
          a.cursoId === cursoId &&
          a.periodoCurso === periodoCurso &&
          a.id !== editId,
      ).length;
      if (jaAlocadas >= limite) {
        toast.warning(`A disciplina "${disc.nome}" já atingiu o limite de ${limite} aula(s) semanal(is).`);
        return;
      }
    }

    const conflictId = s.setAlocacao({
      id: editId ?? undefined,
      disciplinaId,
      docenteId,
      ambienteId,
      cursoId,
      periodoCurso,
      periodoLetivo: periodoLetivoAtivo,
      dia: slot.dia,
      horario: slot.horario,
    });
    if (conflictId) toast.warning("Atenção: choque de horário detectado!");
    else toast.success(`Alocação salva no período ${periodoLetivoAtivo}`);
    setSlot(null);
    setEditId(null);
  };

  const onDragStart = (e: React.DragEvent, type: string, id: string, alocacaoId?: string) => {
    e.dataTransfer.setData("type", type);
    e.dataTransfer.setData("id", id);
    if (alocacaoId) e.dataTransfer.setData("alocacaoId", alocacaoId);
  };

  const onDrop = (e: React.DragEvent, dia: number, horario: string) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("type");
    const id = e.dataTransfer.getData("id");
    const alocacaoId = e.dataTransfer.getData("alocacaoId") || undefined;
    if (!type || !id) return;

    if (type === "disciplina") {
      alocarBlocoDireto(id, dia, horario, alocacaoId);
      return;
    }
    openSlot(dia, horario);
    if (type === "ambiente") setAmbienteId(id);
  };

  const turnosVisiveis = useMemo(() => getTurnosParaCurso(selectedCurso?.turno), [selectedCurso]);

  return (
    <div>
      <PageHeader
        title="Alocar horários"
        description="Defina o professor de cada disciplina e selecione os horários das aulas semanais no quadro do período letivo ativo."
      />

      {/* Indicador de destaque do Período Letivo Ativo em que as disciplinas serão alocadas */}
      <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <CalendarRange className="h-5 w-5 text-primary shrink-0" />
          <div>
            <div className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>Período Letivo de Alocação:</span>
              <Badge variant="default" className="text-xs font-bold px-2.5 py-0.5">
                {periodoLetivoAtivo} (Ativo)
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground">
              {periodoAtivoObj
                ? `Vigência letiva: ${periodoAtivoObj.inicio} → ${periodoAtivoObj.fim} · As disciplinas abaixo estão sendo alocadas exclusivamente para ${periodoAtivoObj.nome}.`
                : `Todas as alocações desta grade pertencem ao período letivo ${periodoLetivoAtivo}.`}
            </div>
          </div>
        </div>
        <Link to="/periodos" className="text-xs font-medium text-primary hover:underline">
          Gerenciar período ativo →
        </Link>
      </div>

      <Card className="p-4 mb-4">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Curso</Label>
            <Combobox
              options={cursosVisiveis.map((c) => ({ value: c.id, label: c.nome, hint: `${c.codigo} (${c.turno})` }))}
              value={cursoId}
              onChange={(v) => { setCursoId(v); setFiltroDisciplinaId(""); setPeriodoCurso(1); setSelectedBloco(null); }}
              placeholder="Buscar curso…"
            />
          </div>
          <div className="space-y-2">
            <Label>Período do curso</Label>
            <Select value={String(periodoCurso)} onValueChange={(v) => { setPeriodoCurso(Number(v)); setSelectedBloco(null); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {listaPeriodosCurso.map((p) => <SelectItem key={p} value={String(p)}>{p}º período</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Ambiente / Sala padrão</Label>
            <Combobox
              options={s.ambientes.map((a) => ({ value: a.id, label: `${a.codigo} · ${a.tipo}`, hint: `${a.capacidade} lug.` }))}
              value={ambientePadraoId}
              onChange={setAmbientePadraoId}
              placeholder="Selecionar ambiente…"
            />
          </div>
          <div className="space-y-2">
            <Label>Filtrar exibição por</Label>
            <Select value={filtroTipo} onValueChange={(v) => setFiltroTipo(v as "curso" | "disciplina")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="curso">Grade do Período do Curso</SelectItem>
                <SelectItem value="disciplina">Por Disciplina Específica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {filtroTipo === "disciplina" && (
            <div className="space-y-2 md:col-span-4">
              <Label>Disciplina</Label>
              <Combobox
                options={disciplinasCurso.map((d) => ({ value: d.id, label: `${d.nome} (${d.codigo})`, hint: `${d.periodo}º período` }))}
                value={filtroDisciplinaId}
                onChange={setFiltroDisciplinaId}
                placeholder="Buscar disciplina…"
              />
            </div>
          )}
        </div>
        {selectedBloco && (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-md bg-primary/15 border border-primary/40 px-3 py-2 text-xs font-medium text-primary">
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 shrink-0" />
              <span>
                Bloco selecionado:{" "}
                <strong>
                  {s.disciplinas.find((d) => d.id === selectedBloco.disciplinaId)?.nome} (Aula{" "}
                  {selectedBloco.indice})
                </strong>{" "}
                — clique no horário desejado na grade abaixo para alocar!
              </span>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={() => setSelectedBloco(null)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </Card>

      <div className="grid md:grid-cols-[1fr_340px] gap-4">
        <Card className="p-3 overflow-x-auto">
          <div className="flex items-center justify-between px-2 pb-2 mb-2 border-b text-xs">
            <span className="font-semibold text-foreground">
              Quadro de Horários · {selectedCurso?.nome} ({periodoCurso}º período)
            </span>
            <Badge variant="outline" className="font-mono text-primary border-primary/40">
              Período Letivo: {periodoLetivoAtivo}
            </Badge>
          </div>
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left text-muted-foreground font-medium w-32">Horário (50 min)</th>
                {DIAS.map((d) => <th key={d} className="p-2 text-left text-muted-foreground font-medium">{d}</th>)}
              </tr>
            </thead>
            <tbody>
              {turnosVisiveis.map((turno) => {
                const slotsDoTurno = SLOTS_HORARIOS.filter((s) => s.turno === turno);
                return (
                  <React.Fragment key={turno}>
                    <tr className="bg-muted/40 border-t border-b">
                      <td colSpan={7} className="px-2 py-1.5 text-[11px] font-bold text-primary tracking-wide uppercase">
                        Turno {turno} ({slotsDoTurno.length} aulas)
                      </td>
                    </tr>
                    {slotsDoTurno.map((slotObj) => {
                      const h = slotObj.horario;
                      return (
                        <tr key={slotObj.id}>
                          <td className="p-2 align-top border-t bg-muted/10">
                            <div className="font-semibold text-foreground text-xs">{slotObj.code}</div>
                            <div className="font-mono text-[10px] text-muted-foreground">{h}</div>
                          </td>
                          {DIAS.map((_, di) => {
                            const a = alocacoesGrid[`${di}-${h}`];
                            const isConflict = a && conflicts.has(a.id);
                            const disc = a && s.disciplinas.find((x) => x.id === a.disciplinaId);
                            const doc = a && s.docentes.find((x) => x.id === a.docenteId);
                            const amb = a && s.ambientes.find((x) => x.id === a.ambienteId);
                            return (
                              <td key={di} className="p-1 align-top border-t">
                                <div
                                  onClick={() => handleCellClick(di, h)}
                                  onDragOver={(e) => e.preventDefault()}
                                  onDrop={(e) => onDrop(e, di, h)}
                                  className={cn(
                                    "w-full min-h-[76px] rounded-md text-left p-2 transition-colors border cursor-pointer select-none",
                                    selectedBloco && !a
                                      ? "border-primary/60 bg-primary/5 hover:bg-primary/15 border-dashed"
                                      : a
                                        ? isConflict
                                          ? "bg-destructive/15 border-destructive/40 hover:bg-destructive/25"
                                          : "bg-primary/10 border-primary/30 hover:bg-primary/15"
                                        : "border-dashed border-border hover:bg-muted",
                                  )}
                                >
                                  {a ? (
                                    <div className="space-y-0.5">
                                      <div className="font-semibold text-foreground flex items-center gap-1 leading-tight">
                                        {isConflict && <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />}
                                        <span className="truncate" title={disc?.nome}>
                                          {disc?.nome ?? disc?.codigo}
                                        </span>
                                      </div>
                                      <div>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (doc?.id) setDetailsDocenteId(doc.id);
                                          }}
                                          className="text-primary hover:underline font-medium text-left truncate block w-full cursor-pointer text-xs"
                                          title="Ver dados e agenda do docente"
                                        >
                                          {doc?.nome || "Docente"}
                                        </button>
                                      </div>
                                      <div className="flex items-center justify-between gap-1">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (amb?.id) setDetailsAmbienteId(amb.id);
                                          }}
                                          className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline text-left truncate cursor-pointer"
                                          title="Ver detalhes do ambiente"
                                        >
                                          {amb?.codigo || "Ambiente"}
                                        </button>
                                        {disc?.codigo && (
                                          <span className="text-[9px] font-mono text-muted-foreground">
                                            {disc.codigo}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-muted-foreground flex flex-col items-center justify-center h-full opacity-50 py-3 gap-0.5 text-[10px]">
                                      <Plus className="h-4 w-4" />
                                      {selectedBloco ? <span>Selecionar horário</span> : null}
                                    </div>
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </Card>

        <Card className="p-3 space-y-4">
          <div>
            <div className="text-sm font-semibold mb-1">Disciplinas e Aulas Semanais</div>
            <p className="text-[11px] text-muted-foreground mb-3">
              1º Defina o professor na disciplina. 2º Clique em um bloco de aula (ou mova-o) e escolha o horário na grade.
            </p>
            <div className="space-y-3">
              {blocosPorDisciplina.map(({ disciplina: d, docenteVinculadoId, totalAulas, alocadasCount, blocos }) => {
                const completa = alocadasCount >= totalAulas;
                return (
                  <div key={d.id} className="rounded-lg border border-border p-2.5 space-y-2 bg-muted/15">
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate" title={d.nome}>
                          {d.nome}
                        </div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {d.codigo} · {totalAulas} aulas/sem
                        </div>
                      </div>
                      <Badge variant={completa ? "default" : "secondary"} className="text-[10px] shrink-0">
                        {completa && <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />}
                        {alocadasCount}/{totalAulas}
                      </Badge>
                    </div>

                    {/* Vínculo do Professor direto na Disciplina */}
                    <div className="space-y-1 pt-1 border-t border-border/60">
                      <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <UserCheck className="h-3 w-3 text-primary" />
                        Professor da disciplina:
                      </Label>
                      <Select
                        value={docenteVinculadoId || ""}
                        onValueChange={(novoDocId) => {
                          s.updateDisciplina(d.id, { docenteId: novoDocId });
                          const docNome = s.docentes.find((x) => x.id === novoDocId)?.nome;
                          toast.success(`Professor ${docNome} vinculado a "${d.nome}"`);
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs bg-background">
                          <SelectValue placeholder="Selecionar professor…" />
                        </SelectTrigger>
                        <SelectContent>
                          {s.docentes.map((doc) => (
                            <SelectItem key={doc.id} value={doc.id}>
                              {doc.nome} ({doc.area})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Blocos semanais da disciplina (já com professor definido) */}
                    <div className="grid grid-cols-2 gap-1 pt-0.5">
                      {blocos.map((bloco) => {
                        const isAlocado = Boolean(bloco.alocacaoId);
                        const isSelected =
                          selectedBloco?.disciplinaId === d.id &&
                          selectedBloco?.indice === bloco.indice;
                        return (
                          <div
                            key={`${d.id}-${bloco.indice}`}
                            draggable
                            onDragStart={(e) => onDragStart(e, "disciplina", d.id, bloco.alocacaoId)}
                            onClick={() => {
                              if (!docenteVinculadoId) {
                                toast.error(`Selecione primeiro o professor de "${d.nome}" acima.`);
                                return;
                              }
                              if (isSelected) setSelectedBloco(null);
                              else setSelectedBloco({ disciplinaId: d.id, indice: bloco.indice, alocacaoId: bloco.alocacaoId });
                            }}
                            className={cn(
                              "flex items-center justify-between gap-1 rounded border px-2 py-1.5 text-[11px] cursor-pointer select-none transition-colors",
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary font-semibold"
                                : isAlocado
                                  ? "bg-emerald-500/10 border-emerald-500/40 text-foreground"
                                  : "bg-secondary/60 border-border hover:bg-secondary",
                            )}
                          >
                            <div className="truncate">
                              <div className="font-medium leading-tight">Aula {bloco.indice}/{bloco.total}</div>
                              <div className={cn("text-[9px] truncate", isSelected ? "text-primary-foreground/85" : "text-muted-foreground")}>
                                {isAlocado ? `${DIAS[bloco.dia ?? 0].slice(0, 3)} · ${bloco.slotCode || ""}` : "Selecionar horário"}
                              </div>
                            </div>
                            {isAlocado && bloco.alocacaoId && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  s.removeAlocacao(bloco.alocacaoId!);
                                  toast.success(`Aula ${bloco.indice}/${bloco.total} de "${d.nome}" liberada`);
                                }}
                                className={cn(
                                  "rounded p-0.5 opacity-70 hover:opacity-100 cursor-pointer",
                                  isSelected
                                    ? "hover:bg-primary-foreground/20 text-primary-foreground"
                                    : "hover:bg-destructive/15 text-destructive",
                                )}
                                title="Remover horário deste bloco"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {blocosPorDisciplina.length === 0 && (
                <div className="text-xs text-muted-foreground py-3 text-center">
                  Nenhuma disciplina cadastrada para este período.
                </div>
              )}
            </div>
          </div>

          <Section title="Ambientes Disponíveis">
            {s.ambientes.map((a) => (
              <div
                key={a.id}
                onClick={() => setAmbientePadraoId(a.id)}
                className={cn(
                  "cursor-pointer rounded-md border px-2 py-1 text-xs transition-colors",
                  ambientePadraoId === a.id
                    ? "border-primary bg-primary/15 text-primary font-medium"
                    : "border-border bg-secondary/60 hover:bg-secondary",
                )}
              >
                {a.codigo} · {a.tipo}
              </div>
            ))}
          </Section>
        </Card>
      </div>

      {/* Modal de Detalhes Interativos (Docente / Ambiente) */}
      <ResourceDetailsModal
        docenteId={detailsDocenteId}
        ambienteId={detailsAmbienteId}
        onClose={() => {
          setDetailsDocenteId(null);
          setDetailsAmbienteId(null);
        }}
      />

      {/* Modal de Alocação de Slot */}
      <Dialog open={!!slot} onOpenChange={(o) => { if (!o) { setSlot(null); setEditId(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editId ? "Editar alocação" : "Alocar horário"} · {slot && DIAS[slot.dia]} {slot?.horario} ({periodoLetivoAtivo})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Disciplina</Label>
              <Combobox
                options={blocosPorDisciplina.map(({ disciplina: d, docenteVinculado, alocadasCount, totalAulas }) => ({
                  value: d.id,
                  label: `${d.nome} (${d.codigo})`,
                  hint: `${docenteVinculado ? `Prof. ${docenteVinculado.nome.split(" ")[0]} · ` : ""}${alocadasCount}/${totalAulas} aulas`,
                }))}
                value={disciplinaId}
                onChange={handleChangeDisciplinaModal}
                placeholder="Buscar disciplina…"
              />
            </div>
            <div className="space-y-2">
              <Label>Professor (vinculado à disciplina)</Label>
              <Combobox
                options={s.docentes.map((d) => ({ value: d.id, label: d.nome, hint: d.area }))}
                value={docenteId}
                onChange={setDocenteId}
                placeholder="Selecionar professor…"
              />
            </div>
            <div className="space-y-2">
              <Label>Ambiente / Sala</Label>
              <Combobox
                options={s.ambientes.map((a) => ({ value: a.id, label: `${a.codigo} · ${a.tipo}`, hint: `${a.capacidade} lug.` }))}
                value={ambienteId}
                onChange={setAmbienteId}
                placeholder="Buscar ambiente…"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            {editId && (
              <Button variant="destructive" onClick={() => { s.removeAlocacao(editId); toast.success("Alocação removida"); setSlot(null); setEditId(null); }}>
                <Trash2 className="h-4 w-4 mr-2" /> Remover
              </Button>
            )}
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">{title}</div>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  );
}
