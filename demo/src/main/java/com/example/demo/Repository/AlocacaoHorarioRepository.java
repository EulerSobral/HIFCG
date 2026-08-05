package com.example.demo.Repository;

import com.example.demo.Entity.AlocacaoHorario;
import com.example.demo.Entity.Ambiente;
import com.example.demo.Entity.Disciplina;
import com.example.demo.Entity.Docente;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.SQLException;
import java.sql.Time;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Repository
public class AlocacaoHorarioRepository {

    private final JdbcTemplate jdbcTemplate;

    public AlocacaoHorarioRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }


    public void alocarHorario(String disciplina, String docente, String ambiente, String dia_semana, String turma,Time horario_inicio, Time horario_fim) {

        String sql = "INSERT INTO alocacao_horario (disciplina, docente, ambiente, turma,dia_semana, horario_inicio, horario_fim) VALUES (?, ?, ?, ?, ?, ?, ?)";

        String sqlDocente = "SELECT matricula FROM docente WHERE nome LIKE docente";
        String matriculaDocente = jdbcTemplate.queryForObject(sqlDocente, String.class, docente);

        String sqlAmbiente = "SELECT codigo FROM ambiente WHERE nome LIKE ambiente";
        String codigoAmbiente = jdbcTemplate.queryForObject(sqlAmbiente, String.class, ambiente);

        if(existeChoqueDocente(matriculaDocente) == false && existeChoqueAmbiente(codigoAmbiente) == false) {
            jdbcTemplate.update(sql);

        } else{
            System.out.println("Choque de horário");
        }

    }


    public void deleteById(Long id) {
        String sql = "DELETE FROM alocacao_horario WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }

    public boolean existeChoqueAmbiente(String codigoAmbiente) {
        String sql = "SELECT COUNT(*) FROM alocacao_horario WHERE fk_alocacao_ambiente = codigoAmbiente";

        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, codigoAmbiente);
        return count != null && count > 0;

    }

    public boolean existeChoqueDocente(String matriculaDocente) {
        String sql = "SELECT COUNT(*) FROM alocacao_horario WHERE fk_alocacao_docente = matriculaDocente";

        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, matriculaDocente);
        return count != null && count > 0;
    }
}
