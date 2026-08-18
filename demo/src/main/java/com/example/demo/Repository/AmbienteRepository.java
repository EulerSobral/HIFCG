package com.example.demo.Repository;

import com.example.demo.Entity.Ambiente;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class AmbienteRepository {

    private final JdbcTemplate jdbcTemplate;

    public AmbienteRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void update(Ambiente ambiente) {
        String sql = "UPDATE ambiente SET nome = ?, descricao = ?, capacidade = ?, tipo = ? WHERE codigo = ?";
        jdbcTemplate.update(sql,
                ambiente.getNome(),
                ambiente.getDescricao(),
                ambiente.getCapacidade(),
                ambiente.getTipo(),
                ambiente.getCodigo());
    }

    public void save(Ambiente ambiente) {
        if (existsByCodigo(ambiente.getCodigo())) {
            update(ambiente);
        } else {
            String sql = "INSERT INTO ambiente (codigo, nome, descricao, capacidade, tipo) VALUES (?, ?, ?, ?, ?)";
            jdbcTemplate.update(sql,
                    ambiente.getCodigo(),
                    ambiente.getNome(),
                    ambiente.getDescricao(),
                    ambiente.getCapacidade(),
                    ambiente.getTipo());
        }
    }

    public Optional<Ambiente> findByCodigo(String codigo) {
        String sql = "SELECT * FROM ambiente WHERE codigo = ?";
        List<Ambiente> list = jdbcTemplate.query(sql, (rs, rowNum) -> Ambiente.builder()
                .id(rs.getLong("id"))
                .codigo(rs.getString("codigo"))
                .nome(rs.getString("nome"))
                .descricao(rs.getString("descricao"))
                .capacidade(rs.getInt("capacidade"))
                .tipo(rs.getString("tipo"))
                .build(), codigo);
        return list.stream().findFirst();
    }

    public boolean existsByCodigo(String codigo) {
        String sql = "SELECT COUNT(*) FROM ambiente WHERE codigo = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, codigo);
        return count != null && count > 0;
    }

    public void deleteByCodigo(String codigo) {
        String sql = "DELETE FROM ambiente WHERE codigo = ?";
        jdbcTemplate.update(sql, codigo);
    }

    public Optional<Ambiente> findByNomeContainingIgnoreCaseOrCodigoContainingIgnoreCase(String nome, String codigo) {
        String sql = "SELECT * FROM ambiente WHERE LOWER(nome) LIKE LOWER(?) OR codigo = ?";
        List<Ambiente> list = jdbcTemplate.query(sql, (rs, rowNum) -> Ambiente.builder()
                .id(rs.getLong("id"))
                .codigo(rs.getString("codigo"))
                .nome(rs.getString("nome"))
                .descricao(rs.getString("descricao"))
                .capacidade(rs.getInt("capacidade"))
                .tipo(rs.getString("tipo"))
                .build(), "%" + nome + "%", codigo);
        return list.stream().findFirst();
    }
}
