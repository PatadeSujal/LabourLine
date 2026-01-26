package com.LabourLine.LabourLine.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.LabourLine.LabourLine.dto.AuthResponse;
import com.LabourLine.LabourLine.dto.LoginRequestDto;
import com.LabourLine.LabourLine.dto.RegisterRequest;
import com.LabourLine.LabourLine.service.AuthService;

@RestController
@RequestMapping("/auth")
public class AuthenticationController {
    private final AuthService authService;

    @Autowired
    public AuthenticationController(AuthService authService) {
        this.authService = authService;
    }

  @PostMapping("/register")
public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest req) {
    AuthResponse response = authService.register(req); 
    
    return ResponseEntity.ok(response); 
}

    @GetMapping("/test")
    public String test() {
        return "OK";
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDto req) {
        System.out.println("dfdfdf");
        System.out.println(req.password);
        System.out.println(req.phoneNo);
        String token = authService.login(req);
        return ResponseEntity.ok(token);
    }

}
