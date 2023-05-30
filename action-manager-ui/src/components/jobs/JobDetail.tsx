import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import { Stack, Switch } from '@mui/material';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import React from 'react';
import {
  GenericActionMetadata,
  PageEntityMetadata,
  PropType,
  PropertyMetadata,
  RestClient,
  SnackbarAlertMetadata,
  SnackbarMessage,
  onChangeProperty
} from '../GenericConstants';
import ProcessTracking from '../common/ProcessTracking';

import { yellow } from '@mui/material/colors';
import { useLocation, useParams } from 'react-router-dom';
import {
  ACTION_MANAGER_API_URL,
  JOB_CATEGORY_VALUES,
  JOB_MANAGER_API_URL,
  JOB_OUTPUT_TARGET_VALUES,
  JOB_SCHEDULE_TIME_SELECTION,
  JobDetailMetadata,
  ROOT_BREADCRUMB,
  getJobDefinition
} from '../AppConstants';
import SnackbarAlert from '../common/SnackbarAlert';
import PageEntityRender from '../renders/PageEntityRender';


class JobAPI {
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

  static async pause(actionId: string, jobId: string, jobName: string, restClient: RestClient) {
    const requestOptions = {
      method: "PUT",
      headers: {}
    }
    const targetURL = `${ACTION_MANAGER_API_URL}/${actionId}/jobs/${jobId}/pause`;
    await restClient.sendRequest(requestOptions, targetURL, async() => {
      return { 'message': `Job ${jobName} has been paused`, key: new Date().getTime() } as SnackbarMessage;
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
}

export default function JobDetail() {
  const targetJob = useParams();
  const location = useLocation();
  const jobName = location.state?.name || "";
  const [isPausedJob, setIsPausedJob] = React.useState(false);
  const jobId: string | undefined = targetJob.jobId;
  const actionId: string = targetJob.actionId || "";
  if (!jobId) {
    throw new Error("TaskId is required");
  }

  const enableEditFunction = function (isEnabled: boolean) {

    setEditActionMeta(previous => {
      previous.disable = isEnabled;
      return previous;
    })
    setSaveActionMeta(previous => {
      previous.disable = !isEnabled;
      return previous;
    });
    setPropertyMetadata(previous => {
      return [...previous].map(p => {
        if (p.propName !== "name") {
          p.disabled = !isEnabled;
        }
        return p;
      })
    })
  }

  const [saveActionMeta, setSaveActionMeta] = React.useState<GenericActionMetadata>(
    {
      actionIcon: <SaveIcon />,
      actionLabel: "Save",
      actionName: "saveAction",
      disable: true,
      onClick: () => JobAPI.update(jobId, restClient, propertyMetadata, () => enableEditFunction(false))
    });

  const [editActionMeta, setEditActionMeta] = React.useState<GenericActionMetadata>(
    {
      actionIcon: <EditIcon />,
      properties: {sx:{color: yellow[800]}},
      actionLabel: "Edit",
      actionName: "editAction",
      onClick: () => enableEditFunction(true)
    });

  const [propertyMetadata, setPropertyMetadata] = React.useState<Array<PropertyMetadata>>(
    [
      {
        propName: 'name',
        propLabel: 'Name',
        propValue: '',
        isRequired: true,
        disabled: true,
        propDescription: 'This is name of job',
        propType: PropType.InputText,
        layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 4 },
        valueElementProperties: { xs: 8 },
        textFieldMeta: {
          onChangeEvent: function (event: any) {
            let propValue = event.target.value;
            let propName = event.target.name;
            setPropertyMetadata(onChangeProperty(propName, propValue));
          }
        }
      },
      {
        propName: 'isAsync',
        propLabel: 'Asynchronous',
        propValue: false,
        disabled: true,
        layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 4, sx: { pl: 5 } },
        valueElementProperties: { xs: 8 },
        propType: PropType.Switcher,
        switcherFieldMeta: {
          onChangeEvent: function (event, propValue) {
            let propName = event.target.name;
            setPropertyMetadata(onChangeProperty(propName, propValue));
          }
        }
      },
      {
        propName: 'outputTargets',
        propLabel: 'Output',
        disabled: true,
        propValue: [],
        propDefaultValue: [],
        layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 4, alignItems: "center", justifyContent: "center" },
        valueElementProperties: { xs: 8 },
        propType: PropType.Selection,
        selectionMeta: {
          selections: JOB_OUTPUT_TARGET_VALUES,
          isMultiple: true,
          onChangeEvent: function (event, propValue) {
            let propName = event.target.name;
            setPropertyMetadata(onChangeProperty(propName, propValue));
          }
        }
      },
      {
        propName: 'category',
        propLabel: 'Category',
        disabled: true,
        propValue: "",
        propDefaultValue: "",
        layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 4, sx: { pl: 5 } },
        valueElementProperties: { xs: 8 },
        propType: PropType.Selection,
        selectionMeta: {
          selections: JOB_CATEGORY_VALUES,
          onChangeEvent: function (event, propValue) {
            let propName = event.target.name;
            setPropertyMetadata(onChangeProperty(propName, propValue));
          }
        }
      },
      {
        propName: 'isScheduled',
        propLabel: 'Supported schedule',
        propValue: false,
        disabled: true,
        layoutProperties: { xs: 6 },
        labelElementProperties: { xs: 4 },
        valueElementProperties: { xs: 8 },
        propDefaultValue: false,
        propType: PropType.Switcher,
        switcherFieldMeta: {
          onChangeEvent: function (event, propValue) {
            let propName = event.target.name;
            setPropertyMetadata(onChangeProperty(propName, propValue));
          }
        }
      },
      {
        propName: 'scheduleInterval',
        propLabel: 'Interval minutes',
        disabled: true,
        propValue: 0,
        layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 4, sx: { pl: 5 } },
        valueElementProperties: { xs: 8 },
        propType: PropType.Selection,
        selectionMeta: {
          selections: JOB_SCHEDULE_TIME_SELECTION,
          onChangeEvent: function (event) {
            let propName = event.target.name;
            let propValue = event.target.value;
            setPropertyMetadata(onChangeProperty(propName, propValue));
          }
        }
      },
      {
        propName: 'description',
        propLabel: 'Description',
        propValue: '',

        disabled: true,
        layoutProperties: { xs: 12, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 2 },
        valueElementProperties: { xs: 10 },
        propType: PropType.Textarea,
        textareaFieldMeta: {
          onChangeEvent: function (event: any) {
            let propValue = event.target.value;
            let propName = event.target.name;
            setPropertyMetadata(onChangeProperty(propName, propValue));
          }
        }
      },
      {
        propName: 'configurations',
        propLabel: 'Configurations',
        isRequired: true,
        propValue: '{}',

        disabled: true,
        propDefaultValue: '{}',
        layoutProperties: { xs: 12 },
        labelElementProperties: { xs: 2 },
        valueElementProperties: { xs: 10 },
        propType: PropType.CodeEditor,
        codeEditorMeta:
        {
          height: '100px',
          codeLanguges: [json()],
          onChangeEvent: function (propName) {
            return (value, _) => {
              let propValue = value;
              setPropertyMetadata(onChangeProperty(propName, propValue))
            }
          }
        }
      },
      {
        propName: 'content',
        propLabel: 'Job Content',
        layoutProperties: { xs: 12 },
        labelElementProperties: { xs: 2 },
        valueElementProperties: { xs: 10 },
        isRequired: true,

        disabled: true,
        propValue: "",
        propDefaultValue: "",
        propType: PropType.CodeEditor,
        codeEditorMeta:
        {
          codeLanguges: [javascript({ jsx: true })],
          onChangeEvent: function (propName) {
            return (value, _) => {
              let propValue = value;
              setPropertyMetadata(onChangeProperty(propName, propValue))
            }
          }
        }
      }
    ]
  );
  const [processTracking, setCircleProcessOpen] = React.useState(false);
  const [openError, setOpenError] = React.useState(false);
  const [openSuccess, setOpenSuccess] = React.useState(false);
  const [messageInfo, setMessageInfo] = React.useState<SnackbarMessage | undefined>(undefined);
  const restClient = React.useMemo(() => new RestClient(setCircleProcessOpen, setMessageInfo, setOpenError, setOpenSuccess), []);

  const breadcrumbs = [
    <Link underline="hover" key="1" color="inherit" href="/actions">
      {ROOT_BREADCRUMB}
    </Link>,
    <Link underline="hover" key="1" color="inherit" href={`/actions/${actionId}`}>{actionId}</Link>,
    <Typography key="3" color="text.primary">Jobs</Typography>,
    <Typography key="3" color="text.primary">{jobId}</Typography>
  ];



  React.useEffect(() => {
    JobAPI.load(jobId, restClient, (jobDetail: any) => {
      setIsPausedJob(jobDetail.isPaused)
      Object.keys(jobDetail).forEach((propertyName: string) => {
        setPropertyMetadata(onChangeProperty(propertyName, jobDetail[propertyName as keyof JobDetailMetadata]));
      })
    })
  }, [jobId, restClient])
  
  const onPauseResumeSwicherOnChange = (event: any) => {
    setIsPausedJob(event.target.checked);
    if (event.target.checked) {
      JobAPI.pause(actionId, jobId, jobName, restClient);
      return;
    }
    JobAPI.resume(actionId, jobId, jobName, restClient);
  }

  let pageEntityMetadata: PageEntityMetadata = {
    pageName: 'template-details',
    breadcumbsMeta: breadcrumbs,
    pageEntityActions: [
      editActionMeta,
      saveActionMeta,
      {
        actionIcon: <RefreshIcon />,
        actionLabel: "Refresh",
        actionName: "refreshAction",
        onClick: () => 
          JobAPI.load(jobId, restClient, (jobDetail: JobDetailMetadata) => {
            setIsPausedJob(jobDetail.isPaused)
            Object.keys(jobDetail).forEach((propertyName: string) => {
              setPropertyMetadata(onChangeProperty(propertyName, jobDetail[propertyName as keyof JobDetailMetadata]));
            })
          })
      },{
        actionIcon: <Switch checked={isPausedJob} onChange={onPauseResumeSwicherOnChange}/>,
        actionLabel: "Pause/Resume",
        actionName: "pauseResumeAction"
      }
    ],
    properties: propertyMetadata
  }

  let snackbarAlertMetadata: SnackbarAlertMetadata = {
    openError,
    openSuccess,
    setOpenError,
    setOpenSuccess,
    messageInfo
  }

  return (
    <Stack spacing={2}>
      <PageEntityRender {...pageEntityMetadata}></PageEntityRender>
      <ProcessTracking isLoading={processTracking}></ProcessTracking>
      <SnackbarAlert {...snackbarAlertMetadata}></SnackbarAlert>
    </Stack>
  );
}