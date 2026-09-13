package com.example.demo;

import com.example.demo.Controller.ApiController;
import com.example.demo.Entity.*;
import com.example.demo.Repository.*;
import com.example.demo.Services.TokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.Objects;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes de Unidade - Usuários Gerais (Somente Leitura)")
class UsuariosGeraisTest {

    @Mock private CoordenadorRepository coordenadorRepository;
    @Mock private DocenteRepository docenteRepository;
    @Mock private AmbienteRepository ambienteRepository;
    @Mock private CursoRepository cursoRepository;
    @Mock private DisciplinaRepository disciplinaRepository;
    @Mock private PeriodoRepository periodoRepository;
    @Mock private AlocacaoHorarioRepository alocacaoHorarioRepository;
    @Mock private LogSistemaRepository logSistemaRepository;
    @Mock private TokenService tokenService;

    private ApiController apiController;

    @BeforeEach
    void setUp() {
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

    @Test
    @DisplayName("Usuários Gerais: Deve conseguir visualizar horários alocados nos cursos")
    void testVisualizarHorariosAlocados() {
        List<Map<String, Object>> alocacoes = List.of(
                Map.of(
                        "disciplina", "POO01",
                        "docente", "DOC001",
                        "ambiente", "LAB01",
                        "turma", "T1",
                        "periodo", 1,
                        "dia_semana", "SEG",
                        "horario_inicio", "08:00:00",
                        "horario_fim", "09:40:00"
                )
        );

        when(alocacaoHorarioRepository.findAllMap()).thenReturn(alocacoes);

        ResponseEntity<List<Map<String, Object>>> response = apiController.getAlocacoes();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("POO01", response.getBody().get(0).get("disciplina"));
        verify(alocacaoHorarioRepository).findAllMap();
    }

    @Test
    @DisplayName("Usuários Gerais: Deve conseguir visualizar a lista de cursos cadastrados")
    void testVisualizarCursos() {
        List<Curso> cursos = List.of(
                Curso.builder().codigo("TADS").nome("Análise e Desenvolvimento de Sistemas").turno("NOTURNO").nivel("SUPERIOR").departamento("Informática").periodos(6).build()
        );

        when(cursoRepository.findAll()).thenReturn(cursos);

        ResponseEntity<List<Curso>> response = apiController.getCursos();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, Objects.requireNonNull(response.getBody()).size());
        assertEquals("TADS", response.getBody().get(0).getCodigo());
        verify(cursoRepository).findAll();
    }

    @Test
    @DisplayName("Usuários Gerais: Deve conseguir visualizar a lista de disciplinas")
    void testVisualizarDisciplinas() {
        List<Disciplina> disciplinas = List.of(
                Disciplina.builder().codigo("DISC01").nome("Estruturas de Dados").cargaHoraria(60).curso("TADS").build()
        );

        when(disciplinaRepository.findAll()).thenReturn(disciplinas);

        ResponseEntity<List<Disciplina>> response = apiController.getDisciplinas();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, Objects.requireNonNull(response.getBody()).size());
        assertEquals("Estruturas de Dados", response.getBody().get(0).getNome());
        verify(disciplinaRepository).findAll();
    }

    @Test
    @DisplayName("Usuários Gerais: Deve conseguir visualizar os ambientes (salas e laboratórios)")
    void testVisualizarAmbientes() {
        List<Ambiente> ambientes = List.of(
                Ambiente.builder().codigo("LAB01").nome("Laboratório de Redes").capacidade(40).tipo("LABORATORIO").build()
        );

        when(ambienteRepository.findAll()).thenReturn(ambientes);

        ResponseEntity<List<Ambiente>> response = apiController.getAmbientes();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, Objects.requireNonNull(response.getBody()).size());
        assertEquals("LAB01", response.getBody().get(0).getCodigo());
        verify(ambienteRepository).findAll();
    }

    @Test
    @DisplayName("Usuários Gerais: Deve conseguir visualizar a lista de docentes")
    void testVisualizarDocentes() {
        List<Docente> docentes = List.of(
                Docente.builder().matricula("D100").nome("Prof. Ada Lovelace").email("ada@hifcg.edu.br").departamento("Informática").build()
        );

        when(docenteRepository.findAll()).thenReturn(docentes);

        ResponseEntity<List<Docente>> response = apiController.getDocentes();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, Objects.requireNonNull(response.getBody()).size());
        assertEquals("Prof. Ada Lovelace", response.getBody().get(0).getNome());
        verify(docenteRepository).findAll();
    }

    @Test
    @DisplayName("Usuários Gerais: Deve conseguir visualizar a lista de períodos acadêmicos")
    void testVisualizarPeriodos() {
        List<Periodo> periodos = List.of(
                Periodo.builder().codigo("2026.1").nome("Primeiro Semestre 2026").build()
        );

        when(periodoRepository.findAll()).thenReturn(periodos);

        ResponseEntity<List<Periodo>> response = apiController.getPeriodos();

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(1, Objects.requireNonNull(response.getBody()).size());
        assertEquals("2026.1", response.getBody().get(0).getCodigo());
        verify(periodoRepository).findAll();
    }
}
