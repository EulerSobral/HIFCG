package com.example.demo.Repository;

import com.example.demo.Entity.LogSistema;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class LogSistemaRepository {

    private final JdbcTemplate jdbcTemplate;

    public LogSistemaRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void save(LogSistema log) {
        String sql = "INSERT INTO log_sistema (usuario_matricula, acao, detalhes, data_hora) VALUES (?, ?, ?, ?)";
        jdbcTemplate.update(sql,
                log.getUsuarioMatricula(),
                log.getAcao(),
                log.getDetalhes(),
                log.getDataHora());
    }

    public List<LogSistema> findByUsuarioMatricula(String usuarioMatricula) {
        String sql = "SELECT * FROM log_sistema WHERE usuario_matricula = ?";
        return jdbcTemplate.query(sql, (rs, rowNum) -> LogSistema.builder()
                .id(rs.getLong("id"))
                .usuarioMatricula(rs.getString("usuario_matricula"))
                .acao(rs.getString("acao"))
                .detalhes(rs.getString("detalhes"))
                .dataHora(rs.getTimestamp("data_hora") != null ? rs.getTimestamp("data_hora").toLocalDateTime() : null)
                .build(), usuarioMatricula);
    }
}
