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

    public  Map<String, String> loginRepository(String email, String password){

        String query = "SELECT * FROM coordenador WHERE email = ? AND password = ?";

        try {
            Map<String, Object> userLogin = jdbcTemplate.queryForMap(query, email, password);

            Map<String, String> result = new HashMap<>();

            result.put("email", (String) userLogin.get("email"));
            result.put("password", (String) userLogin.get("password"));

            return result;
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

    }

    public void save(Coordenador coordenador) {
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

    public void update(Coordenador coordenador) {
        String sql = "UPDATE coordenador SET nome = ?, email = ?, senha = ?, departamento = ?, curso_codigo = ? WHERE matricula = ?";
        jdbcTemplate.update(sql,
                coordenador.getNome(),
                coordenador.getEmail(),
                coordenador.getSenha(),
                coordenador.getDepartamento(),
                coordenador.getCursoCodigo(),
                coordenador.getMatricula());
    }

    public Optional<Coordenador> findCoordenadorByMatricula(String matricula) {
        String sql = "SELECT * FROM coordenador WHERE matricula = ?";
        List<Coordenador> list = jdbcTemplate.query(sql, (rs, rowNum) -> Coordenador.builder()
                .build(), matricula);
        return list.stream().findFirst();
    }

    public List<String> findByMatricula(String matricula) {
        String sql = "select * from coordenador where matricula=?";
        return jdbcTemplate.query(sql, (rs, rowNum) -> rs.getString("matricula"));
    }

    public List<String> findByEmail(String email) {
        String sql = "select * from coordenador where email = ?";
        return jdbcTemplate.query(sql, (rs, rowNum) -> rs.getString("email"));
    }

    public boolean existsByMatricula(String matricula) {
        String sql = "select count(*) from coordenador where matricula = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, matricula);
        return count != null && count > 0;
    }

    public void deleteByMatricula(String matricula) {
        String sql = "delete from coordenador where matricula = ?";
        jdbcTemplate.update(sql, matricula);
    }
}
