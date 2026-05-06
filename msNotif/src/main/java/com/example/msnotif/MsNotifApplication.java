package com.example.msnotif;

import org.springframework.amqp.rabbit.annotation.EnableRabbit;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableRabbit
public class MsNotifApplication {

    public static void main(String[] args) {
        SpringApplication.run(MsNotifApplication.class, args);
    }

}
