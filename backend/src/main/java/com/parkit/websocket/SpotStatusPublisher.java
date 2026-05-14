package com.parkit.websocket;

import com.parkit.domain.sensor.SensorFeedManager;
import com.parkit.dto.SpotStatusMessage;
import jakarta.annotation.PostConstruct;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
public class SpotStatusPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public SpotStatusPublisher(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @PostConstruct
    public void init() {
        SensorFeedManager manager = SensorFeedManager.getInstance();
        manager.registerSpotUpdateListener(this::publish);
        manager.startFeed();
    }

    private void publish(SpotStatusMessage event) {
        messagingTemplate.convertAndSend("/topic/spots", event);
    }
}


