package com.example.demo.Entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "coordenador")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Coordenador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String matricula;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private String senha;

    @Column(name = "tipo_coordenador", nullable = false, length = 30)
    private String tipoCoordenador;

    @Column(length = 100)
    private String departamento;

    @Column(name = "curso_codigo", length = 50)
    private String cursoCodigo;
}
