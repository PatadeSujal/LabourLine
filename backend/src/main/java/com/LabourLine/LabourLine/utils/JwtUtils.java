package com.LabourLine.LabourLine.utils;

import java.sql.Date;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import org.springframework.stereotype.Component;

import com.LabourLine.LabourLine.entity.User;

@Component
public class JwtUtils {
    private final String SECRET = "superSecretKey1234567890superSecretKey";
  public String generateToken(User user) {
    return Jwts.builder()
            .setSubject(user.getPhoneNo())
            .claim("id", user.getId()) // <--- Add this line
            .claim("role", user.getRole().name())
            .setIssuedAt(new java.util.Date()) // Use current time
            .setExpiration(new java.util.Date(System.currentTimeMillis() + 86400000))
            .signWith(Keys.hmacShaKeyFor(SECRET.getBytes()))
            .compact();
}
        public String extractPhone(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(SECRET.getBytes())
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }
}
