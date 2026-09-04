package com.example.demo.Repository;

import com.example.demo.Entity.Curso;
import com.example.demo.Entity.Disciplina;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class DisciplinaRepository {

    private final JdbcTemplate jdbcTemplate;
    private final CursoRepository cursoRepository;

    public DisciplinaRepository(JdbcTemplate jdbcTemplate, CursoRepository cursoRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.cursoRepository = cursoRepository;
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
        String cursoCodigo = resolveCursoCodigo(disciplina.getCurso());
        String sql = "UPDATE disciplina SET nome = ?, carga_horaria = ?, curso_id = ? WHERE codigo = ?";
        jdbcTemplate.update(sql,
                disciplina.getNome(),
                disciplina.getCargaHoraria(),
                cursoCodigo,
                disciplina.getCodigo());
    }

    public void save(Disciplina disciplina) {
        String cursoCodigo = resolveCursoCodigo(disciplina.getCurso());
        if (existsByCodigo(disciplina.getCodigo())) {
            update(disciplina);
        } else {
            String sql = "INSERT INTO disciplina (codigo, nome, carga_horaria, curso_id) VALUES (?, ?, ?, ?)";
            jdbcTemplate.update(sql,
                    disciplina.getCodigo(),
                    disciplina.getNome(),
                    disciplina.getCargaHoraria(),
                    cursoCodigo);
        }
    }

    private String resolveCursoCodigo(String inputCurso) {
        if (inputCurso != null && cursoRepository.existsByCodigo(inputCurso)) {
            return inputCurso;
        }
        if (inputCurso != null) {
            List<Curso> list = cursoRepository.findByNomeContainingIgnoreCase(inputCurso);
            if (!list.isEmpty()) {
                return list.get(0).getCodigo();
            }
        }
        List<Curso> todos = cursoRepository.findAll();
        if (!todos.isEmpty()) {
            return todos.get(0).getCodigo();
        }
        // Se a tabela curso estiver vazia, cria o curso padrão TADS para evitar erro de Foreign Key
        Curso padrao = Curso.builder()
                .codigo("TADS")
                .nome("Tec. em Análise e Des. de Sistemas")
                .turno("NOTURNO")
                .nivel("SUPERIOR")
                .departamento("Informática")
                .build();
        cursoRepository.save(padrao);
        return "TADS";
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
