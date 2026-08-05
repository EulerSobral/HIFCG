package com.example.demo.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "log_sistema")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LogSistema {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_matricula", nullable = false, length = 50)
    private String usuarioMatricula;

    @Column(nullable = false)
    private String acao;

    @Lob
    private String detalhes;

    @Column(name = "data_hora", nullable = false)
    @Builder.Default
    private LocalDateTime dataHora = LocalDateTime.now();
}
