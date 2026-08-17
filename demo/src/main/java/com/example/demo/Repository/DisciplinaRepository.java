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

    public void save(Disciplina disciplina) {
        String sql = "INSERT INTO disciplina (codigo, nome, carga_horaria, curso_id) VALUES (?, ?, ?, ?)";
        jdbcTemplate.update(sql,
                disciplina.getCodigo(),
                disciplina.getNome(),
                disciplina.getCargaHoraria(),
                disciplina.getCurso());
    }

    public Optional<Disciplina> findByCodigo(String codigo) {
        String sql = "SELECT * FROM disciplina WHERE codigo = ?";
        List<Disciplina> list = jdbcTemplate.query(sql, (rs, rowNum) -> Disciplina.builder()
                .id(rs.getLong("id"))
                .codigo(rs.getString("codigo"))
                .nome(rs.getString("nome"))
                .cargaHoraria(rs.getInt("carga_horaria"))
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

    public List<Disciplina> findByCursoCodigo(String codigoCurso) {
        String sql = "SELECT d.* FROM disciplina d JOIN curso c ON d.curso_id = c.id WHERE c.codigo = ?";
        return jdbcTemplate.query(sql, (rs, rowNum) -> Disciplina.builder()
                .id(rs.getLong("id"))
                .codigo(rs.getString("codigo"))
                .nome(rs.getString("nome"))
                .ementa(rs.getString("ementa"))
                .especialidade(rs.getString("especialidade"))
                .cargaHoraria(rs.getInt("carga_horaria"))
                .build(), codigoCurso);
    }
}
