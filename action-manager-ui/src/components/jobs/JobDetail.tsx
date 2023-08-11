import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import EngineeringIcon from '@mui/icons-material/Engineering';
import RefreshIcon from '@mui/icons-material/Refresh';
import SaveIcon from '@mui/icons-material/Save';
import { Box, Stack, Switch } from '@mui/material';
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
  JOB_CATEGORY_VALUES,
  JOB_OUTPUT_TARGET_VALUES,
  JOB_SCHEDULE_TIME_SELECTION,
  JobAPI,
  JobDefinition,
  JobDetailMetadata,
  ROOT_BREADCRUMB
} from '../AppConstants';
import SnackbarAlert from '../common/SnackbarAlert';
import PageEntityRender from '../renders/PageEntityRender';



export default function JobDetail() {
  const targetJob = useParams();
  const location = useLocation();
  const jobName = location.state?.name || "";
  const [isPausedJob, setIsPausedJob] = React.useState(false);
  const [isScheduledJob, setIsScheduledJob] = React.useState(false);
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
        labelElementProperties: { xs: 4,  sx: { pl: 10 } },
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
        labelElementProperties: { xs: 4,  sx: { pl: 10 } },
        valueElementProperties: { xs: 8 },
        propType: PropType.Switcher,
        switcherFieldMeta: {
          onChangeEvent: function (event, propValue) {
            let propName = event.target.name;
            setPropertyMetadata(onChangeProperty(propName, propValue, (propertyMetadata) => {
              if (propertyMetadata.propName === 'category') {
                propertyMetadata.disabled = !propValue;
              }
            }));
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
        labelElementProperties: { xs: 4,  sx: { pl: 10 } },
        valueElementProperties: { xs: 8 },
        propType: PropType.Selection,
        selectionMeta: {
          selections: JOB_OUTPUT_TARGET_VALUES,
          isMultiple: true,
          onChangeEvent: function (event) {
            let propName = event.target.name;
            setPropertyMetadata(onChangeProperty(propName, event.target.value));
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
        labelElementProperties: { xs: 4,  sx: { pl: 10 } },
        valueElementProperties: { xs: 8 },
        propType: PropType.Selection,
        selectionMeta: {
          selections: JOB_CATEGORY_VALUES,
          onChangeEvent: function (event) {
            let propName = event.target.name;
            setPropertyMetadata(onChangeProperty(propName, event.target.value));
          }
        }
      },
      {
        propName: 'isScheduled',
        propLabel: 'Supported schedule',
        propValue: false,
        disabled: true,
        layoutProperties: { xs: 6 },
        labelElementProperties: { xs: 4,  sx: { pl: 10 } },
        valueElementProperties: { xs: 8 },
        propDefaultValue: false,
        propType: PropType.Switcher,
        switcherFieldMeta: {
          onChangeEvent: function (event, propValue) {
            let propName = event.target.name;

            setPropertyMetadata(onChangeProperty(propName, propValue, propertyMetadata => {
              if (propertyMetadata.propName === 'scheduleInterval') {
                propertyMetadata.disabled = !propValue;
              }
            }));
          }
        }
      },
      {
        propName: 'scheduleInterval',
        propLabel: 'Interval minutes',
        disabled: true,
        propValue: 0,
        layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 4,  sx: { pl: 10 } },
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
        labelElementProperties: { xs: 2,  sx: { pl: 10 } },
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
        labelElementProperties: { xs: 2,  sx: { pl: 10 } },
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
        labelElementProperties: { xs: 2,  sx: { pl: 10 } },
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
    JobAPI.load(jobId, restClient, (jobDetail: JobDetailMetadata) => {
      setIsPausedJob(jobDetail.status === "PAUSED")
      setIsScheduledJob(jobDetail.isScheduled)
      Object.keys(jobDetail).forEach((propertyName: string) => {
        setPropertyMetadata(onChangeProperty(propertyName, jobDetail[propertyName as keyof JobDetailMetadata]));
      })
    })
  }, [jobId, restClient])
  
  const onPauseResumeSwicherOnChange = (event: any) => {
    setIsPausedJob(event.target.checked);
    if (event.target.checked) {
      JobAPI.pause(jobId, jobName, restClient);
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
        actionIcon: <EngineeringIcon />,
        actionLabel: "Dry run",
        actionName: "dryRunAction",
        onClick: () => JobAPI.dryRun(restClient, propertyMetadata)
      },
      {
        actionIcon: <RefreshIcon />,
        actionLabel: "Refresh",
        actionName: "refreshAction",
        onClick: () => 
          JobAPI.load(jobId, restClient, (jobDetail: JobDetailMetadata) => {
            setIsPausedJob(jobDetail.status === "PAUSED")
            Object.keys(jobDetail).forEach((propertyName: string) => {
              setPropertyMetadata(onChangeProperty(propertyName, jobDetail[propertyName as keyof JobDetailMetadata]));
            })
          })
      },{
        actionIcon: <Switch disabled={!isScheduledJob} checked={isPausedJob} onChange={onPauseResumeSwicherOnChange}/>,
        actionLabelContent: <Box sx={{ display: 'flex', alignItems: "center", flexDirection: 'row' }}>
         <InfoIcon />
          <p>Paused function only support for schedule jobs, <b>doesn't support for one time jobs</b></p>
        </Box>,
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