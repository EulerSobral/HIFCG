package com.example.demo.Repository;

import com.example.demo.Entity.Docente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Scanner;

@Repository
public class DocenteRepository {
    private final Scanner scanner = new Scanner(System.in);

    private final JdbcTemplate jdbcTemplate;

    public DocenteRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<Docente> findByMatricula(String matricula){
        String sql = "SELECT * FROM curso WHERE matricula = ?";
        List<Docente> list = jdbcTemplate.query(sql, (rs,  rowNum) -> Docente.builder().build(), matricula);

        return list.stream().findFirst();
    }


    public boolean existsByMatricula(String matricula){
        String sql = "SELECT * FROM curso WHERE matricula = ?";

        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, matricula);
        return count != null && count > 0;
    }
    public void deleteByMatricula(String matricula){
        String sql = "DELETE FROM curso WHERE matricula = ?";
        jdbcTemplate.update(sql, matricula);
    }
    public List<Docente> findByNomeContainingIgnoreCase(String termo){
        String sql = "SELECT * FROM docente WHERE LOWER(nome) LIKE LOWER(termo)";

        List<Docente> list = jdbcTemplate.query(sql, (rs, rowNum) -> Docente.builder().build(), termo);
        return list;
    }

}
