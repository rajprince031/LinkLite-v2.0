package com.linklite.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LinkLiteBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(LinkLiteBackendApplication.class, args);
    }
}
