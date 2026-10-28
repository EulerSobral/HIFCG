# HIFCG — Sistema de Gestão de Alocação de Horários
**Instituto Federal de Educação, Ciência e Tecnologia da Paraíba (IFPB) — Campus Campina Grande**

---

## 📌 Sobre o Projeto

O **HIFCG** é uma solução de software desenvolvida para modernizar, otimizar e assegurar a gestão de alocação de horários de aulas e recursos acadêmicos no **IFPB - Campus Campina Grande**.

O projeto surgiu no âmbito da disciplina **Projeto em Engenharia de Computação I (2026.1)**, concebido para sanar gargalos históricos e técnicos decorrentes do sistema legado (HIFPB), garantindo conformidade com os regimentos acadêmicos da instituição e a Lei Geral de Proteção de Dados (LGPD).

### 👥 Equipe e Orientação
* **Equipe de Desenvolvimento:** 
  * Euler Pereira Sobral
  * Felipe Luiz de Lima
* **Orientadora:** Profa. Mirna Carelli Oliveira Maia
* **Área:** Engenharia de Software / Ciência da Computação

---

## 🎯 Contexto: O que o HIFCG faz no IFPB?

No IFPB Campus Campina Grande, a oferta de cursos abrange os níveis **técnico integrado**, **técnico subsequente**, **graduação** e **pós-graduação**, envolvendo um corpo docente amplo e dezenas de salas de aula, laboratórios e auditórios. 

### O Problema do Sistema Legado (HIFPB)
O sistema anterior apresentava deficiências graves que impactavam a rotina acadêmica:
1. **Ineficiência Operacional:** Modificações corriqueiras (saída de docentes, remanejamento de laboratórios, criação de novos cursos e ajustes de grade) exigiam tempo e esforço excessivos dos coordenadores.
2. **Atrasos e Desorganização:** Dificuldade na validação de choques de horário, acarretando atrasos na formação da grade horária e transtornos para professores e estudantes no início dos semestres.
3. **Fragilidade de Segurança:** Ausência de criptografia e hashing seguro para credenciais dos usuários.
4. **Falta de Controle de Acesso (RBAC):** Qualquer usuário logado conseguia alterar turmas, salas e horários indiscriminadamente, sem separação modular de papéis (Admin, Coordenador de Área, Coordenador de Curso).
5. **Limitações Funcionais Básicas:** Impossibilidade de exclusão e edição correta de registros (professores, turmas, ambientes).
6. **Código Fechado e Ausência de Documentação:** O sistema legado não permitia manutenções corretivas ou evolutivas pela comunidade do campus.

### O Intuito do HIFCG
O **HIFCG** foi idealizado para ser uma plataforma **aberta, segura, modular e auditável**, capaz de:
- **Automatizar e simplificar a montagem de horários** pelos coordenadores.
- **Evitar choques de horários** (docente em duas turmas ou duas turmas no mesmo ambiente simultaneamente).
- **Proteger os dados** e hierarquizar os acessos conforme os cargos de gestão.
- **Manter histórico e rastreabilidade** de alterações para cumprimento de resoluções institucionais.
- **Fornecer transparência** para discentes e docentes consultarem suas alocações com facilidade.

---

## 🔑 Níveis de Acesso e Responsabilidades

O sistema implementa controle rigoroso de permissões de acesso:

| Perfil | Escopo de Acesso e Responsabilidades |
| :--- | :--- |
| **Diretor do Campus (Admin)** | Acesso total irrestrito: cadastra e gerencia coordenadores de área e coordenadores de curso; define senhas de administração; cadastra/remove docentes, cursos, ambientes, disciplinas e períodos letivos. |
| **Coordenador de Área** | Gestão departamental: administra os cursos e horários vinculados ao seu departamento; cria coordenadores de cursos do setor; autoriza e realiza alterações excepcionais de horário após o término do período de matrícula. |
| **Coordenador de Curso** | Gestão de curso: aloca disciplinas, turmas, docentes e ambientes nos horários do seu respectivo curso durante o período letivo/matrícula; cadastra subcoordenadores de curso. |
| **Docentes e Discentes** | Consulta pública/individual: visualização facilitada dos horários consolidados por curso, período letivo, turma ou docente. |

---

## ⚙️ Principais Funcionalidades

### 1. Gestão de Entidades Acadêmicas
- **Docentes:** Cadastro completo, edição de dados, listagem geral, remoção e busca com recurso de autocompletar.
- **Ambientes Físicos:** Cadastro de salas de aula, laboratórios, auditórios e quadras, com capacidade e controle de disponibilidade.
- **Cursos:** Cadastro com turno (matutino, vespertino, noturno, integral), nível de ensino (médio integrado, subsequente, superior, pós-graduação), código e departamento.
- **Disciplinas:** Associação ao curso, ementa, código e especialidade/área de conhecimento.
- **Períodos Letivos:** Criação e controle temporal de vigência para a confecção dos horários acadêmicos.

### 2. Alocação Inteligente de Horários
- **Alocação de Recursos:** Associação dinâmica de docente, disciplina, turma, ambiente e horário para o semestre letivo.
- **Detecção de Choques de Horário:** Alerta e bloqueio visual automático contra conflitos de agenda (mesmo professor ou mesmo ambiente no mesmo intervalo de tempo).
- **Aproveitamento de Semestres Anteriores:** Capacidade de importar a estrutura de horários de semestres passados para agilizar a montagem.
- **Janela de Modificações:** Alterações de grade liberadas durante o período de matrícula; modificações posteriores exigem perfil de Coordenador de Área.
- **Visualização Flexível:** Filtros de grade por curso, por docente e por período do curso.

### 3. Segurança, Auditoria e LGPD
- **Criptografia de Senhas:** Armazenamento seguro utilizando funções de hash criptográfico unidirecionais.
- **Trilha de Auditoria (Logs):** Registro detalhado de quem realizou cada alocação/alteração e o timestamp exato, retido por no mínimo 6 meses para verificação de conformidade com resoluções do IFPB.
- **Conformidade LGPD:** Tratamento ético, seguro e restrito dos dados cadastrais de servidores e alunos.

---

## 🛠️ Tecnologias Utilizadas

```
                       ┌─────────────────────────┐
                       │   Frontend (SPA Web)    │
                       │ React + TypeScript/Vite │
                       └────────────┬────────────┘
                                    │ HTTP / REST
                                    ▼
                       ┌─────────────────────────┐
                       │    Backend (API REST)   │
                       │    Java + Spring Boot   │
                       └────────────┬────────────┘
                                    │ JDBC / JPA
                                    ▼
                       ┌─────────────────────────┐
                       │     Banco de Dados      │
                       │   PostgreSQL / H2 (dev) │
                       └─────────────────────────┘
```

* **Frontend:** [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/), Tailwind CSS / Componentes UI.
* **Backend:** [Java](https://www.java.com/), [Spring Boot](https://spring.io/projects/spring-boot), [JUnit](https://junit.org/) (testes unitários e de integração).
* **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/) (ambiente de produção e contêineres) e [H2 Database](https://www.h2database.com/) (testes e desenvolvimento rápido).
* **DevOps & Infraestrutura:** [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) para padronização de ambientes; [GitHub Actions](https://github.com/features/actions) para CI/CD.

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
* [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) instalados;
* *(Opcional para execução nativa)*: [Java 17+](https://adoptium.net/) e [Node.js 18+](https://nodejs.org/).

### Executando via Docker Compose (Recomendado)

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Euler-Sobral/HIFCG.git
   cd HIFCG
   ```

2. **Configure o arquivo de variáveis de ambiente:**
   Copie o arquivo de exemplo `.env.example` para `.env` e ajuste se necessário:
   ```bash
   cp .env.example .env
   ```

3. **Suba os serviços (Banco de Dados, Backend e Frontend):**
   ```bash
   docker-compose up --build
   ```

4. **Acesse as aplicações:**
   * **Frontend:** `http://localhost:3000` (ou porta configurada)
   * **API Backend:** `http://localhost:8080`
   * **Banco PostgreSQL:** `localhost:5432`

---

## 📄 Licença

Este projeto é planejado para ser disponibilizado como software livre sob a licença **GNU General Public License (GPL)**, permitindo que a comunidade acadêmica do IFPB (docentes, discentes e colaboradores) possa auditar, manter e expandir o sistema de forma perene.
