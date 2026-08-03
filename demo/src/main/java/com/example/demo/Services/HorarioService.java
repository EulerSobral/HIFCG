package com.example.demo.Services;

import org.springframework.stereotype.Service;

@Service
public class HorarioService {

    public void alocarRecurso(String codigoDisciplina, String matriculaDocente, String codigoAmbiente, String codigoTurma, String codigoPeriodo) {
    }

    public void removerAlocacao(Long alocacaoId) {
    }

    public void alterarAlocacao(Long alocacaoId, String novoCodigoAmbiente) {
    }

    public void visualizarHorarioPorCurso(String codigoCurso, String codigoPeriodo) {
    }

    public void visualizarHorarioPorDocente(String matriculaDocente, String codigoPeriodo) {
    }

    public boolean verificarChoqueHorario(String codigoAmbiente, String matriculaDocente, String diaSemana, String horaInicio, String horaFim) {
        return false;
    }
}

