import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import AddTaskTwoToneIcon from '@mui/icons-material/AddTaskTwoTone';
import ArrowBackTwoToneIcon from '@mui/icons-material/ArrowBackTwoTone';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import { Stack } from '@mui/material';
import { blue, green } from '@mui/material/colors';

import LinkBreadcrumd from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import React from 'react';
import {
  ACTION_MANAGER_API_URL,
  ACTION_STATUS_SELECTION,
  ActionDefinition,
  DEFAULT_JOB_CONTENT,
  JOB_CATEGORY_VALUES,
  JOB_OUTPUT_TARGET_VALUES,
  JOB_SCHEDULE_TIME_SELECTION,
  JOB_STATUS_SELECTION,
  JobDefinition,
  ROOT_BREADCRUMB,
  getActionDefinition,
  getJobDefinition
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


export default function ActionCreation() {

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
        propName: 'name',
        propLabel: 'Name',
        isRequired: true,
        propValue: '',
        propDescription: 'This is name of job',
        layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 4,  sx: { pl: 10 } },
        valueElementProperties: { xs: 8 },
        propType: PropType.InputText,
        textFieldMeta: {
          onChangeEvent: function (event: any) {
            let propValue = event.target.value;
            let propName = event.target.name;
            let jobIndex = propName.replace('name', '');

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
        labelElementProperties: { xs: 4,  sx: { pl: 10 } },
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
        propName: 'outputTargets',
        propLabel: 'Output',
        propValue: [JOB_OUTPUT_TARGET_VALUES[0].value],
        propDefaultValue: [JOB_OUTPUT_TARGET_VALUES[0].value],
        layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 4,  sx: { pl: 10 } },
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
        propName: 'category',
        propLabel: 'Category',
        disabled: true,
        propValue: JOB_CATEGORY_VALUES[0].value,
        propDefaultValue: JOB_CATEGORY_VALUES[0].value,
        layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 4,  sx: { pl: 10 } },
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
        propName: 'isScheduled',
        propLabel: 'Supported schedule',
        propValue: false,
        layoutProperties: { xs: 6 },
        labelElementProperties: { xs: 4,  sx: { pl: 10 } },
        valueElementProperties: { xs: 8 },
        propDefaultValue: false,
        propType: PropType.Switcher,
        switcherFieldMeta: {
          onChangeEvent: function (event, propValue) {
            let propName = event.target.name;
            let jobIndex = propName.replace('isScheduled', '');
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
        propValue: JOB_SCHEDULE_TIME_SELECTION[0].value,
        propDefaultValue: JOB_SCHEDULE_TIME_SELECTION[0].value,
        layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 4,  sx: { pl: 10 } },
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
        propName: 'description',
        propLabel: 'Description',
        propValue: '',
        layoutProperties: { xs: 6 },
        labelElementProperties: { xs: 4,  sx: { pl: 10 } },
        valueElementProperties: { xs: 8 },
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
        propName: 'status',
        propLabel: 'Status',
        propValue: JOB_STATUS_SELECTION[0].value,
        propDefaultValue: JOB_STATUS_SELECTION[0].value,
        layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 4,  sx: { pl: 10 } },
        valueElementProperties: { xs: 8 },
        propType: PropType.Selection,
        selectionMeta: {
          selections: JOB_STATUS_SELECTION,
          onChangeEvent: function (event) {
            let propValue = event.target.value;
            let propName = event.target.name;
            setStepMetadatas(onchangeStepDefault(propName, propValue));
          }
        }
      },
      {
        propName: 'configurations',
        propLabel: 'Configurations',
        isRequired: true,
        propValue: '{}',
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
              setStepMetadatas(onchangeStepDefault(propName, propValue))
            }
          }
        }
      },
      {
        propName: 'content',
        propLabel: 'Job Content',
        isRequired: true,
        propValue: DEFAULT_JOB_CONTENT,
        propType: PropType.CodeEditor,
        layoutProperties: { xs: 12 },
        labelElementProperties: { xs: 2,  sx: { pl: 10 } },
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
      name: "action",
      label: 'Action',
      description: 'This step is used to define action information',
      properties: [
        {
          propName: 'actionName',
          propLabel: 'Name',
          propValue: '',
          isRequired: true,
          layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
          labelElementProperties: { xs: 4, sx: { pl: 15 } },
          valueElementProperties: { xs: 8 },
          propDescription: 'This is name of action',
          propType: PropType.InputText,
          textFieldMeta: {
            onChangeEvent: function (event: any) {
              let propValue = event.target.value;
              let propName = event.target.name;

              setStepMetadatas(onchangeStepDefault(propName, propValue, (stepMetadata) => {
                if (stepMetadata.name === 'action') {
                  stepMetadata.label = propValue;
                }
              }));
            }
          }
        },
        {
          propName: 'actionStatus',
          propLabel: 'Status',
          propValue: ACTION_STATUS_SELECTION[0].value,
          isRequired: true,
          layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
          labelElementProperties: { xs: 4, sx: { pl: 15 } },
          valueElementProperties: { xs: 8 },
          propDescription: 'This is status of action',
          propType: PropType.Selection,
          selectionMeta: {
            selections: ACTION_STATUS_SELECTION,
            onChangeEvent: function (event) {
              let propValue = event.target.value;
              let propName = event.target.name;
              setStepMetadatas(onchangeStepDefault(propName, propValue))
            }
          }
        },
        {
          propName: 'actionDescription',
          propLabel: 'Description',
          propValue: '',
          layoutProperties: { xs: 12, alignItems: "center", justifyContent: "center" },
          labelElementProperties: { xs: 2, sx: { pl: 15 } },
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
          propName: 'actionConfigurations',
          propLabel: 'Configurations',
          propValue: '{}',
          propDefaultValue: '{}',
          layoutProperties: { xs: 12 },
          labelElementProperties: { xs: 2, sx: { pl: 15 } },
          valueElementProperties: { xs: 10 },
          isRequired: true,
          propType: PropType.CodeEditor,
          codeEditorMeta:
          {
            codeLanguges: [json()],
            onChangeEvent: function (propName) {
              return (value, _) => {
                let propValue = value;
                setStepMetadatas(onchangeStepDefault(propName, propValue))
              }
            }
          }
        }
      ]
    },
    {
      name: "job",
      label: 'Job 1',
      description: 'This step is used to define job information',
      properties: [
        {
          propName: 'name',
          propLabel: 'Name',
          propValue: '',
          isRequired: true,
          propDescription: 'This is name of job',
          propType: PropType.InputText,
          layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
          labelElementProperties: { xs: 4,  sx: { pl: 10 } },
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
          labelElementProperties: { xs: 4,  sx: { pl: 10 } },
          valueElementProperties: { xs: 8 },
          propType: PropType.Switcher,
          switcherFieldMeta: {
            onChangeEvent: function (event, propValue) {
              let propName = event.target.name;
              setStepMetadatas(onchangeStepDefault(propName, propValue, undefined, (propertyMetadata) => {
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
          propValue: [JOB_OUTPUT_TARGET_VALUES[0].value],
          propDefaultValue: [JOB_OUTPUT_TARGET_VALUES[0].value],
          layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
          labelElementProperties: { xs: 4,  sx: { pl: 10 } },
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
          propName: 'category',
          propLabel: 'Category',
          disabled: true,
          propValue: JOB_CATEGORY_VALUES[0].value,
          propDefaultValue: JOB_CATEGORY_VALUES[0].value,
          layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
          labelElementProperties: { xs: 4,  sx: { pl: 10 } },
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
          propName: 'isScheduled',
          propLabel: 'Supported schedule',
          propValue: false,
          layoutProperties: { xs: 6 },
          labelElementProperties: { xs: 4,  sx: { pl: 10 } },
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
          propValue: JOB_SCHEDULE_TIME_SELECTION[0].value,
          propDefaultValue: JOB_SCHEDULE_TIME_SELECTION[0].value,
          layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
          labelElementProperties: { xs: 4,  sx: { pl: 10 } },
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
          propName: 'description',
          propLabel: 'Description',
          propValue: '',
          layoutProperties: { xs: 6 },
          labelElementProperties: { xs: 4,  sx: { pl: 10 } },
          valueElementProperties: { xs: 8},
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
          propName: 'status',
          propLabel: 'Status',
          propValue: JOB_STATUS_SELECTION[0].value,
          propDefaultValue: JOB_STATUS_SELECTION[0].value,
          layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
          labelElementProperties: { xs: 4,  sx: { pl: 10 } },
          valueElementProperties: { xs: 8 },
          propType: PropType.Selection,
          selectionMeta: {
            selections: JOB_STATUS_SELECTION,
            onChangeEvent: function (event) {
              let propValue = event.target.value;
              let propName = event.target.name;
              setStepMetadatas(onchangeStepDefault(propName, propValue));
            }
          }
        },
        {
          propName: 'configurations',
          propLabel: 'Configurations',
          isRequired: true,
          propValue: '{}',
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
                setStepMetadatas(onchangeStepDefault(propName, propValue))
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
    },
    {
      name: "review",
      label: 'Review',
      description: 'This step is used to review all steps',
      properties: [],
      onFinishStepClick: async (currentStepMetadata: Array<StepMetadata>) => {
        let action: ActionDefinition = getActionFromStepper(currentStepMetadata);

        const requestOptions = {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(action)
        };

        const targetURL = `${ACTION_MANAGER_API_URL}`;
        await restClient.sendRequest(requestOptions, targetURL, async (response) => {
          let responseJSON = await response.json();
          let message = `Action ${responseJSON['actionId']} is created`;
          return { 'message': message, key: new Date().getTime() } as SnackbarMessage;
        }, async (response: Response) => {
          return { 'message': "An interal error occurred during your request!", key: new Date().getTime() } as SnackbarMessage;
        });
      }
    }
  ]

  React.useEffect(() => {
    setStepMetadatas(initialStepMetadatas);
  }, [])

  const dryRunAction = async () => {
    let action: ActionDefinition = getActionFromStepper(stepMetadatas);

    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action)
    };

    const targetURL = `${ACTION_MANAGER_API_URL}/dryRun`;
    await restClient.sendRequest(requestOptions, targetURL, async () => {
      return { 'message': "Dry run action successfully", key: new Date().getTime() } as SnackbarMessage;
    }, async (response: Response) => {
      return { 'message': "An interal error occurred during your request!", key: new Date().getTime() } as SnackbarMessage;
    });
  }

  const getActionFromStepper = (currentStepMetadata: Array<StepMetadata>) => {
    let actionMetadata = currentStepMetadata.at(0);

    if (!actionMetadata) {
      throw new Error("Missing action definition");
    }

    const findRelatedJobs = (currentStepMetadata: Array<StepMetadata>): Array<JobDefinition> => {
      const reviewStepIndex = currentStepMetadata.length - 1;
      return currentStepMetadata
        .filter((_, index) => index !== 0 && index !== reviewStepIndex)
        .map(p => getJobDefinition(p.properties))
    }

    let actionDefinition = getActionDefinition(actionMetadata.properties);
    actionDefinition.jobs = findRelatedJobs(currentStepMetadata);
    return actionDefinition;
  }


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
    pageName: 'action-creation',
    floatingActions: initialFloatingActions,
    breadcumbsMeta: [
      <LinkBreadcrumd underline="hover" key="1" color="inherit" href="/actions">
        {ROOT_BREADCRUMB}
      </LinkBreadcrumd>,
      <Typography key="3" color="text.primary">new</Typography>
    ],
    stepMetadatas: stepMetadatas,
    pageEntityActions: [
      {
        actionIcon: <EngineeringOutlinedIcon />,
        actionLabel: "Dry run",
        actionName: "dryRunAction",
        onClick: dryRunAction
      }
    ]
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
