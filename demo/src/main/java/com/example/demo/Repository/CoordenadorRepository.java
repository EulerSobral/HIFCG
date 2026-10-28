package com.example.demo.Repository;

import com.example.demo.Entity.Coordenador;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.Map;

@Repository
public class CoordenadorRepository {
    private final JdbcTemplate jdbcTemplate;

    public CoordenadorRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private LocalDateTime extractUltimaAlteracao(ResultSet rs) throws SQLException {
        try {
            Timestamp ts = rs.getTimestamp("ultima_alteracao_credenciais");
            return ts != null ? ts.toLocalDateTime() : LocalDateTime.now();
        } catch (SQLException e) {
            return LocalDateTime.now();
        }
    }

    private Coordenador mapRow(ResultSet rs, int rowNum) throws SQLException {
        return Coordenador.builder()
                .id(rs.getLong("id"))
                .matricula(rs.getString("matricula"))
                .nome(rs.getString("nome"))
                .email(rs.getString("email"))
                .senha(rs.getString("senha"))
                .tipoCoordenador(rs.getString("tipo_coordenador"))
                .departamento(rs.getString("departamento"))
                .cursoCodigo(rs.getString("curso_codigo"))
                .ultimaAlteracaoCredenciais(extractUltimaAlteracao(rs))
                .build();
    }

    public Map<String, String> loginRepository(String email, String password) {
        String query = "SELECT * FROM coordenador WHERE email = ? AND senha = ?";

        try {
            Map<String, Object> userLogin = jdbcTemplate.queryForMap(query, email, password);

            Map<String, String> result = new HashMap<>();

            result.put("email", (String) userLogin.get("email"));
            result.put("senha", (String) userLogin.get("senha"));
            result.put("nome", (String) userLogin.get("nome"));
            result.put("tipo_coordenador", (String) userLogin.get("tipo_coordenador"));
            result.put("matricula", (String) userLogin.get("matricula"));
            result.put("departamento", (String) userLogin.get("departamento"));
            result.put("curso_codigo", (String) userLogin.get("curso_codigo"));

            Object rawTs = userLogin.get("ultima_alteracao_credenciais");
            LocalDateTime ultimaAlt = LocalDateTime.now();
            if (rawTs instanceof Timestamp ts) {
                ultimaAlt = ts.toLocalDateTime();
            } else if (rawTs instanceof LocalDateTime ldt) {
                ultimaAlt = ldt;
            }
            long diasDecorridos = Math.max(0, ChronoUnit.DAYS.between(ultimaAlt, LocalDateTime.now()));
            long diasRestantes = Math.max(0, 7 - diasDecorridos);
            boolean isDiretor = "DIRETOR".equalsIgnoreCase(result.get("tipo_coordenador"));
            boolean expirado = isDiretor && diasDecorridos >= 7;
            boolean solicitarAlteracao = isDiretor && (diasRestantes <= 3 || "123456".equals(password) || expirado);

            result.put("ultima_alteracao_credenciais", ultimaAlt.toString());
            result.put("dias_restantes_credenciais", String.valueOf(diasRestantes));
            result.put("solicitar_alteracao_credenciais", String.valueOf(solicitarAlteracao));
            result.put("credenciais_expiradas", String.valueOf(expirado));

            return result;
        } catch (Exception e) {
            throw new RuntimeException("Credenciais inválidas ou usuário não encontrado para: " + email);
        }
    }

    public List<Coordenador> findAll() {
        String sql = "SELECT * FROM coordenador";
        return jdbcTemplate.query(sql, this::mapRow);
    }

    public void save(Coordenador coordenador) {
        if (existsByMatricula(coordenador.getMatricula())) {
            update(coordenador);
        } else {
            LocalDateTime ultimaAlt = coordenador.getUltimaAlteracaoCredenciais() != null
                    ? coordenador.getUltimaAlteracaoCredenciais()
                    : LocalDateTime.now();
            String sql = "INSERT INTO coordenador (matricula, nome, email, senha, tipo_coordenador, departamento, curso_codigo, ultima_alteracao_credenciais) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            jdbcTemplate.update(sql,
                    coordenador.getMatricula(),
                    coordenador.getNome(),
                    coordenador.getEmail(),
                    coordenador.getSenha(),
                    coordenador.getTipoCoordenador(),
                    coordenador.getDepartamento(),
                    coordenador.getCursoCodigo(),
                    Timestamp.valueOf(ultimaAlt));
        }
    }

    public void update(Coordenador coordenador) {
        LocalDateTime ultimaAlt = coordenador.getUltimaAlteracaoCredenciais() != null
                ? coordenador.getUltimaAlteracaoCredenciais()
                : LocalDateTime.now();
        String sql = "UPDATE coordenador SET nome = ?, email = ?, senha = ?, departamento = ?, curso_codigo = ?, tipo_coordenador = ?, ultima_alteracao_credenciais = ? WHERE matricula = ?";
        jdbcTemplate.update(sql,
                coordenador.getNome(),
                coordenador.getEmail(),
                coordenador.getSenha(),
                coordenador.getDepartamento(),
                coordenador.getCursoCodigo(),
                coordenador.getTipoCoordenador(),
                Timestamp.valueOf(ultimaAlt),
                coordenador.getMatricula());
    }

    public void updateSenhaByEmail(String email, String senha) {
        String sql = "UPDATE coordenador SET senha = ?, ultima_alteracao_credenciais = CURRENT_TIMESTAMP WHERE email = ?";
        jdbcTemplate.update(sql, senha, email);
    }

    public Optional<Coordenador> findCoordenadorByMatricula(String matricula) {
        String sql = "SELECT * FROM coordenador WHERE matricula = ?";
        List<Coordenador> list = jdbcTemplate.query(sql, this::mapRow, matricula);
        return list.stream().findFirst();
    }

    public Optional<Coordenador> findByEmailObject(String email) {
        String sql = "SELECT * FROM coordenador WHERE email = ?";
        List<Coordenador> list = jdbcTemplate.query(sql, this::mapRow, email);
        return list.stream().findFirst();
    }

    public boolean existsByMatricula(String matricula) {
        String sql = "SELECT COUNT(*) FROM coordenador WHERE matricula = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, matricula);
        return count != null && count > 0;
    }

    public void deleteByMatricula(String matricula) {
        String sql = "DELETE FROM coordenador WHERE matricula = ?";
        jdbcTemplate.update(sql, matricula);
    }

    public void deleteById(Long id) {
        String sql = "DELETE FROM coordenador WHERE id = ?";
        jdbcTemplate.update(sql, id);
    }
}
