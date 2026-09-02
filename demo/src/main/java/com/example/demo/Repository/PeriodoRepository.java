package com.example.demo.Repository;

import com.example.demo.Entity.Periodo;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class PeriodoRepository {

    private final JdbcTemplate jdbcTemplate;

    public PeriodoRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Periodo> findAll() {
        String sql = "SELECT * FROM periodo";
        return jdbcTemplate.query(sql, (rs, rowNum) -> Periodo.builder()
                .id(rs.getLong("id"))
                .codigo(rs.getString("codigo"))
                .nome(rs.getString("nome"))
                .inicio(rs.getString("inicio"))
                .fim(rs.getString("fim"))
                .inicioMatricula(rs.getString("inicio_matricula"))
                .fimMatricula(rs.getString("fim_matricula"))
                .ativo(rs.getBoolean("ativo"))
                .build());
    }

    public Optional<Periodo> findByCodigo(String codigo) {
        String sql = "SELECT * FROM periodo WHERE codigo = ?";
        List<Periodo> list = jdbcTemplate.query(sql, (rs, rowNum) -> Periodo.builder()
                .id(rs.getLong("id"))
                .codigo(rs.getString("codigo"))
                .nome(rs.getString("nome"))
                .inicio(rs.getString("inicio"))
                .fim(rs.getString("fim"))
                .inicioMatricula(rs.getString("inicio_matricula"))
                .fimMatricula(rs.getString("fim_matricula"))
                .ativo(rs.getBoolean("ativo"))
                .build(), codigo);
        return list.stream().findFirst();
    }

    public boolean existsByCodigo(String codigo) {
        String sql = "SELECT COUNT(*) FROM periodo WHERE codigo = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, codigo);
        return count != null && count > 0;
    }

    public void save(Periodo p) {
        if (existsByCodigo(p.getCodigo())) {
            String sql = "UPDATE periodo SET nome = ?, inicio = ?, fim = ?, inicio_matricula = ?, fim_matricula = ?, ativo = ? WHERE codigo = ?";
            jdbcTemplate.update(sql, p.getNome(), p.getInicio(), p.getFim(), p.getInicioMatricula(), p.getFimMatricula(), p.isAtivo(), p.getCodigo());
        } else {
            String sql = "INSERT INTO periodo (codigo, nome, inicio, fim, inicio_matricula, fim_matricula, ativo) VALUES (?, ?, ?, ?, ?, ?, ?)";
            jdbcTemplate.update(sql, p.getCodigo(), p.getNome(), p.getInicio(), p.getFim(), p.getInicioMatricula(), p.getFimMatricula(), p.isAtivo());
        }
    }

    public void deleteByCodigo(String codigo) {
        String sql = "DELETE FROM periodo WHERE codigo = ?";
        jdbcTemplate.update(sql, codigo);
    }
}
