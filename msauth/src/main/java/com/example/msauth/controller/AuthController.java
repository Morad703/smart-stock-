package com.example.msauth.controller;

import com.example.msauth.dto.JwtRequest;
import com.example.msauth.dto.JwtResponse;
import com.example.msauth.model.Admin;
import com.example.msauth.service.AdminService;
import com.example.msauth.service.MyUserDetailsService;
import com.example.msauth.util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    private final AdminService adminService;
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @Autowired
    private MyUserDetailsService userDetailsService;
    
    @Autowired
    private JwtUtil jwtUtil;

    public AuthController(AdminService adminService) {
        this.adminService = adminService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Admin admin) {
        System.out.println("=== REGISTER REQUEST ===");
        System.out.println("Received admin: " + (admin != null ? admin.getUsername() : "null"));
        
        try {
            // Vérifier que le username et le password sont fournis
            if (admin == null) {
                System.out.println("ERROR: Admin is null");
                Map<String, String> error = new HashMap<>();
                error.put("error", "Les données sont requises");
                return ResponseEntity.badRequest().body(error);
            }
            
            if (admin.getUsername() == null || admin.getUsername().trim().isEmpty()) {
                System.out.println("ERROR: Username is empty");
                Map<String, String> error = new HashMap<>();
                error.put("error", "Le nom d'utilisateur est requis");
                return ResponseEntity.badRequest().body(error);
            }
            
            if (admin.getPassword() == null || admin.getPassword().trim().isEmpty()) {
                System.out.println("ERROR: Password is empty");
                Map<String, String> error = new HashMap<>();
                error.put("error", "Le mot de passe est requis");
                return ResponseEntity.badRequest().body(error);
            }
            
            System.out.println("Attempting to register user: " + admin.getUsername());
            Admin registeredAdmin = adminService.register(admin);
            System.out.println("User registered successfully: " + registeredAdmin.getId());
            
            // Ne pas retourner le mot de passe
            registeredAdmin.setPassword(null);
            return ResponseEntity.status(HttpStatus.CREATED).body(registeredAdmin);
        } catch (RuntimeException e) {
            System.out.println("RUNTIME ERROR: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        } catch (Exception e) {
            System.out.println("EXCEPTION: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erreur lors de l'inscription");
            error.put("message", e.getMessage());
            error.put("type", e.getClass().getSimpleName());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody JwtRequest authenticationRequest) {
        System.out.println("=== LOGIN REQUEST ===");
        System.out.println("Username: " + (authenticationRequest != null ? authenticationRequest.getUsername() : "null"));
        
        try {
            if (authenticationRequest == null || 
                authenticationRequest.getUsername() == null || 
                authenticationRequest.getPassword() == null) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Nom d'utilisateur et mot de passe requis");
                return ResponseEntity.badRequest().body(error);
            }
            
            System.out.println("Attempting authentication for: " + authenticationRequest.getUsername());
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            authenticationRequest.getUsername(),
                            authenticationRequest.getPassword()
                    )
            );
            System.out.println("Authentication successful");
        } catch (BadCredentialsException e) {
            System.out.println("BAD CREDENTIALS: " + e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", "Nom d'utilisateur ou mot de passe incorrect");
            error.put("message", "Les identifications sont erronées");
            System.out.println("Retour de l'erreur 401 au frontend: " + error);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        } catch (Exception e) {
            System.out.println("LOGIN EXCEPTION: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erreur lors de la connexion");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }

        try {
            final UserDetails userDetails = userDetailsService.loadUserByUsername(authenticationRequest.getUsername());
            Admin admin = adminService.getByUsername(authenticationRequest.getUsername());
            final String jwt = jwtUtil.generateToken(userDetails, admin.getRole());
            System.out.println("JWT token generated successfully");
            
            return ResponseEntity.ok(new JwtResponse(jwt, "Bearer", admin.getUsername(), admin.getRole()));
        } catch (Exception e) {
            System.out.println("ERROR generating token: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> error = new HashMap<>();
            error.put("error", "Erreur lors de la génération du token");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Principal principal) {
        Admin admin = adminService.getByUsername(principal.getName());
        admin.setPassword(null); // Ne pas retourner le mot de passe
        return ResponseEntity.ok(admin);
    }

    @GetMapping("/validate")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String token) {
        try {
            String jwt = token.substring(7);
            String username = jwtUtil.extractUsername(jwt);
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);
            
            if (jwtUtil.validateToken(jwt, userDetails)) {
                Map<String, Object> response = new HashMap<>();
                response.put("valid", true);
                response.put("username", username);
                response.put("role", jwtUtil.getRoleFromToken(jwt));
                return ResponseEntity.ok(response);
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Token invalide");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
            }
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Token invalide");
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
        }
    }
}
