package com.example.demo.Entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "disciplina")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Disciplina {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String codigo;

    @Column(nullable = false, length = 100)
    private String nome;


    @Lob
    private String ementa;


    @Column(length = 100)
    private String especialidade;

    @Column(name = "carga_horaria", nullable = false)
    private Integer cargaHoraria;

    @Column(name = "aulas_semanais", nullable = false)
    private Integer aulasSemanais;

    @Column(name = "periodo", nullable = false)
    private Integer periodo;

    @Column(name = "docente_id", length = 50)
    private String docente;

    @JoinColumn(name = "curso_id", nullable = false)
    private String curso;
}
