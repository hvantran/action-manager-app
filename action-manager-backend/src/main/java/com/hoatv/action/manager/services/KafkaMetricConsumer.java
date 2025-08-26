package com.hoatv.action.manager.services;

import com.hoatv.fwk.common.ultilities.StringCommonUtils;
import com.hoatv.metric.mgmt.annotations.MetricConsumer;
import com.hoatv.metric.mgmt.consumers.MetricConsumerHandler;
import com.hoatv.metric.mgmt.entities.ComplexValue;
import com.hoatv.metric.mgmt.entities.MetricTag;
import com.hoatv.metric.mgmt.entities.SimpleValue;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.math.NumberUtils;
import org.springframework.kafka.core.KafkaTemplate;

import java.util.Collection;
import java.util.Map;
import java.util.Objects;
import java.util.StringJoiner;
import java.util.function.Predicate;
import java.util.stream.Collectors;

import static com.hoatv.fwk.common.ultilities.StringCommonUtils.deAccent;

@MetricConsumer
public record KafkaMetricConsumer(KafkaTemplate<String, String> kafkaTemplate) implements MetricConsumerHandler {

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
        sendMessage(name, simpleValue.getValue(), unit);
    }

    private void processSimpleValue(String unit, String name, Long simpleValue) {
        sendMessage(name, simpleValue, unit);
    }

    private void processSimpleValue(String unit, String name, Double simpleValue) {
        sendMessage(name, simpleValue, unit);
    }

    private void processComplexValue(String unit, String name, ComplexValue complexValue) {
        Collection<MetricTag> metricTags = complexValue.getTags();

        for (MetricTag metricTag : metricTags) {
            String metricUnit = getMetricUnit(unit, metricTag);
            Map<String, String> attributes = metricTag.getAttributes();
            String nameTag = attributes.get(NAME_PROPERTY);
            String metricNameCompute = name;
            if (Objects.nonNull(nameTag)) {
                Predicate<Map.Entry<String, String>> filterOutName = p -> !NAME_PROPERTY.equals(p.getKey());
                Map<String, String> newAttributes =
                        attributes.entrySet()
                                .stream()
                                .filter(filterOutName)
                                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
                String nameReplaced = nameTag.toLowerCase().replace(" ", "-");
                String attNames = newAttributes.values().stream().map(StringCommonUtils::deAccent).collect(Collectors.joining("-"));

                StringJoiner stringJoiner = new StringJoiner("-");
                stringJoiner.add(deAccent(nameReplaced));
                if (StringUtils.isNotEmpty(attNames)) {
                    stringJoiner.add(attNames);
                }

                metricNameCompute = stringJoiner.toString();
            } else {
                metricNameCompute = name.concat(attributes.toString());
            }
            sendMessage(metricNameCompute, metricTag, metricUnit);
        }
    }

    private void sendMessage(String name, Object value, String unit) {
        kafkaTemplate.send(name, "%s%s".formatted(value, unit));
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
