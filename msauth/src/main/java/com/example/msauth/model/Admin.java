package com.example.msauth.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
public class Admin {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String password;
    private String role = "ADMIN";
}
