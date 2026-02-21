package com.LabourLine.LabourLine.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import com.LabourLine.LabourLine.entity.User;
import java.util.Date; // Import java.util.Date correctly

@Component
public class JwtUtils {

    private final String SECRET = "superSecretKey1234567890superSecretKey";

    public String generateToken(User user) {
        return Jwts.builder()
                .setSubject(user.getPhoneNo())
                .claim("id", user.getId()) // ID stored here
                .claim("role", user.getRole().name())
                .setIssuedAt(new Date()) 
                .setExpiration(new Date(System.currentTimeMillis() + 86400000))
                .signWith(Keys.hmacShaKeyFor(SECRET.getBytes()))
                .compact();
    }

    public String extractPhone(String token) {
        return extractAllClaims(token).getSubject();
    }

    // --- NEW METHOD: EXTRACT ID ---
    public Long extractId(String token) {
        // Extract the "id" claim as a Long
        return extractAllClaims(token).get("id", Long.class);
    }

    // --- HELPER METHOD TO AVOID REPEATING PARSER LOGIC ---
    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(SECRET.getBytes())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}