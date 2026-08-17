package com.example.demo.Repository;

import com.example.demo.Entity.Curso;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class CursoRepository {

    private final JdbcTemplate jdbcTemplate;

    public CursoRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void save(Curso curso) {
        String sql = "INSERT INTO curso (codigo, nome, turno, nivel, departamento) VALUES (?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql,
                curso.getCodigo(),
                curso.getNome(),
                curso.getTurno(),
                curso.getNivel(),
                curso.getDepartamento());
    }

    public Optional<Curso> findByCodigo(String codigo) {
        String sql = "SELECT * FROM curso WHERE codigo = ?";
        List<Curso> list = jdbcTemplate.query(sql, (rs, rowNum) -> Curso.builder()
                .id(rs.getLong("id"))
                .codigo(rs.getString("codigo"))
                .nome(rs.getString("nome"))
                .turno(rs.getString("turno"))
                .nivel(rs.getString("nivel"))
                .departamento(rs.getString("departamento"))
                .build(), codigo);
        return list.stream().findFirst();
    }

    public boolean existsByCodigo(String codigo) {
        String sql = "SELECT COUNT(*) FROM curso WHERE codigo = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, codigo);
        return count != null && count > 0;
    }

    public void deleteByCodigo(String codigo) {
        String sql = "DELETE FROM curso WHERE codigo = ?";
        jdbcTemplate.update(sql, codigo);
    }

    public List<Curso> findByDepartamento(String departamento) {
        String sql = "SELECT * FROM curso WHERE departamento = ?";
        return jdbcTemplate.query(sql, (rs, rowNum) -> Curso.builder()
                .id(rs.getLong("id"))
                .codigo(rs.getString("codigo"))
                .nome(rs.getString("nome"))
                .turno(rs.getString("turno"))
                .nivel(rs.getString("nivel"))
                .departamento(rs.getString("departamento"))
                .build(), departamento);
    }

    public List<Curso> findByNomeContainingIgnoreCase(String nome) {
        String sql = "SELECT * FROM curso WHERE LOWER(nome) LIKE LOWER(?)";
        return jdbcTemplate.query(sql, (rs, rowNum) -> Curso.builder()
                .id(rs.getLong("id"))
                .codigo(rs.getString("codigo"))
                .nome(rs.getString("nome"))
                .turno(rs.getString("turno"))
                .nivel(rs.getString("nivel"))
                .departamento(rs.getString("departamento"))
                .build(), "%" + nome + "%");
    }
}
