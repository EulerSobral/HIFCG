import React, { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/Combobox";
import { ResourceDetailsModal } from "@/components/ResourceDetailsModal";
import { DIAS, SLOTS_HORARIOS, getTurnosParaCurso, useStore, type Alocacao } from "@/lib/store";
import { CalendarClock, ArrowLeft, BookOpen, User, MapPin } from "lucide-react";

export const Route = createFileRoute("/publico")({
  head: () => ({ meta: [{ title: "Horários públicos · HIFCG" }, { name: "description", content: "Visualização pública dos horários do IFPB-CG." }] }),
  component: Page,
});

type TipoVisualizacao = "curso" | "docente" | "ambiente";

function Page() {
  const s = useStore();
  const [tipoView, setTipoView] = useState<TipoVisualizacao>("curso");

  // Filtros para visualização por Curso
  const [nivel, setNivel] = useState<string>("todos");
  const cursosFiltrados = useMemo(
    () => s.cursos.filter((c) => nivel === "todos" || c.nivel === nivel),
    [s.cursos, nivel],
  );
  const [cursoId, setCursoId] = useState<string>(s.cursos[0]?.id ?? "");
  const activeCursoId = useMemo(() => {
    if (cursosFiltrados.some((c) => c.id === cursoId)) return cursoId;
    return cursosFiltrados[0]?.id ?? "";
  }, [cursosFiltrados, cursoId]);
  const selectedCurso = useMemo(() => s.cursos.find((c) => c.id === activeCursoId), [s.cursos, activeCursoId]);
  const [periodoCurso, setPeriodoCurso] = useState<number>(1);
  const listaPeriodos = useMemo(
    () => Array.from({ length: selectedCurso?.periodos ?? 6 }, (_, i) => i + 1),
    [selectedCurso],
  );

  // Filtro por Docente
  const [selectedDocenteId, setSelectedDocenteId] = useState<string>(s.docentes[0]?.id ?? "");
  const selectedDocente = useMemo(() => s.docentes.find((d) => d.id === selectedDocenteId), [s.docentes, selectedDocenteId]);

  // Filtro por Ambiente / Sala
  const [selectedAmbienteId, setSelectedAmbienteId] = useState<string>(s.ambientes[0]?.id ?? "");
  const selectedAmbiente = useMemo(() => s.ambientes.find((a) => a.id === selectedAmbienteId), [s.ambientes, selectedAmbienteId]);

  // Estados para modais de detalhes
  const [detailsDocenteId, setDetailsDocenteId] = useState<string | null>(null);
  const [detailsAmbienteId, setDetailsAmbienteId] = useState<string | null>(null);

  // Mapa de alocações conforme o tipo de visualização ativo
  const mapAlocacoes = useMemo(() => {
    const m: Record<string, Alocacao[]> = {};
    let list: Alocacao[] = [];

    if (tipoView === "curso") {
      list = s.alocacoes.filter((a) => a.cursoId === activeCursoId && a.periodoCurso === periodoCurso);
    } else if (tipoView === "docente") {
      list = s.alocacoes.filter((a) => a.docenteId === selectedDocenteId);
    } else if (tipoView === "ambiente") {
      list = s.alocacoes.filter((a) => a.ambienteId === selectedAmbienteId);
    }

    list.forEach((a) => {
      (m[`${a.dia}-${a.horario}`] ||= []).push(a);
    });
    return m;
  }, [s.alocacoes, tipoView, activeCursoId, periodoCurso, selectedDocenteId, selectedAmbienteId]);

  // Turnos a serem exibidos (Se for por curso, filtra por modalidade Ex: Integral omite Noturno; Noturno omite Manhã e Tarde)
  const turnosVisiveis = useMemo(() => {
    if (tipoView === "curso") {
      return getTurnosParaCurso(selectedCurso?.turno);
    }
    return ["Manhã", "Tarde", "Noite"] as Array<"Manhã" | "Tarde" | "Noite">;
  }, [tipoView, selectedCurso]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b" style={{ background: "var(--gradient-primary)" }}>
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between text-primary-foreground">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-7 w-7" />
            <div>
              <div className="font-bold text-lg">HIFCG</div>
              <div className="text-xs opacity-90">Consulta pública de horários · IFPB-CG</div>
            </div>
          </div>
          <Link to="/" className="text-sm inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Acessar sistema
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-6 space-y-4">
        {/* Botões de Seleção de Recurso para Visualização */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground mr-1">Visualizar por:</span>
          <Button
            type="button"
            variant={tipoView === "curso" ? "default" : "outline"}
            size="sm"
            onClick={() => setTipoView("curso")}
            className="gap-1.5 cursor-pointer"
          >
            <BookOpen className="h-4 w-4" /> Por Curso e Período
          </Button>
          <Button
            type="button"
            variant={tipoView === "docente" ? "default" : "outline"}
            size="sm"
            onClick={() => setTipoView("docente")}
            className="gap-1.5 cursor-pointer"
          >
            <User className="h-4 w-4" /> Por Docente / Professor
          </Button>
          <Button
            type="button"
            variant={tipoView === "ambiente" ? "default" : "outline"}
            size="sm"
            onClick={() => setTipoView("ambiente")}
            className="gap-1.5 cursor-pointer"
          >
            <MapPin className="h-4 w-4" /> Por Ambiente / Sala
          </Button>
        </div>

        {/* Card de Filtros Dinâmicos */}
        <Card className="p-4">
          {tipoView === "curso" && (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nível de ensino</Label>
                <Select value={nivel} onValueChange={(v) => { setNivel(v); setPeriodoCurso(1); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os níveis</SelectItem>
                    <SelectItem value="Técnico Integrado">Técnico Integrado</SelectItem>
                    <SelectItem value="Técnico Subsequente">Técnico Subsequente</SelectItem>
                    <SelectItem value="Superior">Superior</SelectItem>
                    <SelectItem value="Pós-Graduação">Pós-Graduação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Curso</Label>
                <Combobox
                  options={cursosFiltrados.map((c) => ({ value: c.id, label: c.nome, hint: `${c.codigo} (${c.turno})` }))}
                  value={activeCursoId}
                  onChange={(v) => { setCursoId(v); setPeriodoCurso(1); }}
                  placeholder="Buscar curso…"
                />
              </div>
              <div className="space-y-2">
                <Label>Período do curso</Label>
                <Select value={String(periodoCurso)} onValueChange={(v) => setPeriodoCurso(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {listaPeriodos.map((p) => <SelectItem key={p} value={String(p)}>{p}º período</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {tipoView === "docente" && (
            <div className="max-w-md space-y-2">
              <Label>Docente / Professor</Label>
              <Combobox
                options={s.docentes.map((d) => ({ value: d.id, label: d.nome, hint: d.area }))}
                value={selectedDocenteId}
                onChange={setSelectedDocenteId}
                placeholder="Buscar docente pelo nome…"
              />
            </div>
          )}

          {tipoView === "ambiente" && (
            <div className="max-w-md space-y-2">
              <Label>Ambiente / Sala / Laboratório</Label>
              <Combobox
                options={s.ambientes.map((a) => ({ value: a.id, label: `${a.codigo} · ${a.tipo}`, hint: `Bloco ${a.bloco}` }))}
                value={selectedAmbienteId}
                onChange={setSelectedAmbienteId}
                placeholder="Buscar ambiente pelo código…"
              />
            </div>
          )}
        </Card>

        {/* Tabela da Grade de Aulas */}
        <Card className="p-3 overflow-x-auto">
          <div className="mb-2 text-xs font-semibold text-muted-foreground px-1">
            {tipoView === "curso" && (selectedCurso ? `Grade de Aulas: ${selectedCurso.nome} (${selectedCurso.codigo}) · Turno ${selectedCurso.turno} · ${periodoCurso}º Período` : "Nenhum curso selecionado")}
            {tipoView === "docente" && (selectedDocente ? `Horários do Docente: ${selectedDocente.nome} (${selectedDocente.area})` : "Nenhum docente selecionado")}
            {tipoView === "ambiente" && (selectedAmbiente ? `Horários do Ambiente: ${selectedAmbiente.codigo} (${selectedAmbiente.tipo} - Bloco ${selectedAmbiente.bloco})` : "Nenhum ambiente selecionado")}
          </div>

          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left text-muted-foreground w-32">Horário (50 min)</th>
                {DIAS.map((d) => <th key={d} className="p-2 text-left text-muted-foreground">{d}</th>)}
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
                          <td className="p-2 font-mono text-muted-foreground border-t align-top bg-muted/10">
                            <div className="font-semibold text-foreground text-xs">{slotObj.code}</div>
                            <div className="text-[10px]">{h}</div>
                          </td>
                          {DIAS.map((_, di) => {
                            const items = mapAlocacoes[`${di}-${h}`] ?? [];
                            return (
                              <td key={di} className="p-1 border-t align-top min-w-[110px]">
                                {items.map((a) => {
                                  const d = s.disciplinas.find((x) => x.id === a.disciplinaId);
                                  const doc = s.docentes.find((x) => x.id === a.docenteId);
                                  const amb = s.ambientes.find((x) => x.id === a.ambienteId);
                                  const curso = s.cursos.find((x) => x.id === a.cursoId);
                                  return (
                                    <div key={a.id} className="rounded-md bg-primary/10 border border-primary/30 p-2 mb-1 shadow-xs space-y-0.5">
                                      <div className="font-semibold text-foreground">{d?.nome ?? d?.codigo}</div>

                                      {/* Se estiver vendo por curso ou por ambiente, exibe docente clicável */}
                                      {tipoView !== "docente" && (
                                        <div>
                                          <button
                                            type="button"
                                            onClick={() => doc?.id && setDetailsDocenteId(doc.id)}
                                            className="text-primary hover:underline font-medium text-left truncate block w-full cursor-pointer text-xs"
                                            title="Ver agenda do docente"
                                          >
                                            {doc?.nome || "Docente"}
                                          </button>
                                        </div>
                                      )}

                                      {/* Se estiver vendo por curso ou por docente, exibe ambiente clicável */}
                                      {tipoView !== "ambiente" && (
                                        <div>
                                          <button
                                            type="button"
                                            onClick={() => amb?.id && setDetailsAmbienteId(amb.id)}
                                            className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                                            title="Ver detalhes do ambiente"
                                          >
                                            {amb?.codigo || "Ambiente"}
                                          </button>
                                        </div>
                                      )}

                                      {/* Se estiver vendo por docente ou ambiente, informa o curso e período */}
                                      {tipoView !== "curso" && curso && (
                                        <div className="text-[10px] text-muted-foreground truncate">
                                          {curso.codigo} ({a.periodoCurso}º per)
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                                {items.length === 0 && <div className="text-muted-foreground/40 text-center py-3">—</div>}
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
      </div>

      <ResourceDetailsModal
        docenteId={detailsDocenteId}
        ambienteId={detailsAmbienteId}
        onClose={() => {
          setDetailsDocenteId(null);
          setDetailsAmbienteId(null);
        }}
      />
    </div>
  );
}