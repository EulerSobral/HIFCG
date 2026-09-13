package com.example.demo;

import com.example.demo.Controller.ApiController;
import com.example.demo.Controller.DiretorController;
import com.example.demo.Controller.CoordenadorDepartamentoController;
import com.example.demo.Entity.*;
import com.example.demo.Repository.*;
import com.example.demo.Services.CoordenadorDepartamentoService;
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
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes de Unidade - Diretor e Coordenador de Área")
class DiretorECoordenadorAreaTest {

    @Mock private CoordenadorRepository coordenadorRepository;
    @Mock private LogSistemaRepository logSistemaRepository;
    @Mock private TokenService tokenService;
    @Mock private CursoRepository cursoRepository;
    @Mock private AmbienteRepository ambienteRepository;
    @Mock private DocenteRepository docenteRepository;
    @Mock private DisciplinaRepository disciplinaRepository;
    @Mock private PeriodoRepository periodoRepository;
    @Mock private AlocacaoHorarioRepository alocacaoHorarioRepository;
    @Mock private CoordenadorDepartamentoService coordenadorDepartamentoService;

    private DiretorController diretorController;
    private CoordenadorDepartamentoController coordenadorDepartamentoController;
    private ApiController apiController;

    @BeforeEach
    void setUp() {
        diretorController = new DiretorController(coordenadorRepository, logSistemaRepository, tokenService);
        coordenadorDepartamentoController = new CoordenadorDepartamentoController(coordenadorDepartamentoService, tokenService);
        apiController = new ApiController(
                coordenadorRepository,
                docenteRepository,
                ambienteRepository,
                cursoRepository,
                disciplinaRepository,
                periodoRepository,
                alocacaoHorarioRepository,
                logSistemaRepository,
                tokenService
        );
    }

    // =========================================================================
    // CENÁRIO: Registro, login e exclusão do usuário
    // =========================================================================

    @Test
    @DisplayName("Diretor: Deve realizar login com sucesso e retornar token")
    void testLoginDiretorSucesso() {
        Map<String, String> creds = Map.of("email", "diretor@hifcg.edu.br", "password", "123456");
        Map<String, String> userMap = new HashMap<>();
        userMap.put("email", "diretor@hifcg.edu.br");
        userMap.put("tipo_coordenador", "DIRETOR");
        userMap.put("nome", "Diretor Geral");

        when(coordenadorRepository.loginRepository("diretor@hifcg.edu.br", "123456")).thenReturn(userMap);
        when(tokenService.generateToken("diretor@hifcg.edu.br", "DIRETOR")).thenReturn("jwt_token_diretor");

        ResponseEntity<?> response = diretorController.login(creds);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(response.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) response.getBody();
        assertEquals("jwt_token_diretor", body.get("token"));
    }

    @Test
    @DisplayName("Coordenador de Área: Deve realizar login com sucesso")
    void testLoginCoordenadorDepartamentoSucesso() throws Exception {
        Map<String, String> creds = Map.of("email", "coord.area@hifcg.edu.br", "password", "senha123");
        Map<String, String> userMap = new HashMap<>();
        userMap.put("email", "coord.area@hifcg.edu.br");
        userMap.put("tipo_coordenador", "AREA_DEPARTAMENTO");

        when(coordenadorDepartamentoService.login("coord.area@hifcg.edu.br", "senha123")).thenReturn(userMap);
        when(tokenService.generateToken("coord.area@hifcg.edu.br", "senha123")).thenReturn("jwt_token_area");

        ResponseEntity<?> response = coordenadorDepartamentoController.login(creds);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        verify(coordenadorDepartamentoService).login("coord.area@hifcg.edu.br", "senha123");
    }

    @Test
    @DisplayName("Diretor: Deve cadastrar novo Coordenador de Área com sucesso")
    void testCadastrarCoordenadorAreaPeloDiretor() {
        Map<String, String> map = Map.of(
                "nome", "Novo Coord Área",
                "email", "area@hifcg.edu.br",
                "password", "pass123",
                "area", "Exatas"
        );

        ResponseEntity<?> response = diretorController.cadastrarCoordenadorArea(map);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Coordenador de Área cadastrado com sucesso pelo Diretor!", response.getBody());
        verify(coordenadorRepository).save(any(Coordenador.class));
    }

    @Test
    @DisplayName("Coordenador de Área: Deve cadastrar novo Coordenador de Curso com sucesso")
    void testCadastrarCoordenadorPeloCoordenadorDepartamento() {
        Map<String, String> map = Map.of(
                "matricula", "COORD10",
                "nome", "Coord Curso ADS",
                "email", "ads@hifcg.edu.br",
                "curso", "ADS",
                "password", "123456"
        );

        ResponseEntity<?> response = coordenadorDepartamentoController.cadastrarCoordenador(map, "Bearer token");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Coordenador cadastrado com sucesso!", response.getBody());
        verify(coordenadorDepartamentoService).cadastrarCoordenador("COORD10", "Coord Curso ADS", "ads@hifcg.edu.br", "ADS", "123456");
    }

    @Test
    @DisplayName("Coordenador de Área: Deve alterar dados de um coordenador e sua própria conta")
    void testAlterarCoordenadorEConta() {
        Map<String, String> dadosCoord = Map.of("nome", "Nome Atualizado");
        ResponseEntity<?> respCoord = coordenadorDepartamentoController.alterarCoordenador("COORD10", dadosCoord, "Bearer token");
        assertEquals(HttpStatus.OK, respCoord.getStatusCode());
        verify(coordenadorDepartamentoService).alterarCoordenador("COORD10", dadosCoord);

        Map<String, String> dadosConta = Map.of("email", "coord.area@hifcg.edu.br", "password", "novasenha");
        ResponseEntity<?> respConta = coordenadorDepartamentoController.alterarConta(dadosConta);
        assertEquals(HttpStatus.OK, respConta.getStatusCode());
        verify(coordenadorDepartamentoService).updateConta("coord.area@hifcg.edu.br", "novasenha");
    }

    @Test
    @DisplayName("Coordenador de Área / ApiController: Deve excluir coordenador com sucesso")
    void testExcluirCoordenador() {
        ResponseEntity<?> responseDep = coordenadorDepartamentoController.removerCoordenador("COORD10", "Bearer token");
        assertEquals(HttpStatus.OK, responseDep.getStatusCode());
        verify(coordenadorDepartamentoService).removerCoordenador("COORD10");

        ResponseEntity<?> responseApi = apiController.removeCoordenador("COORD10");
        assertEquals(HttpStatus.OK, responseApi.getStatusCode());
        verify(coordenadorRepository).deleteByMatricula("COORD10");
    }

    // =========================================================================
    // CENÁRIO: Criar, deletar, listar ou excluir curso
    // =========================================================================

    @Test
    @DisplayName("Diretor / Coordenador de Área: Deve criar curso com sucesso")
    void testCriarCurso() {
        Map<String, String> cursoMap = Map.of(
                "codigo", "TADS",
                "nome", "Tecnologia em Análise e Desenvolvimento de Sistemas",
                "turno", "NOTURNO",
                "nivel", "SUPERIOR",
                "departamento", "Informática",
                "periodos", "6"
        );

        ResponseEntity<?> response = coordenadorDepartamentoController.curso(cursoMap);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Curso cadastrado com sucesso", response.getBody());
        verify(coordenadorDepartamentoService).cadastrarCurso("TADS", "Tecnologia em Análise e Desenvolvimento de Sistemas", "NOTURNO", "SUPERIOR", "Informática", 6);
    }

    @Test
    @DisplayName("Diretor: Deve listar todos os cursos cadastrados")
    void testListarCursos() {
        List<Curso> cursos = List.of(
                Curso.builder().codigo("TADS").nome("ADS").turno("NOTURNO").nivel("SUPERIOR").departamento("Informática").periodos(6).build(),
                Curso.builder().codigo("ENG").nome("Engenharia").turno("INTEGRAL").nivel("SUPERIOR").departamento("Exatas").periodos(10).build()
        );
        when(cursoRepository.findAll()).thenReturn(cursos);

        ResponseEntity<List<Curso>> response = apiController.getCursos();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(2, Objects.requireNonNull(response.getBody()).size());
        verify(cursoRepository).findAll();
    }

    @Test
    @DisplayName("Diretor: Deve excluir um curso do sistema pelo código")
    void testExcluirCurso() {
        ResponseEntity<?> response = apiController.removeCurso("TADS");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Curso removido", response.getBody());
        verify(cursoRepository).deleteByCodigo("TADS");
    }

    // =========================================================================
    // CENÁRIO: Criar, alterar, listar e deletar recursos (Ambiente, Docente, Disciplina)
    // =========================================================================

    @Test
    @DisplayName("Diretor / Coordenador de Área: Deve cadastrar recursos (Ambiente, Docente, Disciplina)")
    void testCadastrarRecursos() {
        Map<String, Object> dadosAmbiente = Map.of("codigo", "LAB01", "nome", "Lab de Software", "capacidade", 40, "tipo", "LABORATORIO");
        ResponseEntity<?> respAmb = coordenadorDepartamentoController.cadastrarRecurso(1, dadosAmbiente, "Bearer token");
        assertEquals(HttpStatus.OK, respAmb.getStatusCode());
        verify(coordenadorDepartamentoService).cadastrarRecurso(1, dadosAmbiente);

        Map<String, Object> dadosDocente = Map.of("matricula", "DOC001", "nome", "Prof. Alan Turing", "email", "alan@hifcg.edu.br");
        ResponseEntity<?> respDoc = coordenadorDepartamentoController.cadastrarRecurso(2, dadosDocente, "Bearer token");
        assertEquals(HttpStatus.OK, respDoc.getStatusCode());
        verify(coordenadorDepartamentoService).cadastrarRecurso(2, dadosDocente);

        Map<String, Object> dadosDisc = Map.of("codigo", "POO01", "nome", "Programação Orientada a Objetos", "cargaHoraria", 80);
        ResponseEntity<?> respDisc = coordenadorDepartamentoController.cadastrarRecurso(3, dadosDisc, "Bearer token");
        assertEquals(HttpStatus.OK, respDisc.getStatusCode());
        verify(coordenadorDepartamentoService).cadastrarRecurso(3, dadosDisc);
    }

    @Test
    @DisplayName("Diretor / Coordenador de Área: Deve alterar recursos cadastrados")
    void testAlterarRecursos() {
        Map<String, Object> dadosAmbiente = Map.of("codigo", "LAB01", "nome", "Lab de Redes");
        ResponseEntity<?> respAmb = coordenadorDepartamentoController.alterarRecurso(1, dadosAmbiente, "Bearer token");
        assertEquals(HttpStatus.OK, respAmb.getStatusCode());
        verify(coordenadorDepartamentoService).alterarRecurso(1, dadosAmbiente);
    }

    @Test
    @DisplayName("Diretor / Coordenador de Área: Deve listar todos os recursos cadastrados")
    void testListarRecursos() {
        when(ambienteRepository.findAll()).thenReturn(List.of(Ambiente.builder().codigo("LAB01").nome("Lab 1").build()));
        when(docenteRepository.findAll()).thenReturn(List.of(Docente.builder().matricula("D01").nome("Prof A").build()));
        when(disciplinaRepository.findAll()).thenReturn(List.of(Disciplina.builder().codigo("DISC1").nome("Estruturas de Dados").build()));

        assertEquals(1, Objects.requireNonNull(apiController.getAmbientes().getBody()).size());
        assertEquals(1, Objects.requireNonNull(apiController.getDocentes().getBody()).size());
        assertEquals(1, Objects.requireNonNull(apiController.getDisciplinas().getBody()).size());
    }

    @Test
    @DisplayName("Diretor / Coordenador de Área: Deve excluir recursos (Ambiente, Docente, Disciplina)")
    void testExcluirRecursos() {
        ResponseEntity<?> respAmb = coordenadorDepartamentoController.excluirRecurso(1, "LAB01", "Bearer token");
        assertEquals(HttpStatus.OK, respAmb.getStatusCode());
        verify(coordenadorDepartamentoService).excluirRecurso(1, "LAB01");

        ResponseEntity<?> respApiAmb = apiController.removeAmbiente("LAB01");
        assertEquals(HttpStatus.OK, respApiAmb.getStatusCode());
        verify(ambienteRepository).deleteByCodigo("LAB01");

        ResponseEntity<?> respApiDoc = apiController.removeDocente("DOC001");
        assertEquals(HttpStatus.OK, respApiDoc.getStatusCode());
        verify(docenteRepository).deleteByMatricula("DOC001");

        ResponseEntity<?> respApiDisc = apiController.removeDisciplina("POO01");
        assertEquals(HttpStatus.OK, respApiDisc.getStatusCode());
        verify(disciplinaRepository).deleteByCodigo("POO01");
    }

    // =========================================================================
    // CENÁRIO: Alocar e visualizar recursos em horário do curso
    // =========================================================================

    @Test
    @DisplayName("Diretor / Coordenador de Área: Deve alocar recursos em um determinado horário e período")
    void testAlocarRecursosHorario() {
        Map<String, String> mapAlocacao = Map.of(
                "codigoDisciplina", "POO01",
                "codigoMatricula", "DOC001",
                "codigoAmbiente", "LAB01",
                "codigoTurma", "T1",
                "codigoPeriodo", "1",
                "diaSemana", "SEG",
                "horarioInicio", "08:00:00",
                "horarioFim", "09:40:00"
        );

        ResponseEntity<?> response = coordenadorDepartamentoController.alocarRecurso(mapAlocacao, "Bearer token");

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals("Recursos alocados com sucesso no horário!", response.getBody());
        verify(coordenadorDepartamentoService).alocarRecurso(
                eq("POO01"), eq("DOC001"), eq("LAB01"), eq("T1"), eq(1), eq("SEG"),
                eq(Time.valueOf("08:00:00")), eq(Time.valueOf("09:40:00"))
        );
    }

    @Test
    @DisplayName("Diretor / Coordenador de Área: Deve alterar e remover horários alocados")
    void testAlterarERemoverHorario() {
        Map<String, String> mapAlocacao = Map.of(
                "codigoDisciplina", "POO01",
                "codigoMatricula", "DOC001",
                "codigoAmbiente", "LAB01",
                "codigoTurma", "T1",
                "codigoPeriodo", "1",
                "diaSemana", "SEG",
                "horarioInicio", "08:00:00",
                "horarioFim", "09:40:00"
        );

        ResponseEntity<?> respAlt = coordenadorDepartamentoController.alterarHorario(mapAlocacao, "Bearer token");
        assertEquals(HttpStatus.OK, respAlt.getStatusCode());
        verify(coordenadorDepartamentoService).alterarAlocacoes(
                eq("POO01"), eq("DOC001"), eq("LAB01"), eq("T1"), eq(1), eq("SEG"),
                eq(Time.valueOf("08:00:00")), eq(Time.valueOf("09:40:00"))
        );

        ResponseEntity<?> respRem = coordenadorDepartamentoController.removerHorario(mapAlocacao, "Bearer token");
        assertEquals(HttpStatus.OK, respRem.getStatusCode());
        verify(coordenadorDepartamentoService).removerAlocacoes(
                eq("POO01"), eq("DOC001"), eq("LAB01"), eq("T1"), eq(1), eq("SEG"),
                eq(Time.valueOf("08:00:00")), eq(Time.valueOf("09:40:00"))
        );
    }

    // =========================================================================
    // CENÁRIO: Visualizar o que os coordenadores de curso e área fizeram no HIFCG
    // =========================================================================

    @Test
    @DisplayName("Diretor: Deve verificar logs de auditoria do sistema com ações dos coordenadores")
    void testConsultarLogsDoSistema() {
        List<LogSistema> logs = List.of(
                LogSistema.builder().id(1L).usuarioMatricula("COORD10").acao("ALOCACAO_RECURSO").detalhes("Alocou POO01 no LAB01").dataHora(LocalDateTime.now()).build(),
                LogSistema.builder().id(2L).usuarioMatricula("COORD_AREA").acao("CADASTRO_DOCENTE").detalhes("Cadastrou Prof. Alan").dataHora(LocalDateTime.now()).build()
        );
        when(logSistemaRepository.findAll()).thenReturn(logs);

        ResponseEntity<?> response = diretorController.consultarLogs();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(logs, response.getBody());
        verify(logSistemaRepository).findAll();
    }

    @Test
    @DisplayName("Diretor: Deve visualizar histórico de alocações realizadas pelos coordenadores")
    void testVisualizarHistoricoAlocacoesPorCoordenadores() {
        List<Map<String, Object>> alocacoes = List.of(
                Map.of("disciplina", "POO01", "docente", "DOC001", "ambiente", "LAB01", "turma", "T1", "periodo", 1)
        );
        when(alocacaoHorarioRepository.findAllMap()).thenReturn(alocacoes);

        ResponseEntity<List<Map<String, Object>>> response = apiController.getAlocacoes();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, Objects.requireNonNull(response.getBody()).size());
        verify(alocacaoHorarioRepository).findAllMap();
    }
}
