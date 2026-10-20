-- =============================================================================
-- HIFCG: Schema e Dados Iniciais para PostgreSQL (Produção)
-- Sistema de Gestão de Alocação de Horários do IFPB - Campina Grande
-- =============================================================================

-- 1. Tabela de Coordenadores e Administradores (RF31, RF33, RF38)
CREATE TABLE IF NOT EXISTS coordenador (
    id BIGSERIAL PRIMARY KEY,
    matricula VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo_coordenador VARCHAR(30) NOT NULL, -- 'DIRETOR', 'AREA_DEPARTAMENTO', 'CURSO'
    departamento VARCHAR(100),
    curso_codigo VARCHAR(50)
);

-- 2. Tabela de Docentes (RF1, RF2, RF3, RF5)
CREATE TABLE IF NOT EXISTS docente (
    id BIGSERIAL PRIMARY KEY,
    matricula VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    departamento VARCHAR(100) NOT NULL
);

-- 3. Tabela de Ambientes (RF8, RF9, RF10, RF11)
CREATE TABLE IF NOT EXISTS ambiente (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(10000) NOT NULL,
    capacidade INT NOT NULL,
    tipo VARCHAR(50) NOT NULL -- 'SALA', 'LABORATORIO', 'AUDITORIO', 'QUADRA'
);

-- 4. Tabela de Cursos (RF13, RF14, RF15, RF19)
CREATE TABLE IF NOT EXISTS curso (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    turno VARCHAR(30) NOT NULL, -- 'INTEGRAL', 'MATUTINO', 'VESPERTINO', 'NOTURNO'
    nivel VARCHAR(50) NOT NULL, -- 'TECNICO_INTEGRADO', 'TECNICO_SUBSEQUENTE', 'SUPERIOR', 'POS_GRADUACAO'
    departamento VARCHAR(100) NOT NULL,
    periodos INT DEFAULT 6 NOT NULL
);

-- 5. Tabela de Disciplinas (RF16, RF17, RF18)
CREATE TABLE IF NOT EXISTS disciplina (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    ementa TEXT,
    especialidade VARCHAR(100),
    carga_horaria INT NOT NULL,
    curso_id VARCHAR(50) NOT NULL,
    CONSTRAINT fk_disciplina_curso FOREIGN KEY (curso_id) REFERENCES curso(codigo) ON DELETE CASCADE
);

-- 6. Tabela de Períodos Letivos
CREATE TABLE IF NOT EXISTS periodo (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    inicio VARCHAR(20) NOT NULL,
    fim VARCHAR(20) NOT NULL,
    inicio_matricula VARCHAR(20),
    fim_matricula VARCHAR(20),
    ativo BOOLEAN DEFAULT TRUE
);

-- 7. Tabela de Alocação de Horários (RF24, RF25, RF26, RF27, RF28, RF30)
CREATE TABLE IF NOT EXISTS alocacao_horario (
    id BIGSERIAL PRIMARY KEY,
    disciplina VARCHAR(100) NOT NULL,
    docente VARCHAR(100) NOT NULL,
    ambiente VARCHAR(100) NOT NULL,
    turma VARCHAR(100) NOT NULL,
    periodo INT NOT NULL,
    dia_semana VARCHAR(20) NOT NULL, -- 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL
);

-- 8. Tabela de Log de Alterações e Auditoria (RF34)
CREATE TABLE IF NOT EXISTS log_sistema (
    id BIGSERIAL PRIMARY KEY,
    usuario_matricula VARCHAR(50) NOT NULL,
    acao VARCHAR(255) NOT NULL,
    detalhes TEXT,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =============================================================================
-- INSERÇÃO DOS DADOS DAS TABELAS (SEEDS INICIAIS)
-- =============================================================================

-- Coordenadores e Administradores
INSERT INTO coordenador (matricula, nome, email, senha, tipo_coordenador, departamento, curso_codigo)
VALUES
    ('DIR001', 'Dr. Roberto Lima', 'diretor@ifpb.edu.br', '123456', 'DIRETOR', 'Campus', NULL),
    ('DEP001', 'Profa. Ana Souza', 'area.info@ifpb.edu.br', '123456', 'AREA_DEPARTAMENTO', 'Informática', NULL),
    ('COORD001', 'Prof. Carlos Mendes', 'curso.tads@ifpb.edu.br', '123456', 'CURSO', 'Informática', 'TADS')
ON CONFLICT (matricula) DO NOTHING;

-- Períodos Letivos
INSERT INTO periodo (codigo, nome, inicio, fim, inicio_matricula, fim_matricula, ativo)
VALUES
    ('P1', '2026.1', '2026-02-10', '2026-07-05', '2026-01-20', '2026-02-15', TRUE),
    ('P2', '2025.2', '2025-08-05', '2025-12-20', '2025-07-15', '2025-08-10', FALSE)
ON CONFLICT (codigo) DO NOTHING;

-- Cursos
INSERT INTO curso (codigo, nome, turno, nivel, departamento, periodos)
VALUES
    ('TADS', 'Tec. em Análise e Des. de Sistemas', 'NOTURNO', 'SUPERIOR', 'Informática', 6),
    ('INFO-INT', 'Técnico em Informática Integrado', 'INTEGRAL', 'TECNICO_INTEGRADO', 'Informática', 8),
    ('ELET', 'Técnico em Eletromecânica', 'MATUTINO', 'TECNICO_SUBSEQUENTE', 'Indústria', 4)
ON CONFLICT (codigo) DO NOTHING;

-- Docentes
INSERT INTO docente (matricula, nome, email, departamento)
VALUES
    ('1001', 'Sicrano Pereira', 'sicrano@ifpb.edu.br', 'Matemática'),
    ('1002', 'Beltrano Silva', 'beltrano@ifpb.edu.br', 'Informática'),
    ('1003', 'Fulana Costa', 'fulana@ifpb.edu.br', 'Informática'),
    ('1004', 'Mariana Rocha', 'mariana@ifpb.edu.br', 'Indústria')
ON CONFLICT (matricula) DO NOTHING;

-- Ambientes
INSERT INTO ambiente (codigo, nome, descricao, capacidade, tipo)
VALUES
    ('S-101', 'Sala 101', 'Sala de aula padrão (Bloco A) - Projetor, Ar-condicionado, Quadro branco', 40, 'SALA'),
    ('LAB-01', 'Laboratório 01', 'Laboratório de Informática (Bloco B) - Computadores, Projetor, Ar-condicionado, Internet', 30, 'LABORATORIO'),
    ('AUD-01', 'Auditório 01', 'Auditório principal (Bloco C) - Projetor, Som, Microfone, Ar-condicionado', 120, 'AUDITORIO')
ON CONFLICT (codigo) DO NOTHING;

-- Disciplinas
INSERT INTO disciplina (codigo, nome, carga_horaria, curso_id)
VALUES
    ('MAT101', 'Matemática Discreta', 80, 'TADS'),
    ('PRG101', 'Programação I', 80, 'TADS'),
    ('BD101', 'Banco de Dados', 60, 'TADS'),
    ('RED101', 'Redes de Computadores', 60, 'INFO-INT')
ON CONFLICT (codigo) DO NOTHING;

-- Log de Inicialização (insere apenas se a tabela estiver vazia)
INSERT INTO log_sistema (usuario_matricula, acao, detalhes)
SELECT 'DIR001', 'sistema.inicio', 'Sistema HIFCG inicializado no PostgreSQL com dados padrão'
WHERE NOT EXISTS (SELECT 1 FROM log_sistema);
