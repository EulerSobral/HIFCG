package com.example.demo.Repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Time;
import java.util.List;
import java.util.Map;

@Repository
public class AlocacaoHorarioRepository {

    private final JdbcTemplate jdbcTemplate;

    public AlocacaoHorarioRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Map<String, Object>> findAllMap() {
        String sql = "SELECT * FROM alocacao_horario";
        return jdbcTemplate.queryForList(sql);
    }

    public void alocarHorario(String disciplina, String docente, String ambiente, String turma, String periodo, Time horarioInicio, Time horarioFim) {
        alocarHorario(disciplina, docente, ambiente, turma, periodo, "SEG", horarioInicio, horarioFim);
    }

    public void alocarHorario(String disciplina, String docente, String ambiente, String turma, String periodo, String diaSemana, Time horarioInicio, Time horarioFim) {
        if (existeChoqueAmbiente(ambiente, diaSemana, periodo, horarioInicio, horarioFim)) {
            throw new RuntimeException("Choque de horário detectado para o Ambiente: " + ambiente);
        }
        if (existeChoqueDocente(docente, diaSemana, periodo, horarioInicio, horarioFim)) {
            throw new RuntimeException("Choque de horário detectado para o Docente: " + docente);
        }

        String sql = "INSERT INTO alocacao_horario (disciplina, docente, ambiente, turma, periodo, dia_semana, horario_inicio, horario_fim) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql, disciplina, docente, ambiente, turma, periodo, diaSemana, horarioInicio, horarioFim);
    }

    public void removerAlocacoes(String disciplina, String docente, String ambiente, String turma, String periodo, String diaSemana, Time horarioInicio, Time horarioFim) {
        String sql = "DELETE FROM alocacao_horario WHERE disciplina = ? AND docente = ? AND ambiente = ? AND turma = ? AND periodo = ? AND dia_semana = ? AND horario_inicio = ? AND horario_fim = ?";
        jdbcTemplate.update(sql, disciplina, docente, ambiente, turma, periodo, diaSemana, horarioInicio, horarioFim);
    }

    public void alterarAlocacao(String disciplina, String docente, String ambiente, String turma, String periodo, String diaSemana, Time horarioInicio, Time horarioFim) {
        String sql = "UPDATE alocacao_horario SET docente = ?, ambiente = ?, horario_inicio = ?, horario_fim = ? WHERE disciplina = ? AND turma = ? AND periodo = ? AND dia_semana = ?";
        jdbcTemplate.update(sql, docente, ambiente, horarioInicio, horarioFim, disciplina, turma, periodo, diaSemana);
    }

    public boolean existeChoqueAmbiente(String codigoAmbiente, String diaSemana, String periodo, Time horarioInicio, Time horarioFim) {
        String sql = "SELECT COUNT(*) FROM alocacao_horario WHERE ambiente = ? AND dia_semana = ? AND periodo = ? AND (horario_inicio < ? AND horario_fim > ?)";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, codigoAmbiente, diaSemana, periodo, horarioFim, horarioInicio);
        return count != null && count > 0;
    }

    public boolean existeChoqueDocente(String matriculaDocente, String diaSemana, String periodo, Time horarioInicio, Time horarioFim) {
        String sql = "SELECT COUNT(*) FROM alocacao_horario WHERE docente = ? AND dia_semana = ? AND periodo = ? AND (horario_inicio < ? AND horario_fim > ?)";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, matriculaDocente, diaSemana, periodo, horarioFim, horarioInicio);
        return count != null && count > 0;
    }

    public void deleteById(Long id) {
        String sql = "DELETE FROM alocacao_horario WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }
}