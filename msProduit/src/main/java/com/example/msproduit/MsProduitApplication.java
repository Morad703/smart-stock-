package com.example.msproduit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class MsProduitApplication {

    public static void main(String[] args) {
        SpringApplication.run(MsProduitApplication.class, args);
    }

}
