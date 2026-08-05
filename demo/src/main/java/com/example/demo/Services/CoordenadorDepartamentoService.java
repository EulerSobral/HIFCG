package com.example.demo.Services;

import com.example.demo.Entity.*;
import com.example.demo.Interface.CoordenadorFactory;
import com.example.demo.Interface.Recurso;
import com.example.demo.Repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Scanner;

@Service
@RequiredArgsConstructor
public class CoordenadorDepartamentoService implements CoordenadorFactory, Recurso {

    private final CoordenadorRepository coordenadorRepository;
    private final AmbienteRepository ambienteRepository;
    private final DocenteRepository docenteRepository;
    private final DisciplinaRepository disciplinaRepository;
    private final CursoRepository cursoRepository;

    private final Scanner scanner = new Scanner(System.in);

    public Map<String, String> login(String email, String password) throws Exception {
        try{
            return coordenadorRepository.loginRepository(email, password);
        }
        catch(Exception e){throw new Exception("Error");}
    }

    @Override
    @Transactional
    public void cadastrarCoordenador(String matricula, String nome, String email, String curso, String password) {
        Coordenador coordenador = Coordenador.builder()
                .matricula(matricula)
                .nome(nome)
                .email(email)
                .cursoCodigo(curso)
                .senha(password)
                .tipoCoordenador("CURSO")
                .build();
        coordenadorRepository.save(coordenador);
    }

    @Override
    @Transactional
    public void removerCoordenador(String matricula) {
        coordenadorRepository.deleteByMatricula(matricula);
    }

    @Override
    @Transactional
    public void alterarCoordenador(String matricula) {
        coordenadorRepository.findCoordenadorByMatricula(matricula).ifPresentOrElse(coordenador -> {
            System.out.print("Novo nome do coordenador: ");
            coordenador.setNome(scanner.nextLine());

            System.out.print("Novo email: ");
            coordenador.setEmail(scanner.nextLine());

            System.out.print("Novo código do curso: ");
            coordenador.setCursoCodigo(scanner.nextLine());

            System.out.print("Nova senha: ");
            coordenador.setSenha(scanner.nextLine());

            coordenadorRepository.update(coordenador);
            System.out.println("Coordenador alterado com sucesso!");
        }, () -> System.out.println("Coordenador não encontrado!"));
    }


    @Override
    @Transactional
    public void cadastrarRecurso(int tipo_recurso) {
        switch (tipo_recurso) {
            case 1:
                System.out.print("Qual é o código do ambiente? ");
                String codigo = scanner.nextLine();

                System.out.print("Qual é a descrição/nome do ambiente? ");
                String descricao = scanner.nextLine();

                System.out.print("Qual é o nome do ambiente? ");
                String nome_ambiente = scanner.nextLine();

                System.out.print("Qual é a capacidade do ambiente? ");
                int capacidade = Integer.parseInt(scanner.nextLine());

                System.out.print("Qual é o tipo do ambiente? ");
                String tipo = scanner.nextLine();

                Ambiente ambiente = Ambiente.builder()
                        .codigo(codigo)
                        .nome(nome_ambiente)
                        .capacidade(capacidade)
                        .tipo(tipo)
                        .descricao(descricao)
                        .build();

                ambienteRepository.save(ambiente);
                System.out.println("Ambiente salvo com sucesso!");
                break;

            case 2:
                System.out.print("Qual é a matrícula do docente? ");
                String matricula = scanner.nextLine();

                System.out.print("Qual é o nome do docente? ");
                String nome_docente = scanner.nextLine();

                System.out.print("Qual é o email do docente? ");
                String email = scanner.nextLine();

                System.out.print("Qual é o departamento do docente? ");
                String departamento = scanner.nextLine();

                Docente docente = Docente.builder()
                        .matricula(matricula)
                        .email(email)
                        .nome(nome_docente)
                        .departamento(departamento)
                        .build();

                docenteRepository.save(docente);
                System.out.println("Docente salvo com sucesso!");
                break;

            case 3:
                System.out.print("Qual é o código da disciplina? ");
                String codigo_disciplina = scanner.nextLine();

                System.out.print("Qual é o nome da disciplina? ");
                String nome_disciplina = scanner.nextLine();

                System.out.print("Qual é a carga horária? ");
                int carga_horaria = Integer.parseInt(scanner.nextLine());

                System.out.print("Qual é o curso? ");
                String curso = scanner.nextLine();

                List<Curso> cursos = cursoRepository.findByNomeContainingIgnoreCase(curso);
                Curso cursoEncontrado = cursos.isEmpty() ? null : cursos.get(0);

                Disciplina disciplina = Disciplina.builder()
                        .codigo(codigo_disciplina)
                        .nome(nome_disciplina)
                        .cargaHoraria(carga_horaria)
                        .curso(cursoEncontrado)
                        .build();

                disciplinaRepository.save(disciplina);
                System.out.println("Disciplina salva com sucesso!");
                break;

            default:
                System.out.println("Tipo de recurso inválido!");
                break;
        }
    }

    @Override
    @Transactional
    public void alterarRecurso(int tipo_recurso) {
        switch (tipo_recurso) {
            case 1:
                System.out.print("Qual é o código do ambiente a ser alterado? ");
                String codigoAmbiente = scanner.nextLine();

                ambienteRepository.findByCodigo(codigoAmbiente).ifPresentOrElse(ambiente -> {
                    System.out.print("Novo nome do ambiente: ");
                    ambiente.setNome(scanner.nextLine());

                    System.out.print("Nova descrição: ");
                    ambiente.setDescricao(scanner.nextLine());

                    System.out.print("Nova capacidade: ");
                    ambiente.setCapacidade(Integer.parseInt(scanner.nextLine()));

                    System.out.print("Novo tipo: ");
                    ambiente.setTipo(scanner.nextLine());

                    ambienteRepository.save(ambiente);
                    System.out.println("Ambiente alterado com sucesso!");
                }, () -> System.out.println("Ambiente não encontrado!"));
                break;

            case 2:
                System.out.print("Qual é a matrícula do docente a ser alterado? ");
                String matriculaDocente = scanner.nextLine();

                docenteRepository.findByMatricula(matriculaDocente).ifPresentOrElse(docente -> {
                    System.out.print("Novo nome: ");
                    docente.setNome(scanner.nextLine());

                    System.out.print("Novo email: ");
                    docente.setEmail(scanner.nextLine());

                    System.out.print("Novo departamento: ");
                    docente.setDepartamento(scanner.nextLine());

                    docenteRepository.save(docente);
                    System.out.println("Docente alterado com sucesso!");
                }, () -> System.out.println("Docente não encontrado!"));
                break;

            case 3:
                System.out.print("Qual é o código da disciplina a ser alterada? ");
                String codigoDisciplina = scanner.nextLine();

                disciplinaRepository.findByCodigo(codigoDisciplina).ifPresentOrElse(disciplina -> {
                    System.out.print("Novo nome: ");
                    disciplina.setNome(scanner.nextLine());

                    System.out.print("Nova carga horária: ");
                    disciplina.setCargaHoraria(Integer.parseInt(scanner.nextLine()));

                    disciplinaRepository.save(disciplina);
                    System.out.println("Disciplina alterada com sucesso!");
                }, () -> System.out.println("Disciplina não encontrada!"));
                break;

            default:
                System.out.println("Tipo de recurso inválido!");
                break;
        }
    }

    @Override
    @Transactional
    public void excluirRecurso(int tipo_recurso) {
        switch (tipo_recurso) {
            case 1:
                System.out.print("Qual é o código do ambiente a ser excluído? ");
                String codigoAmbiente = scanner.nextLine();
                if (ambienteRepository.existsByCodigo(codigoAmbiente)) {
                    ambienteRepository.deleteByCodigo(codigoAmbiente);
                    System.out.println("Ambiente excluído com sucesso!");
                } else {
                    System.out.println("Ambiente não encontrado!");
                }
                break;

            case 2:
                System.out.print("Qual é a matrícula do docente a ser excluído? ");
                String matriculaDocente = scanner.nextLine();
                if (docenteRepository.existsByMatricula(matriculaDocente)) {
                    docenteRepository.deleteByMatricula(matriculaDocente);
                    System.out.println("Docente excluído com sucesso!");
                } else {
                    System.out.println("Docente não encontrado!");
                }
                break;

            case 3:
                System.out.print("Qual é o código da disciplina a ser excluída? ");
                String codigoDisciplina = scanner.nextLine();
                if (disciplinaRepository.existsByCodigo(codigoDisciplina)) {
                    disciplinaRepository.deleteByCodigo(codigoDisciplina);
                    System.out.println("Disciplina excluída com sucesso!");
                } else {
                    System.out.println("Disciplina não encontrada!");
                }
                break;

            default:
                System.out.println("Tipo de recurso inválido!");
                break;
        }
    }
}
