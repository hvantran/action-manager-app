package com.hoatv.action.manager.services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoatv.fwk.common.services.HttpClientService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.http.HttpClient;
import java.net.http.HttpResponse;
import java.time.Duration;

import static com.hoatv.action.manager.utils.JobManagerConstants.JOB_MANAGER_METRIC_NAME_PREFIX;

/**
 * Service to check Kafka consumer status for jobs
 */
@Service
@RequiredArgsConstructor
public class KafkaConsumerStatusService {

    private static final Logger LOGGER = LoggerFactory.getLogger(KafkaConsumerStatusService.class);

    @Value("${kafka.notifier.base-url:http://localhost:8085}")
    private String kafkaNotifierBaseUrl;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    /**
     * Check if there's an active consumer for a given topic (job name)
     * 
     * @param topicName the Kafka topic name (typically the job name)
     * @return true if there's an active consumer, false otherwise
     */
    public boolean hasActiveConsumer(String topicName) {
        if (topicName == null || topicName.trim().isEmpty()) {
            return false;
        }

        try {
            String jobNameFormalize = topicName.toLowerCase().replace(" ", "-");
            String topic = JOB_MANAGER_METRIC_NAME_PREFIX + "-for-" + jobNameFormalize;
            String url = String.format("%s/api/v1/kafka/subscriptions/%s",  kafkaNotifierBaseUrl, topic);
            
            HttpClientService.RequestParams requestParams = HttpClientService.RequestParams
                    .builder(url, httpClient)
                    .method(HttpClientService.HttpMethod.GET)
                    .requestTimeoutInMs(3000)
                    .build();

            HttpResponse<String> response = HttpClientService.INSTANCE.sendHTTPRequest().apply(requestParams);
            
            if (response.statusCode() == 200) {
                JsonNode jsonResponse = objectMapper.readTree(response.body());
                return jsonResponse.has("subscribed") && jsonResponse.get("subscribed").asBoolean();
            }
            
            LOGGER.debug("Failed to check consumer status for topic '{}': HTTP {}", topicName, response.statusCode());
            return false;
            
        } catch (Exception e) {
            LOGGER.debug("Error checking consumer status for topic '{}': {}", topicName, e.getMessage());
            // Return false on error to avoid breaking the job listing
            return false;
        }
    }
}
