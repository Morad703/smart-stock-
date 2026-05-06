package com.example.msauth.service;

import com.example.msauth.model.Admin;
import com.example.msauth.repository.AdminRepository;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class MyUserDetailsService implements UserDetailsService {

    private final AdminRepository repo;

    public MyUserDetailsService(AdminRepository repo) {
        this.repo = repo;
    }

    @Override
    public UserDetails loadUserByUsername(String username) {
        Admin admin = repo.findByUsername(username);
        if (admin == null) throw new UsernameNotFoundException("Admin introuvable");

        return User.builder()
                .username(admin.getUsername())
                .password(admin.getPassword())
                .roles("ADMIN")
                .build();
    }
}

