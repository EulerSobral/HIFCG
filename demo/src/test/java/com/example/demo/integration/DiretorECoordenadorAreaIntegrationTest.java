package com.example.demo.integration;

import com.example.demo.Repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Transactional
@DisplayName("Testes de Integração - Diretor e Coordenador de Área")
class DiretorECoordenadorAreaIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private CoordenadorRepository coordenadorRepository;

    @Autowired
    private CursoRepository cursoRepository;

    @Autowired
    private AmbienteRepository ambienteRepository;

    @Autowired
    private DocenteRepository docenteRepository;

    @Autowired
    private DisciplinaRepository disciplinaRepository;

    @Autowired
    private AlocacaoHorarioRepository alocacaoHorarioRepository;

    @Autowired
    private LogSistemaRepository logSistemaRepository;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
    }

    // =========================================================================
    // CENÁRIO: Registro, login e exclusão do usuário
    // =========================================================================

    @Test
    @DisplayName("Integração: Login do Diretor deve autenticar no banco H2 e retornar token")
    void testLoginDiretorIntegration() throws Exception {
        Map<String, String> payload = Map.of(
                "email", "diretor@ifpb.edu.br",
                "password", "123456"
        );

        mockMvc.perform(post("/Diretor/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.email", is("diretor@ifpb.edu.br")))
                .andExpect(jsonPath("$.tipo_coordenador", is("DIRETOR")));
    }

    @Test
    @DisplayName("Integração: Login do Coordenador de Área deve autenticar no banco H2")
    void testLoginCoordenadorAreaIntegration() throws Exception {
        Map<String, String> payload = Map.of(
                "email", "area.info@ifpb.edu.br",
                "password", "123456"
        );

        mockMvc.perform(post("/CoordenadorDepartamento/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.email", is("area.info@ifpb.edu.br")));
    }

    @Test
    @DisplayName("Integração: Diretor cadastra novo Coordenador de Área no banco de dados H2")
    void testCadastrarCoordenadorAreaPeloDiretorIntegration() throws Exception {
        Map<String, String> payload = Map.of(
                "matricula", "DEP999",
                "nome", "Prof. Marcone",
                "email", "marcone@ifpb.edu.br",
                "password", "senha123",
                "area", "Exatas"
        );

        mockMvc.perform(post("/Diretor/coordenadoresArea")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Coordenador de Área cadastrado com sucesso")));

        assertTrue(coordenadorRepository.existsByMatricula("DEP999"));
    }

    @Test
    @DisplayName("Integração: Coordenador de Área cadastra, altera e remove Coordenador de Curso no H2")
    void testCrudCoordenadorPeloCoordenadorAreaIntegration() throws Exception {
        // 1. Cadastrar
        Map<String, String> cadPayload = Map.of(
                "matricula", "COORD999",
                "nome", "Coord Novo Curso",
                "email", "novocurso@ifpb.edu.br",
                "curso", "TADS",
                "password", "123456"
        );

        mockMvc.perform(post("/CoordenadorDepartamento/coordenadores")
                        .header("Authorization", "Bearer fake_token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cadPayload)))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Coordenador cadastrado com sucesso!")));

        assertTrue(coordenadorRepository.existsByMatricula("COORD999"));

        // 2. Alterar
        Map<String, String> altPayload = Map.of(
                "nome", "Coord Novo Curso Atualizado",
                "email", "novocurso.alt@ifpb.edu.br"
        );

        mockMvc.perform(put("/CoordenadorDepartamento/coordenadores/COORD999")
                        .header("Authorization", "Bearer fake_token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(altPayload)))
                .andExpect(status().isOk());

        var coordOpt = coordenadorRepository.findCoordenadorByMatricula("COORD999");
        assertTrue(coordOpt.isPresent());
        assertEquals("Coord Novo Curso Atualizado", coordOpt.get().getNome());

        // 3. Remover
        mockMvc.perform(delete("/CoordenadorDepartamento/coordenadores/COORD999")
                        .header("Authorization", "Bearer fake_token"))
                .andExpect(status().isOk());

        assertFalse(coordenadorRepository.existsByMatricula("COORD999"));
    }

    // =========================================================================
    // CENÁRIO: Criar, deletar, listar ou excluir curso
    // =========================================================================

    @Test
    @DisplayName("Integração: Diretor / Coordenador de Área insere, lista e deleta curso no H2")
    void testCrudCursoIntegration() throws Exception {
        // 1. Criar curso
        Map<String, String> cursoMap = Map.of(
                "codigo", "ENG-SOFT",
                "nome", "Engenharia de Software",
                "turno", "NOTURNO",
                "nivel", "SUPERIOR",
                "departamento", "Informática",
                "periodos", "10"
        );

        mockMvc.perform(post("/CoordenadorDepartamento/curso")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cursoMap)))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Curso cadastrado com sucesso")));

        assertTrue(cursoRepository.existsByCodigo("ENG-SOFT"));

        // 2. Listar cursos
        mockMvc.perform(get("/api/cursos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(2))))
                .andExpect(jsonPath("$[*].codigo", hasItem("ENG-SOFT")));

        // 3. Deletar curso
        mockMvc.perform(delete("/api/cursos/ENG-SOFT"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Curso removido")));

        assertFalse(cursoRepository.existsByCodigo("ENG-SOFT"));
    }

    // =========================================================================
    // CENÁRIO: Criar, alterar, listar e deletar recursos (Ambiente, Docente, Disciplina)
    // =========================================================================

    @Test
    @DisplayName("Integração: Diretor / Coordenador de Área gerencia ciclo de vida dos recursos")
    void testRecursosCrudIntegration() throws Exception {
        // --- AMBIENTE ---
        Map<String, Object> ambData = Map.of(
                "codigo", "LAB-INT-01",
                "nome", "Laboratório Integracao",
                "capacidade", 35,
                "tipo", "LABORATORIO",
                "descricao", "Lab para testes"
        );

        mockMvc.perform(post("/CoordenadorDepartamento/recursos/1")
                        .header("Authorization", "Bearer token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ambData)))
                .andExpect(status().isOk());

        assertTrue(ambienteRepository.existsByCodigo("LAB-INT-01"));

        mockMvc.perform(get("/api/ambientes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].codigo", hasItem("LAB-INT-01")));

        mockMvc.perform(delete("/CoordenadorDepartamento/recursos/1/LAB-INT-01")
                        .header("Authorization", "Bearer token"))
                .andExpect(status().isOk());

        assertFalse(ambienteRepository.existsByCodigo("LAB-INT-01"));

        // --- DOCENTE ---
        Map<String, Object> docData = Map.of(
                "matricula", "DOC999",
                "nome", "Prof. Linus Torvalds",
                "email", "linus@ifpb.edu.br",
                "departamento", "Informática"
        );

        mockMvc.perform(post("/CoordenadorDepartamento/recursos/2")
                        .header("Authorization", "Bearer token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(docData)))
                .andExpect(status().isOk());

        assertTrue(docenteRepository.existsByMatricula("DOC999"));

        mockMvc.perform(delete("/api/docentes/DOC999"))
                .andExpect(status().isOk());

        assertFalse(docenteRepository.existsByMatricula("DOC999"));
    }

    // =========================================================================
    // CENÁRIO: Alocar e visualizar recursos em horário do curso
    // =========================================================================

    @Test
    @DisplayName("Integração: Alocar recursos e verificar alocação e detecção de choque de horário")
    void testAlocacaoEConflitoIntegration() throws Exception {
        Map<String, String> alocData = Map.of(
                "codigoDisciplina", "PRG101",
                "codigoMatricula", "1002",
                "codigoAmbiente", "LAB-01",
                "codigoTurma", "T1",
                "codigoPeriodo", "1",
                "diaSemana", "SEG",
                "horarioInicio", "14:00:00",
                "horarioFim", "15:40:00"
        );

        // 1. Alocar com sucesso
        mockMvc.perform(post("/CoordenadorDepartamento/alocarRecurso")
                        .header("Authorization", "Bearer token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(alocData)))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Recursos alocados com sucesso")));

        // 2. Visualizar alocação
        mockMvc.perform(get("/api/alocacoes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].DISCIPLINA", hasItem("PRG101")));

        // 3. Tentar alocar no mesmo ambiente e horário (Choque de Horário)
        Map<String, String> choqueData = Map.of(
                "codigoDisciplina", "MAT101",
                "codigoMatricula", "1001",
                "codigoAmbiente", "LAB-01",
                "codigoTurma", "T2",
                "codigoPeriodo", "1",
                "diaSemana", "SEG",
                "horarioInicio", "14:00:00",
                "horarioFim", "15:40:00"
        );

        mockMvc.perform(post("/CoordenadorDepartamento/alocarRecurso")
                        .header("Authorization", "Bearer token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(choqueData)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string(containsString("Choque de horário")));
    }

    // =========================================================================
    // CENÁRIO: Visualizar o que os coordenadores de curso e área fizeram no HIFCG
    // =========================================================================

    @Test
    @DisplayName("Integração: Diretor consulta os logs de auditoria do sistema persistidos no H2")
    void testConsultarLogsIntegration() throws Exception {
        mockMvc.perform(get("/Diretor/logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].acao", is("sistema.inicio")));
    }
}
