package com.example.demo;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DemoApplication implements CommandLineRunner {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        System.out.println("\n========================================================");
        System.out.println("   HIFCG: Sistema de Gestão de Alocação de Horários    ");
        System.out.println("========================================================");
        System.out.println(" [✓] Banco H2 Inicializado com dados padrão de teste:   ");
        System.out.println("     - Coordenador de Departamento:                    ");
        System.out.println("       Matrícula: DEP001                               ");
        System.out.println("       Email:     coord.depto@ifpb.edu.br              ");
        System.out.println("       Senha:     senha123                             ");
        System.out.println("       Tipo:      AREA_DEPARTAMENTO                    ");
        System.out.println("     - Coordenador de Curso:                           ");
        System.out.println("       Matrícula: COORD001                             ");
        System.out.println("       Email:     coord.curso@ifpb.edu.br              ");
        System.out.println("       Senha:     senha123                             ");
        System.out.println("========================================================\n");
    }
}
