package com.example.demo.Controller;

import com.example.demo.Entity.Coordenador;
import com.example.demo.Entity.LogSistema;
import com.example.demo.Repository.CoordenadorRepository;
import com.example.demo.Repository.LogSistemaRepository;
import com.example.demo.Services.TokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

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

    @PutMapping("/credenciais")
    public ResponseEntity<?> atualizarCredenciais(@RequestBody Map<String, String> body) {
        try {
            String matricula = body.getOrDefault("matricula", "DIR001");
            Optional<Coordenador> opt = coordenadorRepository.findCoordenadorByMatricula(matricula);
            if (opt.isEmpty() && body.get("emailAtual") != null) {
                opt = coordenadorRepository.findByEmailObject(body.get("emailAtual"));
            }
            if (opt.isEmpty() && body.get("email") != null) {
                opt = coordenadorRepository.findByEmailObject(body.get("email"));
            }
            if (opt.isEmpty()) {
                return ResponseEntity.status(404).body("Usuário Diretor não encontrado.");
            }

            Coordenador diretor = opt.get();
            if (!"DIRETOR".equalsIgnoreCase(diretor.getTipoCoordenador())) {
                return ResponseEntity.status(403).body("Apenas o perfil DIRETOR pode utilizar este fluxo de renovação semanal.");
            }

            String novaSenha = body.get("novaSenha");
            if (novaSenha == null || novaSenha.isBlank()) {
                novaSenha = body.get("senha");
            }
            if (novaSenha == null || novaSenha.isBlank()) {
                novaSenha = body.get("password");
            }

            if (novaSenha == null || novaSenha.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("A alteração da senha é obrigatória no ciclo semanal.");
            }
            novaSenha = novaSenha.trim();

            if (novaSenha.length() < 6) {
                return ResponseEntity.badRequest().body("A nova senha deve possuir pelo menos 6 caracteres.");
            }
            if ("123456".equals(novaSenha)) {
                return ResponseEntity.badRequest().body("A nova senha não pode ser a senha padrão inicial (123456).");
            }
            if (novaSenha.equals(diretor.getSenha())) {
                return ResponseEntity.badRequest().body("A nova senha deve ser obrigatoriamente diferente da senha atual.");
            }

            String senhaAtualInformada = body.get("senhaAtual");
            if (senhaAtualInformada != null && !senhaAtualInformada.isBlank() && !senhaAtualInformada.equals(diretor.getSenha())) {
                return ResponseEntity.status(401).body("A senha atual informada está incorreta.");
            }

            String nomeAnterior = diretor.getNome();
            String emailAnterior = diretor.getEmail();

            // Nome e e-mail são opcionais: mantêm-se os atuais caso não mudem
            String novoNome = body.get("nome");
            if (novoNome != null && !novoNome.trim().isEmpty()) {
                diretor.setNome(novoNome.trim());
            }
            String novoEmail = body.get("email");
            if (novoEmail != null && !novoEmail.trim().isEmpty()) {
                diretor.setEmail(novoEmail.trim());
            }

            LocalDateTime agora = LocalDateTime.now();
            diretor.setSenha(novaSenha);
            diretor.setUltimaAlteracaoCredenciais(agora);

            coordenadorRepository.save(diretor);

            boolean mudouTitularOuEmail = !nomeAnterior.equals(diretor.getNome()) || !emailAnterior.equals(diretor.getEmail());
            String detalhesLog = mudouTitularOuEmail
                    ? String.format("Renovação semanal de senha e atualização cadastral do Diretor (%s <%s> -> %s <%s>)",
                    nomeAnterior, emailAnterior, diretor.getNome(), diretor.getEmail())
                    : String.format("Renovação semanal obrigatória de senha realizada pelo Diretor %s (%s)",
                    diretor.getNome(), diretor.getEmail());

            logSistemaRepository.save(LogSistema.builder()
                    .usuarioMatricula(diretor.getMatricula())
                    .acao("diretor.credenciais.renovadas")
                    .detalhes(detalhesLog)
                    .dataHora(agora)
                    .build());

            Map<String, Object> resp = new HashMap<>();
            resp.put("mensagem", "Credenciais do Diretor atualizadas com sucesso! Ciclo de 7 dias renovado.");
            resp.put("id", diretor.getMatricula());
            resp.put("nome", diretor.getNome());
            resp.put("email", diretor.getEmail());
            resp.put("ultimaAlteracaoCredenciais", agora.toString());
            resp.put("diasRestantesCredenciais", 7);
            resp.put("solicitarAlteracaoCredenciais", false);
            resp.put("credenciaisExpiradas", false);

            return ResponseEntity.ok(resp);
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
