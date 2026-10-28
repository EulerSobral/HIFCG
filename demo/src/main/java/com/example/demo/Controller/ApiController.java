package com.example.demo.Controller;

import com.example.demo.Entity.*;
import com.example.demo.Repository.*;
import com.example.demo.Services.TokenService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.sql.Time;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ApiController {

    private final CoordenadorRepository coordenadorRepository;
    private final DocenteRepository docenteRepository;
    private final AmbienteRepository ambienteRepository;
    private final CursoRepository cursoRepository;
    private final DisciplinaRepository disciplinaRepository;
    private final PeriodoRepository periodoRepository;
    private final AlocacaoHorarioRepository alocacaoHorarioRepository;
    private final LogSistemaRepository logSistemaRepository;
    private final TokenService tokenService;

    public ApiController(
            CoordenadorRepository coordenadorRepository,
            DocenteRepository docenteRepository,
            AmbienteRepository ambienteRepository,
            CursoRepository cursoRepository,
            DisciplinaRepository disciplinaRepository,
            PeriodoRepository periodoRepository,
            AlocacaoHorarioRepository alocacaoHorarioRepository,
            LogSistemaRepository logSistemaRepository,
            TokenService tokenService) {
        this.coordenadorRepository = coordenadorRepository;
        this.docenteRepository = docenteRepository;
        this.ambienteRepository = ambienteRepository;
        this.cursoRepository = cursoRepository;
        this.disciplinaRepository = disciplinaRepository;
        this.periodoRepository = periodoRepository;
        this.alocacaoHorarioRepository = alocacaoHorarioRepository;
        this.logSistemaRepository = logSistemaRepository;
        this.tokenService = tokenService;
    }

    // --- AUTHENTICATION ---
    @PostMapping("/auth/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String senha = body.get("senha");
            if (email == null || senha == null) {
                return ResponseEntity.badRequest().body("E-mail e senha são obrigatórios");
            }

            Optional<Coordenador> opt = coordenadorRepository.findByEmailObject(email.trim());
            if (opt.isEmpty()) {
                return ResponseEntity.status(401).body("Credenciais inválidas");
            }

            Coordenador c = opt.get();
            if (!c.getSenha().equals(senha)) {
                return ResponseEntity.status(401).body("Credenciais inválidas");
            }

            String role = "coord_curso";
            if ("DIRETOR".equalsIgnoreCase(c.getTipoCoordenador())) {
                role = "diretor";
            } else if ("AREA_DEPARTAMENTO".equalsIgnoreCase(c.getTipoCoordenador())) {
                role = "coord_area";
            }

            String token = tokenService.generateToken(c.getEmail(), c.getTipoCoordenador());

            LocalDateTime ultimaAlt = c.getUltimaAlteracaoCredenciais() != null
                    ? c.getUltimaAlteracaoCredenciais()
                    : LocalDateTime.now();
            long diasDecorridos = Math.max(0, ChronoUnit.DAYS.between(ultimaAlt, LocalDateTime.now()));
            long diasRestantes = Math.max(0, 7 - diasDecorridos);
            boolean isDiretor = "DIRETOR".equalsIgnoreCase(c.getTipoCoordenador());
            boolean credenciaisExpiradas = isDiretor && diasDecorridos >= 7;
            boolean solicitarAlteracaoCredenciais = isDiretor && (diasRestantes <= 3 || "123456".equals(c.getSenha()) || credenciaisExpiradas);

            Map<String, Object> resp = new HashMap<>();
            resp.put("id", c.getMatricula());
            resp.put("nome", c.getNome());
            resp.put("email", c.getEmail());
            resp.put("role", role);
            resp.put("area", c.getDepartamento());
            resp.put("cursoId", c.getCursoCodigo());
            resp.put("token", token);
            resp.put("ultimaAlteracaoCredenciais", ultimaAlt.toString());
            resp.put("diasRestantesCredenciais", diasRestantes);
            resp.put("solicitarAlteracaoCredenciais", solicitarAlteracaoCredenciais);
            resp.put("credenciaisExpiradas", credenciaisExpiradas);

            return ResponseEntity.ok(resp);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PutMapping("/diretor/credenciais")
    public ResponseEntity<?> atualizarCredenciaisDiretor(@RequestBody Map<String, String> body) {
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

    // --- COORDENADORES / USERS ---
    @GetMapping("/coordenadores")
    public ResponseEntity<List<Coordenador>> getCoordenadores() {
        return ResponseEntity.ok(coordenadorRepository.findAll());
    }

    @PostMapping("/coordenadores")
    public ResponseEntity<?> addCoordenador(@RequestBody Map<String, String> body) {
        try {
            String roleStr = body.get("role");
            String tipo = "CURSO";
            if ("diretor".equalsIgnoreCase(roleStr) || "DIRETOR".equalsIgnoreCase(roleStr)) tipo = "DIRETOR";
            else if ("coord_area".equalsIgnoreCase(roleStr) || "AREA_DEPARTAMENTO".equalsIgnoreCase(roleStr)) tipo = "AREA_DEPARTAMENTO";

            String matricula = body.get("matricula") != null && !body.get("matricula").isEmpty()
                    ? body.get("matricula")
                    : (body.get("id") != null && !body.get("id").isEmpty() ? body.get("id") : "U" + System.currentTimeMillis() % 100000);

            Optional<Coordenador> existing = coordenadorRepository.findCoordenadorByMatricula(matricula);
            if (existing.isEmpty() && body.get("email") != null) {
                existing = coordenadorRepository.findByEmailObject(body.get("email"));
                if (existing.isPresent()) {
                    matricula = existing.get().getMatricula();
                }
            }

            String senhaInformada = body.get("senha");
            boolean alterouSenha = senhaInformada != null && !senhaInformada.isEmpty();
            String senha = alterouSenha
                    ? senhaInformada
                    : existing.map(Coordenador::getSenha).orElse("123456");

            LocalDateTime ultimaAlt = alterouSenha
                    ? LocalDateTime.now()
                    : existing.map(Coordenador::getUltimaAlteracaoCredenciais).orElse(LocalDateTime.now());

            Coordenador c = Coordenador.builder()
                    .matricula(matricula)
                    .nome(body.get("nome") != null ? body.get("nome") : existing.map(Coordenador::getNome).orElse("Coordenador"))
                    .email(body.get("email") != null ? body.get("email") : existing.map(Coordenador::getEmail).orElse(""))
                    .senha(senha)
                    .tipoCoordenador(tipo)
                    .departamento(body.get("area") != null ? body.get("area") : body.get("departamento"))
                    .cursoCodigo(body.get("cursoId") != null ? body.get("cursoId") : body.get("cursoCodigo"))
                    .ultimaAlteracaoCredenciais(ultimaAlt)
                    .build();
            coordenadorRepository.save(c);
            return ResponseEntity.ok(c);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @DeleteMapping("/coordenadores/{matricula}")
    public ResponseEntity<?> removeCoordenador(@PathVariable String matricula) {
        try {
            coordenadorRepository.deleteByMatricula(matricula);
            return ResponseEntity.ok("Coordenador removido");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    // --- DOCENTES ---
    @GetMapping("/docentes")
    public ResponseEntity<List<Docente>> getDocentes() {
        return ResponseEntity.ok(docenteRepository.findAll());
    }

    @PostMapping("/docentes")
    public ResponseEntity<?> addDocente(@RequestBody Docente d) {
        try {
            if (d.getMatricula() == null || d.getMatricula().isEmpty()) {
                d.setMatricula("D" + System.currentTimeMillis() % 100000);
            }
            docenteRepository.save(d);
            return ResponseEntity.ok(d);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @DeleteMapping("/docentes/{matricula}")
    public ResponseEntity<?> removeDocente(@PathVariable String matricula) {
        try {
            docenteRepository.deleteByMatricula(matricula);
            return ResponseEntity.ok("Docente removido");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    // --- AMBIENTES ---
    @GetMapping("/ambientes")
    public ResponseEntity<List<Ambiente>> getAmbientes() {
        return ResponseEntity.ok(ambienteRepository.findAll());
    }

    @PostMapping("/ambientes")
    public ResponseEntity<?> addAmbiente(@RequestBody Ambiente a) {
        try {
            ambienteRepository.save(a);
            return ResponseEntity.ok(a);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @DeleteMapping("/ambientes/{codigo}")
    public ResponseEntity<?> removeAmbiente(@PathVariable String codigo) {
        try {
            ambienteRepository.deleteByCodigo(codigo);
            return ResponseEntity.ok("Ambiente removido");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    // --- CURSOS ---
    @GetMapping("/cursos")
    public ResponseEntity<List<Curso>> getCursos() {
        return ResponseEntity.ok(cursoRepository.findAll());
    }

    @PostMapping("/cursos")
    public ResponseEntity<?> addCurso(@RequestBody Curso c) {
        try {
            cursoRepository.save(c);
            return ResponseEntity.ok(c);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @DeleteMapping("/cursos/{codigo}")
    public ResponseEntity<?> removeCurso(@PathVariable String codigo) {
        try {
            cursoRepository.deleteByCodigo(codigo);
            return ResponseEntity.ok("Curso removido");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    // --- DISCIPLINAS ---
    @GetMapping("/disciplinas")
    public ResponseEntity<List<Disciplina>> getDisciplinas() {
        return ResponseEntity.ok(disciplinaRepository.findAll());
    }

    @PostMapping("/disciplinas")
    public ResponseEntity<?> addDisciplina(@RequestBody Map<String, Object> body) {
        try {
            String codigo = body.get("codigo") != null ? body.get("codigo").toString() : "DISC" + (System.currentTimeMillis() % 10000);
            String nome = body.get("nome") != null ? body.get("nome").toString() : "Nova Disciplina";
            int cargaHoraria = body.get("cargaHoraria") != null ? Integer.parseInt(body.get("cargaHoraria").toString()) : 60;
            String curso = body.get("curso") != null ? body.get("curso").toString() : (body.get("cursoId") != null ? body.get("cursoId").toString() : "TADS");

            Disciplina d = Disciplina.builder()
                    .codigo(codigo)
                    .nome(nome)
                    .cargaHoraria(cargaHoraria)
                    .curso(curso)
                    .build();

            disciplinaRepository.save(d);
            return ResponseEntity.ok(d);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @DeleteMapping("/disciplinas/{codigo}")
    public ResponseEntity<?> removeDisciplina(@PathVariable String codigo) {
        try {
            disciplinaRepository.deleteByCodigo(codigo);
            return ResponseEntity.ok("Disciplina removida");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    // --- PERIODOS ---
    @GetMapping("/periodos")
    public ResponseEntity<List<Periodo>> getPeriodos() {
        return ResponseEntity.ok(periodoRepository.findAll());
    }

    @PostMapping("/periodos")
    public ResponseEntity<?> addPeriodo(@RequestBody Periodo p) {
        try {
            periodoRepository.save(p);
            return ResponseEntity.ok(p);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @DeleteMapping("/periodos/{codigo}")
    public ResponseEntity<?> removePeriodo(@PathVariable String codigo) {
        try {
            periodoRepository.deleteByCodigo(codigo);
            return ResponseEntity.ok("Período removido");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    // --- ALOCACOES ---
    @GetMapping("/alocacoes")
    public ResponseEntity<List<Map<String, Object>>> getAlocacoes() {
        return ResponseEntity.ok(alocacaoHorarioRepository.findAllMap());
    }

    @PostMapping("/alocacoes")
    public ResponseEntity<?> addAlocacao(@RequestBody Map<String, String> body) {
        try {
            String disc = body.get("disciplina");
            String doc = body.get("docente");
            String amb = body.get("ambiente");
            String turma = body.getOrDefault("turma", "T1");
            String perStr = body.get("periodo") != null ? body.get("periodo") : body.get("periodoCurso");
            Integer per = (perStr != null && !perStr.isEmpty()) ? Integer.parseInt(perStr.replaceAll("\\D+", "")) : 1;
            String dia = body.getOrDefault("diaSemana", "SEG");
            Time hIni = Time.valueOf(body.getOrDefault("horarioInicio", "08:00:00"));
            Time hFim = Time.valueOf(body.getOrDefault("horarioFim", "09:40:00"));

            alocacaoHorarioRepository.alocarHorario(disc, doc, amb, turma, per, dia, hIni, hFim);
            return ResponseEntity.ok("Alocação realizada com sucesso");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @DeleteMapping("/alocacoes/{id}")
    public ResponseEntity<?> removeAlocacaoById(@PathVariable Long id) {
        try {
            alocacaoHorarioRepository.deleteById(id);
            return ResponseEntity.ok("Alocação removida");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @DeleteMapping("/alocacoes")
    public ResponseEntity<?> removeAlocacao(@RequestBody Map<String, String> body) {
        try {
            String disc = body.get("disciplina");
            String doc = body.get("docente");
            String amb = body.get("ambiente");
            String turma = body.getOrDefault("turma", "T1");
            String perStr = body.get("periodo") != null ? body.get("periodo") : body.get("periodoCurso");
            Integer per = (perStr != null && !perStr.isEmpty()) ? Integer.parseInt(perStr.replaceAll("\\D+", "")) : 1;
            String dia = body.getOrDefault("diaSemana", "SEG");
            Time hIni = Time.valueOf(body.getOrDefault("horarioInicio", "08:00:00"));
            Time hFim = Time.valueOf(body.getOrDefault("horarioFim", "09:40:00"));

            alocacaoHorarioRepository.removerAlocacoes(disc, doc, amb, turma, per, dia, hIni, hFim);
            return ResponseEntity.ok("Alocação removida com sucesso");
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    // --- LOGS ---
    @GetMapping("/logs")
    public ResponseEntity<List<LogSistema>> getLogs() {
        return ResponseEntity.ok(logSistemaRepository.findAll());
    }

    @PostMapping("/logs")
    public ResponseEntity<?> addLog(@RequestBody Map<String, String> body) {
        try {
            LogSistema log = LogSistema.builder()
                    .usuarioMatricula(body.getOrDefault("usuarioMatricula", "sistema"))
                    .acao(body.get("acao"))
                    .detalhes(body.get("detalhes"))
                    .dataHora(LocalDateTime.now())
                    .build();
            logSistemaRepository.save(log);
            return ResponseEntity.ok(log);
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}
