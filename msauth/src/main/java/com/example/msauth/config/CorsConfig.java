package com.example.msauth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Autoriser les origines (ajoutez votre URL frontend ici)
        // IMPORTANT: Utiliser setAllowedOriginPatterns au lieu de setAllowedOrigins 
        // quand setAllowCredentials est true
        configuration.setAllowedOriginPatterns(Arrays.asList(
            "http://localhost:*",     // Tous les ports localhost (inclut 4200)
            "http://127.0.0.1:*"      // Alternative localhost
        ));
        
        // Autoriser les méthodes HTTP (OPTIONS est crucial pour preflight)
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"));
        
        // Autoriser tous les headers (nécessaire pour Authorization)
        configuration.setAllowedHeaders(Arrays.asList("*"));
        
        // Autoriser les credentials (cookies, authorization headers)
        configuration.setAllowCredentials(true);
        
        // Headers exposés au frontend
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization", 
            "Content-Type",
            "Access-Control-Allow-Origin",
            "Access-Control-Allow-Credentials"
        ));
        
        // Durée de mise en cache des pré-requêtes OPTIONS (1 heure)
        configuration.setMaxAge(3600L);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        
        return source;
    }
}

 