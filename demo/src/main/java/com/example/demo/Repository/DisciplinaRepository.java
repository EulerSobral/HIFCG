package com.example.demo.Repository;

import com.example.demo.Entity.Ambiente;
import com.example.demo.Entity.Disciplina;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Scanner;

@Repository
public class DisciplinaRepository {

    private final Scanner scanner = new Scanner(System.in);

    private final JdbcTemplate jdbcTemplate;

    public DisciplinaRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<Ambiente> findByCodigo(String codigo){
        String sql = "SELECT * FROM Disciplina WHERE codigo = ?";

        List<Ambiente> list = jdbcTemplate.query(sql, (rs,  rowNum) -> Ambiente.builder()
                .build(), codigo);
        return list.stream().findFirst();
    }
    public boolean existsByCodigo(String codigo){
        String sql = "SELECT * FROM Disciplina WHERE codigo = ?";

        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, codigo);
        return count != null && count > 0;
    }
    public void deleteByCodigo(String codigo) {
        String sql = "DELETE FROM Disciplina WHERE codigo = ?";
        jdbcTemplate.update(sql, codigo);
    }

   public List<Disciplina> findByCursoCodigo(String codigoCurso) {
        String sql = "SELECT * FROM Disciplina WHERE codigo = ?";
        List<Disciplina> list = jdbcTemplate.query(sql, (rs,  rowNum) -> Disciplina.builder()
                .build(), codigoCurso);
        return list;
    }
}
