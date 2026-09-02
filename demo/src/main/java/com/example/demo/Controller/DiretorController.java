package com.example.demo.Controller;

import com.example.demo.Entity.Coordenador;
import com.example.demo.Repository.CoordenadorRepository;
import com.example.demo.Repository.LogSistemaRepository;
import com.example.demo.Services.TokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/Diretor")
@CrossOrigin(origins = "*")
public class DiretorController {

    private final CoordenadorRepository coordenadorRepository;
    private final LogSistemaRepository logSistemaRepository;
    private final TokenService tokenService;

    public DiretorController(CoordenadorRepository coordenadorRepository, LogSistemaRepository logSistemaRepository, TokenService tokenService) {
        this.coordenadorRepository = coordenadorRepository;
        this.logSistemaRepository = logSistemaRepository;
        this.tokenService = tokenService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        try {
            Map<String, String> result = coordenadorRepository.loginRepository(
                    credentials.get("email"),
                    credentials.get("password")
            );
            String token = tokenService.generateToken(credentials.get("email"), result.get("tipo_coordenador"));
            result.put("token", token);
            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/coordenadoresArea")
    public ResponseEntity<?> cadastrarCoordenadorArea(@RequestBody Map<String, String> map) {
        try {
            Coordenador c = Coordenador.builder()
                    .matricula(map.get("matricula") != null ? map.get("matricula") : "DEP" + System.currentTimeMillis() % 10000)
                    .nome(map.get("nome"))
                    .email(map.get("email"))
                    .senha(map.get("password") != null ? map.get("password") : "123456")
                    .tipoCoordenador("AREA_DEPARTAMENTO")
                    .departamento(map.get("area") != null ? map.get("area") : "Informática")
                    .build();
            coordenadorRepository.save(c);
            return ResponseEntity.ok("Coordenador de Área cadastrado com sucesso pelo Diretor!");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @GetMapping("/logs")
    public ResponseEntity<?> consultarLogs() {
        try {
            return ResponseEntity.ok(logSistemaRepository.findAll());
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}
