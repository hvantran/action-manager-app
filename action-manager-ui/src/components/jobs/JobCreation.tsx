import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import AddTaskTwoToneIcon from '@mui/icons-material/AddTaskTwoTone';
import ArrowBackTwoToneIcon from '@mui/icons-material/ArrowBackTwoTone';
import SaveIcon from '@mui/icons-material/Save';

import { Stack } from '@mui/material';
import { blue, green } from '@mui/material/colors';

import LinkBreadcrumd from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ACTION_MANAGER_API_URL,
  DEFAULT_JOB_CONTENT,
  JOB_CATEGORY_VALUES,
  JOB_OUTPUT_TARGET_VALUES,
  JOB_SCHEDULE_TIME_SELECTION,
  JobDefinition,
  ROOT_BREADCRUMB,
  getJobDetails,
} from '../AppConstants';
import {
  PageEntityMetadata,
  PropType,
  PropertyMetadata,
  RestClient,
  SnackbarAlertMetadata,
  SnackbarMessage,
  SpeedDialActionMetadata,
  StepMetadata,
  WithLink,
  onchangeStepDefault
} from '../GenericConstants';
import ProcessTracking from '../common/ProcessTracking';
import SnackbarAlert from '../common/SnackbarAlert';
import PageEntityRender from '../renders/PageEntityRender';


export default function JobCreation() {

  const navigate = useNavigate();
  const targetAction = useParams();
  const actionId: string | undefined = targetAction.actionId;
  if (!actionId) {
    throw new Error("Action is required");
  }

  let initialStepsV3: Array<StepMetadata> = []
  const [openError, setOpenError] = React.useState(false);
  const [openSuccess, setOpenSuccess] = React.useState(false);
  const [messageInfo, setMessageInfo] = React.useState<SnackbarMessage | undefined>(undefined);
  const [processTracking, setCircleProcessOpen] = React.useState(false);
  const [stepMetadatas, setStepMetadatas] = React.useState(initialStepsV3);
  const restClient = new RestClient(setCircleProcessOpen, setMessageInfo, setOpenError, setOpenSuccess);

  let initialTemplateStep: StepMetadata = {
    name: "job",
    label: 'Job 1',
    description: 'This step is used to define job information',
    properties: [
      {
        propName: 'jobName',
        propLabel: 'Name',
        isRequired: true,
        propValue: '',
        propDescription: 'This is name of job',
        layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 4 },
        valueElementProperties: { xs: 8 },
        propType: PropType.InputText,
        textFieldMeta: {
          onChangeEvent: function (event: any) {
            let propValue = event.target.value;
            let propName = event.target.name;
            let jobIndex = propName.replace('jobName', '');

            setStepMetadatas(onchangeStepDefault(propName, propValue, (stepMetadata) => {
              if (stepMetadata.name === `job${jobIndex}`) {
                stepMetadata.label = propValue;
              }
            }))
          }
        }
      },
      {
        propName: 'isAsync',
        propLabel: 'Asynchronous',
        propValue: false,
        layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 4, sx: { pl: 5 } },
        valueElementProperties: { xs: 8 },
        propType: PropType.Switcher,
        switcherFieldMeta: {
          onChangeEvent: function (event, propValue) {
            let propName = event.target.name;
            let jobIndex = propName.replace('isAsync', '');
            setStepMetadatas(onchangeStepDefault(propName, propValue, undefined, (propertyMetadata) => {
              if (propertyMetadata.propName === `jobCategory${jobIndex}`) {
                propertyMetadata.disabled = !propValue;
              }
            }));
          }
        }
      },
      {
        propName: 'jobOutputTargets',
        propLabel: 'Output',
        propValue: [JOB_OUTPUT_TARGET_VALUES[0]],
        propDefaultValue: JOB_OUTPUT_TARGET_VALUES[0],
        layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 4 },
        valueElementProperties: { xs: 8 },
        propType: PropType.Selection,
        selectionMeta: {
          selections: JOB_OUTPUT_TARGET_VALUES,
          isMultiple: true,
          onChangeEvent: function (event) {
            let propValue = event.target.value;
            let propName = event.target.name;
            setStepMetadatas(onchangeStepDefault(propName, propValue))
          }
        }
      },
      {
        propName: 'jobCategory',
        propLabel: 'Category',
        disabled: true,
        propValue: JOB_CATEGORY_VALUES[0],
        propDefaultValue: JOB_CATEGORY_VALUES[0],
        layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 4, sx: { pl: 5 } },
        valueElementProperties: { xs: 8 },
        propType: PropType.Selection,
        selectionMeta: {
          selections: JOB_CATEGORY_VALUES,
          onChangeEvent: function (event) {
            let propValue = event.target.value;
            let propName = event.target.name;
            setStepMetadatas(onchangeStepDefault(propName, propValue))
          }
        }
      },
      {
        propName: 'isScheduledJob',
        propLabel: 'Supported schedule',
        propValue: false,
        layoutProperties: { xs: 6 },
        labelElementProperties: { xs: 4 },
        valueElementProperties: { xs: 8 },
        propDefaultValue: false,
        propType: PropType.Switcher,
        switcherFieldMeta: {
          onChangeEvent: function (event, propValue) {
            let propName = event.target.name;
            let jobIndex = propName.replace('isScheduledJob', '');
            setStepMetadatas(onchangeStepDefault(propName, propValue, undefined, (propertyMetadata) => {
              if (propertyMetadata.propName === `scheduleInterval${jobIndex}`) {
                propertyMetadata.disabled = !propValue;
              }
            }));
          }
        }
      },
      {
        propName: 'scheduleInterval',
        propLabel: 'Interval minutes',
        propValue: [JOB_SCHEDULE_TIME_SELECTION[0]],
        propDefaultValue: JOB_SCHEDULE_TIME_SELECTION[0],
        layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 4, sx: { pl: 5 } },
        valueElementProperties: { xs: 8 },
        propType: PropType.Selection,
        selectionMeta: {
          selections: JOB_SCHEDULE_TIME_SELECTION,
          onChangeEvent: function (event) {
            let propValue = event.target.value;
            let propName = event.target.name;
            setStepMetadatas(onchangeStepDefault(propName, propValue))
          }
        }
      },
      {
        propName: 'jobDescription',
        propLabel: 'Description',
        propValue: '',
        layoutProperties: { xs: 12, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 2 },
        valueElementProperties: { xs: 10 },
        propType: PropType.Textarea,
        textareaFieldMeta: {
          onChangeEvent: function (event: any) {
            let propValue = event.target.value;
            let propName = event.target.name;
            setStepMetadatas(onchangeStepDefault(propName, propValue))
          }
        }
      },
      {
        propName: 'jobConfigurations',
        propLabel: 'Configurations',
        isRequired: true,
        propValue: '{}',
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
              setStepMetadatas(onchangeStepDefault(propName, propValue))
            }
          }
        }
      },
      {
        propName: 'jobContent',
        propLabel: 'Job Content',
        isRequired: true,
        propValue: DEFAULT_JOB_CONTENT,
        propType: PropType.CodeEditor,
        layoutProperties: { xs: 12 },
        labelElementProperties: { xs: 2 },
        valueElementProperties: { xs: 10 },
        propDefaultValue: DEFAULT_JOB_CONTENT,
        codeEditorMeta:
        {
          codeLanguges: [javascript({ jsx: true })],
          onChangeEvent: function (propName) {
            return (value, _) => {
              let propValue = value;
              setStepMetadatas(onchangeStepDefault(propName, propValue))
            }
          }
        }
      }
    ]
  }

  let initialStepMetadatas: Array<StepMetadata> = [
    {
      name: "job",
      label: 'Job 1',
      description: 'This step is used to define job information',
      properties: [
        {
          propName: 'jobName',
          propLabel: 'Name',
          propValue: '',
          isRequired: true,
          propDescription: 'This is name of job',
          propType: PropType.InputText,
          layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
          labelElementProperties: { xs: 4 },
          valueElementProperties: { xs: 8 },
          textFieldMeta: {
            onChangeEvent: function (event: any) {
              let propValue = event.target.value;
              let propName = event.target.name;
              setStepMetadatas(onchangeStepDefault(propName, propValue, (stepMetadata) => {
                if (stepMetadata.name === 'job') {
                  stepMetadata.label = propValue;
                }
              }))
            }
          }
        },
        {
          propName: 'isAsync',
          propLabel: 'Asynchronous',
          propValue: false,
          layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
          labelElementProperties: { xs: 4, sx: { pl: 5 } },
          valueElementProperties: { xs: 8 },
          propType: PropType.Switcher,
          switcherFieldMeta: {
            onChangeEvent: function (event, propValue) {
              let propName = event.target.name;
              setStepMetadatas(onchangeStepDefault(propName, propValue, undefined, (propertyMetadata) => {
                if (propertyMetadata.propName === 'jobCategory') {
                  propertyMetadata.disabled = !propValue;
                }
              }));
            }
          }
        },
        {
          propName: 'jobOutputTargets',
          propLabel: 'Output',
          propValue: [JOB_OUTPUT_TARGET_VALUES[0]],
          propDefaultValue: JOB_OUTPUT_TARGET_VALUES[0],
          layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
          labelElementProperties: { xs: 4, alignItems: "center", justifyContent: "center" },
          valueElementProperties: { xs: 8 },
          propType: PropType.Selection,
          selectionMeta: {
            selections: JOB_OUTPUT_TARGET_VALUES,
            isMultiple: true,
            onChangeEvent: function (event) {
              let propValue = event.target.value;
              let propName = event.target.name;
              setStepMetadatas(onchangeStepDefault(propName, propValue))
            }
          }
        },
        {
          propName: 'jobCategory',
          propLabel: 'Category',
          disabled: true,
          propValue: JOB_CATEGORY_VALUES[0],
          propDefaultValue: JOB_CATEGORY_VALUES[0],
          layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
          labelElementProperties: { xs: 4, sx: { pl: 5 } },
          valueElementProperties: { xs: 8 },
          propType: PropType.Selection,
          selectionMeta: {
            selections: JOB_CATEGORY_VALUES,
            onChangeEvent: function (event) {
              let propValue = event.target.value;
              let propName = event.target.name;
              setStepMetadatas(onchangeStepDefault(propName, propValue))
            }
          }
        },
        {
          propName: 'isScheduledJob',
          propLabel: 'Supported schedule',
          propValue: false,
          layoutProperties: { xs: 6 },
          labelElementProperties: { xs: 4 },
          valueElementProperties: { xs: 8 },
          propDefaultValue: false,
          propType: PropType.Switcher,
          switcherFieldMeta: {
            onChangeEvent: function (event, propValue) {
              let propName = event.target.name;
              setStepMetadatas(onchangeStepDefault(propName, propValue, undefined, (propertyMetadata) => {
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
          propValue: [JOB_SCHEDULE_TIME_SELECTION[0]],
          propDefaultValue: JOB_SCHEDULE_TIME_SELECTION[0],
          layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
          labelElementProperties: { xs: 4, sx: { pl: 5 } },
          valueElementProperties: { xs: 8 },
          propType: PropType.Selection,
          selectionMeta: {
            selections: JOB_SCHEDULE_TIME_SELECTION,
            onChangeEvent: function (event) {
              let propValue = event.target.value;
              let propName = event.target.name;
              setStepMetadatas(onchangeStepDefault(propName, propValue));
            }
          }
        },
        {
          propName: 'jobDescription',
          propLabel: 'Description',
          propValue: '',
          layoutProperties: { xs: 12, alignItems: "center", justifyContent: "center" },
          labelElementProperties: { xs: 2 },
          valueElementProperties: { xs: 10 },
          propType: PropType.Textarea,
          textareaFieldMeta: {
            onChangeEvent: function (event: any) {
              let propValue = event.target.value;
              let propName = event.target.name;
              setStepMetadatas(onchangeStepDefault(propName, propValue))
            }
          }
        },
        {
          propName: 'jobConfigurations',
          propLabel: 'Configurations',
          isRequired: true,
          propValue: '{}',
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
                setStepMetadatas(onchangeStepDefault(propName, propValue))
              }
            }
          }
        },
        {
          propName: 'jobContent',
          propLabel: 'Job Content',
          layoutProperties: { xs: 12 },
          labelElementProperties: { xs: 2 },
          valueElementProperties: { xs: 10 },
          isRequired: true,
          propValue: DEFAULT_JOB_CONTENT,
          propDefaultValue: DEFAULT_JOB_CONTENT,
          propType: PropType.CodeEditor,
          codeEditorMeta:
          {
            codeLanguges: [javascript({ jsx: true })],
            onChangeEvent: function (propName) {
              return (value, _) => {
                let propValue = value;
                setStepMetadatas(onchangeStepDefault(propName, propValue))
              }
            }
          }
        }
      ]
    }
  ]

  React.useEffect(() => {
    setStepMetadatas(initialStepMetadatas);
  }, [])



  let initialFloatingActions: Array<SpeedDialActionMetadata> = [
    {
      actionIcon: <AddTaskTwoToneIcon />, actionName: 'newJob', actionLabel: 'New Job',
      onClick: () => {
        setStepMetadatas(previous => {
          let nextStepMetadata: Array<StepMetadata> = [...previous];
          let addtionalStep = { ...initialTemplateStep }
          let newStepName = `${initialTemplateStep.name}${nextStepMetadata.length}`
          addtionalStep.name = newStepName
          addtionalStep.properties.forEach(property => property.propName = `${property.propName}${nextStepMetadata.length}`)
          nextStepMetadata.splice(previous.length - 1, 0, addtionalStep);
          return nextStepMetadata;
        })
      },
      properties: {
        sx: {
          bgcolor: green[500],
          '&:hover': {
            bgcolor: green[800],
          }
        }
      },
    },
    {
      actionIcon: WithLink('/actions', <ArrowBackTwoToneIcon />), actionName: 'navigateBackToActions', actionLabel: 'Navigate to actions', properties: {
        sx: {
          bgcolor: blue[500],
          '&:hover': {
            bgcolor: blue[800],
          }
        }
      }
    }
  ];

  let initialPageEntityMetdata: PageEntityMetadata = {
    pageName: 'job-creation',
    floatingActions: initialFloatingActions,
    breadcumbsMeta: [
      <LinkBreadcrumd underline="hover" key="1" color="inherit" href="/actions">
        {ROOT_BREADCRUMB}
      </LinkBreadcrumd>,
      <LinkBreadcrumd underline="hover" key="1" color="inherit" href={"/actions/" + actionId}>
        {actionId}
      </LinkBreadcrumd>,
      <LinkBreadcrumd underline="hover" key="1" color="inherit" href={"/actions/" + actionId}>
        Jobs
      </LinkBreadcrumd>,
      <Typography key="3" color="text.primary">new</Typography>
    ],
    pageEntityActions: [
      {
        actionIcon: <SaveIcon />,
        actionLabel: "Save",
        actionName: "saveJob",
        onClick: () => async () => {
          let jobDefinitions: Array<JobDefinition> = getJobDetails(stepMetadatas);

          const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jobDefinitions)
          };

          const targetURL = `${ACTION_MANAGER_API_URL}/${actionId}/jobs/new`;
          await restClient.sendRequest(requestOptions, targetURL, async (response) => {
            navigate("/actions/" + actionId);
            return undefined;
          }, async (response: Response) => {
            return { 'message': "An interal error occurred during your request!", key: new Date().getTime() } as SnackbarMessage;
          });
        }
      },
    ],
    stepMetadatas: stepMetadatas
  }


  let snackbarAlertMetadata: SnackbarAlertMetadata = {
    openError,
    openSuccess,
    setOpenError,
    setOpenSuccess,
    messageInfo
  }

  return (
    <Stack spacing={4}>
      <PageEntityRender {...initialPageEntityMetdata} />
      <ProcessTracking isLoading={processTracking}></ProcessTracking>
      <SnackbarAlert {...snackbarAlertMetadata}></SnackbarAlert>
    </Stack>
  );
}