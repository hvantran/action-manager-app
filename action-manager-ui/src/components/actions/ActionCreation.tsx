import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import AddTaskTwoToneIcon from '@mui/icons-material/AddTaskTwoTone';
import ArrowBackTwoToneIcon from '@mui/icons-material/ArrowBackTwoTone';
import { Stack } from '@mui/material';
import { blue, green } from '@mui/material/colors';

import LinkBreadcrumd from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import React from 'react';
import { ActionDefinition, ACTION_MANAGER_API_URL, DEFAULT_JOB_CONTENT, JobDefinition, JOB_CATEGORY_VALUES, JOB_OUTPUT_TARGET_VALUES, JOB_SCHEDULE_TIME_SELECTION, ROOT_BREADCRUMB } from '../AppConstants';
import ProcessTracking from '../common/ProcessTracking';
import SnackbarAlert from '../common/SnackbarAlert';
import {
  PageEntityMetadata,
  PropertyMetadata,
  PropType,
  RestClient,
  SnackbarAlertMetadata,
  SnackbarMessage,
  SpeedDialActionMetadata,
  StepMetadata,
  WithLink
} from '../GenericConstants';
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
        propValue: true,
        propDefaultValue: true,
        layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 4, sx: { pl: 5 } },
        valueElementProperties: { xs: 8 },
        propType: PropType.Switcher,
        switcherFieldMeta: {
          onChangeEvent: function (event, propValue) {
            let propName = event.target.name;
            setStepMetadatas(onchangeStepDefault(propName, propValue))
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
        propValue: true,
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
      name: "action",
      label: 'Action',
      description: 'This step is used to define action information',
      properties: [
        {
          propName: 'actionName',
          propLabel: 'Name',
          propValue: '',
          isRequired: true,
          layoutProperties: { xs: 12, alignItems: "center", justifyContent: "center" },
          labelElementProperties: { xs: 2 },
          valueElementProperties: { xs: 10 },
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
          propName: 'actionDescription',
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
          propName: 'actionConfigurations',
          propLabel: 'Configurations',
          propValue: '{}',
          propDefaultValue: '{}',
          layoutProperties: { xs: 12 },
          labelElementProperties: { xs: 2 },
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
          propValue: true,
          layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
          labelElementProperties: { xs: 4, sx: { pl: 5 } },
          valueElementProperties: { xs: 8 },
          propDefaultValue: true,
          propType: PropType.Switcher,
          switcherFieldMeta: {
            onChangeEvent: function (event, propValue) {
              let propName = event.target.name;
              setStepMetadatas(onchangeStepDefault(propName, propValue))
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

  const getActionFromStepper = (currentStepMetadata: Array<StepMetadata>) => {
    const actionStepIndex = 0;
    let actionMetadata = currentStepMetadata.at(actionStepIndex);
    if (!actionMetadata) {
      throw new Error("Missing action definition");
    }
    const findStepPropertyByCondition = (stepMetadata: StepMetadata | undefined, filter: (property: PropertyMetadata) => boolean): PropertyMetadata | undefined => {
      return stepMetadata ? stepMetadata.properties.find(filter) : undefined;
    }
    const getAction = (): ActionDefinition => {
      let actionDescription = findStepPropertyByCondition(actionMetadata, property => property.propName === "actionDescription");
      let actionConfigurations = findStepPropertyByCondition(actionMetadata, property => property.propName === "actionConfigurations");
      let relatedJobs = findRelatedJobs(currentStepMetadata);
      let actionDefinition: ActionDefinition = {
        name: actionMetadata?.label,
        description: actionDescription?.propValue,
        configurations: actionConfigurations?.propValue,
        relatedJobs: relatedJobs
      }
      return actionDefinition;
    }

    const findRelatedJobs = (currentStepMetadata: Array<StepMetadata>): Array<JobDefinition> => {
      const reviewStepIndex = currentStepMetadata.length - 1;
      return currentStepMetadata.filter((_, index) => index !== 0 && index !== reviewStepIndex)
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

    return getAction();
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

  function onchangeStepDefault(propName: string, propValue: any, stepMetadataCallback?: (stepMetadata: StepMetadata) => void,
    propertyCallback?: (property: PropertyMetadata) => void): React.SetStateAction<StepMetadata[]> {
    return previous => {
      return [...previous].map((stepMetadata) => {
        let properties = stepMetadata.properties.map(prop => {
          if (prop.propName === propName) {
            prop.propValue = propValue;
          }
          if (propertyCallback) {
            propertyCallback(prop);
          }
          return prop;
        });

        stepMetadata.properties = properties;
        if (stepMetadataCallback) {
          stepMetadataCallback(stepMetadata);
        }
        return stepMetadata;
      });
    };
  }
}