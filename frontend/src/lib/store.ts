import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "diretor" | "coord_area" | "coord_curso";

export interface User {
  id: string;
  nome: string;
  email: string;
  senha: string;
  role: Role;
  departamento?: string;
  cursoId?: string;
}

export interface Docente {
  id: string;
  nome: string;
  email: string;
  matricula: string;
  especialidade: string;
}

export interface Ambiente {
  id: string;
  codigo: string;
  tipo: "Sala" | "Laboratório" | "Auditório" | "Quadra";
  capacidade: number;
  bloco: string;
}

export interface Curso {
  id: string;
  codigo: string;
  nome: string;
  turno: "Integral" | "Matutino" | "Vespertino" | "Noturno";
  nivel: "Técnico Subsequente" | "Técnico Integrado" | "Superior" | "Pós-Graduação";
  departamento: string;
}

export interface Disciplina {
  id: string;
  codigo: string;
  nome: string;
  cursoId: string;
  ementa: string;
  especialidade: string;
  cargaHoraria: number;
}

export interface Periodo {
  id: string;
  nome: string;
  inicio: string;
  fim: string;
  inicioMatricula: string;
  fimMatricula: string;
  ativo: boolean;
}

export interface Alocacao {
  id: string;
  disciplinaId: string;
  docenteId: string;
  ambienteId: string;
  cursoId: string;
  periodoId: string;
  dia: number; // 0=Seg .. 5=Sáb
  horario: string; // "08:00-09:40"
}

export interface LogEntry {
  id: string;
  userId: string;
  userName: string;
  acao: string;
  detalhe: string;
  timestamp: string;
}

interface State {
  currentUserId: string | null;
  users: User[];
  docentes: Docente[];
  ambientes: Ambiente[];
  cursos: Curso[];
  disciplinas: Disciplina[];
  periodos: Periodo[];
  alocacoes: Alocacao[];
  logs: LogEntry[];

  login: (email: string, senha: string) => User | null;
  logout: () => void;

  addLog: (acao: string, detalhe: string) => void;

  addDocente: (d: Omit<Docente, "id">) => void;
  updateDocente: (id: string, d: Partial<Docente>) => void;
  removeDocente: (id: string) => void;

  addAmbiente: (a: Omit<Ambiente, "id">) => void;
  updateAmbiente: (id: string, a: Partial<Ambiente>) => void;
  removeAmbiente: (id: string) => void;

  addCurso: (c: Omit<Curso, "id">) => void;
  updateCurso: (id: string, c: Partial<Curso>) => void;
  removeCurso: (id: string) => void;

  addDisciplina: (d: Omit<Disciplina, "id">) => void;
  updateDisciplina: (id: string, d: Partial<Disciplina>) => void;
  removeDisciplina: (id: string) => void;

  addPeriodo: (p: Omit<Periodo, "id">) => void;
  updatePeriodo: (id: string, p: Partial<Periodo>) => void;
  removePeriodo: (id: string) => void;

  addUser: (u: Omit<User, "id">) => void;
  updateUser: (id: string, u: Partial<User>) => void;
  removeUser: (id: string) => void;

  setAlocacao: (a: Omit<Alocacao, "id"> & { id?: string }) => string | null;
  removeAlocacao: (id: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const seedUsers: User[] = [
  { id: "u1", nome: "Dr. Roberto Lima", email: "diretor@ifpb.edu.br", senha: "123456", role: "diretor" },
  { id: "u2", nome: "Profa. Ana Souza", email: "area.info@ifpb.edu.br", senha: "123456", role: "coord_area", departamento: "Informática" },
  { id: "u3", nome: "Prof. Carlos Mendes", email: "curso.tads@ifpb.edu.br", senha: "123456", role: "coord_curso", departamento: "Informática", cursoId: "c1" },
];

const seedDocentes: Docente[] = [
  { id: "d1", nome: "Sicrano Pereira", email: "sicrano@ifpb.edu.br", matricula: "1001", especialidade: "Matemática" },
  { id: "d2", nome: "Beltrano Silva", email: "beltrano@ifpb.edu.br", matricula: "1002", especialidade: "Programação" },
  { id: "d3", nome: "Fulana Costa", email: "fulana@ifpb.edu.br", matricula: "1003", especialidade: "Banco de Dados" },
  { id: "d4", nome: "Mariana Rocha", email: "mariana@ifpb.edu.br", matricula: "1004", especialidade: "Redes" },
];

const seedAmbientes: Ambiente[] = [
  { id: "a1", codigo: "S-101", tipo: "Sala", capacidade: 40, bloco: "A" },
  { id: "a2", codigo: "LAB-01", tipo: "Laboratório", capacidade: 30, bloco: "B" },
  { id: "a3", codigo: "AUD-01", tipo: "Auditório", capacidade: 120, bloco: "C" },
];

const seedCursos: Curso[] = [
  { id: "c1", codigo: "TADS", nome: "Tec. em Análise e Des. de Sistemas", turno: "Noturno", nivel: "Superior", departamento: "Informática" },
  { id: "c2", codigo: "INFO-INT", nome: "Técnico em Informática Integrado", turno: "Integral", nivel: "Técnico Integrado", departamento: "Informática" },
  { id: "c3", codigo: "ELET", nome: "Técnico em Eletromecânica", turno: "Matutino", nivel: "Técnico Subsequente", departamento: "Indústria" },
];

const seedDisciplinas: Disciplina[] = [
  { id: "di1", codigo: "MAT101", nome: "Matemática Discreta", cursoId: "c1", ementa: "Lógica, conjuntos, grafos", especialidade: "Matemática", cargaHoraria: 80 },
  { id: "di2", codigo: "PRG101", nome: "Programação I", cursoId: "c1", ementa: "Algoritmos e estruturas", especialidade: "Programação", cargaHoraria: 80 },
  { id: "di3", codigo: "BD101", nome: "Banco de Dados", cursoId: "c1", ementa: "Modelagem e SQL", especialidade: "Banco de Dados", cargaHoraria: 60 },
  { id: "di4", codigo: "RED101", nome: "Redes de Computadores", cursoId: "c2", ementa: "Protocolos e topologias", especialidade: "Redes", cargaHoraria: 60 },
];

const seedPeriodos: Periodo[] = [
  { id: "p1", nome: "2026.1", inicio: "2026-02-10", fim: "2026-07-05", inicioMatricula: "2026-01-20", fimMatricula: "2026-02-15", ativo: true },
  { id: "p2", nome: "2025.2", inicio: "2025-08-05", fim: "2025-12-20", inicioMatricula: "2025-07-15", fimMatricula: "2025-08-10", ativo: false },
];

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      currentUserId: null,
      users: seedUsers,
      docentes: seedDocentes,
      ambientes: seedAmbientes,
      cursos: seedCursos,
      disciplinas: seedDisciplinas,
      periodos: seedPeriodos,
      alocacoes: [],
      logs: [],

      login: (email, senha) => {
        const u = get().users.find((x) => x.email === email && x.senha === senha);
        if (u) {
          set({ currentUserId: u.id });
          get().addLog("login", `Usuário ${u.nome} acessou o sistema`);
          return u;
        }
        return null;
      },
      logout: () => set({ currentUserId: null }),

      addLog: (acao, detalhe) => {
        const uId = get().currentUserId;
        const user = get().users.find((u) => u.id === uId);
        set((s) => ({
          logs: [
            { id: uid(), userId: uId ?? "anon", userName: user?.nome ?? "Sistema", acao, detalhe, timestamp: new Date().toISOString() },
            ...s.logs,
          ].slice(0, 500),
        }));
      },

      addDocente: (d) => { set((s) => ({ docentes: [...s.docentes, { ...d, id: uid() }] })); get().addLog("docente.criar", d.nome); },
      updateDocente: (id, d) => { set((s) => ({ docentes: s.docentes.map((x) => (x.id === id ? { ...x, ...d } : x)) })); get().addLog("docente.editar", id); },
      removeDocente: (id) => { set((s) => ({ docentes: s.docentes.filter((x) => x.id !== id) })); get().addLog("docente.remover", id); },

      addAmbiente: (a) => { set((s) => ({ ambientes: [...s.ambientes, { ...a, id: uid() }] })); get().addLog("ambiente.criar", a.codigo); },
      updateAmbiente: (id, a) => { set((s) => ({ ambientes: s.ambientes.map((x) => (x.id === id ? { ...x, ...a } : x)) })); get().addLog("ambiente.editar", id); },
      removeAmbiente: (id) => { set((s) => ({ ambientes: s.ambientes.filter((x) => x.id !== id) })); get().addLog("ambiente.remover", id); },

      addCurso: (c) => { set((s) => ({ cursos: [...s.cursos, { ...c, id: uid() }] })); get().addLog("curso.criar", c.nome); },
      updateCurso: (id, c) => { set((s) => ({ cursos: s.cursos.map((x) => (x.id === id ? { ...x, ...c } : x)) })); get().addLog("curso.editar", id); },
      removeCurso: (id) => { set((s) => ({ cursos: s.cursos.filter((x) => x.id !== id) })); get().addLog("curso.remover", id); },

      addDisciplina: (d) => { set((s) => ({ disciplinas: [...s.disciplinas, { ...d, id: uid() }] })); get().addLog("disciplina.criar", d.nome); },
      updateDisciplina: (id, d) => { set((s) => ({ disciplinas: s.disciplinas.map((x) => (x.id === id ? { ...x, ...d } : x)) })); get().addLog("disciplina.editar", id); },
      removeDisciplina: (id) => { set((s) => ({ disciplinas: s.disciplinas.filter((x) => x.id !== id) })); get().addLog("disciplina.remover", id); },

      addPeriodo: (p) => { set((s) => ({ periodos: [...s.periodos, { ...p, id: uid() }] })); get().addLog("periodo.criar", p.nome); },
      updatePeriodo: (id, p) => { set((s) => ({ periodos: s.periodos.map((x) => (x.id === id ? { ...x, ...p } : x)) })); get().addLog("periodo.editar", id); },
      removePeriodo: (id) => { set((s) => ({ periodos: s.periodos.filter((x) => x.id !== id) })); get().addLog("periodo.remover", id); },

      addUser: (u) => { set((s) => ({ users: [...s.users, { ...u, id: uid() }] })); get().addLog("usuario.criar", u.nome); },
      updateUser: (id, u) => { set((s) => ({ users: s.users.map((x) => (x.id === id ? { ...x, ...u } : x)) })); get().addLog("usuario.editar", id); },
      removeUser: (id) => { set((s) => ({ users: s.users.filter((x) => x.id !== id) })); get().addLog("usuario.remover", id); },

      setAlocacao: (a) => {
        const id = a.id ?? uid();
        // detect conflict: same docente OR mesmo ambiente OR mesmo curso no mesmo dia/horario/periodo
        const conflict = get().alocacoes.find(
          (x) =>
            x.id !== id &&
            x.periodoId === a.periodoId &&
            x.dia === a.dia &&
            x.horario === a.horario &&
            (x.docenteId === a.docenteId || x.ambienteId === a.ambienteId || x.cursoId === a.cursoId),
        );
        set((s) => {
          const exists = s.alocacoes.some((x) => x.id === id);
          const next = { ...a, id } as Alocacao;
          return {
            alocacoes: exists ? s.alocacoes.map((x) => (x.id === id ? next : x)) : [...s.alocacoes, next],
          };
        });
        get().addLog("alocacao.salvar", `${a.dia}/${a.horario}`);
        return conflict ? conflict.id : null;
      },
      removeAlocacao: (id) => { set((s) => ({ alocacoes: s.alocacoes.filter((x) => x.id !== id) })); get().addLog("alocacao.remover", id); },
    }),
    { name: "hifcg-store" },
  ),
);

export const useCurrentUser = () => {
  const id = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  return users.find((u) => u.id === id) ?? null;
};

export const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
export const HORARIOS = [
  "07:00-08:40",
  "08:50-10:30",
  "10:40-12:20",
  "13:30-15:10",
  "15:20-17:00",
  "19:00-20:40",
  "20:50-22:30",
];

export const roleLabel = (r: Role) =>
  r === "diretor" ? "Diretor do Campus" : r === "coord_area" ? "Coordenador de Área" : "Coordenador de Curso";