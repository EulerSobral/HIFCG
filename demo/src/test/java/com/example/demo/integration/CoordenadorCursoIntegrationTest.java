package com.example.demo.integration;

import com.example.demo.Repository.AmbienteRepository;
import com.example.demo.Repository.CoordenadorRepository;
import com.example.demo.Repository.DocenteRepository;
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
@DisplayName("Testes de Integração - Coordenador de Curso")
class CoordenadorCursoIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private CoordenadorRepository coordenadorRepository;

    @Autowired
    private AmbienteRepository ambienteRepository;

    @Autowired
    private DocenteRepository docenteRepository;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
    }

    // =========================================================================
    // CENÁRIO: Registro, login e exclusão do usuário
    // =========================================================================

    @Test
    @DisplayName("Integração: Login do Coordenador de Curso com credenciais do banco H2")
    void testLoginCoordenadorCursoIntegration() throws Exception {
        Map<String, String> creds = Map.of(
                "email", "curso.tads@ifpb.edu.br",
                "password", "123456"
        );

        mockMvc.perform(post("/CoordenadorCurso/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(creds)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andExpect(jsonPath("$.email", is("curso.tads@ifpb.edu.br")));
    }

    @Test
    @DisplayName("Integração: Coordenador de Curso altera sua própria conta no H2")
    void testAlterarContaCoordenadorCursoIntegration() throws Exception {
        Map<String, String> creds = Map.of(
                "email", "curso.tads@ifpb.edu.br",
                "password", "nova_senha_curso_123"
        );

        mockMvc.perform(put("/CoordenadorCurso/alterarConta")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(creds)))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Conta alterado com sucesso")));

        var userOpt = coordenadorRepository.findByEmailObject("curso.tads@ifpb.edu.br");
        assertTrue(userOpt.isPresent());
        assertEquals("nova_senha_curso_123", userOpt.get().getSenha());
    }

    // =========================================================================
    // CENÁRIO: Criar, alterar, listar e deletar recursos
    // =========================================================================

    @Test
    @DisplayName("Integração: Coordenador de Curso cadastra, altera e remove recursos")
    void testRecursosCoordenadorCursoIntegration() throws Exception {
        // 1. Cadastrar Ambiente
        Map<String, Object> amb = Map.of(
                "codigo", "LAB-CURSO-01",
                "nome", "Laboratório do Curso",
                "capacidade", 25,
                "tipo", "LABORATORIO",
                "descricao", "Descrição do laboratório"
        );

        mockMvc.perform(post("/CoordenadorCurso/recursos/1")
                        .header("Authorization", "Bearer token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(amb)))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Recurso cadastrado com sucesso pelo Coordenador de Curso!")));

        assertTrue(ambienteRepository.existsByCodigo("LAB-CURSO-01"));

        // 2. Alterar Ambiente
        Map<String, Object> ambAlt = Map.of(
                "codigo", "LAB-CURSO-01",
                "nome", "Laboratório do Curso Renovado",
                "capacidade", 30
        );

        mockMvc.perform(put("/CoordenadorCurso/recursos/1")
                        .header("Authorization", "Bearer token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(ambAlt)))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Recurso alterado com sucesso pelo Coordenador de Curso!")));

        var ambOpt = ambienteRepository.findByCodigo("LAB-CURSO-01");
        assertTrue(ambOpt.isPresent());
        assertEquals("Laboratório do Curso Renovado", ambOpt.get().getNome());

        // 3. Excluir Ambiente
        mockMvc.perform(delete("/CoordenadorCurso/recursos/1/LAB-CURSO-01")
                        .header("Authorization", "Bearer token"))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Recurso excluído com sucesso pelo Coordenador de Curso!")));

        assertFalse(ambienteRepository.existsByCodigo("LAB-CURSO-01"));
    }

    // =========================================================================
    // CENÁRIO: Alocar e visualizar recursos em horário do curso
    // =========================================================================

    @Test
    @DisplayName("Integração: Coordenador de Curso aloca recursos para grade horária do curso")
    void testAlocarRecursoHorarioCursoIntegration() throws Exception {
        Map<String, String> alocData = Map.of(
                "codigoDisciplina", "MAT101",
                "codigoMatricula", "1001",
                "codigoAmbiente", "S-101",
                "codigoTurma", "T1",
                "codigoPeriodo", "1",
                "horarioInicio", "07:30:00",
                "horarioFim", "09:10:00"
        );

        mockMvc.perform(post("/CoordenadorCurso/alocarRecurso")
                        .header("Authorization", "Bearer token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(alocData)))
                .andExpect(status().isOk())
                .andExpect(content().string(containsString("Recursos alocodaos no horário")));

        mockMvc.perform(get("/api/alocacoes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].DISCIPLINA", hasItem("MAT101")));
    }
}
