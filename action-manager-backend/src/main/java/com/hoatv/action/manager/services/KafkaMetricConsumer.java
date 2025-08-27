package com.hoatv.action.manager.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hoatv.fwk.common.services.CheckedSupplier;
import com.hoatv.fwk.common.ultilities.StringCommonUtils;
import com.hoatv.metric.mgmt.annotations.MetricConsumer;
import com.hoatv.metric.mgmt.consumers.MetricConsumerHandler;
import com.hoatv.metric.mgmt.entities.ComplexValue;
import com.hoatv.metric.mgmt.entities.MetricTag;
import com.hoatv.metric.mgmt.entities.SimpleValue;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.math.NumberUtils;
import org.springframework.kafka.core.KafkaTemplate;

import java.util.*;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import static com.hoatv.fwk.common.ultilities.StringCommonUtils.deAccent;

@MetricConsumer
public record KafkaMetricConsumer(KafkaTemplate<String, String> kafkaTemplate,
                                  ObjectMapper objectMapper) implements MetricConsumerHandler {

    public static final String UNIT = "unit";
    public static final String NAME_PROPERTY = "name";

    @Override
    public void consume(String application, String category, String name, Object value, String unit) {
        switch (value) {
            case SimpleValue simpleValue -> processSimpleValue(unit, name, simpleValue);
            case String metricValue -> {
                try {
                    Long metricValueLong = NumberUtils.createLong(metricValue);
                    processSimpleValue(unit, name, metricValueLong);
                } catch (NumberFormatException exception) {
                    Double metricValueDouble = NumberUtils.createDouble(metricValue);
                    processSimpleValue(unit, name, metricValueDouble);
                }
            }
            case Long metricValue -> processSimpleValue(unit, name, metricValue);
            case Integer metricValue -> processSimpleValue(unit, name, metricValue.longValue());
            case Double metricValue -> processSimpleValue(unit, name, metricValue);
            case Collection<?> objects -> {
                @SuppressWarnings("unchecked")
                Collection<ComplexValue> complexValues = (Collection<ComplexValue>) value;
                complexValues.forEach(complexValue -> processComplexValue(unit, name, complexValue));
            }
            case null, default -> processComplexValue(unit, name, (ComplexValue) value);
        }
    }

    private void processSimpleValue(String unit, String name, SimpleValue simpleValue) {
        sendMessage(name, simpleValue.getValue().toString());
    }

    private void processSimpleValue(String unit, String name, Long simpleValue) {
        sendMessage(name, simpleValue.toString());
    }

    private void processSimpleValue(String unit, String name, Double simpleValue) {
        sendMessage(name, simpleValue.toString());
    }

    private void processComplexValue(String unit, String annotationMetricName, ComplexValue complexValue) {
        Collection<MetricTag> metricTags = complexValue.getTags();

        for (MetricTag metricTag : metricTags) {
            Map<String, String> attributes = metricTag.getAttributes();
            String metricNameCompute = getMetricName(annotationMetricName, attributes);
            CheckedSupplier<String> metricValueSupplier = () -> {
                // In case the Metric Tag attributes are empty, or just have only one name prop.
                // Just return the metric value
                // Otherwise, return the metric tag json object
                if (attributes.isEmpty() || attributes.size() == 1 && attributes.containsKey(NAME_PROPERTY)) {
                    return metricTag.getValue();
                }
                return objectMapper.writeValueAsString(metricTag);
            };
            sendMessage(metricNameCompute, metricValueSupplier.get());
        }
    }

    private static String getMetricName(String annotationMetricName, Map<String, String> attributes) {
        String nameTag = attributes.getOrDefault(NAME_PROPERTY, annotationMetricName)
                .toLowerCase()
                .replace(" ", "-");
        List<String> restPropNames =
                attributes.keySet()
                        .stream()
                        .filter(Predicate.not(NAME_PROPERTY::equals))
                        .toList();

        StringJoiner stringJoiner = new StringJoiner("-");
        stringJoiner.add(nameTag);
        if (!restPropNames.isEmpty()) {
            String propNames = restPropNames.stream()
                    .map(String::toLowerCase)
                    .map(prop -> prop.replace(" ", "-"))
                    .map(StringCommonUtils::deAccent)
                    .collect(Collectors.joining("-"));
            stringJoiner.add(propNames);
        }
        return stringJoiner.toString();
    }

    private void sendMessage(String name, String value) {
        kafkaTemplate.send(name, value);
    }

    private String getMetricUnit(String unit, Object value) {
        if (value instanceof MetricTag metrictag) {
            Map<String, String> attributes = metrictag.getAttributes();
            String unitMetricAttribute = attributes.get(UNIT);
            if (Objects.nonNull(unitMetricAttribute)) {
                unit = unitMetricAttribute;
                attributes.remove(UNIT);
            }
        }
        return unit;
    }

}
