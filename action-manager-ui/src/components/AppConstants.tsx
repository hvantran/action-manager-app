import { PropertyMetadata, StepMetadata } from "./GenericConstants"

export const ROOT_BREADCRUMB = 'Actions'
export const JOB_CATEGORY_VALUES = ["IO", "CPU"]
export const JOB_OUTPUT_TARGET_VALUES = ["CONSOLE", "METRIC"]
export const JOB_SCHEDULE_TIME_SELECTION = [0, 5, 10, 20, 30, 60]
export const ACTION_MANAGER_API_URL: string = `${process.env.REACT_APP_ACTION_MANAGER_BACKEND_URL}/action-manager/v1/actions`
export const JOB_MANAGER_API_URL: string = `${process.env.REACT_APP_ACTION_MANAGER_BACKEND_URL}/action-manager/v1/jobs`
export const DEFAULT_JOB_CONTENT: string = `let Collections = Java.type('java.util.Collections');
let Collectors = Java.type('java.util.stream.Collectors');
let StreamSupport = Java.type('java.util.stream.StreamSupport');
let List = Java.type('java.util.List');
let ArrayList = Java.type('java.util.ArrayList');
let Map = Java.type('java.util.Map');
let HashMap = Java.type('java.util.HashMap');
let HttpResponse = Java.type('java.net.http.HttpResponse');
let Configuration = Java.type('com.jayway.jsonpath.Configuration');
let DocumentContext = Java.type('com.jayway.jsonpath.DocumentContext');
let JsonPath = Java.type('com.jayway.jsonpath.JsonPath');
let String = Java.type('java.lang.String');
let Duration = Java.type('java.time.Duration');
let ChronoUnit = Java.type('java.time.temporal.ChronoUnit');
let JSONObject = Java.type('net.minidev.json.JSONObject');

let HttpClient = Java.type('java.net.http.HttpClient');
let Pair = Java.type('com.hoatv.fwk.common.ultilities.Pair');
let Triplet = Java.type('com.hoatv.fwk.common.ultilities.Triplet');
let CheckedFunction = Java.type('com.hoatv.fwk.common.services.CheckedFunction');
let CheckSupplier = Java.type('com.hoatv.fwk.common.services.CheckedSupplier');
let CheckConsumer = Java.type('com.hoatv.fwk.common.services.CheckedConsumer');

let DateTimeUtils = Java.type('com.hoatv.fwk.common.ultilities.DateTimeUtils');
let ObjectUtils = Java.type('com.hoatv.fwk.common.ultilities.ObjectUtils');
let JobResult = Java.type('com.hoatv.action.manager.services.JobResult');
let JobResultFactory = Java.type('com.hoatv.action.manager.services.JobResultFactory');
let RequestParams = Java.type('com.hoatv.fwk.common.services.HttpClientService.RequestParams');
let HttpMethod = Java.type('com.hoatv.fwk.common.services.HttpClientService.HttpMethod');
let HttpClientService = Java.type('com.hoatv.fwk.common.services.HttpClientService');

const NEWRELIC_API_KEY = ''

function preExecute() {
    return null;
}

function execute(preExecuteReturnValues) {
}


function postExecute(result, preExecuteReturnValues) {
    reutrn result;
}


function sendNewRelicQuery(targetURL, newRelicQuery) {
  
    let postData = JSON.parse('{"query":"{ actor {account(id: 153518) {  nrql(timeout: 120, query: \\"' + newRelicQuery + '\\") { results  }} }}", "variables":""}')
    return sendHttpPOSTRequest(targetURL,
      Map.of('Content-Type', 'application/json', 'API-Key', NEWRELIC_API_KEY), JSON.stringify(postData)
   );
}

function sendHttpGETRequest(targetURL, headers) {
    let httpClient = HttpClient.newBuilder().build();
    let requestParams = RequestParams.builder(targetURL, httpClient)
        .method(HttpMethod.GET)
        .requestTimeoutInMs(60000)
        .headers(headers)
        .build();

    let response = httpClientService.sendHTTPRequest().apply(requestParams);
    let responseString = HttpClientService.asString(response);
    return Configuration.defaultConfiguration().jsonProvider().parse(responseString);
}

function sendHttpPOSTRequest(targetURL, headers, queryData) {
    let httpClient = HttpClient.newBuilder().build();
    let requestParams = RequestParams.builder(targetURL, httpClient)
        .method(HttpMethod.POST)
        .requestTimeoutInMs(60000)
        .headers(headers)
        .data(queryData)
        .build();

    let response = httpClientService.sendHTTPRequest().apply(requestParams);
    let responseString = HttpClientService.asString(response);
    return Configuration.defaultConfiguration().jsonProvider().parse(responseString);
}
`

export interface JobDefinition {
    name: string | undefined
    category: 'NORMAL' | 'SYSTEM' | undefined
    description: string | undefined
    configurations: string | undefined
    content: string | undefined
    isAsync: boolean | undefined
    isScheduled: boolean | undefined
    outputTargets: Array<String> | undefined
    scheduleInterval: number | undefined
    createdAt?: number | undefined
}

export interface ActionDefinition {
    name: string | undefined
    description: string | undefined
    configurations: string | undefined
    createdAt?: number | undefined
    relatedJobs: Array<JobDefinition> | undefined
}

export interface ActionOverview {
    hash: string
    name: string
    numberOfJobs: number
    numberOfSuccessJobs: number
    numberOfFailureJobs: number
    numberOfScheduleJobs: number
    createdAt: number
    isFavorite: boolean
}

export interface ActionDetails {
    hash: string
    name: string
    numberOfJobs: number
    numberOfSuccessJobs: number
    numberOfFailureJobs: number
    createdAt: number
    description: string
    configurations: string
}

export interface JobOverview {
    hash: string
    actionHash: string
    name: string
    state: string
    status: string
    failureNotes?: string
    startedAt: number
    elapsedTime: number
    updatedAt: number
    schedule: boolean
}

export interface JobDetailMetadata {
    name: string | undefined
    category: 'NORMAL' | 'SYSTEM' | undefined
    description: string | undefined
    configurations: string | undefined
    content: string | undefined
    isAsync: boolean | undefined
    isScheduled: boolean | undefined
    outputTargets: Array<String> | undefined
    scheduleInterval: number | undefined
    createdAt?: number | undefined
}

const findStepPropertyByCondition = (stepMetadata: StepMetadata | undefined, filter: (property: PropertyMetadata) => boolean): PropertyMetadata | undefined => {
    return stepMetadata ? stepMetadata.properties.find(filter) : undefined;
}

const findPropertyByCondition = (properties: Array<PropertyMetadata> | undefined, filter: (property: PropertyMetadata) => boolean): PropertyMetadata | undefined => {
    return properties ? properties.find(filter) : undefined;
}

export const getJobDefinition = (properties: Array<PropertyMetadata>) => {

    let name = findPropertyByCondition(properties, property => property.propName.startsWith("name"))?.propValue;
    let description = findPropertyByCondition(properties, property => property.propName.startsWith("description"))?.propValue;
    let configurations = findPropertyByCondition(properties, property => property.propName.startsWith("configurations"))?.propValue;
    let content = findPropertyByCondition(properties, property => property.propName.startsWith("content"))?.propValue;
    let isAsync = findPropertyByCondition(properties, property => property.propName.startsWith("isAsync"))?.propValue;
    let category = findPropertyByCondition(properties, property => property.propName.startsWith("category"))?.propValue;
    let outputTargets = findPropertyByCondition(properties, property => property.propName.startsWith("outputTargets"))?.propValue;
    let isScheduled = findPropertyByCondition(properties, property => property.propName.startsWith("isScheduled"))?.propValue;
    let scheduleInterval = findPropertyByCondition(properties, property => property.propName.startsWith("scheduleInterval"))?.propValue;

    return {
        name,
        category,
        description,
        configurations,
        content,
        outputTargets,
        isAsync,
        isScheduled,
        scheduleInterval: isScheduled ? scheduleInterval : 0
    } as JobDefinition

}

export const getJobDetails = (currentStepMetadata: Array<StepMetadata>) => {

    const findRelatedJobs = (currentStepMetadata: Array<StepMetadata>): Array<JobDefinition> => {
        return currentStepMetadata
            .map(stepMetadata => {
                let name = findStepPropertyByCondition(stepMetadata, property => property.propName.startsWith("jobName"))?.propValue;
                let description = findStepPropertyByCondition(stepMetadata, property => property.propName.startsWith("jobDescription"))?.propValue;
                let configurations = findStepPropertyByCondition(stepMetadata, property => property.propName.startsWith("jobConfigurations"))?.propValue;
                let content = findStepPropertyByCondition(stepMetadata, property => property.propName.startsWith("jobContent"))?.propValue;
                let isAsync = findStepPropertyByCondition(stepMetadata, property => property.propName.startsWith("isAsync"))?.propValue;
                let category = findStepPropertyByCondition(stepMetadata, property => property.propName.startsWith("jobCategory"))?.propValue;
                let outputTargets = findStepPropertyByCondition(stepMetadata, property => property.propName.startsWith("jobOutputTargets"))?.propValue;
                let isScheduled = findStepPropertyByCondition(stepMetadata, property => property.propName.startsWith("isScheduledJob"))?.propValue;
                let scheduleInterval = findStepPropertyByCondition(stepMetadata, property => property.propName.startsWith("scheduleInterval"))?.propValue;

                return {
                    name,
                    category,
                    description,
                    configurations,
                    content,
                    outputTargets,
                    isAsync,
                    isScheduled,
                    scheduleInterval: isScheduled ? scheduleInterval : 0
                } as JobDefinition
            })
    }

    return findRelatedJobs(currentStepMetadata);
}