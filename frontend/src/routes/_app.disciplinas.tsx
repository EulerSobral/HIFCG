import React, { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/Combobox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ResourceDetailsModal } from "@/components/ResourceDetailsModal";
import {
  useStore,
  useActivePeriodo,
  DIAS,
  SLOTS_HORARIOS,
  getTurnosParaCurso,
  gerarCodigoDisciplina,
  isCodigoDisciplinaDuplicado,
  type Disciplina,
} from "@/lib/store";
import {
  AlertTriangle,
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  MousePointerClick,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app/disciplinas")({
  head: () => ({ meta: [{ title: "Disciplinas · HIFCG" }] }),
  component: Page,
});

interface BlocoAulaItem {
  disciplina: Disciplina;
  indice: number; // 1..aulasSemanais
  total: number;
  alocacaoId?: string;
  dia?: number;
  horario?: string;
  slotCode?: string;
  docenteId?: string;
  ambienteId?: string;
}

function Page() {
  const s = useStore();
  const { disciplinas, cursos, docentes, ambientes, alocacoes } = s;
  const periodoAtivoObj = useActivePeriodo();
  const periodoLetivoAtivo = periodoAtivoObj?.nome || "2026.1";

  const add = useStore((st) => st.addDisciplina);
  const update = useStore((st) => st.updateDisciplina);
  const remove = useStore((st) => st.removeDisciplina);

  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Disciplina | null>(null);

  // Campos do formulário de cadastro/edição
  const [nomeForm, setNomeForm] = useState("");
  const [cursoId, setCursoId] = useState(cursos[0]?.id ?? "");
  const [periodo, setPeriodo] = useState("1");
  const [docenteFormId, setDocenteFormId] = useState(docentes[0]?.id ?? "");
  const [aulasSemanaisForm, setAulasSemanaisForm] = useState<number>(4);
  const [cargaHorariaForm, setCargaHorariaForm] = useState<number>(80);

  // Filtros do painel gráfico de blocos de aulas semanais
  const [checkCursoId, setCheckCursoId] = useState(cursos[0]?.id ?? "");
  const [checkPeriodo, setCheckPeriodo] = useState("1");
  const [quickAmbienteId, setQuickAmbienteId] = useState(ambientes[0]?.id ?? "");

  // Bloco selecionado para alocação por clique ("clicar no bloco e clicar no horário desejado")
  const [selectedBloco, setSelectedBloco] = useState<{
    disciplinaId: string;
    indice: number;
    alocacaoId?: string;
  } | null>(null);

  // Modal de edição/alocação direta ao clicar em um horário na grade
  const [slotModal, setSlotModal] = useState<{ dia: number; horario: string } | null>(null);
  const [modalEditId, setModalEditId] = useState<string | null>(null);
  const [modalDisciplinaId, setModalDisciplinaId] = useState("");
  const [modalDocenteId, setModalDocenteId] = useState("");
  const [modalAmbienteId, setModalAmbienteId] = useState("");

  // Modais de detalhes de docente/ambiente
  const [detailsDocenteId, setDetailsDocenteId] = useState<string | null>(null);
  const [detailsAmbienteId, setDetailsAmbienteId] = useState<string | null>(null);

  useEffect(() => {
    if (!quickAmbienteId && ambientes[0]?.id) setQuickAmbienteId(ambientes[0].id);
  }, [ambientes, quickAmbienteId]);

  const selectedCursoObj = useMemo(() => cursos.find((c) => c.id === cursoId), [cursos, cursoId]);
  const formPeriodos = useMemo(
    () => Array.from({ length: selectedCursoObj?.periodos ?? 8 }, (_, i) => i + 1),
    [selectedCursoObj],
  );

  const selectedCheckCursoObj = useMemo(() => cursos.find((c) => c.id === checkCursoId), [cursos, checkCursoId]);
  const checkPeriodosList = useMemo(
    () => Array.from({ length: selectedCheckCursoObj?.periodos ?? 8 }, (_, i) => i + 1),
    [selectedCheckCursoObj],
  );

  // Código gerado automaticamente em tempo real (sem necessidade de digitação e garantidamente único)
  const codigoPreview = useMemo(() => {
    if (editing && !isCodigoDisciplinaDuplicado(editing.codigo, disciplinas, editing.id)) {
      return editing.codigo;
    }
    return gerarCodigoDisciplina(
      nomeForm,
      selectedCursoObj?.codigo || "DIS",
      Number(periodo) || 1,
      disciplinas,
      editing?.id,
    );
  }, [editing, nomeForm, selectedCursoObj, periodo, disciplinas]);

  const filtered = useMemo(
    () => disciplinas.filter((d) => `${d.codigo} ${d.nome}`.toLowerCase().includes(q.toLowerCase())),
    [disciplinas, q],
  );

  // Alocações pertencentes exclusivamente ao Período Letivo Ativo
  const alocacoesDoPeriodoLetivo = useMemo(
    () => alocacoes.filter((a) => (a.periodoLetivo || "2026.1") === periodoLetivoAtivo),
    [alocacoes, periodoLetivoAtivo],
  );

  // Disciplinas do curso/período selecionado no quadro de blocos
  const disciplinasDoPeriodo = useMemo(
    () =>
      disciplinas.filter(
        (d) => d.cursoId === checkCursoId && d.periodo === Number(checkPeriodo),
      ),
    [disciplinas, checkCursoId, checkPeriodo],
  );

  // Gera os blocos de aulas semanais para cada disciplina do período no Período Letivo Ativo
  const blocosPorDisciplina = useMemo(() => {
    return disciplinasDoPeriodo.map((d) => {
      const totalAulas = Math.max(1, Number(d.aulasSemanais) || Math.round((d.cargaHoraria || 60) / 20));
      const alocacoesDaDisc = alocacoesDoPeriodoLetivo
        .filter(
          (a) =>
            a.disciplinaId === d.id &&
            a.cursoId === checkCursoId &&
            a.periodoCurso === Number(checkPeriodo),
        )
        .sort((a, b) => a.dia - b.dia || a.horario.localeCompare(b.horario));

      const docVinculadoId = d.docenteId || alocacoesDaDisc[0]?.docenteId || "";
      const docenteVinculado = docentes.find((doc) => doc.id === docVinculadoId);

      const blocos: BlocoAulaItem[] = Array.from({ length: totalAulas }, (_, idx) => {
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
        docenteVinculado,
        totalAulas,
        alocadasCount: alocacoesDaDisc.length,
        blocos,
        ultimaAlocacao: alocacoesDaDisc[alocacoesDaDisc.length - 1],
      };
    });
  }, [disciplinasDoPeriodo, alocacoesDoPeriodoLetivo, checkCursoId, checkPeriodo, docentes]);

  // Mapa de alocações da grade do curso/período selecionado no Período Letivo Ativo
  const alocacoesGrid = useMemo(() => {
    const map: Record<string, (typeof alocacoes)[number]> = {};
    alocacoesDoPeriodoLetivo
      .filter((a) => a.cursoId === checkCursoId && a.periodoCurso === Number(checkPeriodo))
      .forEach((a) => {
        map[`${a.dia}-${a.horario}`] = a;
      });
    return map;
  }, [alocacoesDoPeriodoLetivo, checkCursoId, checkPeriodo]);

  // Detecção de conflitos dentro do mesmo Período Letivo Ativo
  const conflicts = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < alocacoesDoPeriodoLetivo.length; i++) {
      for (let j = i + 1; j < alocacoesDoPeriodoLetivo.length; j++) {
        const a = alocacoesDoPeriodoLetivo[i];
        const b = alocacoesDoPeriodoLetivo[j];
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

  const turnosVisiveis = useMemo(
    () => getTurnosParaCurso(selectedCheckCursoObj?.turno),
    [selectedCheckCursoObj],
  );

  const openCreateModal = () => {
    setEditing(null);
    setNomeForm("");
    const defaultCurso = checkCursoId || cursos[0]?.id || "";
    setCursoId(defaultCurso);
    setPeriodo(checkPeriodo || "1");
    setDocenteFormId(docentes[0]?.id ?? "");
    setAulasSemanaisForm(4);
    setCargaHorariaForm(80);
    setOpen(true);
  };

  const openEditModal = (d: Disciplina) => {
    const aulasSem = Math.max(1, Number(d.aulasSemanais) || Math.round((d.cargaHoraria || 60) / 20));
    setEditing(d);
    setNomeForm(d.nome);
    setCursoId(d.cursoId);
    setPeriodo(String(d.periodo));
    setDocenteFormId(d.docenteId || docentes[0]?.id || "");
    setAulasSemanaisForm(aulasSem);
    setCargaHorariaForm(d.cargaHoraria || aulasSem * 20);
    setOpen(true);
  };

  const handleAulasSemanaisChange = (val: number) => {
    const clamped = Math.max(1, Math.min(12, Number(val) || 1));
    setAulasSemanaisForm(clamped);
    setCargaHorariaForm(clamped * 20);
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nomeLimpo = nomeForm.trim();
    if (!nomeLimpo) {
      toast.error("Informe o nome da disciplina.");
      return;
    }

    const aulasSemanais = Math.max(1, Math.min(12, Number(aulasSemanaisForm) || 4));
    const cargaHoraria = Math.max(10, Number(cargaHorariaForm) || aulasSemanais * 20);

    if (editing) {
      const res = update(editing.id, {
        codigo: codigoPreview,
        nome: nomeLimpo,
        cursoId,
        periodo: Number(periodo),
        aulasSemanais,
        cargaHoraria,
        docenteId: docenteFormId || undefined,
      });
      if (!res.ok) {
        toast.error(res.error || "Não foi possível atualizar a disciplina.");
        return;
      }
      toast.success(`Disciplina "${nomeLimpo}" (${codigoPreview}) atualizada!`);
    } else {
      const res = add({
        codigo: codigoPreview,
        nome: nomeLimpo,
        cursoId,
        periodo: Number(periodo),
        aulasSemanais,
        cargaHoraria,
        docenteId: docenteFormId || undefined,
      });
      if (!res.ok) {
        toast.error(res.error || "Não foi possível cadastrar a disciplina.");
        return;
      }
      setCheckCursoId(cursoId);
      setCheckPeriodo(String(periodo));
      toast.success(`Disciplina "${nomeLimpo}" (${res.codigo}) cadastrada com ${aulasSemanais} aula(s) semanal(is)!`);
    }
    setOpen(false);
    setEditing(null);
  };

  // Aloca diretamente um bloco de aula em um slot já utilizando o professor definido na disciplina
  const alocarBlocoNoHorario = (
    discId: string,
    dia: number,
    horario: string,
    existingAlocacaoIdToMove?: string,
  ) => {
    const disc = disciplinas.find((d) => d.id === discId);
    if (!disc) return;

    const totalPermitido = Math.max(1, Number(disc.aulasSemanais) || Math.round((disc.cargaHoraria || 60) / 20));
    const alocacoesAtuaisDaDisc = alocacoesDoPeriodoLetivo.filter(
      (a) =>
        a.disciplinaId === disc.id &&
        a.cursoId === checkCursoId &&
        a.periodoCurso === Number(checkPeriodo) &&
        a.id !== existingAlocacaoIdToMove,
    );

    const existingMoveAloc = existingAlocacaoIdToMove
      ? alocacoesDoPeriodoLetivo.find((a) => a.id === existingAlocacaoIdToMove)
      : undefined;

    const prevAloc = alocacoesAtuaisDaDisc[alocacoesAtuaisDaDisc.length - 1];
    // Usa o professor já vinculado à disciplina!
    const docId =
      disc.docenteId ||
      existingMoveAloc?.docenteId ||
      prevAloc?.docenteId ||
      "";
    const ambId =
      quickAmbienteId ||
      existingMoveAloc?.ambienteId ||
      prevAloc?.ambienteId ||
      ambientes[0]?.id ||
      "";

    if (!docId) {
      toast.error(`Defina primeiro o professor da disciplina "${disc.nome}" antes de alocar o horário.`);
      return;
    }

    if (!ambId) {
      setSlotModal({ dia, horario });
      setModalEditId(existingAlocacaoIdToMove ?? null);
      setModalDisciplinaId(disc.id);
      setModalDocenteId(docId);
      setModalAmbienteId(ambId);
      return;
    }

    // Verifica primeiramente se há choque de horário (professor, espaço/ambiente ou turma)
    const conflictMsg = s.verificarConflitoAlocacao({
      id: existingAlocacaoIdToMove ?? undefined,
      disciplinaId: disc.id,
      docenteId: docId,
      ambienteId: ambId,
      cursoId: checkCursoId,
      periodoCurso: Number(checkPeriodo),
      periodoLetivo: periodoLetivoAtivo,
      dia,
      horario,
    });

    if (conflictMsg) {
      toast.error(conflictMsg);
      return;
    }

    if (alocacoesAtuaisDaDisc.length >= totalPermitido) {
      toast.warning(
        `Todas as ${totalPermitido} aulas semanais de "${disc.nome}" já estão alocadas neste período.`,
      );
      return;
    }

    const erroAlocacao = s.setAlocacao({
      id: existingAlocacaoIdToMove ?? undefined,
      disciplinaId: disc.id,
      docenteId: docId,
      ambienteId: ambId,
      cursoId: checkCursoId,
      periodoCurso: Number(checkPeriodo),
      periodoLetivo: periodoLetivoAtivo,
      dia,
      horario,
    });

    if (erroAlocacao) {
      toast.error(erroAlocacao);
      return;
    }

    const slotCode = SLOTS_HORARIOS.find((sl) => sl.horario === horario)?.code ?? horario;
    toast.success(`Aula de "${disc.nome}" alocada em ${DIAS[dia]} · ${slotCode} (${periodoLetivoAtivo})`);
    setSelectedBloco(null);
  };

  const onDragStartBloco = (
    e: React.DragEvent,
    bloco: { disciplinaId: string; indice: number; alocacaoId?: string },
  ) => {
    e.dataTransfer.setData("application/hifcg-bloco", JSON.stringify(bloco));
    e.dataTransfer.setData("type", "disciplina");
    e.dataTransfer.setData("id", bloco.disciplinaId);
    if (bloco.alocacaoId) {
      e.dataTransfer.setData("alocacaoId", bloco.alocacaoId);
    }
  };

  const onDropSlot = (e: React.DragEvent, dia: number, horario: string) => {
    e.preventDefault();
    const rawBloco = e.dataTransfer.getData("application/hifcg-bloco");
    if (rawBloco) {
      try {
        const parsed = JSON.parse(rawBloco) as {
          disciplinaId: string;
          indice: number;
          alocacaoId?: string;
        };
        if (parsed.disciplinaId) {
          alocarBlocoNoHorario(parsed.disciplinaId, dia, horario, parsed.alocacaoId);
          return;
        }
      } catch {
        // Fallback abaixo
      }
    }
    const discId = e.dataTransfer.getData("id");
    const alocId = e.dataTransfer.getData("alocacaoId") || undefined;
    if (discId) {
      alocarBlocoNoHorario(discId, dia, horario, alocId);
    }
  };

  const handleCellClick = (dia: number, horario: string) => {
    if (selectedBloco) {
      alocarBlocoNoHorario(selectedBloco.disciplinaId, dia, horario, selectedBloco.alocacaoId);
      return;
    }

    const existing = alocacoesGrid[`${dia}-${horario}`];
    const primeiraComSaldo =
      blocosPorDisciplina.find((b) => b.alocadasCount < b.totalAulas)?.disciplina.id ??
      disciplinasDoPeriodo[0]?.id ??
      "";
    const targetDiscId = existing?.disciplinaId ?? primeiraComSaldo;
    const targetDisc = disciplinas.find((d) => d.id === targetDiscId);

    setSlotModal({ dia, horario });
    setModalEditId(existing?.id ?? null);
    setModalDisciplinaId(targetDiscId);
    setModalDocenteId(targetDisc?.docenteId ?? existing?.docenteId ?? docentes[0]?.id ?? "");
    setModalAmbienteId(existing?.ambienteId ?? quickAmbienteId ?? ambientes[0]?.id ?? "");
  };

  const conflitoModal = useMemo(() => {
    if (!slotModal || !modalDisciplinaId || !modalDocenteId || !modalAmbienteId) return null;
    return s.verificarConflitoAlocacao({
      id: modalEditId ?? undefined,
      disciplinaId: modalDisciplinaId,
      docenteId: modalDocenteId,
      ambienteId: modalAmbienteId,
      cursoId: checkCursoId,
      periodoCurso: Number(checkPeriodo),
      periodoLetivo: periodoLetivoAtivo,
      dia: slotModal.dia,
      horario: slotModal.horario,
    });
  }, [
    alocacoes,
    disciplinas,
    docentes,
    ambientes,
    cursos,
    slotModal,
    modalEditId,
    modalDisciplinaId,
    modalDocenteId,
    modalAmbienteId,
    checkCursoId,
    checkPeriodo,
    periodoLetivoAtivo,
  ]);

  const saveModalSlot = () => {
    if (!slotModal || !modalDisciplinaId || !modalDocenteId || !modalAmbienteId) {
      toast.error("Selecione a disciplina, o professor e o ambiente.");
      return;
    }

    // Verifica se há choque de professor, de espaço/ambiente ou de turma antes de efetivar a alocação
    const conflictMsg = s.verificarConflitoAlocacao({
      id: modalEditId ?? undefined,
      disciplinaId: modalDisciplinaId,
      docenteId: modalDocenteId,
      ambienteId: modalAmbienteId,
      cursoId: checkCursoId,
      periodoCurso: Number(checkPeriodo),
      periodoLetivo: periodoLetivoAtivo,
      dia: slotModal.dia,
      horario: slotModal.horario,
    });

    if (conflictMsg) {
      toast.error(conflictMsg);
      return;
    }

    const disc = disciplinas.find((d) => d.id === modalDisciplinaId);
    if (disc) {
      const limite = Math.max(1, Number(disc.aulasSemanais) || Math.round((disc.cargaHoraria || 60) / 20));
      const jaAlocadas = alocacoesDoPeriodoLetivo.filter(
        (a) =>
          a.disciplinaId === disc.id &&
          a.cursoId === checkCursoId &&
          a.periodoCurso === Number(checkPeriodo) &&
          a.id !== modalEditId,
      ).length;
      if (jaAlocadas >= limite) {
        toast.warning(`A disciplina "${disc.nome}" já possui todas as ${limite} aulas semanais alocadas.`);
        return;
      }

      if (disc.docenteId !== modalDocenteId) {
        const resUpdate = update(disc.id, { docenteId: modalDocenteId });
        if (!resUpdate.ok) {
          toast.error(resUpdate.error || "Não foi possível vincular o professor devido a choque de horário.");
          return;
        }
      }
    }

    const erroAlocacao = s.setAlocacao({
      id: modalEditId ?? undefined,
      disciplinaId: modalDisciplinaId,
      docenteId: modalDocenteId,
      ambienteId: modalAmbienteId,
      cursoId: checkCursoId,
      periodoCurso: Number(checkPeriodo),
      periodoLetivo: periodoLetivoAtivo,
      dia: slotModal.dia,
      horario: slotModal.horario,
    });
    if (erroAlocacao) {
      toast.error(erroAlocacao);
      return;
    }

    toast.success(`Aula alocada no horário (${periodoLetivoAtivo})!`);
    setSlotModal(null);
    setModalEditId(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disciplinas"
        description="Cadastro de disciplinas com código único gerado automaticamente, vínculo com o professor e definição da quantidade de aulas semanais (RF16-RF18)."
        action={
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o);
              if (!o) setEditing(null);
            }}
          >
            <DialogTrigger asChild>
              <Button onClick={openCreateModal}>
                <Plus className="h-4 w-4 mr-2" />
                Nova disciplina
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? "Editar disciplina" : "Nova disciplina"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                {/* Código gerado automaticamente */}
                <div className="rounded-lg border border-primary/25 bg-primary/5 p-3 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Código único da disciplina (gerado automaticamente)
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Não é necessário digitar. O sistema garante código exclusivo por disciplina.
                    </div>
                  </div>
                  <Badge variant="default" className="font-mono text-sm px-3 py-1 shrink-0">
                    {codigoPreview}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label>Nome da disciplina</Label>
                  <Input
                    name="nome"
                    required
                    placeholder="Ex.: Estrutura de Dados"
                    value={nomeForm}
                    onChange={(e) => setNomeForm(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Curso</Label>
                    <Combobox
                      options={cursos.map((c) => ({ value: c.id, label: c.nome, hint: c.codigo }))}
                      value={cursoId}
                      onChange={setCursoId}
                      placeholder="Buscar curso…"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Período do curso</Label>
                    <Select value={periodo} onValueChange={setPeriodo}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {formPeriodos.map((p) => (
                          <SelectItem key={p} value={String(p)}>
                            {p}º período
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Professor (Docente responsável pela disciplina)</Label>
                  <Combobox
                    options={docentes.map((d) => ({ value: d.id, label: d.nome, hint: d.area }))}
                    value={docenteFormId}
                    onChange={setDocenteFormId}
                    placeholder="Selecionar professor da disciplina…"
                  />
                </div>

                {/* Quantidade de Aulas Semanais (campo principal) + Carga Horária Total */}
                <div className="rounded-lg border border-border p-3 space-y-3 bg-muted/20">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-primary font-semibold">
                        Qtd. de aulas semanais (blocos)
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          name="aulasSemanais"
                          type="number"
                          min={1}
                          max={12}
                          required
                          value={aulasSemanaisForm}
                          onChange={(e) => handleAulasSemanaisChange(Number(e.target.value))}
                          className="w-20 font-semibold"
                        />
                        <div className="flex flex-wrap gap-1">
                          {[2, 3, 4, 5, 6].map((n) => (
                            <Button
                              key={n}
                              type="button"
                              size="sm"
                              variant={aulasSemanaisForm === n ? "default" : "outline"}
                              className="h-7 px-2 text-xs"
                              onClick={() => handleAulasSemanaisChange(n)}
                            >
                              {n}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-muted-foreground text-xs">
                        Carga horária semestral estimada (h)
                      </Label>
                      <Input
                        name="ch"
                        type="number"
                        min={10}
                        max={400}
                        required
                        value={cargaHorariaForm}
                        onChange={(e) => setCargaHorariaForm(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  {/* Pré-visualização gráfica dos blocos semanais que serão gerados */}
                  <div className="space-y-1.5 pt-1 border-t border-border/60">
                    <div className="text-[11px] font-medium text-muted-foreground">
                      Blocos de aulas semanais gerados para alocação ({aulasSemanaisForm}{" "}
                      {aulasSemanaisForm === 1 ? "aula" : "aulas"} de 50 min/semana):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: aulasSemanaisForm }, (_, i) => (
                        <div
                          key={i}
                          className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                        >
                          <span>{nomeForm.trim() || codigoPreview}</span>
                          <span className="text-[10px] opacity-80">
                            · Aula {i + 1}/{aulasSemanaisForm}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="submit">Salvar disciplina</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Tabela de disciplinas cadastradas */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código ou nome da disciplina…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Disciplina</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Professor Vinculado</TableHead>
              <TableHead>Curso / Período</TableHead>
              <TableHead>Aulas Semanais ({periodoLetivoAtivo})</TableHead>
              <TableHead>CH</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((d) => {
              const aulasSem = Math.max(
                1,
                Number(d.aulasSemanais) || Math.round((d.cargaHoraria || 60) / 20),
              );
              const alocadas = alocacoesDoPeriodoLetivo.filter(
                (a) =>
                  a.disciplinaId === d.id &&
                  a.cursoId === d.cursoId &&
                  a.periodoCurso === d.periodo,
              ).length;
              const docVinculado = docentes.find((doc) => doc.id === d.docenteId);
              return (
                <TableRow key={d.id}>
                  <TableCell className="font-semibold">{d.nome}</TableCell>
                  <TableCell className="font-mono text-xs text-primary">
                    {d.codigo}
                  </TableCell>
                  <TableCell>
                    {docVinculado ? (
                      <span className="text-xs font-medium text-foreground">
                        {docVinculado.nome}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        Não definido
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {cursos.find((c) => c.id === d.cursoId)?.nome ?? "—"} · {d.periodo}º período
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={alocadas >= aulasSem ? "default" : "secondary"}
                        className="text-xs font-semibold"
                      >
                        {aulasSem} {aulasSem === 1 ? "aula" : "aulas"}/sem
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        ({alocadas}/{aulasSem} alocadas)
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{d.cargaHoraria}h</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        setCheckCursoId(d.cursoId);
                        setCheckPeriodo(String(d.periodo));
                        const nextIndex = Math.min(aulasSem, alocadas + 1);
                        setSelectedBloco({ disciplinaId: d.id, indice: nextIndex });
                        document
                          .getElementById("painel-blocos-semanais")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      <CalendarClock className="h-3.5 w-3.5 mr-1" />
                      Alocar horários
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEditModal(d)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Remover ${d.nome}?`)) {
                          remove(d.id);
                          toast.success("Disciplina removida");
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  Nenhuma disciplina cadastrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Painel Gráfico de Blocos de Aulas Semanais + Quadro de Horários */}
      <Card id="painel-blocos-semanais" className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-3">
          <div>
            <div className="text-base font-semibold flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-primary" />
              Blocos de Aulas Semanais · Quadro do Período Letivo {periodoLetivoAtivo}
            </div>
            <p className="text-xs text-muted-foreground">
              Defina o professor na disciplina e selecione um bloco de aula semanal para alocar no horário desejado da grade.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default" className="gap-1.5 px-3 py-1">
              <CalendarRange className="h-3.5 w-3.5" />
              Período Letivo Ativo: {periodoLetivoAtivo}
            </Badge>
            <Link to="/periodos" className="text-xs text-primary hover:underline font-medium">
              Alterar período
            </Link>
          </div>
        </div>

        {selectedBloco && (
          <div className="flex items-center justify-between gap-2 rounded-md bg-primary/15 border border-primary/40 px-3 py-2 text-xs font-medium text-primary">
            <div className="flex items-center gap-2">
              <MousePointerClick className="h-4 w-4 shrink-0" />
              <span>
                Bloco ativo:{" "}
                <strong>
                  {disciplinas.find((d) => d.id === selectedBloco.disciplinaId)?.nome} (Aula{" "}
                  {selectedBloco.indice})
                </strong>{" "}
                — clique no horário desejado na grade abaixo para alocar!
              </span>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-5 w-5"
              onClick={() => setSelectedBloco(null)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}

        {/* Filtros de Curso, Período do Curso e Ambiente Padrão */}
        <div className="grid sm:grid-cols-3 gap-3 bg-muted/30 p-3 rounded-lg border">
          <div className="space-y-1.5">
            <Label className="text-xs">Curso</Label>
            <Combobox
              options={cursos.map((c) => ({ value: c.id, label: c.nome, hint: c.codigo }))}
              value={checkCursoId}
              onChange={(v) => {
                setCheckCursoId(v);
                setCheckPeriodo("1");
                setSelectedBloco(null);
              }}
              placeholder="Buscar curso…"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Período do curso</Label>
            <Select
              value={checkPeriodo}
              onValueChange={(v) => {
                setCheckPeriodo(v);
                setSelectedBloco(null);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {checkPeriodosList.map((p) => (
                  <SelectItem key={p} value={String(p)}>
                    {p}º período
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Ambiente / Sala padrão para alocação</Label>
            <Combobox
              options={ambientes.map((a) => ({
                value: a.id,
                label: `${a.codigo} · ${a.tipo}`,
                hint: `${a.capacidade} lug.`,
              }))}
              value={quickAmbienteId}
              onChange={setQuickAmbienteId}
              placeholder="Selecionar ambiente…"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-[340px_1fr] gap-4 items-start">
          {/* Coluna Esquerda: Disciplinas, Professor vinculado e Blocos de Aulas Semanais */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Disciplinas do {checkPeriodo}º Período ({blocosPorDisciplina.length})
            </div>

            {blocosPorDisciplina.length === 0 && (
              <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                Nenhuma disciplina cadastrada neste período. Clique em{" "}
                <strong>Nova disciplina</strong> acima para cadastrar.
              </div>
            )}

            {blocosPorDisciplina.map(({ disciplina: d, docenteVinculadoId, totalAulas, alocadasCount, blocos }) => {
              const completa = alocadasCount >= totalAulas;
              return (
                <div
                  key={d.id}
                  className={cn(
                    "rounded-lg border p-3 space-y-2.5 transition-colors",
                    completa ? "bg-emerald-500/5 border-emerald-500/30" : "bg-card border-border",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-semibold">{d.nome}</div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {d.codigo} · {totalAulas} {totalAulas === 1 ? "aula semanal" : "aulas semanais"}
                      </div>
                    </div>
                    <Badge
                      variant={completa ? "default" : "secondary"}
                      className="text-[10px] shrink-0"
                    >
                      {completa && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {alocadasCount}/{totalAulas} alocadas
                    </Badge>
                  </div>

                  {/* Seleção do Professor diretamente na Disciplina */}
                  <div className="space-y-1 pt-1 border-t border-border/60">
                    <Label className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <UserCheck className="h-3 w-3 text-primary" />
                      Professor da disciplina:
                    </Label>
                    <Select
                      value={docenteVinculadoId || ""}
                      onValueChange={(novoDocId) => {
                        const res = update(d.id, { docenteId: novoDocId });
                        if (!res.ok) {
                          toast.error(res.error || "Não foi possível vincular o professor devido a choque de horário.");
                          return;
                        }
                        const docNome = docentes.find((x) => x.id === novoDocId)?.nome;
                        toast.success(`Professor ${docNome} vinculado a "${d.nome}"`);
                      }}
                    >
                      <SelectTrigger className="h-7 text-xs bg-background">
                        <SelectValue placeholder="Selecionar professor…" />
                      </SelectTrigger>
                      <SelectContent>
                        {docentes.map((doc) => (
                          <SelectItem key={doc.id} value={doc.id}>
                            {doc.nome} ({doc.area})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Blocos individuais da disciplina */}
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    {blocos.map((bloco) => {
                      const isAlocado = Boolean(bloco.alocacaoId);
                      const isSelected =
                        selectedBloco?.disciplinaId === d.id &&
                        selectedBloco?.indice === bloco.indice;

                      return (
                        <div
                          key={`${d.id}-bloco-${bloco.indice}`}
                          draggable
                          onDragStart={(e) =>
                            onDragStartBloco(e, {
                              disciplinaId: d.id,
                              indice: bloco.indice,
                              alocacaoId: bloco.alocacaoId,
                            })
                          }
                          onClick={() => {
                            if (!docenteVinculadoId) {
                              toast.error(`Selecione primeiro o professor da disciplina "${d.nome}" acima.`);
                              return;
                            }
                            if (isSelected) {
                              setSelectedBloco(null);
                            } else {
                              setSelectedBloco({
                                disciplinaId: d.id,
                                indice: bloco.indice,
                                alocacaoId: bloco.alocacaoId,
                              });
                            }
                          }}
                          className={cn(
                            "group relative flex items-center justify-between gap-1.5 rounded-md border px-2.5 py-2 text-xs cursor-pointer select-none transition-all",
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30"
                              : isAlocado
                                ? "border-emerald-500/40 bg-emerald-500/10 text-foreground hover:bg-emerald-500/15"
                                : "border-primary/30 bg-primary/5 text-foreground hover:bg-primary/15",
                          )}
                        >
                          <div className="truncate">
                            <div className="font-semibold leading-tight">
                              Aula {bloco.indice}/{bloco.total}
                            </div>
                            <div
                              className={cn(
                                "text-[10px] truncate",
                                isSelected
                                  ? "text-primary-foreground/90"
                                  : "text-muted-foreground",
                              )}
                            >
                              {isAlocado
                                ? `${DIAS[bloco.dia ?? 0].slice(0, 3)} · ${bloco.slotCode || bloco.horario}`
                                : "Selecionar horário"}
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
          </div>

          {/* Coluna Direita: Grade de Horários Interativa do Período Letivo Ativo */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <div className="flex items-center justify-between bg-muted/30 px-3 py-2 border-b text-xs">
              <span className="font-semibold text-foreground">
                Grade de Horários · {selectedCheckCursoObj?.nome} ({checkPeriodo}º período)
              </span>
              <span className="font-mono font-semibold text-primary">
                Período Letivo: {periodoLetivoAtivo}
              </span>
            </div>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-muted/40">
                  <th className="p-2 text-left text-muted-foreground font-medium w-28">
                    Horário (50m)
                  </th>
                  {DIAS.map((d) => (
                    <th key={d} className="p-2 text-left text-muted-foreground font-medium">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {turnosVisiveis.map((turno) => {
                  const slotsDoTurno = SLOTS_HORARIOS.filter((sl) => sl.turno === turno);
                  return (
                    <React.Fragment key={turno}>
                      <tr className="bg-muted/40 border-t border-b">
                        <td
                          colSpan={6}
                          className="px-2 py-1.5 text-[11px] font-bold text-primary tracking-wide uppercase"
                        >
                          Turno {turno} ({slotsDoTurno.length} aulas)
                        </td>
                      </tr>
                      {slotsDoTurno.map((slotObj) => {
                        const h = slotObj.horario;
                        return (
                          <tr key={slotObj.id}>
                            <td className="p-2 align-top border-t bg-muted/10">
                              <div className="font-semibold text-foreground text-xs">
                                {slotObj.code}
                              </div>
                              <div className="font-mono text-[10px] text-muted-foreground">
                                {h}
                              </div>
                            </td>
                            {DIAS.map((_, di) => {
                              const a = alocacoesGrid[`${di}-${h}`];
                              const isConflict = a && conflicts.has(a.id);
                              const disc =
                                a && disciplinas.find((x) => x.id === a.disciplinaId);
                              const doc = a && docentes.find((x) => x.id === a.docenteId);
                              const amb = a && ambientes.find((x) => x.id === a.ambienteId);

                              let blocoIdxLabel = "";
                              if (a && disc) {
                                const infoDisc = blocosPorDisciplina.find(
                                  (b) => b.disciplina.id === disc.id,
                                );
                                const foundBloco = infoDisc?.blocos.find(
                                  (bl) => bl.alocacaoId === a.id,
                                );
                                if (foundBloco) {
                                  blocoIdxLabel = `Aula ${foundBloco.indice}/${foundBloco.total}`;
                                }
                              }

                              return (
                                <td key={di} className="p-1 align-top border-t">
                                  <div
                                    onClick={() => handleCellClick(di, h)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => onDropSlot(e, di, h)}
                                    className={cn(
                                      "w-full min-h-[72px] rounded-md text-left p-2 transition-all border cursor-pointer select-none",
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
                                        <div className="font-semibold text-foreground flex items-center justify-between gap-1">
                                          <span className="truncate flex items-center gap-1" title={disc?.nome}>
                                            {isConflict && (
                                              <AlertTriangle className="h-3 w-3 text-destructive shrink-0" />
                                            )}
                                            {disc?.nome ?? disc?.codigo}
                                          </span>
                                          {blocoIdxLabel && (
                                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-background/80 text-muted-foreground shrink-0">
                                              {blocoIdxLabel}
                                            </span>
                                          )}
                                        </div>
                                        <div>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (doc?.id) setDetailsDocenteId(doc.id);
                                            }}
                                            className="text-primary hover:underline font-medium text-left truncate block w-full cursor-pointer text-[11px]"
                                          >
                                            {doc?.nome || "Docente"}
                                          </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (amb?.id) setDetailsAmbienteId(amb.id);
                                            }}
                                            className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline text-left truncate cursor-pointer"
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
                                      <div className="text-muted-foreground flex flex-col items-center justify-center h-full opacity-60 py-2 text-[10px] gap-0.5">
                                        <Plus className="h-3.5 w-3.5" />
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
          </div>
        </div>
      </Card>

      {/* Modal de Detalhes de Docente / Ambiente */}
      <ResourceDetailsModal
        docenteId={detailsDocenteId}
        ambienteId={detailsAmbienteId}
        onClose={() => {
          setDetailsDocenteId(null);
          setDetailsAmbienteId(null);
        }}
      />

      {/* Modal ao clicar diretamente em uma célula da grade */}
      <Dialog
        open={!!slotModal}
        onOpenChange={(o) => {
          if (!o) {
            setSlotModal(null);
            setModalEditId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {modalEditId ? "Editar aula alocada" : "Alocar aula no horário"} ·{" "}
              {slotModal && DIAS[slotModal.dia]} {slotModal?.horario} ({periodoLetivoAtivo})
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
                value={modalDisciplinaId}
                onChange={(novaDiscId) => {
                  setModalDisciplinaId(novaDiscId);
                  const d = disciplinas.find((x) => x.id === novaDiscId);
                  if (d?.docenteId) setModalDocenteId(d.docenteId);
                }}
                placeholder="Buscar disciplina…"
              />
            </div>
            <div className="space-y-2">
              <Label>Professor (vinculado à disciplina)</Label>
              <Combobox
                options={docentes.map((d) => ({ value: d.id, label: d.nome, hint: d.area }))}
                value={modalDocenteId}
                onChange={setModalDocenteId}
                placeholder="Buscar professor…"
              />
            </div>
            <div className="space-y-2">
              <Label>Ambiente / Sala</Label>
              <Combobox
                options={ambientes.map((a) => ({
                  value: a.id,
                  label: `${a.codigo} · ${a.tipo}`,
                  hint: `${a.capacidade} lug.`,
                }))}
                value={modalAmbienteId}
                onChange={setModalAmbienteId}
                placeholder="Buscar ambiente…"
              />
            </div>
            {conflitoModal && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{conflitoModal}</span>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            {modalEditId && (
              <Button
                variant="destructive"
                onClick={() => {
                  s.removeAlocacao(modalEditId);
                  toast.success("Aula removida do horário");
                  setSlotModal(null);
                  setModalEditId(null);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Remover
              </Button>
            )}
            <Button onClick={saveModalSlot}>{modalEditId ? "Salvar" : "Alocar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
