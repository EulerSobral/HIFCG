package com.example.demo.Repository;

import com.example.demo.Entity.Coordenador;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

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

            return result;
        } catch (Exception e) {
            throw new RuntimeException("Credenciais inválidas ou usuário não encontrado para: " + email);
        }
    }

    public List<Coordenador> findAll() {
        String sql = "SELECT * FROM coordenador";
        return jdbcTemplate.query(sql, (rs, rowNum) -> Coordenador.builder()
                .id(rs.getLong("id"))
                .matricula(rs.getString("matricula"))
                .nome(rs.getString("nome"))
                .email(rs.getString("email"))
                .senha(rs.getString("senha"))
                .tipoCoordenador(rs.getString("tipo_coordenador"))
                .departamento(rs.getString("departamento"))
                .cursoCodigo(rs.getString("curso_codigo"))
                .build());
    }

    public void save(Coordenador coordenador) {
        if (existsByMatricula(coordenador.getMatricula())) {
            update(coordenador);
        } else {
            String sql = "INSERT INTO coordenador (matricula, nome, email, senha, tipo_coordenador, departamento, curso_codigo) VALUES (?, ?, ?, ?, ?, ?, ?)";
            jdbcTemplate.update(sql,
                    coordenador.getMatricula(),
                    coordenador.getNome(),
                    coordenador.getEmail(),
                    coordenador.getSenha(),
                    coordenador.getTipoCoordenador(),
                    coordenador.getDepartamento(),
                    coordenador.getCursoCodigo());
        }
    }

    public void update(Coordenador coordenador) {
        String sql = "UPDATE coordenador SET nome = ?, email = ?, senha = ?, departamento = ?, curso_codigo = ?, tipo_coordenador = ? WHERE matricula = ?";
        jdbcTemplate.update(sql,
                coordenador.getNome(),
                coordenador.getEmail(),
                coordenador.getSenha(),
                coordenador.getDepartamento(),
                coordenador.getCursoCodigo(),
                coordenador.getTipoCoordenador(),
                coordenador.getMatricula());
    }

    public void updateSenhaByEmail(String email, String senha) {
        String sql = "UPDATE coordenador SET senha = ? WHERE email = ?";
        jdbcTemplate.update(sql, senha, email);
    }

    public Optional<Coordenador> findCoordenadorByMatricula(String matricula) {
        String sql = "SELECT * FROM coordenador WHERE matricula = ?";
        List<Coordenador> list = jdbcTemplate.query(sql, (rs, rowNum) -> Coordenador.builder()
                .id(rs.getLong("id"))
                .matricula(rs.getString("matricula"))
                .nome(rs.getString("nome"))
                .email(rs.getString("email"))
                .senha(rs.getString("senha"))
                .tipoCoordenador(rs.getString("tipo_coordenador"))
                .departamento(rs.getString("departamento"))
                .cursoCodigo(rs.getString("curso_codigo"))
                .build(), matricula);
        return list.stream().findFirst();
    }

    public Optional<Coordenador> findByEmailObject(String email) {
        String sql = "SELECT * FROM coordenador WHERE email = ?";
        List<Coordenador> list = jdbcTemplate.query(sql, (rs, rowNum) -> Coordenador.builder()
                .id(rs.getLong("id"))
                .matricula(rs.getString("matricula"))
                .nome(rs.getString("nome"))
                .email(rs.getString("email"))
                .senha(rs.getString("senha"))
                .tipoCoordenador(rs.getString("tipo_coordenador"))
                .departamento(rs.getString("departamento"))
                .cursoCodigo(rs.getString("curso_codigo"))
                .build(), email);
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
