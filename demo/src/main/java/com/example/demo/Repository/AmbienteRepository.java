package com.example.demo.Repository;

import com.example.demo.Entity.Ambiente;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Scanner;

@Repository
public class AmbienteRepository  {

    private final Scanner scanner = new Scanner(System.in);

    private final JdbcTemplate jdbcTemplate;

    public AmbienteRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<Ambiente> findByCodigo(String codigo){

        System.out.print("Qual é o código do ambiente? ");
        String codigo_ambiente = scanner.nextLine();

        System.out.print("Qual é a descrição/nome do ambiente? ");
        String descricao = scanner.nextLine();

        System.out.print("Qual é o nome do ambiente? ");
        String nome_ambiente = scanner.nextLine();

        System.out.print("Qual é a capacidade do ambiente? ");
        int capacidade = Integer.parseInt(scanner.nextLine());

        System.out.print("Qual é o tipo do ambiente? ");
        String tipo = scanner.nextLine();

        String sql = "SELECT * FROM ambiente WHERE codigo = ?";
        List<Ambiente> list = jdbcTemplate.query(sql, (rs, rowNum) -> Ambiente.builder()
                .codigo(codigo_ambiente)
                .nome(nome_ambiente)
                .capacidade(capacidade)
                .tipo(tipo)
                .descricao(descricao)
                .build(), codigo);
        return list.stream().findFirst();
    }
    public boolean existsByCodigo(String codigo){
        String sql = "SELECT COUNT(*) FROM ambiente WHERE codigo = ?";

        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, codigo);
        return count != null && count > 0;
    }
    public void deleteByCodigo(String codigo){
        String sql = "DELETE FROM ambiente WHERE codigo = ?";
        jdbcTemplate.update(sql, codigo);
    }
   public Optional<Ambiente> findByNomeContainingIgnoreCaseOrCodigoContainingIgnoreCase(String nome, String codigo){
        String sql = "SELECT * FROM ambiente WHERE nome LIKE ? OR codigo = ?";
       List<Ambiente> list = jdbcTemplate.query(sql, (rs, rowNum) -> Ambiente.builder()
               .codigo("codigo")
               .nome("nome_ambiente")
               .build(), codigo);
       return list.stream().findFirst();
   };
}
