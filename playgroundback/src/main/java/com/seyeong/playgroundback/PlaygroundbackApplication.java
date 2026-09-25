package com.seyeong.playgroundback;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class PlaygroundbackApplication {

	public static void main(String[] args) {
		SpringApplication.run(PlaygroundbackApplication.class, args);
	}

}
