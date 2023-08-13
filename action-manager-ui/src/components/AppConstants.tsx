import { PropertyMetadata, RestClient, SelectionData, SnackbarMessage, StepMetadata } from "./GenericConstants"

export const ROOT_BREADCRUMB = 'Actions'
export const JOB_CATEGORY_VALUES: Array<SelectionData> = [{label: "IO", value: "IO"}, {label: "CPU", value: "CPU"}]
export const JOB_OUTPUT_TARGET_VALUES: Array<SelectionData>  = [{label: "CONSOLE", value: "CONSOLE"}, {label: "METRIC", value: "METRIC"}]
export const JOB_SCHEDULE_TIME_SELECTION: Array<SelectionData>  = [
    {label: "0", value: 0},
    {label: "5 minutes", value: 5},
    {label: "10 minutes", value: 10},
    {label: "30 minutes", value: 30},
    {label: "1 hour", value: 1 * 60},
    {label: "2 hours", value: 2 * 60},
    {label: "3 hours", value: 3 * 60},
    {label: "6 hours", value: 6 * 60},
    {label: "12 hours", value: 12 * 60},
    {label: "24 hours", value: 24 * 60},
]
export const ACTION_STATUS_SELECTION: Array<SelectionData> = [
  {label: "INITIAL", value: "INITIAL"},
  {label: "READY", value:"READY"}
] 
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
let IntStream = Java.type('java.util.stream.IntStream');
let AtomicInteger = Java.type('java.util.concurrent.atomic.AtomicInteger');

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

const NEWRELIC_ENDPOINT = "https://api.newrelic.com/graphql";
const NEWRELIC_REQUEST_HEADERS = Map.of('Content-Type', 'application/json', 'API-Key', '<api key>');


const JIRA_ENDPOINT = 'https://<jira URL>/wiki/rest/api/content';
const JIRA_REQUEST_HEADERS = Map.of('Content-Type', 'application/json', "Authorization", "Basic <token>")


function preExecute() {
    return null;
}

function execute(preExecuteReturnValues) {
}


function postExecute(result, preExecuteReturnValues) {
    reutrn result;
}


function getNewRelicReport(newRelicQuery, columnMapping, heading) {
  let responseDocument = sendNewRelicQuery(newRelicQuery);
  let dailyStatsContext = JsonPath.parse(responseDocument);
  let dailyStats = dailyStatsContext.read('$.data.actor.account.nrql.results', List.class);

  let dailyStatRecords = formatJsonResponseToJavaMap(dailyStats, columnMapping);
  let daylyStatColumnLabels = columnMapping.keySet();
  let dailyStatsHTMLCode = new TableInfor(daylyStatColumnLabels, dailyStatRecords, heading);
  return dailyStatsHTMLCode.getHTMLCode;
}

function formatJsonResponseToJavaMap(jsonResponse, columnMapping) {
  let counter = new AtomicInteger(0);
  return StreamSupport.stream(jsonResponse.spliterator(), false).
    map(p => {
      let columnAsList = new ArrayList(columnMapping.entrySet());
      return columnMapping.entrySet().stream().map(column => {
        let columnName = column.getKey();
        let rowColumnDataType = column.getValue();
        let columnDataType = rowColumnDataType.getValue();

        if (columnName === 'No') {
          return Pair.of(columnName, counter.incrementAndGet());
        }

        if (columnDataType === 'date') {
          return Pair.of(columnName, new Date(parseInt(p.get(rowColumnDataType.getKey()))).toISOString());
        }

        let columnValue = replaceSpecialCharacters(p.get(rowColumnDataType.getKey()).toString());
        return Pair.of(columnName, columnValue);
      }).collect(Collectors.toMap(column => column.getKey(), column => column.getValue(), (u, v) => u, ()=> new LinkedHashMap()));
    }).collect(Collectors.toList());
}

function replaceSpecialCharacters(text) {
  const specialCharacters = /[&<>'"]/g;
  return text.replace(specialCharacters, function(match) {
    switch (match) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "\"":
        return "&quot;";
      case "'":
        return "&apos;";
    }
  });
}

function createJiraConfluenceWikiPage(pageTitle, pageContent) {
  let pageContentData = {
  }

  return sendHttpPOSTRequest(JIRA_ENDPOINT, JIRA_REQUEST_HEADERS, JSON.stringify(pageContentData))
}

function sendNewRelicQuery(targetURL, newRelicQuery) {
  
    let postDataAsJSONString = '{"query":"{ actor {account(id: 153518) {  nrql(timeout: 120, query: \\"' + newRelicQuery + '\\") { results  }} }}", "variables":""}'; 
    let postData = JSON.parse(postDataAsJSONString)
    return sendHttpPOSTRequest(NEWRELIC_ENDPOINT, NEWRELIC_REQUEST_HEADERS, JSON.stringify(postData));
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
    isPaused: boolean | undefined
    isScheduled: boolean | undefined
    outputTargets: Array<String> | undefined
    scheduleInterval: number | undefined
    status: string | undefined
    createdAt?: number | undefined
}

export interface ActionDefinition {
    name: string | undefined
    description: string | undefined
    configurations: string | undefined
    createdAt?: number | undefined
    status: string | undefined
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
    status: string
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
    executionStatus: string
    status: string
    failureNotes?: string
    startedAt: number
    elapsedTime: number
    updatedAt: number
    schedule: boolean
}

export interface JobDetailMetadata {
    name?: string
    category: 'NORMAL' | 'SYSTEM' | undefined
    description?: string
    configurations?: string
    content?: string
    isAsync?: boolean
    isScheduled: boolean
    outputTargets?: Array<String>
    scheduleInterval?: number
    createdAt?: number
    status?: string
}


const findStepPropertyByCondition = (stepMetadata: StepMetadata | undefined, filter: (property: PropertyMetadata) => boolean): PropertyMetadata | undefined => {
    return stepMetadata ? findPropertyByCondition(stepMetadata.properties, filter) : undefined;
}

const findPropertyByCondition = (properties: Array<PropertyMetadata> | undefined, filter: (property: PropertyMetadata) => boolean): PropertyMetadata | undefined => {
    return properties ? properties.find(filter) : undefined;
}

export const getJobDefinitionFromStepMetadata = (stepMetadata: StepMetadata) => {

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


export class JobAPI {
  static update = async (jobId: string, restClient: RestClient, propertyMetadata: Array<PropertyMetadata>, successCallback: () => void) => {
    let jobDefinition = getJobDefinition(propertyMetadata);
    const requestOptions = {
      method: "PUT",
      headers: {
        "Accept": "application/json",
        "Content-type": "application/json"
      },
      body: JSON.stringify(jobDefinition)
    }

    const targetURL = `${JOB_MANAGER_API_URL}/${jobId}`;
    await restClient.sendRequest(requestOptions, targetURL, async(response) => {
      let responseJSON = await response.json();
      successCallback();
      return { 'message': `${responseJSON['uuid']} is updated`, key: new Date().getTime() } as SnackbarMessage;
    });
  }

  static async pause(jobId: string, jobName: string, restClient: RestClient) {
    const requestOptions = {
      method: "PUT",
      headers: {}
    }
    const targetURL = `${JOB_MANAGER_API_URL}/${jobId}/pause`;
    await restClient.sendRequest(requestOptions, targetURL, async() => {
      return { 'message': `Job ${jobName} has been paused`, key: new Date().getTime() } as SnackbarMessage;
    });
  }

  static async new(actionId: string, jobDefinitions: Array<JobDefinition>, restClient: RestClient, successCallback: () => void) {

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jobDefinitions)
    };

    const targetURL = `${ACTION_MANAGER_API_URL}/${actionId}/jobs/new`;
    await restClient.sendRequest(requestOptions, targetURL, async (response) => {
      successCallback()
      return undefined;
    }, async (response: Response) => {
      return { 'message': "An interal error occurred during your request!", key: new Date().getTime() } as SnackbarMessage;
    });
  }

  static async delete(jobId: string, jobName: string, restClient: RestClient, successCallback: () => void) {
    const requestOptions = {
      method: "DELETE",
      headers: {}
    }
    const targetURL = `${JOB_MANAGER_API_URL}/${jobId}`;
    await restClient.sendRequest(requestOptions, targetURL, async() => {
      successCallback();
      return { 'message': `Job ${jobName} has been deleted`, key: new Date().getTime() } as SnackbarMessage;
    });
  }

  static async resume(actionId: string, jobId: string, jobName: string, restClient: RestClient) {
    const requestOptions = {
      method: "PUT",
      headers: {}
    }
    const targetURL = `${ACTION_MANAGER_API_URL}/${actionId}/jobs/${jobId}/resume`;
    await restClient.sendRequest(requestOptions, targetURL, async() => {
      return { 'message': `Job ${jobName} has been resumed`, key: new Date().getTime() } as SnackbarMessage;
    });
  }

  static async load(jobId: string, restClient: RestClient, successCallback: (data: any) => void) {
    const requestOptions = {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    }

    const targetURL = `${JOB_MANAGER_API_URL}/${jobId}`;
    await restClient.sendRequest(requestOptions, targetURL, async (response) => {
      let jobDetail: JobDetailMetadata = await response.json() as JobDetailMetadata;
      successCallback(jobDetail);
      return { 'message': 'Load job detail successfully!!', key: new Date().getTime() } as SnackbarMessage;
    }, async (response: Response) => {
      let responseJSON = await response.json();
      return { 'message': responseJSON['message'], key: new Date().getTime() } as SnackbarMessage;
    });
  }

  static async dryRun(restClient: RestClient, propertyMetadata: Array<PropertyMetadata>) {
    let jobDefinition = getJobDefinition(propertyMetadata);
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify(jobDefinition)
    }

    const targetURL = `${JOB_MANAGER_API_URL}/dryRun`;
    await restClient.sendRequest(requestOptions, targetURL, async() => {
      return { 'message': "Dry run action successfully", key: new Date().getTime() } as SnackbarMessage;
    });
  }
}