package com.LabourLine.LabourLine.config;

import java.io.IOException;
import java.util.Collections;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.LabourLine.LabourLine.entity.User;
import com.LabourLine.LabourLine.repository.UserRepository;
import com.LabourLine.LabourLine.utils.JwtUtils;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtils jwtUtil;

    @Autowired
    @Lazy
    private UserRepository userRepo;

@Override
protected boolean shouldNotFilter(HttpServletRequest request) {
    boolean skip = request.getServletPath().startsWith("/auth/");
    System.out.println("JWT FILTER → skip=" + skip + ", path=" + request.getServletPath());
    return skip;
}

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader != null && authHeader.startsWith("Bearer ")) {

            String token = authHeader.substring(7);
            String phone = jwtUtil.extractPhone(token);

            User user = userRepo.findByPhoneNo(phone).orElse(null);

            if (user != null) {
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                user,
                                null,
                                Collections.singletonList(
                                    new SimpleGrantedAuthority("ROLE_" + user.getRole())
                                )
                        );

                SecurityContextHolder.getContext()
                                     .setAuthentication(authentication);
            }
        }

        chain.doFilter(request, response);
    }
}





