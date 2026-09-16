package com.example.demo.integration;

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

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@Transactional
@DisplayName("Testes de Integração - Usuários Gerais (Visualização Pública)")
class UsuariosGeraisIntegrationTest {

    @Autowired
    private WebApplicationContext webApplicationContext;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext).build();
    }

    @Test
    @DisplayName("Integração: Usuário geral visualiza alocações de horários registradas no HIFCG")
    void testVisualizarAlocacoesIntegration() throws Exception {
        mockMvc.perform(get("/api/alocacoes")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));
    }

    @Test
    @DisplayName("Integração: Usuário geral visualiza a lista de cursos cadastrados no H2")
    void testVisualizarCursosIntegration() throws Exception {
        mockMvc.perform(get("/api/cursos")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[*].codigo", hasItem("TADS")));
    }

    @Test
    @DisplayName("Integração: Usuário geral visualiza a lista de disciplinas no H2")
    void testVisualizarDisciplinasIntegration() throws Exception {
        mockMvc.perform(get("/api/disciplinas")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[*].codigo", hasItem("PRG101")));
    }

    @Test
    @DisplayName("Integração: Usuário geral visualiza ambientes (salas e laboratórios) no H2")
    void testVisualizarAmbientesIntegration() throws Exception {
        mockMvc.perform(get("/api/ambientes")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[*].codigo", hasItem("LAB-01")));
    }

    @Test
    @DisplayName("Integração: Usuário geral visualiza a lista de docentes no H2")
    void testVisualizarDocentesIntegration() throws Exception {
        mockMvc.perform(get("/api/docentes")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[*].matricula", hasItem("1002")));
    }

    @Test
    @DisplayName("Integração: Usuário geral visualiza períodos acadêmicos no H2")
    void testVisualizarPeriodosIntegration() throws Exception {
        mockMvc.perform(get("/api/periodos")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[*].codigo", hasItem("P1")));
    }
}
