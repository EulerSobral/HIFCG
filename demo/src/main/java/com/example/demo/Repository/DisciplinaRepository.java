package com.example.demo.Repository;

import com.example.demo.Entity.Disciplina;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class DisciplinaRepository {

    private final JdbcTemplate jdbcTemplate;

    public DisciplinaRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<Disciplina> findAll() {
        String sql = "SELECT * FROM disciplina";
        return jdbcTemplate.query(sql, (rs, rowNum) -> Disciplina.builder()
                .id(rs.getLong("id"))
                .codigo(rs.getString("codigo"))
                .nome(rs.getString("nome"))
                .cargaHoraria(rs.getInt("carga_horaria"))
                .curso(rs.getString("curso_id"))
                .build());
    }

    public void update(Disciplina disciplina) {
        String sql = "UPDATE disciplina SET nome = ?, carga_horaria = ?, curso_id = ? WHERE codigo = ?";
        jdbcTemplate.update(sql,
                disciplina.getNome(),
                disciplina.getCargaHoraria(),
                disciplina.getCurso(),
                disciplina.getCodigo());
    }

    public void save(Disciplina disciplina) {
        if (existsByCodigo(disciplina.getCodigo())) {
            update(disciplina);
        } else {
            String sql = "INSERT INTO disciplina (codigo, nome, carga_horaria, curso_id) VALUES (?, ?, ?, ?)";
            jdbcTemplate.update(sql,
                    disciplina.getCodigo(),
                    disciplina.getNome(),
                    disciplina.getCargaHoraria(),
                    disciplina.getCurso() != null ? disciplina.getCurso() : "TADS");
        }
    }

    public Optional<Disciplina> findByCodigo(String codigo) {
        String sql = "SELECT * FROM disciplina WHERE codigo = ?";
        List<Disciplina> list = jdbcTemplate.query(sql, (rs, rowNum) -> Disciplina.builder()
                .id(rs.getLong("id"))
                .codigo(rs.getString("codigo"))
                .nome(rs.getString("nome"))
                .cargaHoraria(rs.getInt("carga_horaria"))
                .curso(rs.getString("curso_id"))
                .build(), codigo);
        return list.stream().findFirst();
    }

    public boolean existsByCodigo(String codigo) {
        String sql = "SELECT COUNT(*) FROM disciplina WHERE codigo = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, codigo);
        return count != null && count > 0;
    }

    public void deleteByCodigo(String codigo) {
        String sql = "DELETE FROM disciplina WHERE codigo = ?";
        jdbcTemplate.update(sql, codigo);
    }
}
