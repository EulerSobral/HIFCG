-- =============================================================================
-- HIFCG: Schema de Banco de Dados H2
-- Sistema de Gestão de Alocação de Horários do IFPB - Campina Grande
-- =============================================================================

DROP TABLE IF EXISTS log_sistema;
DROP TABLE IF EXISTS alocacao_horario;
DROP TABLE IF EXISTS turma;
DROP TABLE IF EXISTS disciplina;
DROP TABLE IF EXISTS curso;
DROP TABLE IF EXISTS ambiente;
DROP TABLE IF EXISTS docente;
DROP TABLE IF EXISTS coordenador;
DROP TABLE IF EXISTS periodo;

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
    ementa CLOB,
    especialidade VARCHAR(100),
    carga_horaria INT NOT NULL,
    curso_id BIGINT NOT NULL,
    CONSTRAINT fk_disciplina_curso FOREIGN KEY (curso_id) REFERENCES curso(id) ON DELETE CASCADE
);

-- 6. Tabela de Turmas
CREATE TABLE turma (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nome VARCHAR(100) NOT NULL,
    curso_id BIGINT NOT NULL,
    CONSTRAINT fk_turma_curso FOREIGN KEY (curso_id) REFERENCES curso(id) ON DELETE CASCADE
);

-- 7. Tabela de Períodos Letivos (RF21, RF22, RF23)
CREATE TABLE periodo (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE, -- Ex: '2026.1'
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    ativo BOOLEAN DEFAULT TRUE NOT NULL
);

-- 8. Tabela de Alocação de Horários (RF24, RF25, RF26, RF27, RF28, RF30)
CREATE TABLE alocacao_horario (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    disciplina_id BIGINT NOT NULL,
    docente_id BIGINT NOT NULL,
    ambiente_id BIGINT NOT NULL,
    turma_id BIGINT NOT NULL,
    periodo_id BIGINT NOT NULL,
    dia_semana VARCHAR(20) NOT NULL, -- 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    CONSTRAINT fk_alocacao_disciplina FOREIGN KEY (disciplina_id) REFERENCES disciplina(id),
    CONSTRAINT fk_alocacao_docente FOREIGN KEY (docente_id) REFERENCES docente(id),
    CONSTRAINT fk_alocacao_ambiente FOREIGN KEY (ambiente_id) REFERENCES ambiente(id),
    CONSTRAINT fk_alocacao_turma FOREIGN KEY (turma_id) REFERENCES turma(id),
    CONSTRAINT fk_alocacao_periodo FOREIGN KEY (periodo_id) REFERENCES periodo(id)
);

-- 9. Tabela de Log de Alterações e Auditoria (RF34)
CREATE TABLE log_sistema (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_matricula VARCHAR(50) NOT NULL,
    acao VARCHAR(255) NOT NULL,
    detalhes CLOB,
    data_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
