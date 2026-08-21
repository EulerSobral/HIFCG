package com.example.demo.Services;

import com.example.demo.Entity.*;
import com.example.demo.Interface.Recurso;
import com.example.demo.Repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Time;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CoordenadorCursoService implements Recurso {

    private final CoordenadorRepository coordenadorRepository;
    private final AmbienteRepository ambienteRepository;
    private final DocenteRepository docenteRepository;
    private final DisciplinaRepository disciplinaRepository;
    private final CursoRepository cursoRepository;
    private final AlocacaoHorarioRepository alocacaoHorarioRepository;

    public Map<String, String> login(String email, String password) throws Exception {
        try {
            return coordenadorRepository.loginRepository(email, password);
        } catch (Exception e) {
            throw new Exception("Error");
        }
    }

    public void updateConta(String email, String password) {
        coordenadorRepository.updateSenhaByEmail(email, password);
    }

    @Override
    @Transactional
    public void cadastrarRecurso(int tipo_recurso, Map<String, Object> dados) {
        switch (tipo_recurso) {
            case 1: // Ambiente
                Ambiente ambiente = Ambiente.builder()
                        .codigo(dados.get("codigo") != null ? dados.get("codigo").toString() : null)
                        .nome(dados.get("nome") != null ? dados.get("nome").toString() : null)
                        .capacidade(dados.get("capacidade") != null ? Integer.parseInt(dados.get("capacidade").toString()) : 0)
                        .tipo(dados.get("tipo") != null ? dados.get("tipo").toString() : null)
                        .descricao(dados.get("descricao") != null ? dados.get("descricao").toString() : null)
                        .build();
                ambienteRepository.save(ambiente);
                break;

            case 2: // Docente
                Docente docente = Docente.builder()
                        .matricula(dados.get("matricula") != null ? dados.get("matricula").toString() : null)
                        .nome(dados.get("nome") != null ? dados.get("nome").toString() : null)
                        .email(dados.get("email") != null ? dados.get("email").toString() : null)
                        .departamento(dados.get("departamento") != null ? dados.get("departamento").toString() : null)
                        .build();
                docenteRepository.save(docente);
                break;

            case 3: // Disciplina
                String cursoNome = dados.get("curso") != null ? dados.get("curso").toString() : "";
                List<Curso> cursos = cursoRepository.findByNomeContainingIgnoreCase(cursoNome);
                Curso cursoEncontrado = cursos.isEmpty() ? null : cursos.get(0);

                Disciplina disciplina = Disciplina.builder()
                        .codigo(dados.get("codigo") != null ? dados.get("codigo").toString() : null)
                        .nome(dados.get("nome") != null ? dados.get("nome").toString() : null)
                        .cargaHoraria(dados.get("cargaHoraria") != null ? Integer.parseInt(dados.get("cargaHoraria").toString()) : 0)
                        .curso(cursoEncontrado != null ? cursoEncontrado.getCodigo() : cursoNome)
                        .build();
                disciplinaRepository.save(disciplina);
                break;

            default:
                throw new IllegalArgumentException("Tipo de recurso inválido: " + tipo_recurso);
        }
    }

    @Override
    @Transactional
    public void alterarRecurso(int tipo_recurso, Map<String, Object> dados) {
        String codigo = dados.get("codigo") != null ? dados.get("codigo").toString() : 
                       (dados.get("matricula") != null ? dados.get("matricula").toString() : "");

        switch (tipo_recurso) {
            case 1: // Ambiente
                ambienteRepository.findByCodigo(codigo).ifPresentOrElse(ambiente -> {
                    if (dados.containsKey("nome")) ambiente.setNome(dados.get("nome").toString());
                    if (dados.containsKey("descricao")) ambiente.setDescricao(dados.get("descricao").toString());
                    if (dados.containsKey("capacidade")) ambiente.setCapacidade(Integer.parseInt(dados.get("capacidade").toString()));
                    if (dados.containsKey("tipo")) ambiente.setTipo(dados.get("tipo").toString());
                    ambienteRepository.save(ambiente);
                }, () -> { throw new RuntimeException("Ambiente não encontrado: " + codigo); });
                break;

            case 2: // Docente
                docenteRepository.findByMatricula(codigo).ifPresentOrElse(docente -> {
                    if (dados.containsKey("nome")) docente.setNome(dados.get("nome").toString());
                    if (dados.containsKey("email")) docente.setEmail(dados.get("email").toString());
                    if (dados.containsKey("departamento")) docente.setDepartamento(dados.get("departamento").toString());
                    docenteRepository.save(docente);
                }, () -> { throw new RuntimeException("Docente não encontrado: " + codigo); });
                break;

            case 3: // Disciplina
                disciplinaRepository.findByCodigo(codigo).ifPresentOrElse(disciplina -> {
                    if (dados.containsKey("nome")) disciplina.setNome(dados.get("nome").toString());
                    if (dados.containsKey("cargaHoraria")) disciplina.setCargaHoraria(Integer.parseInt(dados.get("cargaHoraria").toString()));
                    disciplinaRepository.save(disciplina);
                }, () -> { throw new RuntimeException("Disciplina não encontrada: " + codigo); });
                break;

            default:
                throw new IllegalArgumentException("Tipo de recurso inválido: " + tipo_recurso);
        }
    }

    @Override
    @Transactional
    public void excluirRecurso(int tipo_recurso, String identificador) {
        switch (tipo_recurso) {
            case 1:
                if (ambienteRepository.existsByCodigo(identificador)) {
                    ambienteRepository.deleteByCodigo(identificador);
                } else {
                    throw new RuntimeException("Ambiente não encontrado: " + identificador);
                }
                break;

            case 2:
                if (docenteRepository.existsByMatricula(identificador)) {
                    docenteRepository.deleteByMatricula(identificador);
                } else {
                    throw new RuntimeException("Docente não encontrado: " + identificador);
                }
                break;

            case 3:
                if (disciplinaRepository.existsByCodigo(identificador)) {
                    disciplinaRepository.deleteByCodigo(identificador);
                } else {
                    throw new RuntimeException("Disciplina não encontrada: " + identificador);
                }
                break;

            default:
                throw new IllegalArgumentException("Tipo de recurso inválido: " + tipo_recurso);
        }
    }

    @Transactional
    public void alocarRecurso(String codigoDisciplina, String matriculaDocente, String codigoAmbiente, String codigoTurma, String codigoPeriodo, Time horario_inicio, Time horario_fim) {
        alocacaoHorarioRepository.alocarHorario(codigoDisciplina, matriculaDocente, codigoAmbiente, codigoTurma, codigoPeriodo, horario_inicio, horario_fim);
    }

    @Transactional
    public void alocarRecurso(String codigoDisciplina, String matriculaDocente, String codigoAmbiente, String codigoTurma, String codigoPeriodo, String diaSemana, Time horario_inicio, Time horario_fim) {
        alocacaoHorarioRepository.alocarHorario(codigoDisciplina, matriculaDocente, codigoAmbiente, codigoTurma, codigoPeriodo, diaSemana, horario_inicio, horario_fim);
    }
}
