package com.example.demo;

import com.example.demo.Services.TokenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Testes de Unidade - TokenService")
class TokenServiceTest {

    private TokenService tokenService;

    @BeforeEach
    void setUp() {
        tokenService = new TokenService();
    }

    @Test
    @DisplayName("Deve gerar e validar token JWT com sucesso")
    void testGenerateAndValidateToken() {
        String email = "diretor@hifcg.edu.br";
        String tipoUsuario = "DIRETOR";

        String token = tokenService.generateToken(email, tipoUsuario);

        assertNotNull(token);
        assertFalse(token.isEmpty());

        String subject = tokenService.validateToken(token);
        assertEquals(email, subject);
    }

    @Test
    @DisplayName("Deve retornar null para token inválido")
    void testValidateInvalidToken() {
        String tokenInvalido = "token_invalido_123456";

        String subject = tokenService.validateToken(tokenInvalido);

        assertNull(subject);
    }
}
