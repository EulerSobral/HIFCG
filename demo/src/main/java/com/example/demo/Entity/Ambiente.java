package com.example.demo.Entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ambiente")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ambiente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String codigo;

    @Column(nullable = false, length = 100)
    private String nome;


    @Column(nullable = true, length = 1000)
    private String descricao;

    @Column(nullable = false)
    private Integer capacidade;

    @Column(nullable = false, length = 50)
    private String tipo;
}
