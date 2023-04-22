// violations-api-error-check
{
  "filter_message": "Z ERROR",
  "filter_app_key": "app",
  "filter_app_value": "violations_api"
}

let List = Java.type('java.util.List');
let ArrayList = Java.type('java.util.ArrayList');
let Map = Java.type('java.util.Map');
let HashMap = Java.type('java.util.HashMap');
let HttpResponse = Java.type('java.net.http.HttpResponse');
let Configuration = Java.type('com.jayway.jsonpath.Configuration');
let DocumentContext = Java.type('com.jayway.jsonpath.DocumentContext');
let JsonPath = Java.type('com.jayway.jsonpath.JsonPath');
let String = Java.type('java.lang.String');

let HttpClient = Java.type('java.net.http.HttpClient');
let Pair = Java.type('com.hoatv.fwk.common.ultilities.Pair');
let Triplet = Java.type('com.hoatv.fwk.common.ultilities.Triplet');
let CheckedFunction = Java.type('com.hoatv.fwk.common.services.CheckedFunction');
let CheckSupplier = Java.type('com.hoatv.fwk.common.services.CheckedSupplier');
let CheckConsumer = Java.type('com.hoatv.fwk.common.services.CheckedConsumer');

let DateTimeUtils = Java.type('com.hoatv.fwk.common.ultilities.DateTimeUtils');
let ObjectUtils = Java.type('com.hoatv.fwk.common.ultilities.ObjectUtils');
let JobResult = Java.type('com.hoatv.action.manager.services.JobResult');
let RequestParams = Java.type('com.hoatv.fwk.common.services.HttpClientService.RequestParams');
let HttpMethod = Java.type('com.hoatv.fwk.common.services.HttpClientService.HttpMethod');
let HttpClientService = Java.type('com.hoatv.fwk.common.services.HttpClientService');

function execute() {
    let hitCount = kibanaQueryHit(`{"params":{"preference":1680074550978,"index":"filebeat-*","body":{"version":true,"size":10000,"sort":[{"@timestamp":{"order":"desc","unmapped_type":"boolean"}}],"aggs":{"2":{"date_histogram":{"field":"@timestamp","fixed_interval":"30m","time_zone":"Asia/Saigon","min_doc_count":1}}},"stored_fields":["*"],"script_fields":{},"docvalue_fields":[{"field":"@timestamp","format":"date_time"},{"field":"aws.cloudtrail.user_identity.session_context.creation_date","format":"date_time"},{"field":"azure.auditlogs.properties.activity_datetime","format":"date_time"},{"field":"azure.enqueued_time","format":"date_time"},{"field":"azure.signinlogs.properties.created_at","format":"date_time"},{"field":"cef.extensions.agentReceiptTime","format":"date_time"},{"field":"cef.extensions.deviceCustomDate1","format":"date_time"},{"field":"cef.extensions.deviceCustomDate2","format":"date_time"},{"field":"cef.extensions.deviceReceiptTime","format":"date_time"},{"field":"cef.extensions.endTime","format":"date_time"},{"field":"cef.extensions.fileCreateTime","format":"date_time"},{"field":"cef.extensions.fileModificationTime","format":"date_time"},{"field":"cef.extensions.flexDate1","format":"date_time"},{"field":"cef.extensions.managerReceiptTime","format":"date_time"},{"field":"cef.extensions.oldFileCreateTime","format":"date_time"},{"field":"cef.extensions.oldFileModificationTime","format":"date_time"},{"field":"cef.extensions.startTime","format":"date_time"},{"field":"checkpoint.subs_exp","format":"date_time"},{"field":"crowdstrike.event.EndTimestamp","format":"date_time"},{"field":"crowdstrike.event.IncidentEndTime","format":"date_time"},{"field":"crowdstrike.event.IncidentStartTime","format":"date_time"},{"field":"crowdstrike.event.ProcessEndTime","format":"date_time"},{"field":"crowdstrike.event.ProcessStartTime","format":"date_time"},{"field":"crowdstrike.event.StartTimestamp","format":"date_time"},{"field":"crowdstrike.event.UTCTimestamp","format":"date_time"},{"field":"crowdstrike.metadata.eventCreationTime","format":"date_time"},{"field":"event.created","format":"date_time"},{"field":"event.end","format":"date_time"},{"field":"event.ingested","format":"date_time"},{"field":"event.start","format":"date_time"},{"field":"file.accessed","format":"date_time"},{"field":"file.created","format":"date_time"},{"field":"file.ctime","format":"date_time"},{"field":"file.mtime","format":"date_time"},{"field":"kafka.block_timestamp","format":"date_time"},{"field":"misp.campaign.first_seen","format":"date_time"},{"field":"misp.campaign.last_seen","format":"date_time"},{"field":"misp.intrusion_set.first_seen","format":"date_time"},{"field":"misp.intrusion_set.last_seen","format":"date_time"},{"field":"misp.observed_data.first_observed","format":"date_time"},{"field":"misp.observed_data.last_observed","format":"date_time"},{"field":"misp.report.published","format":"date_time"},{"field":"misp.threat_indicator.valid_from","format":"date_time"},{"field":"misp.threat_indicator.valid_until","format":"date_time"},{"field":"netflow.collection_time_milliseconds","format":"date_time"},{"field":"netflow.exporter.timestamp","format":"date_time"},{"field":"netflow.flow_end_microseconds","format":"date_time"},{"field":"netflow.flow_end_milliseconds","format":"date_time"},{"field":"netflow.flow_end_nanoseconds","format":"date_time"},{"field":"netflow.flow_end_seconds","format":"date_time"},{"field":"netflow.flow_start_microseconds","format":"date_time"},{"field":"netflow.flow_start_milliseconds","format":"date_time"},{"field":"netflow.flow_start_nanoseconds","format":"date_time"},{"field":"netflow.flow_start_seconds","format":"date_time"},{"field":"netflow.max_export_seconds","format":"date_time"},{"field":"netflow.max_flow_end_microseconds","format":"date_time"},{"field":"netflow.max_flow_end_milliseconds","format":"date_time"},{"field":"netflow.max_flow_end_nanoseconds","format":"date_time"},{"field":"netflow.max_flow_end_seconds","format":"date_time"},{"field":"netflow.min_export_seconds","format":"date_time"},{"field":"netflow.min_flow_start_microseconds","format":"date_time"},{"field":"netflow.min_flow_start_milliseconds","format":"date_time"},{"field":"netflow.min_flow_start_nanoseconds","format":"date_time"},{"field":"netflow.min_flow_start_seconds","format":"date_time"},{"field":"netflow.monitoring_interval_end_milli_seconds","format":"date_time"},{"field":"netflow.monitoring_interval_start_milli_seconds","format":"date_time"},{"field":"netflow.observation_time_microseconds","format":"date_time"},{"field":"netflow.observation_time_milliseconds","format":"date_time"},{"field":"netflow.observation_time_nanoseconds","format":"date_time"},{"field":"netflow.observation_time_seconds","format":"date_time"},{"field":"netflow.system_init_time_milliseconds","format":"date_time"},{"field":"package.installed","format":"date_time"},{"field":"process.parent.start","format":"date_time"},{"field":"process.start","format":"date_time"},{"field":"suricata.eve.flow.end","format":"date_time"},{"field":"suricata.eve.flow.start","format":"date_time"},{"field":"suricata.eve.timestamp","format":"date_time"},{"field":"suricata.eve.tls.notafter","format":"date_time"},{"field":"suricata.eve.tls.notbefore","format":"date_time"},{"field":"tls.client.not_after","format":"date_time"},{"field":"tls.client.not_before","format":"date_time"},{"field":"tls.server.not_after","format":"date_time"},{"field":"tls.server.not_before","format":"date_time"},{"field":"zeek.kerberos.valid.from","format":"date_time"},{"field":"zeek.kerberos.valid.until","format":"date_time"},{"field":"zeek.ocsp.revoke.time","format":"date_time"},{"field":"zeek.ocsp.update.next","format":"date_time"},{"field":"zeek.ocsp.update.this","format":"date_time"},{"field":"zeek.pe.compile_time","format":"date_time"},{"field":"zeek.smb_files.times.accessed","format":"date_time"},{"field":"zeek.smb_files.times.changed","format":"date_time"},{"field":"zeek.smb_files.times.created","format":"date_time"},{"field":"zeek.smb_files.times.modified","format":"date_time"},{"field":"zeek.smtp.date","format":"date_time"},{"field":"zeek.snmp.up_since","format":"date_time"},{"field":"zeek.x509.certificate.valid.from","format":"date_time"},{"field":"zeek.x509.certificate.valid.until","format":"date_time"}],"_source":false,"query":{"bool":{"must":[],"filter":[{"bool":{"should":[{"match_phrase":{"message":"Z ERROR"}}],"minimum_should_match":1}},{"match_phrase":{"app":"violations_api"}},{"range":{"@timestamp":{"gte":"now-15m","lte":"now","format":"strict_date_optional_time"}}}],"should":[],"must_not":[]}},"highlight":{"pre_tags":["@kibana-highlighted-field@"],"post_tags":["@/kibana-highlighted-field@"],"fields":{"*":{}},"fragment_size":2147483647}},"rest_total_hits_as_int":true,"ignore_unavailable":true,"ignore_throttled":true,"timeout":"720000ms"},"serverStrategy":"es"}`);
    return new JobResult(`${r"${hitCount}"}`,'')
}

function kibanaQueryHit(queryData) {
    let httpClient = HttpClient.newBuilder().build();
    let requestParams = RequestParams.builder('https://prod-0001-logstash.unified.com/internal/search/es', httpClient)
        .method(HttpMethod.POST)
        .headers(Map.of('Content-Type', 'application/json', 'kbn-version', '7.8.1'))
        .data(queryData)
        .build();

    let response = httpClientService.sendHTTPRequest().apply(requestParams);
    let responseString = HttpClientService.asString(response);
    let document = Configuration.defaultConfiguration().jsonProvider().parse(responseString);
    let documentContext = JsonPath.parse(document);
    return documentContext.read('$.rawResponse.hits.total', String.class);
}

//violation-executor-error-check
{
  "filter_message": "FAILED . Caused by",
  "filter_app_key": "kubernetes.labels.app",
  "filter_app_value": "violation-executor"
}

let List = Java.type('java.util.List');
let ArrayList = Java.type('java.util.ArrayList');
let Map = Java.type('java.util.Map');
let HashMap = Java.type('java.util.HashMap');
let HttpResponse = Java.type('java.net.http.HttpResponse');
let Configuration = Java.type('com.jayway.jsonpath.Configuration');
let DocumentContext = Java.type('com.jayway.jsonpath.DocumentContext');
let JsonPath = Java.type('com.jayway.jsonpath.JsonPath');
let String = Java.type('java.lang.String');

let HttpClient = Java.type('java.net.http.HttpClient');
let Pair = Java.type('com.hoatv.fwk.common.ultilities.Pair');
let Triplet = Java.type('com.hoatv.fwk.common.ultilities.Triplet');
let CheckedFunction = Java.type('com.hoatv.fwk.common.services.CheckedFunction');
let CheckSupplier = Java.type('com.hoatv.fwk.common.services.CheckedSupplier');
let CheckConsumer = Java.type('com.hoatv.fwk.common.services.CheckedConsumer');

let DateTimeUtils = Java.type('com.hoatv.fwk.common.ultilities.DateTimeUtils');
let ObjectUtils = Java.type('com.hoatv.fwk.common.ultilities.ObjectUtils');
let JobResult = Java.type('com.hoatv.action.manager.services.JobResult');
let RequestParams = Java.type('com.hoatv.fwk.common.services.HttpClientService.RequestParams');
let HttpMethod = Java.type('com.hoatv.fwk.common.services.HttpClientService.HttpMethod');
let HttpClientService = Java.type('com.hoatv.fwk.common.services.HttpClientService');

function execute() {
    let hitCount = kibanaQueryHit(`{"params":{"preference":1680074550978,"index":"filebeat-*","body":{"version":true,"size":10000,"sort":[{"@timestamp":{"order":"desc","unmapped_type":"boolean"}}],"aggs":{"2":{"date_histogram":{"field":"@timestamp","fixed_interval":"30m","time_zone":"Asia/Saigon","min_doc_count":1}}},"stored_fields":["*"],"script_fields":{},"docvalue_fields":[{"field":"@timestamp","format":"date_time"},{"field":"aws.cloudtrail.user_identity.session_context.creation_date","format":"date_time"},{"field":"azure.auditlogs.properties.activity_datetime","format":"date_time"},{"field":"azure.enqueued_time","format":"date_time"},{"field":"azure.signinlogs.properties.created_at","format":"date_time"},{"field":"cef.extensions.agentReceiptTime","format":"date_time"},{"field":"cef.extensions.deviceCustomDate1","format":"date_time"},{"field":"cef.extensions.deviceCustomDate2","format":"date_time"},{"field":"cef.extensions.deviceReceiptTime","format":"date_time"},{"field":"cef.extensions.endTime","format":"date_time"},{"field":"cef.extensions.fileCreateTime","format":"date_time"},{"field":"cef.extensions.fileModificationTime","format":"date_time"},{"field":"cef.extensions.flexDate1","format":"date_time"},{"field":"cef.extensions.managerReceiptTime","format":"date_time"},{"field":"cef.extensions.oldFileCreateTime","format":"date_time"},{"field":"cef.extensions.oldFileModificationTime","format":"date_time"},{"field":"cef.extensions.startTime","format":"date_time"},{"field":"checkpoint.subs_exp","format":"date_time"},{"field":"crowdstrike.event.EndTimestamp","format":"date_time"},{"field":"crowdstrike.event.IncidentEndTime","format":"date_time"},{"field":"crowdstrike.event.IncidentStartTime","format":"date_time"},{"field":"crowdstrike.event.ProcessEndTime","format":"date_time"},{"field":"crowdstrike.event.ProcessStartTime","format":"date_time"},{"field":"crowdstrike.event.StartTimestamp","format":"date_time"},{"field":"crowdstrike.event.UTCTimestamp","format":"date_time"},{"field":"crowdstrike.metadata.eventCreationTime","format":"date_time"},{"field":"event.created","format":"date_time"},{"field":"event.end","format":"date_time"},{"field":"event.ingested","format":"date_time"},{"field":"event.start","format":"date_time"},{"field":"file.accessed","format":"date_time"},{"field":"file.created","format":"date_time"},{"field":"file.ctime","format":"date_time"},{"field":"file.mtime","format":"date_time"},{"field":"kafka.block_timestamp","format":"date_time"},{"field":"misp.campaign.first_seen","format":"date_time"},{"field":"misp.campaign.last_seen","format":"date_time"},{"field":"misp.intrusion_set.first_seen","format":"date_time"},{"field":"misp.intrusion_set.last_seen","format":"date_time"},{"field":"misp.observed_data.first_observed","format":"date_time"},{"field":"misp.observed_data.last_observed","format":"date_time"},{"field":"misp.report.published","format":"date_time"},{"field":"misp.threat_indicator.valid_from","format":"date_time"},{"field":"misp.threat_indicator.valid_until","format":"date_time"},{"field":"netflow.collection_time_milliseconds","format":"date_time"},{"field":"netflow.exporter.timestamp","format":"date_time"},{"field":"netflow.flow_end_microseconds","format":"date_time"},{"field":"netflow.flow_end_milliseconds","format":"date_time"},{"field":"netflow.flow_end_nanoseconds","format":"date_time"},{"field":"netflow.flow_end_seconds","format":"date_time"},{"field":"netflow.flow_start_microseconds","format":"date_time"},{"field":"netflow.flow_start_milliseconds","format":"date_time"},{"field":"netflow.flow_start_nanoseconds","format":"date_time"},{"field":"netflow.flow_start_seconds","format":"date_time"},{"field":"netflow.max_export_seconds","format":"date_time"},{"field":"netflow.max_flow_end_microseconds","format":"date_time"},{"field":"netflow.max_flow_end_milliseconds","format":"date_time"},{"field":"netflow.max_flow_end_nanoseconds","format":"date_time"},{"field":"netflow.max_flow_end_seconds","format":"date_time"},{"field":"netflow.min_export_seconds","format":"date_time"},{"field":"netflow.min_flow_start_microseconds","format":"date_time"},{"field":"netflow.min_flow_start_milliseconds","format":"date_time"},{"field":"netflow.min_flow_start_nanoseconds","format":"date_time"},{"field":"netflow.min_flow_start_seconds","format":"date_time"},{"field":"netflow.monitoring_interval_end_milli_seconds","format":"date_time"},{"field":"netflow.monitoring_interval_start_milli_seconds","format":"date_time"},{"field":"netflow.observation_time_microseconds","format":"date_time"},{"field":"netflow.observation_time_milliseconds","format":"date_time"},{"field":"netflow.observation_time_nanoseconds","format":"date_time"},{"field":"netflow.observation_time_seconds","format":"date_time"},{"field":"netflow.system_init_time_milliseconds","format":"date_time"},{"field":"package.installed","format":"date_time"},{"field":"process.parent.start","format":"date_time"},{"field":"process.start","format":"date_time"},{"field":"suricata.eve.flow.end","format":"date_time"},{"field":"suricata.eve.flow.start","format":"date_time"},{"field":"suricata.eve.timestamp","format":"date_time"},{"field":"suricata.eve.tls.notafter","format":"date_time"},{"field":"suricata.eve.tls.notbefore","format":"date_time"},{"field":"tls.client.not_after","format":"date_time"},{"field":"tls.client.not_before","format":"date_time"},{"field":"tls.server.not_after","format":"date_time"},{"field":"tls.server.not_before","format":"date_time"},{"field":"zeek.kerberos.valid.from","format":"date_time"},{"field":"zeek.kerberos.valid.until","format":"date_time"},{"field":"zeek.ocsp.revoke.time","format":"date_time"},{"field":"zeek.ocsp.update.next","format":"date_time"},{"field":"zeek.ocsp.update.this","format":"date_time"},{"field":"zeek.pe.compile_time","format":"date_time"},{"field":"zeek.smb_files.times.accessed","format":"date_time"},{"field":"zeek.smb_files.times.changed","format":"date_time"},{"field":"zeek.smb_files.times.created","format":"date_time"},{"field":"zeek.smb_files.times.modified","format":"date_time"},{"field":"zeek.smtp.date","format":"date_time"},{"field":"zeek.snmp.up_since","format":"date_time"},{"field":"zeek.x509.certificate.valid.from","format":"date_time"},{"field":"zeek.x509.certificate.valid.until","format":"date_time"}],"_source":false,"query":{"bool":{"must":[],"filter":[{"bool":{"should":[{"match_phrase":{"message":"FAILED . Caused by"}}],"minimum_should_match":1}},{"match_phrase":{"kubernetes.labels.app":"violation-executor"}},{"range":{"@timestamp":{"gte":"now-15m","lte":"now","format":"strict_date_optional_time"}}}],"should":[],"must_not":[]}},"highlight":{"pre_tags":["@kibana-highlighted-field@"],"post_tags":["@/kibana-highlighted-field@"],"fields":{"*":{}},"fragment_size":2147483647}},"rest_total_hits_as_int":true,"ignore_unavailable":true,"ignore_throttled":true,"timeout":"720000ms"},"serverStrategy":"es"}`);
    return new JobResult(`${r"${hitCount}"}`,'')
}

function kibanaQueryHit(queryData) {
    let httpClient = HttpClient.newBuilder().build();
    let requestParams = RequestParams.builder('https://prod-0001-logstash.unified.com/internal/search/es', httpClient)
        .method(HttpMethod.POST)
        .headers(Map.of('Content-Type', 'application/json', 'kbn-version', '7.8.1'))
        .data(queryData)
        .build();

    let response = httpClientService.sendHTTPRequest().apply(requestParams);
    let responseString = HttpClientService.asString(response);
    let document = Configuration.defaultConfiguration().jsonProvider().parse(responseString);
    let documentContext = JsonPath.parse(document);
    return documentContext.read('$.rawResponse.hits.total', String.class);
}