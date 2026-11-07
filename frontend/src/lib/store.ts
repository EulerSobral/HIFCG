import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  loginApi,
  updateDiretorCredenciaisApi,
  fetchDocentesApi,
  addDocenteApi,
  removeDocenteApi,
  fetchAmbientesApi,
  addAmbienteApi,
  removeAmbienteApi,
  fetchCursosApi,
  addCursoApi,
  removeCursoApi,
  fetchDisciplinasApi,
  addDisciplinaApi,
  updateDisciplinaApi,
  removeDisciplinaApi,
  fetchPeriodosApi,
  addPeriodoApi,
  removePeriodoApi,
  fetchCoordenadoresApi,
  addCoordenadorApi,
  removeCoordenadorApi,
  fetchAlocacoesApi,
  addAlocacaoApi,
  removeAlocacaoApi,
  fetchLogsApi,
  addLogApi,
} from "./api";

export type Role = "diretor" | "coord_area" | "coord_curso";

export const CICLO_CREDENCIAIS_DIRETOR_DIAS = 7;

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
  /** Data ISO da última alteração de senha/credenciais (usada no ciclo de 7 dias do Diretor). */
  ultimaAlteracaoCredenciais?: string;
}

export interface StatusCredenciaisDiretor {
  isDiretor: boolean;
  diasDecorridos: number;
  diasRestantes: number;
  emPeriodoDeAviso: boolean;
  expirado: boolean;
  ultimaAlteracao: Date;
  proximaRenovacao: Date;
}

export function getStatusCredenciaisDiretor(user: User | null | undefined): StatusCredenciaisDiretor {
  const agora = new Date();
  if (!user || user.role !== "diretor") {
    return {
      isDiretor: false,
      diasDecorridos: 0,
      diasRestantes: CICLO_CREDENCIAIS_DIRETOR_DIAS,
      emPeriodoDeAviso: false,
      expirado: false,
      ultimaAlteracao: agora,
      proximaRenovacao: new Date(agora.getTime() + CICLO_CREDENCIAIS_DIRETOR_DIAS * 86400000),
    };
  }

  const ultimaAlteracao = user.ultimaAlteracaoCredenciais
    ? new Date(user.ultimaAlteracaoCredenciais)
    : new Date(agora.getTime() - 4 * 86400000); // Caso sem registro inicial, entra na janela de aviso (faltando 3 dias)
  const diffMs = Math.max(0, agora.getTime() - ultimaAlteracao.getTime());
  const diasDecorridos = Math.floor(diffMs / 86400000);
  const diasRestantes = Math.max(0, CICLO_CREDENCIAIS_DIRETOR_DIAS - diasDecorridos);
  const expirado = diasDecorridos >= CICLO_CREDENCIAIS_DIRETOR_DIAS;
  // Solicita/avisa durante a semana (especialmente nos últimos 3 dias ou se já expirou)
  const emPeriodoDeAviso = !expirado && diasRestantes <= 3;
  const proximaRenovacao = new Date(ultimaAlteracao.getTime() + CICLO_CREDENCIAIS_DIRETOR_DIAS * 86400000);

  return {
    isDiretor: true,
    diasDecorridos,
    diasRestantes,
    emPeriodoDeAviso,
    expirado,
    ultimaAlteracao,
    proximaRenovacao,
  };
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
  aulasSemanais: number;
  cargaHoraria: number;
  /** Docente (professor) vinculado à disciplina antes da alocação de horário */
  docenteId?: string;
}

const STOP_WORDS_DISCIPLINA = new Set([
  "DE", "DA", "DO", "DAS", "DOS", "E", "EM", "PARA", "COM", "A", "O", "AS", "OS", "AO", "NA", "NO",
  "I", "II", "III", "IV", "V", "VI",
]);

export function isCodigoDisciplinaDuplicado(
  codigo: string,
  disciplinasExistentes: Disciplina[],
  ignoreId?: string,
): boolean {
  const limpo = (codigo || "").trim().toUpperCase();
  if (!limpo) return false;
  return disciplinasExistentes.some(
    (d) => d.id !== ignoreId && d.codigo.trim().toUpperCase() === limpo,
  );
}

export function gerarCodigoDisciplina(
  nome: string,
  cursoCodigoOuId: string,
  periodo: number,
  disciplinasExistentes: Disciplina[],
  ignoreId?: string,
): string {
  const base = (nome || "").trim() || (cursoCodigoOuId || "DIS");
  const semAcento = base
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z\s]/g, " ")
    .trim();

  const palavras = semAcento
    .split(/\s+/)
    .filter((p) => p.length > 0 && !STOP_WORDS_DISCIPLINA.has(p));

  let letras = palavras.join("");
  if (letras.length < 3) {
    const fallbackCurso = (cursoCodigoOuId || "DIS")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase()
      .replace(/[^A-Z]/g, "");
    letras = (letras + fallbackCurso + "DIS").slice(0, 3);
  }
  const prefixo = letras.slice(0, 3);
  const per = Number.isFinite(periodo) && periodo > 0 ? Math.min(16, Math.floor(periodo)) : 1;

  let seq = 1;
  while (seq < 1000) {
    const candidato = `${prefixo}${per}${String(seq).padStart(2, "0")}`;
    if (!isCodigoDisciplinaDuplicado(candidato, disciplinasExistentes, ignoreId)) {
      return candidato;
    }
    seq++;
  }
  return `${prefixo}${per}${Math.floor(100 + Math.random() * 900)}`;
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
  /** Nome/código do período letivo (ex.: "2026.1", "2025.2") ao qual pertence esta alocação */
  periodoLetivo: string;
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
  syncFromBackend: () => Promise<void>;

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

  addDisciplina: (d: Omit<Disciplina, "id" | "codigo"> & { codigo?: string }) => { ok: boolean; codigo: string; error?: string };
  updateDisciplina: (id: string, d: Partial<Disciplina>) => { ok: boolean; error?: string };
  removeDisciplina: (id: string) => void;

  addPeriodo: (p: Omit<Periodo, "id">) => void;
  updatePeriodo: (id: string, p: Partial<Periodo>) => void;
  ativarPeriodo: (id: string) => void;
  removePeriodo: (id: string) => void;

  addUser: (u: Omit<User, "id" | "salt" | "senhaHash"> & { senha: string }) => Promise<void>;
  updateUser: (id: string, u: Partial<Omit<User, "salt" | "senhaHash">>) => void;
  setUserPassword: (id: string, senha: string) => Promise<void>;
  renovarCredenciaisDiretor: (params: {
    nome?: string;
    email?: string;
    novaSenha: string;
    senhaAtual?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  removeUser: (id: string) => void;

  setAlocacao: (a: Omit<Alocacao, "id" | "periodoLetivo"> & { id?: string; periodoLetivo?: string }) => string | null;
  removeAlocacao: (id: string) => void;
}

const uid = () => Math.random().toString(36).slice(2, 10);

const randomSalt = () => {
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
};

/** Hash de senha (SHA-256 sobre `salt:senha`) via Web Crypto com fallback seguro para contextos HTTP locais. */
export const hashSenha = async (salt: string, senha: string) => {
  const input = `${salt}:${senha}`;
  if (typeof crypto !== "undefined" && crypto.subtle && typeof crypto.subtle.digest === "function") {
    try {
      const data = new TextEncoder().encode(input);
      const digest = await crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
    } catch {
      // Fallback caso Web Crypto falhe
    }
  }
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0, ch; i < input.length; i++) {
    ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
};

/** Comparação em tempo constante para evitar vazamento por timing. */
const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
};

const DIA_CODES = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB"];

const toBackendHorario = (horario: string): { inicio: string; fim: string } => {
  const [ini = "08:00", fim = "09:40"] = horario.split("-");
  const fmt = (t: string) => (t.trim().length === 5 ? `${t.trim()}:00` : t.trim());
  return { inicio: fmt(ini), fim: fmt(fim) };
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
  { id: "di1", codigo: "MAT101", nome: "Matemática Discreta", cursoId: "c1", periodo: 1, aulasSemanais: 4, cargaHoraria: 80, docenteId: "d1" },
  { id: "di2", codigo: "PRG101", nome: "Programação I", cursoId: "c1", periodo: 1, aulasSemanais: 4, cargaHoraria: 80, docenteId: "d2" },
  { id: "di3", codigo: "BD101", nome: "Banco de Dados", cursoId: "c1", periodo: 2, aulasSemanais: 3, cargaHoraria: 60, docenteId: "d3" },
  { id: "di4", codigo: "RED101", nome: "Redes de Computadores", cursoId: "c2", periodo: 1, aulasSemanais: 3, cargaHoraria: 60, docenteId: "d2" },
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
        // Tenta autenticação no backend Spring Boot / PostgreSQL primeiro
        const backendUser = await loginApi(email, senha);
        if (backendUser) {
          let userInStore = get().users.find(
            (x) =>
              x.email.toLowerCase() === email.trim().toLowerCase() ||
              (backendUser.role === "diretor" && x.role === "diretor"),
          );
          const backendTs =
            typeof backendUser.ultimaAlteracaoCredenciais === "string"
              ? new Date(backendUser.ultimaAlteracaoCredenciais).getTime()
              : NaN;
          const localTs = userInStore?.ultimaAlteracaoCredenciais
            ? new Date(userInStore.ultimaAlteracaoCredenciais).getTime()
            : NaN;

          // Preserva o timestamp mais recente para evitar que defasagem de relógio do container re-expire a senha recém-trocada
          let ultimaAlt = userInStore?.ultimaAlteracaoCredenciais;
          if (!Number.isNaN(backendTs) && (Number.isNaN(localTs) || backendTs > localTs)) {
            ultimaAlt = backendUser.ultimaAlteracaoCredenciais;
          }
          if (!ultimaAlt) {
            ultimaAlt = new Date().toISOString();
          }

          const salt = randomSalt();
          const senhaHash = await hashSenha(salt, senha);

          if (!userInStore) {
            const matchedCurso = get().cursos.find((c) => c.codigo === backendUser.cursoId || c.id === backendUser.cursoId);
            userInStore = {
              id: backendUser.id || uid(),
              nome: backendUser.nome,
              email: backendUser.email,
              salt,
              senhaHash,
              role: backendUser.role as Role,
              area: backendUser.area,
              cursoId: matchedCurso ? matchedCurso.id : backendUser.cursoId,
              ultimaAlteracaoCredenciais: ultimaAlt,
            };
            set((s) => ({ users: [...s.users, userInStore!] }));
          } else {
            const updatedUser: User = {
              ...userInStore,
              nome: backendUser.nome || userInStore.nome,
              email: backendUser.email || userInStore.email,
              salt,
              senhaHash,
              ultimaAlteracaoCredenciais: ultimaAlt,
            };
            userInStore = updatedUser;
            set((s) => ({ users: s.users.map((x) => (x.id === updatedUser.id ? updatedUser : x)) }));
          }
          set({ currentUserId: userInStore.id });
          get().addLog("login", `Usuário ${userInStore.nome} acessou o sistema via PostgreSQL`);
          void get().syncFromBackend();
          return userInStore;
        }

        // Fallback local
        const u = get().users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
        if (!u) return null;
        const hash = await hashSenha(u.salt, senha);
        if (!safeEqual(hash, u.senhaHash)) return null;
        if (!u.ultimaAlteracaoCredenciais) {
          const initializedIso = new Date().toISOString();
          set((s) => ({
            currentUserId: u.id,
            users: s.users.map((x) => (x.id === u.id ? { ...x, ultimaAlteracaoCredenciais: initializedIso } : x)),
          }));
        } else {
          set({ currentUserId: u.id });
        }
        get().addLog("login", `Usuário ${u.nome} acessou o sistema`);
        return get().users.find((x) => x.id === u.id) ?? u;
      },
      logout: () => set({ currentUserId: null }),

      syncFromBackend: async () => {
        try {
          const [dbCursos, dbDocentes, dbAmbientes, dbDisciplinas, dbPeriodos, dbAlocacoes, dbLogs] =
            await Promise.all([
              fetchCursosApi(),
              fetchDocentesApi(),
              fetchAmbientesApi(),
              fetchDisciplinasApi(),
              fetchPeriodosApi(),
              fetchAlocacoesApi(),
              fetchLogsApi(),
            ]);

          const current = get();

          const normTurno = (t?: string): Curso["turno"] => {
            const u = (t || "").toUpperCase();
            if (u.includes("INTEGRAL")) return "Integral";
            if (u.includes("MATUTINO")) return "Matutino";
            if (u.includes("VESPERTINO")) return "Vespertino";
            return "Noturno";
          };

          const normNivel = (n?: string): Curso["nivel"] => {
            const u = (n || "").toUpperCase();
            if (u.includes("INTEGRADO")) return "Técnico Integrado";
            if (u.includes("SUBSEQUENTE")) return "Técnico Subsequente";
            if (u.includes("POS") || u.includes("PÓS")) return "Pós-Graduação";
            return "Superior";
          };

          const normTipoAmb = (t?: string): Ambiente["tipo"] => {
            const u = (t || "").toUpperCase();
            if (u.includes("LAB")) return "Laboratório";
            if (u.includes("AUD")) return "Auditório";
            if (u.includes("QUADRA")) return "Quadra";
            if (u.includes("SALA")) return "Sala";
            return "Outros";
          };

          const nextCursos: Curso[] = Array.isArray(dbCursos) && dbCursos.length > 0
            ? dbCursos.map((c: any) => {
                const ex = current.cursos.find((x) => x.codigo === c.codigo);
                return {
                  id: ex?.id || c.codigo || String(c.id),
                  codigo: c.codigo,
                  nome: c.nome,
                  turno: ex?.turno || normTurno(c.turno),
                  nivel: ex?.nivel || normNivel(c.nivel),
                  area: c.departamento || ex?.area || "Informática",
                  periodos: Number(c.periodos) || ex?.periodos || 6,
                };
              })
            : current.cursos;

          const nextDocentes: Docente[] = Array.isArray(dbDocentes) && dbDocentes.length > 0
            ? dbDocentes.map((d: any) => {
                const ex = current.docentes.find((x) => x.matricula === d.matricula);
                return {
                  id: ex?.id || d.matricula || String(d.id),
                  nome: d.nome,
                  email: d.email,
                  matricula: d.matricula,
                  area: d.departamento || ex?.area || "Informática",
                };
              })
            : current.docentes;

          const nextAmbientes: Ambiente[] = Array.isArray(dbAmbientes) && dbAmbientes.length > 0
            ? dbAmbientes.map((a: any) => {
                const ex = current.ambientes.find((x) => x.codigo === a.codigo);
                return {
                  id: ex?.id || a.codigo || String(a.id),
                  codigo: a.codigo,
                  tipo: ex?.tipo || normTipoAmb(a.tipo),
                  descricao: a.descricao ?? ex?.descricao ?? "",
                  recursos: ex?.recursos || ["Projetor", "Ar-condicionado"],
                  capacidade: Number(a.capacidade) || ex?.capacidade || 30,
                  bloco: ex?.bloco || "A",
                };
              })
            : current.ambientes;

          const nextDisciplinas: Disciplina[] = Array.isArray(dbDisciplinas) && dbDisciplinas.length > 0
            ? dbDisciplinas.map((d: any) => {
                const ex = current.disciplinas.find((x) => x.codigo === d.codigo);
                const matchedCurso = nextCursos.find((c) => c.codigo === d.curso || c.id === d.curso);
                const matchedDocente = d.docente
                  ? nextDocentes.find((doc) => doc.matricula === d.docente || doc.id === d.docente)
                  : undefined;
                const ch = Number(d.cargaHoraria) || ex?.cargaHoraria || 60;
                const aulasSem = Number(d.aulasSemanais) || ex?.aulasSemanais || Math.max(1, Math.round(ch / 20));
                return {
                  id: ex?.id || d.codigo || String(d.id),
                  codigo: d.codigo,
                  nome: d.nome,
                  cursoId: matchedCurso?.id || ex?.cursoId || nextCursos[0]?.id || "c1",
                  periodo: Number(d.periodo) || ex?.periodo || 1,
                  aulasSemanais: aulasSem,
                  cargaHoraria: ch,
                  docenteId: matchedDocente?.id ?? ex?.docenteId,
                };
              })
            : current.disciplinas;

          const rawNextPeriodos: Periodo[] = Array.isArray(dbPeriodos) && dbPeriodos.length > 0
            ? dbPeriodos.map((p: any) => {
                const ex = current.periodos.find((x) => x.nome === p.nome || x.id === p.codigo);
                return {
                  id: ex?.id || p.codigo || p.nome || String(p.id),
                  nome: p.nome,
                  inicio: p.inicio,
                  fim: p.fim,
                  inicioMatricula: p.inicioMatricula,
                  fimMatricula: p.fimMatricula,
                  ativo: Boolean(p.ativo),
                };
              })
            : current.periodos;

          // Garante que apenas um período letivo fique ativo por vez
          let jaTemAtivo = false;
          const nextPeriodos: Periodo[] = rawNextPeriodos.map((p) => {
            if (p.ativo && !jaTemAtivo) {
              jaTemAtivo = true;
              return p;
            }
            return { ...p, ativo: false };
          });
          if (!jaTemAtivo && nextPeriodos.length > 0) {
            nextPeriodos[0] = { ...nextPeriodos[0], ativo: true };
          }

          const periodoAtivoNome = nextPeriodos.find((p) => p.ativo)?.nome || "2026.1";

          const nextAlocacoes: Alocacao[] = Array.isArray(dbAlocacoes)
            ? dbAlocacoes.map((a: any) => {
                const disc = nextDisciplinas.find((d) => d.codigo === a.disciplina || d.id === a.disciplina);
                const doc = nextDocentes.find((d) => d.matricula === a.docente || d.id === a.docente);
                const amb = nextAmbientes.find((am) => am.codigo === a.ambiente || am.id === a.ambiente);
                const cur = nextCursos.find((c) => c.codigo === a.turma || c.id === a.turma);
                const diaIdx = DIA_CODES.indexOf(String(a.dia_semana || "SEG").toUpperCase());
                const hIni = String(a.horario_inicio || "08:00").slice(0, 5);
                const hFim = String(a.horario_fim || "09:40").slice(0, 5);
                const perLetivo = String(a.periodo_letivo || a.periodoLetivo || periodoAtivoNome);
                return {
                  id: String(a.id),
                  disciplinaId: disc?.id || a.disciplina,
                  docenteId: doc?.id || disc?.docenteId || a.docente,
                  ambienteId: amb?.id || a.ambiente,
                  cursoId: cur?.id || a.turma,
                  periodoCurso: Number(a.periodo) || 1,
                  periodoLetivo: perLetivo,
                  dia: diaIdx >= 0 ? diaIdx : 0,
                  horario: `${hIni}-${hFim}`,
                };
              })
            : current.alocacoes;

          const nextLogs: LogEntry[] = Array.isArray(dbLogs) && dbLogs.length > 0
            ? dbLogs.map((l: any) => {
                const u = current.users.find((x) => x.id === l.usuarioMatricula);
                return {
                  id: String(l.id),
                  userId: l.usuarioMatricula || "sistema",
                  userName: u?.nome || l.usuarioMatricula || "Sistema",
                  acao: l.acao || "evento",
                  detalhe: l.detalhes || "",
                  timestamp: l.dataHora || new Date().toISOString(),
                };
              })
            : current.logs;

          set({
            cursos: nextCursos,
            docentes: nextDocentes,
            ambientes: nextAmbientes,
            disciplinas: nextDisciplinas,
            periodos: nextPeriodos,
            alocacoes: nextAlocacoes,
            logs: nextLogs,
          });
        } catch (err) {
          console.warn("Falha ao sincronizar com o backend:", err);
        }
      },

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
        const existentes = get().disciplinas;
        const cursoCodigo = get().cursos.find((c) => c.id === d.cursoId)?.codigo || d.cursoId;
        const codigoInformado = (d.codigo || "").trim().toUpperCase();

        if (codigoInformado && isCodigoDisciplinaDuplicado(codigoInformado, existentes)) {
          return {
            ok: false,
            codigo: codigoInformado,
            error: `Já existe uma disciplina cadastrada com o código ${codigoInformado}.`,
          };
        }

        const codigoFinal =
          codigoInformado || gerarCodigoDisciplina(d.nome, cursoCodigo, d.periodo, existentes);
        const aulasSemanais = Math.max(1, Number(d.aulasSemanais) || Math.round((Number(d.cargaHoraria) || 60) / 20));
        const cargaHoraria = Number(d.cargaHoraria) || aulasSemanais * 20;

        const id = uid();
        const nova: Disciplina = {
          ...d,
          id,
          codigo: codigoFinal,
          aulasSemanais,
          cargaHoraria,
        };

        set((s) => ({ disciplinas: [...s.disciplinas, nova] }));
        const docMatricula = nova.docenteId
          ? get().docentes.find((doc) => doc.id === nova.docenteId)?.matricula || nova.docenteId
          : undefined;
        addDisciplinaApi({
          codigo: codigoFinal,
          nome: nova.nome,
          cargaHoraria: nova.cargaHoraria,
          aulasSemanais: nova.aulasSemanais,
          periodo: nova.periodo,
          docente: docMatricula,
          curso: cursoCodigo,
        });
        get().addLog("disciplina.criar", `${nova.codigo} - ${nova.nome} (${nova.aulasSemanais} aulas/sem)`);
        return { ok: true, codigo: codigoFinal };
      },
      updateDisciplina: (id, d) => {
        const existentes = get().disciplinas;
        const atual = existentes.find((x) => x.id === id);
        if (!atual) {
          return { ok: false, error: "Disciplina não encontrada." };
        }

        const novoCodigo = d.codigo !== undefined ? d.codigo.trim().toUpperCase() : atual.codigo;
        if (novoCodigo && isCodigoDisciplinaDuplicado(novoCodigo, existentes, id)) {
          return {
            ok: false,
            error: `Já existe outra disciplina cadastrada com o código ${novoCodigo}.`,
          };
        }

        const cursoIdFinal = d.cursoId ?? atual.cursoId;
        const cursoCodigo = get().cursos.find((c) => c.id === cursoIdFinal)?.codigo || cursoIdFinal;
        const periodoFinal = d.periodo ?? atual.periodo;
        const nomeFinal = d.nome ?? atual.nome;
        const codigoFinal =
          novoCodigo || gerarCodigoDisciplina(nomeFinal, cursoCodigo, periodoFinal, existentes, id);

        set((s) => ({
          disciplinas: s.disciplinas.map((x) =>
            x.id === id ? { ...x, ...d, codigo: codigoFinal } : x,
          ),
          // Se o professor vinculado à disciplina foi definido/alterado, sincroniza as alocações dessa disciplina
          alocacoes:
            d.docenteId
              ? s.alocacoes.map((aloc) =>
                  aloc.disciplinaId === id ? { ...aloc, docenteId: d.docenteId! } : aloc,
                )
              : s.alocacoes,
        }));
        const target = get().disciplinas.find((x) => x.id === id);
        if (target) {
          const docMatricula = target.docenteId
            ? get().docentes.find((doc) => doc.id === target.docenteId)?.matricula || target.docenteId
            : undefined;
          updateDisciplinaApi(target.codigo, {
            codigo: target.codigo,
            nome: target.nome,
            cargaHoraria: target.cargaHoraria,
            aulasSemanais: target.aulasSemanais,
            periodo: target.periodo,
            docente: docMatricula,
            curso: cursoCodigo,
          });
        }
        get().addLog("disciplina.editar", `${codigoFinal} (${id})`);
        return { ok: true };
      },
      removeDisciplina: (id) => {
        const target = get().disciplinas.find((x) => x.id === id);
        if (target) removeDisciplinaApi(target.codigo);
        set((s) => ({ disciplinas: s.disciplinas.filter((x) => x.id !== id) }));
        get().addLog("disciplina.remover", id);
      },

      addPeriodo: (p) => {
        const id = uid();
        const deveAtivar = Boolean(p.ativo) || get().periodos.length === 0;
        set((s) => {
          const anteriores = deveAtivar
            ? s.periodos.map((x) => ({ ...x, ativo: false }))
            : s.periodos;
          return { periodos: [...anteriores, { ...p, ativo: deveAtivar, id }] };
        });
        if (deveAtivar) {
          get()
            .periodos.filter((x) => x.id !== id)
            .forEach((other) => {
              addPeriodoApi({
                codigo: other.nome,
                nome: other.nome,
                inicio: other.inicio,
                fim: other.fim,
                inicioMatricula: other.inicioMatricula,
                fimMatricula: other.fimMatricula,
                ativo: false,
              });
            });
        }
        addPeriodoApi({
          codigo: p.nome,
          nome: p.nome,
          inicio: p.inicio,
          fim: p.fim,
          inicioMatricula: p.inicioMatricula,
          fimMatricula: p.fimMatricula,
          ativo: deveAtivar,
        });
        get().addLog("periodo.criar", `${p.nome} (${deveAtivar ? "Ativo" : "Arquivado"})`);
      },
      updatePeriodo: (id, p) => {
        set((s) => {
          const ativandoEste = p.ativo === true;
          let lista = s.periodos.map((x) => {
            if (x.id === id) return { ...x, ...p };
            if (ativandoEste) return { ...x, ativo: false };
            return x;
          });
          // Se desmarcou o único período ativo e existem outros, mantém pelo menos 1 ativo para consistência
          if (!lista.some((x) => x.ativo) && lista.length > 0) {
            const fallback = lista.find((x) => x.id !== id) ?? lista[0];
            lista = lista.map((x) => (x.id === fallback.id ? { ...x, ativo: true } : x));
          }
          return { periodos: lista };
        });
        get().periodos.forEach((item) => {
          addPeriodoApi({
            codigo: item.nome,
            nome: item.nome,
            inicio: item.inicio,
            fim: item.fim,
            inicioMatricula: item.inicioMatricula,
            fimMatricula: item.fimMatricula,
            ativo: item.ativo,
          });
        });
        get().addLog("periodo.editar", id);
      },
      ativarPeriodo: (id) => {
        set((s) => ({
          periodos: s.periodos.map((x) => ({ ...x, ativo: x.id === id })),
        }));
        get().periodos.forEach((item) => {
          addPeriodoApi({
            codigo: item.nome,
            nome: item.nome,
            inicio: item.inicio,
            fim: item.fim,
            inicioMatricula: item.inicioMatricula,
            fimMatricula: item.fimMatricula,
            ativo: item.ativo,
          });
        });
        const target = get().periodos.find((x) => x.id === id);
        if (target) {
          get().addLog("periodo.ativar", `Período letivo ativo alterado para ${target.nome}`);
        }
      },
      removePeriodo: (id) => {
        const target = get().periodos.find((x) => x.id === id);
        if (target) removePeriodoApi(target.nome);
        set((s) => ({ periodos: s.periodos.filter((x) => x.id !== id) }));
        get().addLog("periodo.remover", id);
      },

      addUser: async ({ senha, ...u }) => {
        const id = uid();
        const salt = randomSalt();
        const senhaHash = await hashSenha(salt, senha);
        set((s) => ({ users: [...s.users, { ...u, id, salt, senhaHash }] }));
        const cursoCodigo = u.cursoId ? get().cursos.find((c) => c.id === u.cursoId)?.codigo || u.cursoId : undefined;
        addCoordenadorApi({ matricula: id, nome: u.nome, email: u.email, senha, role: u.role, area: u.area, cursoId: cursoCodigo });
        get().addLog("usuario.criar", u.nome);
      },
      updateUser: (id, u) => {
        set((s) => ({ users: s.users.map((x) => (x.id === id ? { ...x, ...u } : x)) }));
        const target = get().users.find((x) => x.id === id);
        if (target) {
          const cursoCodigo = target.cursoId ? get().cursos.find((c) => c.id === target.cursoId)?.codigo || target.cursoId : undefined;
          addCoordenadorApi({ matricula: target.id, nome: target.nome, email: target.email, role: target.role, area: target.area, cursoId: cursoCodigo });
        }
        get().addLog("usuario.editar", id);
      },
      setUserPassword: async (id, senha) => {
        const salt = randomSalt();
        const senhaHash = await hashSenha(salt, senha);
        const ultimaAlteracaoCredenciais = new Date().toISOString();
        set((s) => ({
          users: s.users.map((x) => (x.id === id ? { ...x, salt, senhaHash, ultimaAlteracaoCredenciais } : x)),
        }));
        const target = get().users.find((x) => x.id === id);
        if (target) {
          const cursoCodigo = target.cursoId ? get().cursos.find((c) => c.id === target.cursoId)?.codigo || target.cursoId : undefined;
          addCoordenadorApi({ matricula: target.id, nome: target.nome, email: target.email, senha, role: target.role, area: target.area, cursoId: cursoCodigo });
        }
        get().addLog("usuario.senha", id);
      },
      renovarCredenciaisDiretor: async ({ nome, email, novaSenha, senhaAtual }) => {
        const currentId = get().currentUserId;
        const diretor = get().users.find((u) => u.id === currentId) || get().users.find((u) => u.role === "diretor");
        if (!diretor) {
          return { ok: false, error: "Usuário Diretor não encontrado." };
        }

        const senhaLimpa = (novaSenha || "").trim();
        if (!senhaLimpa) {
          return { ok: false, error: "A nova senha é obrigatória para renovar o ciclo semanal." };
        }
        if (senhaLimpa.length < 6) {
          return { ok: false, error: "A nova senha deve possuir no mínimo 6 caracteres." };
        }
        if (senhaLimpa === "123456") {
          return { ok: false, error: "Por segurança, a nova senha não pode ser a senha padrão (123456)." };
        }

        const hashNovaComSaltAtual = await hashSenha(diretor.salt, senhaLimpa);
        if (safeEqual(hashNovaComSaltAtual, diretor.senhaHash)) {
          return { ok: false, error: "A nova senha deve ser obrigatoriamente diferente da senha atual." };
        }

        const nomeFinal = nome && nome.trim().length > 0 ? nome.trim() : diretor.nome;
        const emailFinal = email && email.trim().length > 0 ? email.trim() : diretor.email;

        const novoSalt = randomSalt();
        const novoHash = await hashSenha(novoSalt, senhaLimpa);
        // Usa sempre o relógio atual do cliente para garantir que o ciclo de 7 dias reinicie imediatamente na interface
        const agoraIso = new Date().toISOString();

        const mudouDadosCadastrais = nomeFinal !== diretor.nome || emailFinal !== diretor.email;
        set((s) => ({
          currentUserId: diretor.id,
          users: s.users.map((u) =>
            u.id === diretor.id || u.role === "diretor"
              ? {
                  ...u,
                  nome: nomeFinal,
                  email: emailFinal,
                  salt: novoSalt,
                  senhaHash: novoHash,
                  ultimaAlteracaoCredenciais: agoraIso,
                }
              : u,
          ),
        }));

        // Sincroniza de forma resiliente com o backend (endpoint dedicado + fallback de coordenadores)
        const matriculaBackend = diretor.id === "u1" ? "DIR001" : diretor.id;
        void updateDiretorCredenciaisApi({
          matricula: matriculaBackend,
          nome: nomeFinal,
          email: emailFinal,
          emailAtual: diretor.email,
          senhaAtual,
          novaSenha: senhaLimpa,
        });
        void addCoordenadorApi({
          matricula: matriculaBackend,
          nome: nomeFinal,
          email: emailFinal,
          senha: senhaLimpa,
          role: "diretor",
          area: diretor.area || "Campus",
        });

        get().addLog(
          "diretor.credenciais.renovadas",
          mudouDadosCadastrais
            ? `Senha renovada (ciclo de 7 dias) e titular/e-mail atualizado para ${nomeFinal} (${emailFinal})`
            : `Senha renovada obrigatoriamente no ciclo de 7 dias por ${nomeFinal}`,
        );

        return { ok: true };
      },
      removeUser: (id) => {
        const target = get().users.find((x) => x.id === id);
        if (target) removeCoordenadorApi(target.id);
        set((s) => ({ users: s.users.filter((x) => x.id !== id) }));
        get().addLog("usuario.remover", id);
      },

      setAlocacao: (a) => {
        const id = a.id ?? uid();
        const periodoAtivo = get().periodos.find((p) => p.ativo)?.nome || "2026.1";
        const periodoLetivo = a.periodoLetivo || periodoAtivo;
        const discObj = get().disciplinas.find((d) => d.id === a.disciplinaId);
        const docenteIdFinal = a.docenteId || discObj?.docenteId || "";

        const conflict = get().alocacoes.find(
          (x) =>
            x.id !== id &&
            (x.periodoLetivo || "2026.1") === periodoLetivo &&
            x.dia === a.dia &&
            x.horario === a.horario &&
            (x.docenteId === docenteIdFinal ||
              x.ambienteId === a.ambienteId ||
              (x.cursoId === a.cursoId && x.periodoCurso === a.periodoCurso)),
        );
        set((s) => {
          const exists = s.alocacoes.some((x) => x.id === id);
          const next: Alocacao = { ...a, docenteId: docenteIdFinal, periodoLetivo, id };
          return {
            alocacoes: exists ? s.alocacoes.map((x) => (x.id === id ? next : x)) : [...s.alocacoes, next],
          };
        });

        const disc = discObj?.codigo || a.disciplinaId;
        const doc = get().docentes.find((d) => d.id === docenteIdFinal)?.matricula || docenteIdFinal;
        const amb = get().ambientes.find((am) => am.id === a.ambienteId)?.codigo || a.ambienteId;
        const curso = get().cursos.find((c) => c.id === a.cursoId)?.codigo || a.cursoId;
        const { inicio, fim } = toBackendHorario(a.horario);

        addAlocacaoApi({
          disciplina: disc,
          docente: doc,
          ambiente: amb,
          turma: curso,
          periodo: a.periodoCurso,
          periodoLetivo,
          diaSemana: DIA_CODES[a.dia] || "SEG",
          horarioInicio: inicio,
          horarioFim: fim,
        });

        get().addLog("alocacao.salvar", `${periodoLetivo} · ${a.dia}/${a.horario}`);
        return conflict ? conflict.id : null;
      },
      removeAlocacao: (id) => {
        const target = get().alocacoes.find((x) => x.id === id);
        if (target) {
          const disc = get().disciplinas.find((d) => d.id === target.disciplinaId)?.codigo || target.disciplinaId;
          const doc = get().docentes.find((d) => d.id === target.docenteId)?.matricula || target.docenteId;
          const amb = get().ambientes.find((am) => am.id === target.ambienteId)?.codigo || target.ambienteId;
          const curso = get().cursos.find((c) => c.id === target.cursoId)?.codigo || target.cursoId;
          const { inicio, fim } = toBackendHorario(target.horario);

          removeAlocacaoApi({
            disciplina: disc,
            docente: doc,
            ambiente: amb,
            turma: curso,
            periodo: target.periodoCurso,
            periodoLetivo: target.periodoLetivo,
            diaSemana: DIA_CODES[target.dia] || "SEG",
            horarioInicio: inicio,
            horarioFim: fim,
          });
        }
        set((s) => ({ alocacoes: s.alocacoes.filter((x) => x.id !== id) }));
        get().addLog("alocacao.remover", id);
      },
    }),
    {
      name: "hifcg-store-v7",
      version: 9,
      migrate: (persisted) => {
        const s = persisted as Partial<State> | undefined;
        const cursos = (s?.cursos ?? seedCursos).map((c) => ({ ...c, periodos: c.periodos ?? 6 }));

        // Garante que apenas um período fique ativo por vez
        const rawPeriodos = s?.periodos ?? seedPeriodos;
        let hasActive = false;
        const periodos = rawPeriodos.map((p) => {
          if (p.ativo && !hasActive) {
            hasActive = true;
            return p;
          }
          return { ...p, ativo: false };
        });
        if (!hasActive && periodos.length > 0) {
          periodos[0] = { ...periodos[0], ativo: true };
        }
        const defaultPeriodoLetivo = periodos.find((p) => p.ativo)?.nome || "2026.1";

        const rawDisciplinas = s?.disciplinas ?? seedDisciplinas;
        const disciplinasMigradas: Disciplina[] = [];
        for (const d of rawDisciplinas) {
          const ch = Number(d.cargaHoraria) || 60;
          const aulasSemanais = Number((d as any).aulasSemanais) || Math.max(1, Math.round(ch / 20));
          const cursoCodigo = cursos.find((c) => c.id === d.cursoId)?.codigo || "DIS";
          const codigoUnico =
            !d.codigo || isCodigoDisciplinaDuplicado(d.codigo, disciplinasMigradas, d.id)
              ? gerarCodigoDisciplina(d.nome, cursoCodigo, d.periodo || 1, disciplinasMigradas, d.id)
              : d.codigo.trim().toUpperCase();
          const seedMatch = seedDisciplinas.find((sd) => sd.id === d.id || sd.codigo === codigoUnico);
          disciplinasMigradas.push({
            ...d,
            codigo: codigoUnico,
            aulasSemanais,
            cargaHoraria: ch,
            docenteId: (d as any).docenteId ?? seedMatch?.docenteId,
          });
        }

        const alocacoes = (s?.alocacoes ?? []).map((a) => ({
          ...a,
          periodoCurso: (a as any).periodoCurso ?? 1,
          periodoLetivo: (a as any).periodoLetivo || defaultPeriodoLetivo,
        }));

        return {
          ...(s ?? {}),
          cursos,
          periodos,
          disciplinas: disciplinasMigradas,
          alocacoes,
          users: seedUsers,
          currentUserId: null,
        } as State;
      },
    },
  ),
);

export const useCurrentUser = () => {
  const id = useStore((s) => s.currentUserId);
  const users = useStore((s) => s.users);
  return users.find((u) => u.id === id) ?? null;
};

export const useActivePeriodo = () => {
  const periodos = useStore((s) => s.periodos);
  return periodos.find((p) => p.ativo) ?? periodos[0] ?? null;
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
