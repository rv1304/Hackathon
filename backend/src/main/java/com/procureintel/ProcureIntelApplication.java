package com.procureintel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ProcureIntelApplication {
    public static void main(String[] args) {
        SpringApplication.run(ProcureIntelApplication.class, args);
    }
}
