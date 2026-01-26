package com.LabourLine.LabourLine.service;



import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.LabourLine.LabourLine.dto.AuthResponse;
import com.LabourLine.LabourLine.dto.LoginRequestDto;
import com.LabourLine.LabourLine.dto.RegisterRequest;
import com.LabourLine.LabourLine.entity.EmployerDetails;
import com.LabourLine.LabourLine.entity.LabourDetails;
import com.LabourLine.LabourLine.entity.User;
import com.LabourLine.LabourLine.entity.type.Role;
import com.LabourLine.LabourLine.repository.EmployerRepository;
import com.LabourLine.LabourLine.repository.LabourRepository;
import com.LabourLine.LabourLine.repository.UserRepository;
import com.LabourLine.LabourLine.utils.JwtUtils;

import jakarta.transaction.Transactional;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepo;
    
    @Autowired
    private LabourRepository labourRepo;

    @Autowired
    private EmployerRepository employerRepo;
    
    @Autowired
    private PasswordEncoder  passwordEncoder;
    private JwtUtils jwtUtils;

      @Autowired
    public AuthService(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

@Transactional
public AuthResponse register(RegisterRequest req) { // Change return type
    if (userRepo.findByPhoneNo(req.phoneNo).isPresent()) {
        throw new RuntimeException("User already exists");
    }

    User user = new User();
    user.setPhoneNo(req.phoneNo);
    user.setName(req.name);
    user.setAge(req.age);
    user.setRole(req.role);
    user.setPassword(passwordEncoder.encode(req.password));
    
    User savedUser = userRepo.saveAndFlush(user);

    if (req.role == Role.LABOUR) {
        LabourDetails labour = new LabourDetails();
        labour.setUser(savedUser); 
        labourRepo.save(labour);
    } else if (req.role == Role.EMPLOYER) {
        EmployerDetails employer = new EmployerDetails();
        employer.setUser(savedUser); 
        employerRepo.save(employer);
    }

    String token = jwtUtils.generateToken(savedUser);
    return new AuthResponse(token, savedUser.getRole().name()); // Return object
}

    public String login(LoginRequestDto req) {
        System.out.println(req.phoneNo);
    User user = userRepo.findByPhoneNo(req.phoneNo)
            .orElseThrow(() -> new RuntimeException("User not found"));

    if (!passwordEncoder.matches(req.password, user.getPassword())) {
        throw new RuntimeException("Invalid password");
    }

    return jwtUtils.generateToken(user);
}

}

