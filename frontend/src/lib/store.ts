import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  loginApi,
  addDocenteApi,
  removeDocenteApi,
  addAmbienteApi,
  removeAmbienteApi,
  addCursoApi,
  removeCursoApi,
  addDisciplinaApi,
  removeDisciplinaApi,
  addPeriodoApi,
  removePeriodoApi,
  addCoordenadorApi,
  removeCoordenadorApi,
  addLogApi,
} from "./api";

export type Role = "diretor" | "coord_area" | "coord_curso";

export interface User {
  id: string;
  nome: string;
  email: string;
  /** Salt aleatório por usuário (não é segredo). */
  salt: string;
  /** SHA-256 de `salt:senha` — a senha em texto puro nunca é armazenada. */
  senhaHash: string;
  role: Role;
  area?: string;
  cursoId?: string;
}

export interface Docente {
  id: string;
  nome: string;
  email: string;
  matricula: string;
  area: string;
}

export interface Ambiente {
  id: string;
  codigo: string;
  tipo: "Sala" | "Laboratório" | "Auditório" | "Quadra" | "Outros";
  descricao?: string;
  recursos: string[];
  capacidade: number;
  bloco: string;
}

export interface Curso {
  id: string;
  codigo: string;
  nome: string;
  turno: "Integral" | "Matutino" | "Vespertino" | "Noturno";
  nivel: "Técnico Subsequente" | "Técnico Integrado" | "Superior" | "Pós-Graduação";
  area: string;
  periodos: number;
}

export interface Disciplina {
  id: string;
  codigo: string;
  nome: string;
  cursoId: string;
  periodo: number;
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
  periodoCurso: number;
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

  login: (email: string, senha: string) => Promise<User | null>;
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

  addUser: (u: Omit<User, "id" | "salt" | "senhaHash"> & { senha: string }) => Promise<void>;
  updateUser: (id: string, u: Partial<Omit<User, "salt" | "senhaHash">>) => void;
  setUserPassword: (id: string, senha: string) => Promise<void>;
  removeUser: (id: string) => void;

  setAlocacao: (a: Omit<Alocacao, "id"> & { id?: string }) => string | null;
  removeAlocacao: (id: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const randomSalt = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
};

/** Hash de senha (SHA-256 sobre `salt:senha`) via Web Crypto. */
export const hashSenha = async (salt: string, senha: string) => {
  const data = new TextEncoder().encode(`${salt}:${senha}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
};

/** Comparação em tempo constante para evitar vazamento por timing. */
const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

const seedUsers: User[] = [
  { id: "u1", nome: "Dr. Roberto Lima", email: "diretor@ifpb.edu.br", salt: "s1", senhaHash: "2bb2196139a152d838a22cc4e4b8fc3b425ad36bed7e5576821fdbd558f12103", role: "diretor" },
  { id: "u2", nome: "Profa. Ana Souza", email: "area.info@ifpb.edu.br", salt: "s2", senhaHash: "6dfc787627f2d560d2a6bc4c370aeb916577fc0fc006c6b2249207977d5d02ed", role: "coord_area", area: "Informática" },
  { id: "u3", nome: "Prof. Carlos Mendes", email: "curso.tads@ifpb.edu.br", salt: "s3", senhaHash: "e6a247afa5ac35836e098f9f88f67cd0b9ffefcea903be1e1cb31230a280183b", role: "coord_curso", area: "Informática", cursoId: "c1" },
];

const seedDocentes: Docente[] = [
  { id: "d1", nome: "Sicrano Pereira", email: "sicrano@ifpb.edu.br", matricula: "1001", area: "Matemática" },
  { id: "d2", nome: "Beltrano Silva", email: "beltrano@ifpb.edu.br", matricula: "1002", area: "Informática" },
  { id: "d3", nome: "Fulana Costa", email: "fulana@ifpb.edu.br", matricula: "1003", area: "Informática" },
  { id: "d4", nome: "Mariana Rocha", email: "mariana@ifpb.edu.br", matricula: "1004", area: "Indústria" },
];

const seedAmbientes: Ambiente[] = [
  { id: "a1", codigo: "S-101", tipo: "Sala", capacidade: 40, bloco: "A", descricao: "Sala de aula padrão", recursos: ["Projetor", "Ar-condicionado", "Quadro branco"] },
  { id: "a2", codigo: "LAB-01", tipo: "Laboratório", capacidade: 30, bloco: "B", descricao: "Laboratório de informática", recursos: ["Computadores", "Projetor", "Ar-condicionado", "Internet"] },
  { id: "a3", codigo: "AUD-01", tipo: "Auditório", capacidade: 120, bloco: "C", descricao: "Auditório principal", recursos: ["Projetor", "Som", "Microfone", "Ar-condicionado"] },
];

const seedCursos: Curso[] = [
  { id: "c1", codigo: "TADS", nome: "Tec. em Análise e Des. de Sistemas", turno: "Noturno", nivel: "Superior", area: "Informática", periodos: 6 },
  { id: "c2", codigo: "INFO-INT", nome: "Técnico em Informática Integrado", turno: "Integral", nivel: "Técnico Integrado", area: "Informática", periodos: 8 },
  { id: "c3", codigo: "ELET", nome: "Técnico em Eletromecânica", turno: "Matutino", nivel: "Técnico Subsequente", area: "Indústria", periodos: 4 },
];

const seedDisciplinas: Disciplina[] = [
  { id: "di1", codigo: "MAT101", nome: "Matemática Discreta", cursoId: "c1", periodo: 1, cargaHoraria: 80 },
  { id: "di2", codigo: "PRG101", nome: "Programação I", cursoId: "c1", periodo: 1, cargaHoraria: 80 },
  { id: "di3", codigo: "BD101", nome: "Banco de Dados", cursoId: "c1", periodo: 2, cargaHoraria: 60 },
  { id: "di4", codigo: "RED101", nome: "Redes de Computadores", cursoId: "c2", periodo: 1, cargaHoraria: 60 },
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

      login: async (email, senha) => {
        // Tenta autenticação no backend Spring Boot primeiro
        const backendUser = await loginApi(email, senha);
        if (backendUser) {
          let userInStore = get().users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
          if (!userInStore) {
            const salt = randomSalt();
            const senhaHash = await hashSenha(salt, senha);
            userInStore = {
              id: backendUser.id || uid(),
              nome: backendUser.nome,
              email: backendUser.email,
              salt,
              senhaHash,
              role: backendUser.role as Role,
              area: backendUser.area,
              cursoId: backendUser.cursoId,
            };
            set((s) => ({ users: [...s.users, userInStore!] }));
          }
          set({ currentUserId: userInStore.id });
          get().addLog("login", `Usuário ${userInStore.nome} acessou o sistema via backend`);
          return userInStore;
        }

        // Fallback local
        const u = get().users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
        if (!u) return null;
        const hash = await hashSenha(u.salt, senha);
        if (!safeEqual(hash, u.senhaHash)) return null;
        set({ currentUserId: u.id });
        get().addLog("login", `Usuário ${u.nome} acessou o sistema`);
        return u;
      },
      logout: () => set({ currentUserId: null }),

      addLog: (acao, detalhe) => {
        const uId = get().currentUserId;
        const user = get().users.find((u) => u.id === uId);
        addLogApi({ usuarioMatricula: user?.id, acao, detalhes: detalhe });
        set((s) => ({
          logs: [
            { id: uid(), userId: uId ?? "anon", userName: user?.nome ?? "Sistema", acao, detalhe, timestamp: new Date().toISOString() },
            ...s.logs,
          ].slice(0, 500),
        }));
      },

      addDocente: (d) => {
        const id = uid();
        set((s) => ({ docentes: [...s.docentes, { ...d, id }] }));
        addDocenteApi({ matricula: d.matricula, nome: d.nome, email: d.email, departamento: d.area });
        get().addLog("docente.criar", d.nome);
      },
      updateDocente: (id, d) => {
        set((s) => ({ docentes: s.docentes.map((x) => (x.id === id ? { ...x, ...d } : x)) }));
        const target = get().docentes.find((x) => x.id === id);
        if (target) addDocenteApi({ matricula: target.matricula, nome: target.nome, email: target.email, departamento: target.area });
        get().addLog("docente.editar", id);
      },
      removeDocente: (id) => {
        const target = get().docentes.find((x) => x.id === id);
        if (target) removeDocenteApi(target.matricula);
        set((s) => ({ docentes: s.docentes.filter((x) => x.id !== id) }));
        get().addLog("docente.remover", id);
      },

      addAmbiente: (a) => {
        const id = uid();
        set((s) => ({ ambientes: [...s.ambientes, { ...a, id }] }));
        addAmbienteApi({ codigo: a.codigo, nome: a.codigo, descricao: a.descricao || "", capacidade: a.capacidade, tipo: a.tipo });
        get().addLog("ambiente.criar", a.codigo);
      },
      updateAmbiente: (id, a) => {
        set((s) => ({ ambientes: s.ambientes.map((x) => (x.id === id ? { ...x, ...a } : x)) }));
        const target = get().ambientes.find((x) => x.id === id);
        if (target) addAmbienteApi({ codigo: target.codigo, nome: target.codigo, descricao: target.descricao || "", capacidade: target.capacidade, tipo: target.tipo });
        get().addLog("ambiente.editar", id);
      },
      removeAmbiente: (id) => {
        const target = get().ambientes.find((x) => x.id === id);
        if (target) removeAmbienteApi(target.codigo);
        set((s) => ({ ambientes: s.ambientes.filter((x) => x.id !== id) }));
        get().addLog("ambiente.remover", id);
      },

      addCurso: (c) => {
        const id = uid();
        const nextCurso = { ...c, periodos: c.periodos ?? 6, id };
        set((s) => ({ cursos: [...s.cursos, nextCurso] }));
        addCursoApi({ codigo: c.codigo, nome: c.nome, turno: c.turno, nivel: c.nivel, departamento: c.area, periodos: c.periodos });
        get().addLog("curso.criar", c.nome);
      },
      updateCurso: (id, c) => {
        set((s) => ({ cursos: s.cursos.map((x) => (x.id === id ? { ...x, ...c } : x)) }));
        const target = get().cursos.find((x) => x.id === id);
        if (target) addCursoApi({ codigo: target.codigo, nome: target.nome, turno: target.turno, nivel: target.nivel, departamento: target.area, periodos: target.periodos });
        get().addLog("curso.editar", id);
      },
      removeCurso: (id) => {
        const target = get().cursos.find((x) => x.id === id);
        if (target) removeCursoApi(target.codigo);
        set((s) => ({ cursos: s.cursos.filter((x) => x.id !== id) }));
        get().addLog("curso.remover", id);
      },

      addDisciplina: (d) => {
        const id = uid();
        set((s) => ({ disciplinas: [...s.disciplinas, { ...d, id }] }));
        addDisciplinaApi({ codigo: d.codigo, nome: d.nome, cargaHoraria: d.cargaHoraria, curso: d.cursoId });
        get().addLog("disciplina.criar", d.nome);
      },
      updateDisciplina: (id, d) => {
        set((s) => ({ disciplinas: s.disciplinas.map((x) => (x.id === id ? { ...x, ...d } : x)) }));
        const target = get().disciplinas.find((x) => x.id === id);
        if (target) addDisciplinaApi({ codigo: target.codigo, nome: target.nome, cargaHoraria: target.cargaHoraria, curso: target.cursoId });
        get().addLog("disciplina.editar", id);
      },
      removeDisciplina: (id) => {
        const target = get().disciplinas.find((x) => x.id === id);
        if (target) removeDisciplinaApi(target.codigo);
        set((s) => ({ disciplinas: s.disciplinas.filter((x) => x.id !== id) }));
        get().addLog("disciplina.remover", id);
      },

      addPeriodo: (p) => {
        const id = uid();
        set((s) => ({ periodos: [...s.periodos, { ...p, id }] }));
        addPeriodoApi({ codigo: p.nome, nome: p.nome, inicio: p.inicio, fim: p.fim, inicioMatricula: p.inicioMatricula, fimMatricula: p.fimMatricula, ativo: p.ativo });
        get().addLog("periodo.criar", p.nome);
      },
      updatePeriodo: (id, p) => {
        set((s) => ({ periodos: s.periodos.map((x) => (x.id === id ? { ...x, ...p } : x)) }));
        const target = get().periodos.find((x) => x.id === id);
        if (target) addPeriodoApi({ codigo: target.nome, nome: target.nome, inicio: target.inicio, fim: target.fim, inicioMatricula: target.inicioMatricula, fimMatricula: target.fimMatricula, ativo: target.ativo });
        get().addLog("periodo.editar", id);
      },
      removePeriodo: (id) => {
        const target = get().periodos.find((x) => x.id === id);
        if (target) removePeriodoApi(target.nome);
        set((s) => ({ periodos: s.periodos.filter((x) => x.id !== id) }));
        get().addLog("periodo.remover", id);
      },

      addUser: async ({ senha, ...u }) => {
        const salt = randomSalt();
        const senhaHash = await hashSenha(salt, senha);
        set((s) => ({ users: [...s.users, { ...u, id: uid(), salt, senhaHash }] }));
        addCoordenadorApi({ nome: u.nome, email: u.email, senha, role: u.role, area: u.area, cursoId: u.cursoId });
        get().addLog("usuario.criar", u.nome);
      },
      updateUser: (id, u) => {
        set((s) => ({ users: s.users.map((x) => (x.id === id ? { ...x, ...u } : x)) }));
        get().addLog("usuario.editar", id);
      },
      setUserPassword: async (id, senha) => {
        const salt = randomSalt();
        const senhaHash = await hashSenha(salt, senha);
        set((s) => ({ users: s.users.map((x) => (x.id === id ? { ...x, salt, senhaHash } : x)) }));
        get().addLog("usuario.senha", id);
      },
      removeUser: (id) => {
        const target = get().users.find((x) => x.id === id);
        if (target) removeCoordenadorApi(target.id);
        set((s) => ({ users: s.users.filter((x) => x.id !== id) }));
        get().addLog("usuario.remover", id);
      },

      setAlocacao: (a) => {
        const id = a.id ?? uid();
        const conflict = get().alocacoes.find(
          (x) =>
            x.id !== id &&
            x.dia === a.dia &&
            x.horario === a.horario &&
            (x.docenteId === a.docenteId ||
              x.ambienteId === a.ambienteId ||
              (x.cursoId === a.cursoId && x.periodoCurso === a.periodoCurso)),
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
      removeAlocacao: (id) => {
        set((s) => ({ alocacoes: s.alocacoes.filter((x) => x.id !== id) }));
        get().addLog("alocacao.remover", id);
      },
    }),
    {
      name: "hifcg-store-v7",
      version: 7,
      migrate: (persisted) => {
        const s = persisted as Partial<State> | undefined;
        const cursos = (s?.cursos ?? seedCursos).map((c) => ({ ...c, periodos: c.periodos ?? 6 }));
        const alocacoes = (s?.alocacoes ?? []).map((a) => ({ ...a, periodoCurso: (a as any).periodoCurso ?? 1 }));
        return { ...(s ?? {}), cursos, alocacoes, users: seedUsers, currentUserId: null } as State;
      },
    },
  ),
);

export const useCurrentUser = () => {
  const id = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  return users.find((u) => u.id === id) ?? null;
};

export interface HorarioSlot {
  id: string;
  code: string;
  turno: "Manhã" | "Tarde" | "Noite";
  horario: string;
}

export const SLOTS_HORARIOS: HorarioSlot[] = [
  // Manhã (6 linhas de 50min)
  { id: "m1", code: "M1", turno: "Manhã", horario: "07:00-07:50" },
  { id: "m2", code: "M2", turno: "Manhã", horario: "07:50-08:40" },
  { id: "m3", code: "M3", turno: "Manhã", horario: "08:50-09:40" },
  { id: "m4", code: "M4", turno: "Manhã", horario: "09:40-10:30" },
  { id: "m5", code: "M5", turno: "Manhã", horario: "10:40-11:30" },
  { id: "m6", code: "M6", turno: "Manhã", horario: "11:30-12:20" },

  // Tarde (6 linhas de 50min)
  { id: "t1", code: "T1", turno: "Tarde", horario: "13:00-13:50" },
  { id: "t2", code: "T2", turno: "Tarde", horario: "13:50-14:40" },
  { id: "t3", code: "T3", turno: "Tarde", horario: "14:50-15:40" },
  { id: "t4", code: "T4", turno: "Tarde", horario: "15:40-16:30" },
  { id: "t5", code: "T5", turno: "Tarde", horario: "16:40-17:30" },
  { id: "t6", code: "T6", turno: "Tarde", horario: "17:30-18:20" },

  // Noite (4 linhas de 50min)
  { id: "n1", code: "N1", turno: "Noite", horario: "18:50-19:40" },
  { id: "n2", code: "N2", turno: "Noite", horario: "19:40-20:30" },
  { id: "n3", code: "N3", turno: "Noite", horario: "20:40-21:30" },
  { id: "n4", code: "N4", turno: "Noite", horario: "21:30-22:20" },
];

export const DIAS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];
export const HORARIOS = SLOTS_HORARIOS.map((s) => s.horario);

export const getTurnosParaCurso = (turnoCurso?: string): Array<"Manhã" | "Tarde" | "Noite"> => {
  if (!turnoCurso) return ["Manhã", "Tarde", "Noite"];
  if (turnoCurso === "Integral") return ["Manhã", "Tarde"];
  if (turnoCurso === "Matutino") return ["Manhã"];
  if (turnoCurso === "Vespertino") return ["Tarde"];
  if (turnoCurso === "Noturno") return ["Noite"];
  return ["Manhã", "Tarde", "Noite"];
};

export const roleLabel = (r: Role) =>
  r === "diretor" ? "Diretor do Campus" : r === "coord_area" ? "Coordenador de Área" : "Coordenador de Curso";