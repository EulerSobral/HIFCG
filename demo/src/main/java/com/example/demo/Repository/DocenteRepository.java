package com.example.demo.Repository;

import com.example.demo.Entity.Docente;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class DocenteRepository {

    private final JdbcTemplate jdbcTemplate;

    public DocenteRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void save(Docente docente) {
        String sql = "INSERT INTO docente (matricula, nome, email, departamento) VALUES (?, ?, ?, ?)";
        jdbcTemplate.update(sql,
                docente.getMatricula(),
                docente.getNome(),
                docente.getEmail(),
                docente.getDepartamento());
    }

    public Optional<Docente> findByMatricula(String matricula) {
        String sql = "SELECT * FROM docente WHERE matricula = ?";
        List<Docente> list = jdbcTemplate.query(sql, (rs, rowNum) -> Docente.builder()
                .id(rs.getLong("id"))
                .matricula(rs.getString("matricula"))
                .nome(rs.getString("nome"))
                .email(rs.getString("email"))
                .departamento(rs.getString("departamento"))
                .build(), matricula);
        return list.stream().findFirst();
    }

    public boolean existsByMatricula(String matricula) {
        String sql = "SELECT COUNT(*) FROM docente WHERE matricula = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, matricula);
        return count != null && count > 0;
    }

    public void deleteByMatricula(String matricula) {
        String sql = "DELETE FROM docente WHERE matricula = ?";
        jdbcTemplate.update(sql, matricula);
    }

    public List<Docente> findByNomeContainingIgnoreCase(String termo) {
        String sql = "SELECT * FROM docente WHERE LOWER(nome) LIKE LOWER(?)";
        return jdbcTemplate.query(sql, (rs, rowNum) -> Docente.builder()
                .id(rs.getLong("id"))
                .matricula(rs.getString("matricula"))
                .nome(rs.getString("nome"))
                .email(rs.getString("email"))
                .departamento(rs.getString("departamento"))
                .build(), "%" + termo + "%");
    }
}
