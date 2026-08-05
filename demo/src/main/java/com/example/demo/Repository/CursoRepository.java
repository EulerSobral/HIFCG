package com.example.demo.Repository;

import com.example.demo.Entity.Ambiente;
import com.example.demo.Entity.Curso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Scanner;

@Repository
public class CursoRepository {
    private final Scanner scanner = new Scanner(System.in);

    private final JdbcTemplate jdbcTemplate;

    public CursoRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }
    public Optional<Curso> findByCodigo(String codigo){
        String sql = "SELECT * FROM cursos WHERE codigo = ?";

        List<Curso> list = jdbcTemplate.query(sql, (rs, rowNum) -> Curso.builder()
                .codigo("codigo")
                .nome("nome")
                .turno("turno")
                .departamento("departamento")
                .nivel("nivel")
                .build(), codigo);
        return list.stream().findFirst();
    }
    public  boolean existsByCodigo(String codigo){
        String sql = "SELECT COUNT(*) FROM curso WHERE codigo = ?";

        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, codigo);
        return count != null && count > 0;
    }
    public void deleteByCodigo(String codigo){
        String sql = "DELETE FROM cursos WHERE codigo = ?";
        jdbcTemplate.update(sql, codigo);
    }
    public Optional<Curso> findByDepartamento(String departamento){
        String sql = "SELECT * FROM cursos WHERE departamento = ?";
        List<com.example.demo.Entity.Curso> list = jdbcTemplate.query(sql, (rs, rowNum) -> com.example.demo.Entity.Curso.builder()
                .codigo("codigo")
                .nome("nome")
                .turno("turno")
                .departamento("departamento")
                .nivel("nivel")
                .build(), departamento);
        return list.stream().findFirst();
    }
    public Optional<Curso> findByNomeContainingIgnoreCase(String nome){
        String sql = "SELECT * FROM cursos WHERE LOWER(nome) LIKE LOWER(?) ?";
        List<com.example.demo.Entity.Curso> list = jdbcTemplate.query(sql, (rs, rowNum) -> com.example.demo.Entity.Curso.builder()
                .codigo("codigo")
                .nome("nome")
                .turno("turno")
                .departamento("departamento")
                .nivel("nivel")
                .build(), nome);
        return list.stream().findFirst();
    }
}
