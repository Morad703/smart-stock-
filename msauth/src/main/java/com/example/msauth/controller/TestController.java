package com.example.msauth.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/test")
public class TestController {

    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Backend is running");
        response.put("timestamp", String.valueOf(System.currentTimeMillis()));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/echo")
    public ResponseEntity<Map<String, Object>> echo(@RequestBody Map<String, Object> body) {
        Map<String, Object> response = new HashMap<>();
        response.put("received", body);
        response.put("status", "OK");
        return ResponseEntity.ok(response);
    }
}

