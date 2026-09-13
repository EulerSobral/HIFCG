package com.example.demo;

import com.example.demo.Controller.CoordenadorCursoController;
import com.example.demo.Services.CoordenadorCursoService;
import com.example.demo.Services.TokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.sql.Time;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes de Unidade - Coordenador de Curso")
class CoordenadorCursoTest {

    @Mock
    private CoordenadorCursoService coordenadorCursoService;

    @Mock
    private TokenService tokenService;

    private CoordenadorCursoController coordenadorCursoController;

    @BeforeEach
    void setUp() {
        coordenadorCursoController = new CoordenadorCursoController(coordenadorCursoService, tokenService);
    }

    // =========================================================================
    // CENÁRIO: Registro, login e exclusão do usuário
    // =========================================================================

    @Test
    @DisplayName("Coordenador de Curso: Deve entrar corretamente no sistema do HIFCG")
    void testLoginCoordenadorCursoSucesso() throws Exception {
        Map<String, String> credenciais = Map.of("email", "coord.ads@hifcg.edu.br", "password", "senha123");
        Map<String, String> userMap = new HashMap<>();
        userMap.put("email", "coord.ads@hifcg.edu.br");
        userMap.put("tipo_coordenador", "CURSO");

        when(coordenadorCursoService.login("coord.ads@hifcg.edu.br", "senha123")).thenReturn(userMap);
        when(tokenService.generateToken("coord.ads@hifcg.edu.br", "senha123")).thenReturn("jwt_token_curso");

        ResponseEntity<?> response = coordenadorCursoController.login(credenciais);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("jwt_token_curso", body.get("token"));
        verify(coordenadorCursoService).login("coord.ads@hifcg.edu.br", "senha123");
    }

    @Test
    @DisplayName("Coordenador de Curso: Deve alterar dados de sua própria conta")
    void testAlterarContaCoordenadorCurso() {
        Map<String, String> credenciais = Map.of("email", "coord.ads@hifcg.edu.br", "password", "novasenha456");

        ResponseEntity<?> response = coordenadorCursoController.alterarConta(credenciais);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Conta alterado com sucesso", response.getBody());
        verify(coordenadorCursoService).updateConta("coord.ads@hifcg.edu.br", "novasenha456");
    }

    // =========================================================================
    // CENÁRIO: Criar, alterar, listar e deletar recursos
    // =========================================================================

    @Test
    @DisplayName("Coordenador de Curso: Deve criar recursos (Ambiente, Docente e Disciplina)")
    void testCadastrarRecurso() {
        Map<String, Object> dadosAmbiente = Map.of("codigo", "LAB02", "nome", "Laboratório 2", "capacidade", 30, "tipo", "LAB");
        ResponseEntity<?> respAmb = coordenadorCursoController.cadastrarRecurso(1, dadosAmbiente, "Bearer token");
        assertEquals(HttpStatus.OK, respAmb.getStatusCode());
        verify(coordenadorCursoService).cadastrarRecurso(1, dadosAmbiente);

        Map<String, Object> dadosDocente = Map.of("matricula", "DOC002", "nome", "Prof. Grace Hopper", "email", "grace@hifcg.edu.br");
        ResponseEntity<?> respDoc = coordenadorCursoController.cadastrarRecurso(2, dadosDocente, "Bearer token");
        assertEquals(HttpStatus.OK, respDoc.getStatusCode());
        verify(coordenadorCursoService).cadastrarRecurso(2, dadosDocente);

        Map<String, Object> dadosDisciplina = Map.of("codigo", "ENG01", "nome", "Engenharia de Software", "cargaHoraria", 60);
        ResponseEntity<?> respDisc = coordenadorCursoController.cadastrarRecurso(3, dadosDisciplina, "Bearer token");
        assertEquals(HttpStatus.OK, respDisc.getStatusCode());
        verify(coordenadorCursoService).cadastrarRecurso(3, dadosDisciplina);
    }

    @Test
    @DisplayName("Coordenador de Curso: Deve alterar recursos cadastrados")
    void testAlterarRecurso() {
        Map<String, Object> dadosRecurso = Map.of("codigo", "LAB02", "nome", "Laboratório Atualizado");

        ResponseEntity<?> response = coordenadorCursoController.alterarRecurso(1, dadosRecurso, "Bearer token");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Recurso alterado com sucesso pelo Coordenador de Curso!", response.getBody());
        verify(coordenadorCursoService).alterarRecurso(1, dadosRecurso);
    }

    @Test
    @DisplayName("Coordenador de Curso: Deve excluir recursos cadastrados")
    void testExcluirRecurso() {
        ResponseEntity<?> response = coordenadorCursoController.excluirRecurso(1, "LAB02", "Bearer token");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Recurso excluído com sucesso pelo Coordenador de Curso!", response.getBody());
        verify(coordenadorCursoService).excluirRecurso(1, "LAB02");
    }

    // =========================================================================
    // CENÁRIO: Alocar e visualizar recursos em horário do curso
    // =========================================================================

    @Test
    @DisplayName("Coordenador de Curso: Deve alocar recursos em um determinado horário e período do curso")
    void testAlocarRecursoHorarioCurso() {
        Map<String, String> map = Map.of(
                "codigoDisciplina", "ENG01",
                "codigoMatricula", "DOC002",
                "codigoAmbiente", "LAB02",
                "codigoTurma", "T1",
                "codigoPeriodo", "2",
                "horarioInicio", "10:00:00",
                "horarioFim", "11:40:00"
        );

        ResponseEntity<?> response = coordenadorCursoController.alocarRecurso(map, "Bearer token");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Recursos alocodaos no horário", response.getBody());
        verify(coordenadorCursoService).alocarRecurso(
                eq("ENG01"),
                eq("DOC002"),
                eq("LAB02"),
                eq("T1"),
                eq("2"),
                eq(Time.valueOf("10:00:00")),
                eq(Time.valueOf("11:40:00"))
        );
    }
}
