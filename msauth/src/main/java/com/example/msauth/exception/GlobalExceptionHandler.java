package com.example.msauth.exception;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentials(BadCredentialsException e) {
        System.out.println("GlobalExceptionHandler - BadCredentialsException capturée");
        Map<String, String> error = new HashMap<>();
        error.put("error", "Nom d'utilisateur ou mot de passe incorrect");
        error.put("message", e.getMessage());
        
        // Ajouter les en-têtes CORS explicitement
        HttpHeaders headers = new HttpHeaders();
        headers.add("Access-Control-Allow-Origin", "http://localhost:4200");
        headers.add("Access-Control-Allow-Credentials", "true");
        headers.add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD");
        headers.add("Access-Control-Allow-Headers", "*");
        headers.add("Access-Control-Expose-Headers", "Authorization, Content-Type");
        
        System.out.println("Retour de l'erreur 401 avec headers CORS");
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .headers(headers)
                .body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericException(Exception e) {
        Map<String, String> error = new HashMap<>();
        error.put("error", "Une erreur est survenue");
        error.put("message", e.getMessage());
        
        // Ajouter les en-têtes CORS explicitement
        HttpHeaders headers = new HttpHeaders();
        headers.add("Access-Control-Allow-Origin", "http://localhost:4200");
        headers.add("Access-Control-Allow-Credentials", "true");
        headers.add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD");
        headers.add("Access-Control-Allow-Headers", "*");
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .headers(headers)
                .body(error);
    }
}

