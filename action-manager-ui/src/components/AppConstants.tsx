import { PagingResult, PropertyMetadata, RestClient, SelectionData, SnackbarMessage, StepMetadata } from "./GenericConstants"
import fileDownload from 'js-file-download';

export const ROOT_BREADCRUMB = 'Actions'
export const JOB_CATEGORY_VALUES: Array<SelectionData> = [{ label: "IO", value: "IO" }, { label: "CPU", value: "CPU" }]
export const JOB_OUTPUT_TARGET_VALUES: Array<SelectionData> = [{ label: "CONSOLE", value: "CONSOLE" }, { label: "METRIC", value: "METRIC" }]
export const JOB_SCHEDULE_TIME_SELECTION: Array<SelectionData> = [
  { label: "0", value: 0 },
  { label: "1 minutes", value: 1 },
  { label: "2 minutes", value: 2 },
  { label: "5 minutes", value: 5 },
  { label: "10 minutes", value: 10 },
  { label: "30 minutes", value: 30 },
  { label: "1 hour", value: 1 * 60 },
  { label: "2 hours", value: 2 * 60 },
  { label: "3 hours", value: 3 * 60 },
  { label: "6 hours", value: 6 * 60 },
  { label: "12 hours", value: 12 * 60 },
  { label: "24 hours", value: 24 * 60 },
]
export const ACTION_STATUS_SELECTION: Array<SelectionData> = [
  { label: "INITIAL", value: "INITIAL" },
  { label: "ACTIVE", value: "ACTIVE" }
]
export const JOB_STATUS_SELECTION: Array<SelectionData> = [
  { label: "INITIAL", value: "INITIAL" },
  { label: "PAUSED", value: "PAUSED" },
  { label: "ACTIVE", value: "ACTIVE" }
]
export const CHIP_RANDOM_COLOR = [
  '#2C5F2D', '#CC313D', '#20948B', '#1995AD',
  '#2F3C7E', '#101820', '#990011', '#00246B'
];
export const ACTION_MANAGER_API_URL: string = `${process.env.REACT_APP_ACTION_MANAGER_BACKEND_URL}/action-manager-backend/v1/actions`
export const JOB_MANAGER_API_URL: string = `${process.env.REACT_APP_ACTION_MANAGER_BACKEND_URL}/action-manager-backend/v1/jobs`
export const TEMPLATE_BACKEND_URL: string = `${process.env.REACT_APP_TEMPLATE_MANAGER_BACKEND_URL}/template-manager-backend/templates`
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


let StringUtils = Java.type('org.apache.commons.lang3.StringUtils');

let HttpClient = Java.type('java.net.http.HttpClient');
let Pair = Java.type('com.hoatv.fwk.common.ultilities.Pair');
let Triplet = Java.type('com.hoatv.fwk.common.ultilities.Triplet');
let CheckedFunction = Java.type('com.hoatv.fwk.common.services.CheckedFunction');
let CheckSupplier = Java.type('com.hoatv.fwk.common.services.CheckedSupplier');
let CheckConsumer = Java.type('com.hoatv.fwk.common.services.CheckedConsumer');

let DateTimeUtils = Java.type('com.hoatv.fwk.common.ultilities.DateTimeUtils');
let ObjectUtils = Java.type('com.hoatv.fwk.common.ultilities.ObjectUtils');
let MDCUtils = Java.type('com.hoatv.fwk.common.ultilities.MDCUtils');
let StringCommonUtils = Java.type('com.hoatv.fwk.common.ultilities.StringCommonUtils');
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
  isScheduled: boolean | undefined
  outputTargets: Array<String> | undefined
  scheduleInterval: number | undefined
  status: string | undefined
  createdAt?: number | undefined
  templates: string
}

export interface ActionDefinition {
  name: string | undefined
  description: string | undefined
  configurations: string | undefined
  createdAt?: number | undefined
  status: string | undefined
  jobs: Array<JobDefinition> | undefined
}

export interface ActionOverview {
  hash: string
  name: string
  numberOfJobs: number
  numberOfSuccessJobs: number
  numberOfFailureJobs: number
  numberOfPendingJobs: number
  numberOfScheduleJobs: number
  createdAt: number
  status: string
  isFavorite: boolean
}

export interface ActionDetails {
  actionName: string
  actionStatus: string
  actionConfigurations: string
}

export interface TemplateOverview {
  uuid: string
  templateName: string
  dataTemplateJSON: string
  templateText: string
  createdAt: number
  updatedAt: number
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
  templates: string
}

export const isAllDependOnPropsValid = (dependOnArr: Array<any>, properties: Array<PropertyMetadata> | undefined): boolean => {

  for (let index = 0; index < dependOnArr.length; index += 2) {
    let dependOnPropName = dependOnArr[index]
    let dependOnPropValue = dependOnArr[index + 1]
    let dependOnProp = findPropertyByCondition(properties, p => p.propName === dependOnPropName && p.propValue === dependOnPropValue);
    if (dependOnProp === undefined) {
      return false;
    }
  }
  return true
}


export const findPropertyByCondition = (properties: Array<PropertyMetadata> | undefined, filter: (property: PropertyMetadata) => boolean): PropertyMetadata | undefined => {
  return properties ? properties.find(filter) : undefined;
}

export const getActionDefinition = (properties: Array<PropertyMetadata>): ActionDefinition => {
  let actionDescription = findPropertyByCondition(properties, property => property.propName === "actionDescription");
  let actionConfigurations = findPropertyByCondition(properties, property => property.propName === "actionConfigurations");
  let actionStatus = findPropertyByCondition(properties, property => property.propName === "actionStatus");
  let name = findPropertyByCondition(properties, property => property.propName === "actionName");
  let actionDefinition: ActionDefinition = {
    name: name?.propValue,
    description: actionDescription?.propValue,
    configurations: actionConfigurations?.propValue,
    jobs: undefined,
    status: actionStatus?.propValue
  }
  return actionDefinition;
}

export const getJobDefinition = (properties: Array<PropertyMetadata>) => {

  const name = findPropertyByCondition(properties, property => property.propName.startsWith("name"))?.propValue;
  const description = findPropertyByCondition(properties, property => property.propName.startsWith("description"))?.propValue;
  const configurations = findPropertyByCondition(properties, property => property.propName.startsWith("configurations"))?.propValue;
  const content = findPropertyByCondition(properties, property => property.propName.startsWith("content"))?.propValue;
  const isAsync = findPropertyByCondition(properties, property => property.propName.startsWith("isAsync"))?.propValue;
  const category = findPropertyByCondition(properties, property => property.propName.startsWith("category"))?.propValue;
  const outputTargets = findPropertyByCondition(properties, property => property.propName.startsWith("outputTargets"))?.propValue;
  const isScheduled = findPropertyByCondition(properties, property => property.propName.startsWith("isScheduled"))?.propValue;
  const scheduleInterval = findPropertyByCondition(properties, property => property.propName.startsWith("scheduleInterval"))?.propValue;
  const status = findPropertyByCondition(properties, property => property.propName.startsWith("status"))?.propValue;
  const templateArrays = findPropertyByCondition(properties, property => property.propName.startsWith("templates"))?.propValue;
  const templates = JSON.stringify(templateArrays)
  return {
    name,
    category,
    description,
    configurations,
    content,
    outputTargets,
    isAsync,
    status,
    isScheduled,
    templates,
    scheduleInterval: isScheduled ? scheduleInterval : 0
  } as JobDefinition

}

export const getJobDetails = (currentStepMetadata: Array<StepMetadata>) => {

  const findRelatedJobs = (currentStepMetadata: Array<StepMetadata>): Array<JobDefinition> => {
    return currentStepMetadata
      .map(stepMetadata => getJobDefinition(stepMetadata.properties))
  }

  return findRelatedJobs(currentStepMetadata);
}

export class ActionAPI {

  static setFavoriteAction = async (actionId: string, isFavorite: boolean, restClient: RestClient, successCallback: () => void) => {

    const requestOptions = {
      method: "PATCH",
      headers: {
        "Accept": "application/json"
      }
    }

    const targetURL = `${ACTION_MANAGER_API_URL}/${actionId}/favorite?isFavorite=${isFavorite}`;
    await restClient.sendRequest(requestOptions, targetURL, () => {
      successCallback();
      return undefined;
    });
  }
  static loadTrashSummarysAsync = async (
    pageIndex: number, 
    pageSize: number, 
    orderBy: string,
    restClient: RestClient, 
    successCallback: (pageingResult: PagingResult) => void) => {
    const requestOptions = {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    }

    const targetURL = `${ACTION_MANAGER_API_URL}/trash?pageIndex=${pageIndex}&pageSize=${pageSize}&orderBy=${orderBy}`;
    await restClient.sendRequest(requestOptions, targetURL, async (response) => {
      let actionPagingResult = await response.json() as PagingResult;
      successCallback(actionPagingResult);
      return undefined;
    });
  }

  static loadActionSummarysAsync = async (
    pageIndex: number, 
    pageSize: number, 
    orderBy: string,
    restClient: RestClient, 
    successCallback: (pageingResult: PagingResult) => void) => {
    const requestOptions = {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    }

    const targetURL = `${ACTION_MANAGER_API_URL}?pageIndex=${pageIndex}&pageSize=${pageSize}&orderBy=${orderBy}`;
    await restClient.sendRequest(requestOptions, targetURL, async (response) => {
      let actionPagingResult = await response.json() as PagingResult;
      successCallback(actionPagingResult);
      return undefined;
    });
  }


  static loadActionDetailAsync = async (actionId: string, restClient: RestClient, successCallback: (response: ActionDetails) => void) => {
    const requestOptions = {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    }

    const targetURL = `${ACTION_MANAGER_API_URL}/${encodeURIComponent(actionId)}`;
    await restClient.sendRequest(requestOptions, targetURL, async (response) => {
      let actionDetailResult = await response.json();

      const actionDetail: ActionDetails = {
        actionName: actionDetailResult.name,
        actionStatus: actionDetailResult.status,
        actionConfigurations: actionDetailResult.configurations
      }
      successCallback(actionDetail);
      return undefined;
    });
  }

  static loadRelatedJobsAsync = async (
    pageIndex: number, 
    pageSize: number, 
    orderBy: string,
    targetAction: string, 
    restClient: RestClient, 
    successCallback: (data: PagingResult) => void) => {
    const requestOptions = {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    }

    const targetURL = `${ACTION_MANAGER_API_URL}/${encodeURIComponent(targetAction)}/jobs?pageIndex=${encodeURIComponent(pageIndex)}&pageSize=${encodeURIComponent(pageSize)}&orderBy=${orderBy}`;
    await restClient.sendRequest(requestOptions, targetURL, async (response) => {
      let responseJSON = await response.json() as PagingResult;
      successCallback(responseJSON);
      return undefined;
    });
  }

  static deleteAction = async (actionId: string, restClient: RestClient, successCallback: () => void) => {

    const requestOptions = {
      method: "DELETE",
      headers: {
        "Accept": "application/json"
      }
    }
    const targetURL = `${ACTION_MANAGER_API_URL}/${actionId}`;
    await restClient.sendRequest(requestOptions, targetURL, () => {
      successCallback();
      return undefined;
    });
  }

  static updateAction = async (actionId: string, restClient: RestClient, propertyMetadata: Array<PropertyMetadata>, successCallback: () => void) => {
    const actionDefinition = getActionDefinition(propertyMetadata);
    const requestOptions = {
      method: "PUT",
      headers: {
        "Accept": "application/json",
        "Content-type": "application/json"
      },
      body: JSON.stringify(actionDefinition)
    }
    const targetURL = `${ACTION_MANAGER_API_URL}/${actionId}`;
    await restClient.sendRequest(requestOptions, targetURL, async (response) => {
      successCallback();
      return { 'message': 'Action info has been updated successfully', key: new Date().getTime() } as SnackbarMessage;
    });
  }

  static async importFromFile(uploadFormData: FormData, restClient: RestClient, successCallback: (actionName: string) => void) {

    const requestOptions = {
      method: "POST",
      body: uploadFormData
    }
    const targetURL = `${ACTION_MANAGER_API_URL}/import`;
    await restClient.sendRequest(requestOptions, targetURL, async (response) => {
      let responseJSON = await response.json();
      successCallback(responseJSON.name)
      return undefined
    });
  }

  static export = async (actionId: string, actionName: string, restClient: RestClient) => {

    const requestOptions = {
      method: "GET",
      headers: {
      }
    }
    const targetURL = `${ACTION_MANAGER_API_URL}/${actionId}/export`;
    await restClient.sendRequest(requestOptions, targetURL, async (response) => {
      let blob = await response.blob();
      let fileName = response.headers.get('X-DOWNLOAD-FILE-NAME');
      fileDownload(blob, fileName || `${actionName}.zip`)
      return { 'message': "The action is export sucessfully", key: new Date().getTime() } as SnackbarMessage;
    });
  }

  static archive = async (actionId: string, restClient: RestClient, successCallback: () => void) => {

    const requestOptions = {
      method: "PUT",
      headers: {
        "Accept": "application/json"
      }
    }
    const targetURL = `${ACTION_MANAGER_API_URL}/${actionId}/archive`;
    await restClient.sendRequest(requestOptions, targetURL, () => {
      successCallback();
      return undefined;
    });
  }

  static restore = async (actionId: string, restClient: RestClient, successCallback: () => void) => {

    const requestOptions = {
      method: "PUT",
      headers: {
        "Accept": "application/json"
      }
    }
    const targetURL = `${ACTION_MANAGER_API_URL}/${actionId}/restore`;
    await restClient.sendRequest(requestOptions, targetURL, () => {
      successCallback();
      return undefined;
    });
  }


  static replayAction = async (actionId: string, restClient: RestClient, successCallback: () => void) => {

    const requestOptions = {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    }
    const targetURL = `${ACTION_MANAGER_API_URL}/${actionId}/replay`;
    await restClient.sendRequest(requestOptions, targetURL, async () => {
      successCallback();
      return undefined
    });
  }

  static replayFailures = async (actionId: string, restClient: RestClient, successCallback: () => void) => {

    const requestOptions = {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    }
    const targetURL = `${ACTION_MANAGER_API_URL}/${actionId}/replay-failures`;
    await restClient.sendRequest(requestOptions, targetURL, async () => {
      successCallback();
      return undefined
    });
  }

  static replayJob = async (actionId: string, jobId: string, restClient: RestClient) => {

    const requestOptions = {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    }
    const targetURL = `${ACTION_MANAGER_API_URL}/${actionId}/jobs/${jobId}/replay`;
    await restClient.sendRequest(requestOptions, targetURL, async () => {
      return undefined
    });
  }
}

export class TemplateAPI {

  static async search(name: string, restClient: RestClient, successCallback: (templateOverviews: Array<TemplateOverview>) => void) {
    const requestOptions = {
      method: "GET",
      headers: {}
    }
    const targetURL = `${TEMPLATE_BACKEND_URL}/search?name=${name}`;
    await restClient.sendRequest(requestOptions, targetURL, async (response) => {
      let templateOverviews = await response.json() as Array<TemplateOverview>;
      successCallback(templateOverviews)
      return undefined
    });
  }
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
    await restClient.sendRequest(requestOptions, targetURL, async (response) => {
      successCallback();
      return { 'message': 'Job info has been updated successfully', key: new Date().getTime() } as SnackbarMessage;
    });
  }

  static async pause(jobId: string, jobName: string, restClient: RestClient) {
    const requestOptions = {
      method: "PUT",
      headers: {}
    }
    const targetURL = `${JOB_MANAGER_API_URL}/${jobId}/pause`;
    await restClient.sendRequest(requestOptions, targetURL, async () => {
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
    });
  }

  static async delete(jobId: string, jobName: string, restClient: RestClient, successCallback: () => void) {
    const requestOptions = {
      method: "DELETE",
      headers: {}
    }
    const targetURL = `${JOB_MANAGER_API_URL}/${jobId}`;
    await restClient.sendRequest(requestOptions, targetURL, async () => {
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
    await restClient.sendRequest(requestOptions, targetURL, async () => {
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
      return undefined;
    });
  }

  static loadRelatedJobsAsync = async (
    pageIndex: number, 
    pageSize: number, 
    orderBy: string,
    restClient: RestClient, 
    successCallback: (data: any) => void) => {
    const requestOptions = {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    }

    const targetURL = `${JOB_MANAGER_API_URL}?pageIndex=${encodeURIComponent(pageIndex)}&pageSize=${encodeURIComponent(pageSize)}&orderBy=${orderBy}`;
    await restClient.sendRequest(requestOptions, targetURL, async (response) => {
      let responseJSON = await response.json() as PagingResult;
      successCallback(responseJSON);
      return undefined;
    });
  }

  static async dryRun(restClient: RestClient, propertyMetadata: Array<PropertyMetadata>, actionId: string) {
    let jobDefinition = getJobDefinition(propertyMetadata);
    const requestOptions = {
      method: "POST",
      headers: {
        "Content-type": "application/json"
      },
      body: JSON.stringify(jobDefinition)
    }

    const targetURL = `${JOB_MANAGER_API_URL}/dryRun?actionId=${actionId}`;
    await restClient.sendRequest(requestOptions, targetURL, async () => {
      return { 'message': "Dry run action successfully", key: new Date().getTime() } as SnackbarMessage;
    });
  }
}