package com.example.demo.Controller;

import com.example.demo.Services.CoordenadorCursoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.Time;
import java.util.Map;

@RestController
@RequestMapping("/CoordenadorCurso")
public class CoordenadorCursoController {

    private final CoordenadorCursoService coordenadorCursoService;

    public CoordenadorCursoController(CoordenadorCursoService service) {
        this.coordenadorCursoService = service;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        try {
            Map<String, String> result = coordenadorCursoService.login(
                    credentials.get("email"), 
                    credentials.get("password")
            );
            result.put("token", credentials.get("token"));
            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/recursos/{tipoRecurso}")
    public ResponseEntity<?> cadastrarRecurso(
            @PathVariable int tipoRecurso,
            @RequestBody Map<String, Object> dados,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            coordenadorCursoService.cadastrarRecurso(tipoRecurso, dados);
            return ResponseEntity.ok("Recurso cadastrado com sucesso pelo Coordenador de Curso!");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PutMapping("/recursos/{tipoRecurso}")
    public ResponseEntity<?> alterarRecurso(
            @PathVariable int tipoRecurso,
            @RequestBody Map<String, Object> dados,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            coordenadorCursoService.alterarRecurso(tipoRecurso, dados);
            return ResponseEntity.ok("Recurso alterado com sucesso pelo Coordenador de Curso!");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @DeleteMapping("/recursos/{tipoRecurso}/{identificador}")
    public ResponseEntity<?> excluirRecurso(
            @PathVariable int tipoRecurso,
            @PathVariable String identificador,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            coordenadorCursoService.excluirRecurso(tipoRecurso, identificador);
            return ResponseEntity.ok("Recurso excluído com sucesso pelo Coordenador de Curso!");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("alocarRecurso")
    public ResponseEntity<?> alocarRecurso(
            @RequestBody Map<String, String> map,
            @RequestHeader(value = "Authorization", required = false) String token) {
        try {
            String disciplina = map.get("codigoDisciplina");
            String matricula = map.get("codigoMatricula");
            String ambiente = map.get("codigoAmbiente");
            String turma = map.get("codigoTurma");
            String periodo = map.get("codigoPeriodo");
            Time horario_inicio = Time.valueOf(map.get("horarioInicio"));
            Time horario_fim = Time.valueOf(map.get("horarioFim"));

            coordenadorCursoService.alocarRecurso(disciplina, matricula, ambiente, turma, periodo, horario_inicio, horario_fim);
            return ResponseEntity.ok("Recursos alocodaos no horário");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }

    }
}
