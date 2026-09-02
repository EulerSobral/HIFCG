-- =============================================================================
-- HIFCG: Schema de Banco de Dados H2
-- Sistema de Gestão de Alocação de Horários do IFPB - Campina Grande
-- =============================================================================

DROP TABLE IF EXISTS log_sistema;
DROP TABLE IF EXISTS alocacao_horario;
DROP TABLE IF EXISTS disciplina;
DROP TABLE IF EXISTS curso;
DROP TABLE IF EXISTS ambiente;
DROP TABLE IF EXISTS docente;
DROP TABLE IF EXISTS periodo;
DROP TABLE IF EXISTS coordenador;

-- 1. Tabela de Coordenadores e Administradores (RF31, RF33, RF38)
CREATE TABLE coordenador (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    matricula VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo_coordenador VARCHAR(30) NOT NULL, -- 'DIRETOR', 'AREA_DEPARTAMENTO', 'CURSO'
    departamento VARCHAR(100),
    curso_codigo VARCHAR(50)
);

-- 2. Tabela de Docentes (RF1, RF2, RF3, RF5)
CREATE TABLE docente (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    matricula VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    departamento VARCHAR(100) NOT NULL
);

-- 3. Tabela de Ambientes (RF8, RF9, RF10, RF11)
CREATE TABLE ambiente (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    descricao VARCHAR(10000) NOT NULL,
    capacidade INT NOT NULL,
    tipo VARCHAR(50) NOT NULL -- 'SALA', 'LABORATORIO', 'AUDITORIO', 'QUADRA'
);

-- 4. Tabela de Cursos (RF13, RF14, RF15, RF19)
CREATE TABLE curso (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    turno VARCHAR(30) NOT NULL, -- 'INTEGRAL', 'MATUTINO', 'VESPERTINO', 'NOTURNO'
    nivel VARCHAR(50) NOT NULL, -- 'TECNICO_INTEGRADO', 'SUPERIOR', 'POS_GRADUACAO'
    departamento VARCHAR(100) NOT NULL
);

-- 5. Tabela de Disciplinas (RF16, RF17, RF18)
CREATE TABLE disciplina (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    carga_horaria INT NOT NULL,
    curso_id VARCHAR(50) NOT NULL,
    CONSTRAINT fk_disciplina_curso FOREIGN KEY (curso_id) REFERENCES curso(codigo) ON DELETE CASCADE
);

-- 6. Tabela de Períodos Letivos
CREATE TABLE periodo (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    inicio VARCHAR(20) NOT NULL,
    fim VARCHAR(20) NOT NULL,
    inicio_matricula VARCHAR(20),
    fim_matricula VARCHAR(20),
    ativo BOOLEAN DEFAULT TRUE
);

-- 7. Tabela de Alocação de Horários (RF24, RF25, RF26, RF27, RF28, RF30)
CREATE TABLE alocacao_horario (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    disciplina VARCHAR(100) NOT NULL,
    docente VARCHAR(100) NOT NULL,
    ambiente VARCHAR(100) NOT NULL,
    turma VARCHAR(100) NOT NULL,
    periodo VARCHAR(50) NOT NULL,
    dia_semana VARCHAR(20) NOT NULL, -- 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL
);

-- 8. Tabela de Log de Alterações e Auditoria (RF34)
CREATE TABLE log_sistema (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_matricula VARCHAR(50) NOT NULL,
    acao VARCHAR(255) NOT NULL,
    detalhes CLOB,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =============================================================================
-- INSERÇÃO DE DADOS PADRÃO DE TESTES (SEEDS)
-- =============================================================================

-- Diretor do Campus
INSERT INTO coordenador (matricula, nome, email, senha, tipo_coordenador, departamento, curso_codigo)
VALUES ('DIR001', 'Dr. Roberto Lima', 'diretor@ifpb.edu.br', '123456', 'DIRETOR', 'Campus', NULL);

-- Coordenador de Área (Departamento)
INSERT INTO coordenador (matricula, nome, email, senha, tipo_coordenador, departamento, curso_codigo)
VALUES ('DEP001', 'Profa. Ana Souza', 'area.info@ifpb.edu.br', '123456', 'AREA_DEPARTAMENTO', 'Informática', NULL);

-- Coordenador de Curso
INSERT INTO coordenador (matricula, nome, email, senha, tipo_coordenador, departamento, curso_codigo)
VALUES ('COORD001', 'Prof. Carlos Mendes', 'curso.tads@ifpb.edu.br', '123456', 'CURSO', 'Informática', 'TADS');

-- Período Letivo Padrão
INSERT INTO periodo (codigo, nome, inicio, fim, inicio_matricula, fim_matricula, ativo)
VALUES ('P1', '2026.1', '2026-02-10', '2026-07-05', '2026-01-20', '2026-02-15', TRUE);

-- Cursos Padrão
INSERT INTO curso (codigo, nome, turno, nivel, departamento)
VALUES ('TADS', 'Tec. em Análise e Des. de Sistemas', 'NOTURNO', 'SUPERIOR', 'Informática');

INSERT INTO curso (codigo, nome, turno, nivel, departamento)
VALUES ('INFO-INT', 'Técnico em Informática Integrado', 'INTEGRAL', 'TECNICO_INTEGRADO', 'Informática');

-- Docentes Padrão
INSERT INTO docente (matricula, nome, email, departamento)
VALUES ('1001', 'Sicrano Pereira', 'sicrano@ifpb.edu.br', 'Matemática');

INSERT INTO docente (matricula, nome, email, departamento)
VALUES ('1002', 'Beltrano Silva', 'beltrano@ifpb.edu.br', 'Informática');

-- Ambientes Padrão
INSERT INTO ambiente (codigo, nome, descricao, capacidade, tipo)
VALUES ('S-101', 'Sala 101', 'Sala de aula padrão', 40, 'SALA');

INSERT INTO ambiente (codigo, nome, descricao, capacidade, tipo)
VALUES ('LAB-01', 'Laboratório 01', 'Laboratório de Informática', 30, 'LABORATORIO');

-- Disciplinas Padrão
INSERT INTO disciplina (codigo, nome, carga_horaria, curso_id)
VALUES ('MAT101', 'Matemática Discreta', 80, 'TADS');

INSERT INTO disciplina (codigo, nome, carga_horaria, curso_id)
VALUES ('PRG101', 'Programação I', 80, 'TADS');

-- Log de Inicialização
INSERT INTO log_sistema (usuario_matricula, acao, detalhes)
VALUES ('DIR001', 'sistema.inicio', 'Sistema HIFCG inicializado com dados padrão');
