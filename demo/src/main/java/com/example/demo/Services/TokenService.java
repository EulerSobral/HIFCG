package com.example.demo.Services;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class TokenService {
    private final SecretKey SECRET_KEY = Keys.hmacShaKeyFor("minha_chave_secreta_super_segura_hifcg_2026_com_mais_de_32_caracteres".getBytes(StandardCharsets.UTF_8));
    private final long EXPIRATION_TIME = 3600000; // 1 horas em milissegundos

   public String generateToken(String email, String tipoUsuario) {
       return Jwts.builder()
               .subject(email)
               .claim("tipo", tipoUsuario)
               .issuedAt(new Date())
               .expiration(new Date(System.currentTimeMillis() + EXPIRATION_TIME))
               .signWith(SECRET_KEY)
               .compact();
   }

   public String validateToken(String token) {
       try {
           Claims claims = Jwts.parser()
                   .verifyWith(SECRET_KEY)
                   .build()
                   .parseSignedClaims(token)
                   .getPayload();
           return claims.getSubject();
       } catch (Exception e) {
           System.out.println(e.getMessage());
           return null;
       }
   }
}
