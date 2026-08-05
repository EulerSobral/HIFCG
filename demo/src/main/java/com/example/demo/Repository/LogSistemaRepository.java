package com.example.demo.Repository;

import com.example.demo.Entity.LogSistema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class LogSistemaRepository  {
    private JdbcTemplate jdbcTemplate;
    public LogSistemaRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }
    public List<LogSistema> findByUsuarioMatricula(String usuarioMatricula){
        String sql = "select * from log_sistema where matricula = usuarioMatricula";

        List<LogSistema>  list = jdbcTemplate.query(sql, (rs, rowNum) -> LogSistema.builder().build(),
                usuarioMatricula);
        return list;
    }
}
