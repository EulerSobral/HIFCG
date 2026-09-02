package com.example.demo.Entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "periodo")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Periodo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String codigo;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, length = 20)
    private String inicio;

    @Column(nullable = false, length = 20)
    private String fim;

    @Column(name = "inicio_matricula", length = 20)
    private String inicioMatricula;

    @Column(name = "fim_matricula", length = 20)
    private String fimMatricula;

    @Column(nullable = false)
    private boolean ativo;
}
