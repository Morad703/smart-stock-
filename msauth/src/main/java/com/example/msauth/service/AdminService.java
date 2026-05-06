package com.example.msauth.service;

import com.example.msauth.model.Admin;
import com.example.msauth.repository.AdminRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AdminService {
    private final AdminRepository repo;
    private final PasswordEncoder encoder;

    public AdminService(AdminRepository repo, PasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    public Admin register(Admin admin) {
        // Vérifier si l'utilisateur existe déjà
        if (repo.findByUsername(admin.getUsername()) != null) {
            throw new RuntimeException("Le nom d'utilisateur existe déjà");
        }
        
        // Encoder le mot de passe avant de sauvegarder
        admin.setPassword(encoder.encode(admin.getPassword()));
        admin.setRole("ADMIN");
        return repo.save(admin);
    }

    public Admin getByUsername(String username) {
        return repo.findByUsername(username);
    }
}

