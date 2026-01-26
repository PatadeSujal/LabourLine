package com.LabourLine.LabourLine.entity;
import com.LabourLine.LabourLine.entity.type.Role;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;

@Entity
@Data
@Table(name = "users") // "user" is a reserved keyword in some SQL DBs
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String phoneNo;
    private String name;
    private Integer age;

    @Enumerated(EnumType.STRING)
    private Role role;

    // Relationships
    // One User can have one Labour Profile
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    @ToString.Exclude
    private LabourDetails labourDetails;

    // One User can have one Employer Profile
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL)
    @ToString.Exclude
    private EmployerDetails employerDetails;
       private String password;
}
