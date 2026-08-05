package com.example.demo.Services;

import com.example.demo.Entity.*;
import com.example.demo.Repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HorarioService {

    private final AlocacaoHorarioRepository alocacaoHorarioRepository;
    private final DisciplinaRepository disciplinaRepository;
    private final DocenteRepository docenteRepository;
    private final AmbienteRepository ambienteRepository;
    private final TurmaRepository turmaRepository;
    private final PeriodoRepository periodoRepository;

    @Transactional
    public void alocarRecurso(String codigoDisciplina, String matriculaDocente, String codigoAmbiente, String codigoTurma, String codigoPeriodo) {
        Disciplina disciplina = disciplinaRepository.findByCodigo(codigoDisciplina)
                .orElseThrow(() -> new RuntimeException("Disciplina não encontrada: " + codigoDisciplina));
        Docente docente = docenteRepository.findByMatricula(matriculaDocente)
                .orElseThrow(() -> new RuntimeException("Docente não encontrado: " + matriculaDocente));
        Ambiente ambiente = ambienteRepository.findByCodigo(codigoAmbiente)
                .orElseThrow(() -> new RuntimeException("Ambiente não encontrado: " + codigoAmbiente));
        Turma turma = turmaRepository.findByCodigo(codigoTurma)
                .orElseThrow(() -> new RuntimeException("Turma não encontrada: " + codigoTurma));
        Periodo periodo = periodoRepository.findByCodigo(codigoPeriodo)
                .orElseThrow(() -> new RuntimeException("Período não encontrado: " + codigoPeriodo));

        AlocacaoHorario alocacao = AlocacaoHorario.builder()
                .disciplina(disciplina)
                .docente(docente)
                .ambiente(ambiente)
                .turma(turma)
                .periodo(periodo)
                .diaSemana("SEG")
                .horarioInicio(LocalTime.of(8, 0))
                .horarioFim(LocalTime.of(10, 0))
                .build();

        alocacaoHorarioRepository.save(alocacao);
    }

    @Transactional
    public void removerAlocacao(Long alocacaoId) {
        alocacaoHorarioRepository.deleteById(alocacaoId);
    }

    @Transactional
    public void alterarAlocacao(Long alocacaoId, String novoCodigoAmbiente) {
        Ambiente novoAmbiente = ambienteRepository.findByCodigo(novoCodigoAmbiente)
                .orElseThrow(() -> new RuntimeException("Ambiente não encontrado: " + novoCodigoAmbiente));

        alocacaoHorarioRepository.findById(alocacaoId).ifPresent(alocacao -> {
            alocacao.setAmbiente(novoAmbiente);
            alocacaoHorarioRepository.save(alocacao);
        });
    }

    public List<AlocacaoHorario> visualizarHorarioPorCurso(String codigoCurso, String codigoPeriodo) {
        return alocacaoHorarioRepository.findByTurmaCursoCodigoAndPeriodoCodigo(codigoCurso, codigoPeriodo);
    }

    public List<AlocacaoHorario> visualizarHorarioPorDocente(String matriculaDocente, String codigoPeriodo) {
        return alocacaoHorarioRepository.findByDocenteMatriculaAndPeriodoCodigo(matriculaDocente, codigoPeriodo);
    }

    public boolean verificarChoqueHorario(String codigoAmbiente, String matriculaDocente, String diaSemana, String horaInicio, String horaFim) {
        LocalTime inicio = LocalTime.parse(horaInicio);
        LocalTime fim = LocalTime.parse(horaFim);

        List<AlocacaoHorario> choquesAmbiente = alocacaoHorarioRepository.findChoquesAmbiente(codigoAmbiente, diaSemana, "2026.1", inicio, fim);
        List<AlocacaoHorario> choquesDocente = alocacaoHorarioRepository.findChoquesDocente(matriculaDocente, diaSemana, "2026.1", inicio, fim);

        return !choquesAmbiente.isEmpty() || !choquesDocente.isEmpty();
    }
}
