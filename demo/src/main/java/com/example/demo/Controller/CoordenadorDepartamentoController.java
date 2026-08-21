package com.example.demo.Controller;

import com.example.demo.Services.CoordenadorDepartamentoService;
import com.example.demo.Services.TokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.Time;
import java.util.Map;

@RestController
@RequestMapping("/CoordenadorDepartamento")
public class CoordenadorDepartamentoController {

    private final CoordenadorDepartamentoService coordenadorDepartamentoService;
    private final TokenService tokenService;

    public CoordenadorDepartamentoController(CoordenadorDepartamentoService service, TokenService tokenService) {
        this.coordenadorDepartamentoService = service;
        this.tokenService = tokenService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        try {
            Map<String, String> result = coordenadorDepartamentoService.login(
                    credentials.get("email"),
                    credentials.get("password")
            );
            String token = tokenService.generateToken(credentials.get("email"), credentials.get("password"));
            result.put("token",  token);
            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PutMapping("/alterarConta")
    public ResponseEntity<?> alterarConta(@RequestBody Map<String, String> credentials) {
        try {
            coordenadorDepartamentoService.updateConta(credentials.get("email"), credentials.get("password"));
            return ResponseEntity.ok("Conta alterado com sucesso");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/curso")
    public ResponseEntity<?> curso(@RequestBody Map<String, String> credentials) {
        try {
            String codigo = credentials.get("codigo");
            String nome = credentials.get("nome");
            String turno = credentials.get("turno");
            String nivel = credentials.get("nivel");
            String departamento = credentials.get("departamento");

            coordenadorDepartamentoService.cadastrarCurso(codigo, nome, turno, nivel, departamento);
            return ResponseEntity.ok("Curso cadastrado com sucesso");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/coordenadores")
    public ResponseEntity<?> cadastrarCoordenador(
            @RequestBody Map<String, String> map, 
            @RequestHeader(value = "Authorization") String token) {
        try {
            String matricula = map.get("matricula");
            String nome = map.get("nome");
            String email = map.get("email");
            String curso = map.get("curso");
            String password = map.get("password");

            coordenadorDepartamentoService.cadastrarCoordenador(matricula, nome, email, curso, password);
            return ResponseEntity.ok("Coordenador cadastrado com sucesso!");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PutMapping("/coordenadores/{matricula}")
    public ResponseEntity<?> alterarCoordenador(
            @PathVariable String matricula, 
            @RequestBody Map<String, String> map, 
            @RequestHeader(value = "Authorization") String token) {
        try {
            coordenadorDepartamentoService.alterarCoordenador(matricula, map);
            return ResponseEntity.ok("Coordenador alterado com sucesso!");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @DeleteMapping("/coordenadores/{matricula}")
    public ResponseEntity<?> removerCoordenador(
            @PathVariable String matricula, 
            @RequestHeader(value = "Authorization") String token) {
        try {
            coordenadorDepartamentoService.removerCoordenador(matricula);
            return ResponseEntity.ok("Coordenador removido com sucesso!");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/recursos/{tipoRecurso}")
    public ResponseEntity<?> cadastrarRecurso(
            @PathVariable int tipoRecurso,
            @RequestBody Map<String, Object> dados,
            @RequestHeader(value = "Authorization") String token) {
        try {
            coordenadorDepartamentoService.cadastrarRecurso(tipoRecurso, dados);
            return ResponseEntity.ok("Recurso cadastrado com sucesso!");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PutMapping("/recursos/{tipoRecurso}")
    public ResponseEntity<?> alterarRecurso(
            @PathVariable int tipoRecurso,
            @RequestBody Map<String, Object> dados,
            @RequestHeader(value = "Authorization") String token) {
        try {
            coordenadorDepartamentoService.alterarRecurso(tipoRecurso, dados);
            return ResponseEntity.ok("Recurso alterado com sucesso!");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @DeleteMapping("/recursos/{tipoRecurso}/{identificador}")
    public ResponseEntity<?> excluirRecurso(
            @PathVariable int tipoRecurso,
            @PathVariable String identificador,
            @RequestHeader(value = "Authorization") String token) {
        try {
            coordenadorDepartamentoService.excluirRecurso(tipoRecurso, identificador);
            return ResponseEntity.ok("Recurso excluído com sucesso!");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/alocarRecurso")
    public ResponseEntity<?> alocarRecurso(
            @RequestBody Map<String, String> map,
            @RequestHeader(value = "Authorization") String token) {
        try {
            String disciplina = map.get("codigoDisciplina");
            String matricula = map.get("codigoMatricula");
            String ambiente = map.get("codigoAmbiente");
            String turma = map.get("codigoTurma");
            String periodo = map.get("codigoPeriodo");
            String diaSemana = map.getOrDefault("diaSemana", "SEG");
            Time horario_inicio = Time.valueOf(map.get("horarioInicio"));
            Time horario_fim = Time.valueOf(map.get("horarioFim"));

            coordenadorDepartamentoService.alocarRecurso(disciplina, matricula, ambiente, turma, periodo, diaSemana, horario_inicio, horario_fim);
            return ResponseEntity.ok("Recursos alocados com sucesso no horário!");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @DeleteMapping("/removerHorario")
    public ResponseEntity<?> removerHorario(
            @RequestBody Map<String, String> map,
            @RequestHeader(value = "Authorization") String token) {
        try {
            String disciplina = map.get("codigoDisciplina");
            String matricula = map.get("codigoMatricula");
            String ambiente = map.get("codigoAmbiente");
            String turma = map.get("codigoTurma");
            String periodo = map.get("codigoPeriodo");
            String diaSemana = map.getOrDefault("diaSemana", "SEG");
            Time horario_inicio = Time.valueOf(map.get("horarioInicio"));
            Time horario_fim = Time.valueOf(map.get("horarioFim"));

            coordenadorDepartamentoService.removerAlocacoes(disciplina, matricula, ambiente, turma, periodo, diaSemana, horario_inicio, horario_fim);
            return ResponseEntity.ok("Horário removido com sucesso!");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/alterarHorario")
    public ResponseEntity<?> alterarHorario(
            @RequestBody Map<String, String> map,
            @RequestHeader(value = "Authorization") String token) {
        try {
            String disciplina = map.get("codigoDisciplina");
            String matricula = map.get("codigoMatricula");
            String ambiente = map.get("codigoAmbiente");
            String turma = map.get("codigoTurma");
            String periodo = map.get("codigoPeriodo");
            String diaSemana = map.getOrDefault("diaSemana", "SEG");
            Time horario_inicio = Time.valueOf(map.get("horarioInicio"));
            Time horario_fim = Time.valueOf(map.get("horarioFim"));

            coordenadorDepartamentoService.alterarAlocacoes(disciplina, matricula, ambiente, turma, periodo, diaSemana, horario_inicio, horario_fim);
            return ResponseEntity.ok("Horário alterado com sucesso!");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}
