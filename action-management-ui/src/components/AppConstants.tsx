export const ROOT_BREADCRUMB = 'Actions'
export const JOB_CATEGORY_VALUES = ["IO", "CPU"]
export const JOB_OUTPUT_TARGET_VALUES = ["CONSOLE", "METRIC"]
export const JOB_SCHEDULE_TIME_SELECTION = [0, 5, 10, 20, 30, 60]
export const ACTION_MANAGER_API_URL: string = `${process.env.REACT_APP_ACTION_MANAGER_BACKEND_URL}/action-manager/v1/actions`
export const JOB_MANAGER_API_URL: string =  `${process.env.REACT_APP_ACTION_MANAGER_BACKEND_URL}/action-manager/v1/jobs`
export const DEFAULT_JOB_CONTENT: string = `let Collections = Java.type('java.util.Collections');
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
    name: string
    state: string
    status: string
    failureNotes?: string
    startedAt: number
    elapsedTime: number
    updatedAt: number
    schedule: boolean
}