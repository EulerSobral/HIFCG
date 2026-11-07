package com.example.demo.Repository;

import com.example.demo.Entity.Curso;
import com.example.demo.Entity.Disciplina;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.text.Normalizer;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public class DisciplinaRepository {

    private static final Set<String> STOP_WORDS = Set.of(
            "DE", "DA", "DO", "DAS", "DOS", "E", "EM", "PARA", "COM", "A", "O", "AS", "OS", "AO", "NA", "NO",
            "I", "II", "III", "IV", "V", "VI"
    );

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
                .aulasSemanais(rs.getObject("aulas_semanais") != null ? rs.getInt("aulas_semanais") : Math.max(1, rs.getInt("carga_horaria") / 20))
                .periodo(rs.getObject("periodo") != null ? rs.getInt("periodo") : 1)
                .docente(rs.getString("docente_id"))
                .curso(rs.getString("curso_id"))
                .build());
    }

    public String gerarCodigoUnico(String nome, String curso, Integer periodo) {
        String prefix = extrairPrefixo(nome, curso);
        int per = (periodo != null && periodo > 0 && periodo <= 16) ? periodo : 1;
        int seq = 1;
        while (seq < 1000) {
            String candidato = String.format("%s%d%02d", prefix, per, seq);
            if (!existsByCodigo(candidato)) {
                return candidato;
            }
            seq++;
        }
        return prefix + per + (System.currentTimeMillis() % 10000);
    }

    private String extrairPrefixo(String nome, String curso) {
        String base = (nome != null && !nome.isBlank()) ? nome : (curso != null ? curso : "DIS");
        String semAcento = Normalizer.normalize(base, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toUpperCase()
                .replaceAll("[^A-Z\\s]", " ")
                .trim();

        StringBuilder letras = new StringBuilder();
        for (String palavra : semAcento.split("\\s+")) {
            if (!palavra.isEmpty() && !STOP_WORDS.contains(palavra)) {
                letras.append(palavra);
            }
        }
        if (letras.length() < 3 && curso != null) {
            String cursoLimpo = curso.toUpperCase().replaceAll("[^A-Z]", "");
            letras.append(cursoLimpo);
        }
        while (letras.length() < 3) {
            letras.append("X");
        }
        return letras.substring(0, 3);
    }

    public void update(Disciplina disciplina) {
        String cursoCodigo = resolveCursoCodigo(disciplina.getCurso());
        int ch = disciplina.getCargaHoraria() != null && disciplina.getCargaHoraria() > 0 ? disciplina.getCargaHoraria() : 60;
        int aulasSem = disciplina.getAulasSemanais() != null && disciplina.getAulasSemanais() > 0
                ? disciplina.getAulasSemanais()
                : Math.max(1, ch / 20);
        int per = disciplina.getPeriodo() != null && disciplina.getPeriodo() > 0 ? disciplina.getPeriodo() : 1;
        String sql = "UPDATE disciplina SET nome = ?, carga_horaria = ?, aulas_semanais = ?, periodo = ?, docente_id = ?, curso_id = ? WHERE UPPER(codigo) = UPPER(?)";
        jdbcTemplate.update(sql,
                disciplina.getNome(),
                ch,
                aulasSem,
                per,
                disciplina.getDocente(),
                cursoCodigo,
                disciplina.getCodigo());
    }

    public void save(Disciplina disciplina) {
        String cursoCodigo = resolveCursoCodigo(disciplina.getCurso());
        int ch = disciplina.getCargaHoraria() != null && disciplina.getCargaHoraria() > 0 ? disciplina.getCargaHoraria() : 60;
        int aulasSem = disciplina.getAulasSemanais() != null && disciplina.getAulasSemanais() > 0
                ? disciplina.getAulasSemanais()
                : Math.max(1, ch / 20);
        int per = disciplina.getPeriodo() != null && disciplina.getPeriodo() > 0 ? disciplina.getPeriodo() : 1;

        disciplina.setCargaHoraria(ch);
        disciplina.setAulasSemanais(aulasSem);
        disciplina.setPeriodo(per);

        if (disciplina.getCodigo() == null || disciplina.getCodigo().isBlank()) {
            disciplina.setCodigo(gerarCodigoUnico(disciplina.getNome(), cursoCodigo, per));
        } else {
            disciplina.setCodigo(disciplina.getCodigo().trim().toUpperCase());
        }

        if (existsByCodigo(disciplina.getCodigo())) {
            update(disciplina);
        } else {
            String sql = "INSERT INTO disciplina (codigo, nome, carga_horaria, aulas_semanais, periodo, docente_id, curso_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
            jdbcTemplate.update(sql,
                    disciplina.getCodigo(),
                    disciplina.getNome(),
                    ch,
                    aulasSem,
                    per,
                    disciplina.getDocente(),
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
        String sql = "SELECT * FROM disciplina WHERE UPPER(codigo) = UPPER(?)";
        List<Disciplina> list = jdbcTemplate.query(sql, (rs, rowNum) -> Disciplina.builder()
                .id(rs.getLong("id"))
                .codigo(rs.getString("codigo"))
                .nome(rs.getString("nome"))
                .cargaHoraria(rs.getInt("carga_horaria"))
                .aulasSemanais(rs.getObject("aulas_semanais") != null ? rs.getInt("aulas_semanais") : Math.max(1, rs.getInt("carga_horaria") / 20))
                .periodo(rs.getObject("periodo") != null ? rs.getInt("periodo") : 1)
                .docente(rs.getString("docente_id"))
                .curso(rs.getString("curso_id"))
                .build(), codigo);
        return list.stream().findFirst();
    }

    public boolean existsByCodigo(String codigo) {
        if (codigo == null || codigo.isBlank()) return false;
        String sql = "SELECT COUNT(*) FROM disciplina WHERE UPPER(codigo) = UPPER(?)";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, codigo.trim());
        return count != null && count > 0;
    }

    public void deleteByCodigo(String codigo) {
        String sql = "DELETE FROM disciplina WHERE UPPER(codigo) = UPPER(?)";
        jdbcTemplate.update(sql, codigo);
    }
}
