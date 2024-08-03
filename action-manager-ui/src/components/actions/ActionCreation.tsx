import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import AddTaskTwoToneIcon from '@mui/icons-material/AddTaskTwoTone';
import ArrowBackTwoToneIcon from '@mui/icons-material/ArrowBackTwoTone';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import { Chip, Stack } from '@mui/material';
import { blue, green } from '@mui/material/colors';

import LinkBreadcrumd from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import React from 'react';
import {
  ACTION_MANAGER_API_URL,
  ACTION_STATUS_SELECTION,
  ActionDefinition,
  CHIP_RANDOM_COLOR,
  DEFAULT_JOB_CONTENT,
  JOB_CATEGORY_VALUES,
  JOB_OUTPUT_TARGET_VALUES,
  JOB_SCHEDULE_TIME_SELECTION,
  JOB_STATUS_SELECTION,
  JobDefinition,
  ROOT_BREADCRUMB,
  TemplateAPI,
  TemplateOverview,
  findPropertyByCondition,
  getActionDefinition,
  getJobDefinition
} from '../AppConstants';
import {
  PageEntityMetadata,
  PropType,
  PropertyMetadata,
  RestClient,
  SnackbarMessage,
  SpeedDialActionMetadata,
  StepMetadata,
  WithLink,
  onChangeProperty,
  onchangeStepDefault
} from '../GenericConstants';
import ProcessTracking from '../common/ProcessTracking';
import PageEntityRender from '../renders/PageEntityRender';


export default function ActionCreation() {

  let initialStepsV3: Array<StepMetadata> = []
  const [processTracking, setCircleProcessOpen] = React.useState(false);
  const [stepMetadatas, setStepMetadatas] = React.useState(initialStepsV3);
  const restClient = new RestClient(setCircleProcessOpen);
  const [actionPropertyMetadata, setActionPropertyMetadata] = React.useState<Array<PropertyMetadata>>(
    [
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
    ])

  const [propertyMetadata, setPropertyMetadata] = React.useState<Array<PropertyMetadata>>(
    [
      {
        propName: 'name',
        propLabel: 'Name',
        propValue: '',
        isRequired: true,
        propDescription: 'This is name of job',
        propType: PropType.InputText,
        layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
        valueElementProperties: { xs: 8 },
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
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
        valueElementProperties: { xs: 8 },
        propType: PropType.Switcher,
        switcherFieldMeta: {
          onChangeEvent: function (event, propValue) {
            let propName = event.target.name;
            let jobIndex = propName.replace('isAsync', '');
            setStepMetadatas(onchangeStepDefault(propName, propValue, undefined, (propertyMetadata) => {
              if (propertyMetadata.propName === `category${jobIndex}`) {
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
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
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
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
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
        propLabel: 'Schedule',
        propValue: false,
        layoutProperties: { xs: 6 },
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
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
        propLabel: 'Period',
        disabled: true,
        info: 'The period between successive executions',
        propValue: JOB_SCHEDULE_TIME_SELECTION[0].value,
        propDefaultValue: JOB_SCHEDULE_TIME_SELECTION[0].value,
        layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
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
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
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
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
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
        labelElementProperties: { xs: 2, sx: { pl: 10 } },
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
        propName: 'templates',
        propLabel: 'Templates',
        propValue: [],
        layoutProperties: { xs: 12 },
        labelElementProperties: { xs: 2, sx: { pl: 10 } },
        valueElementProperties: { xs: 10 },
        propType: PropType.Autocomplete,
        autoCompleteMeta: {
          isMultiple: true,
          options: [],
          limitTags: 4,
          filterSelectedOptions: true,
          isOptionEqualToValue(option: TemplateOverview, value: TemplateOverview) {
            return option.templateName === value.templateName
          },
          getOptionLabel: (option: TemplateOverview) => {
            return option.templateName
          },
          renderTags: (value: Array<TemplateOverview>, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              const properties = {
                ...{
                  sx: {
                    backgroundColor: CHIP_RANDOM_COLOR[Math.floor(Math.random() * CHIP_RANDOM_COLOR.length)],
                    color: 'white'
                  }
                }, ...tagProps
              }
              return (
                <Chip
                  key={key}
                  label={option.templateName}
                  {...properties}
                />
              );
            })
          ,
          onChange: function (event, value: Array<TemplateOverview>, reason) {
            const templateContent = value
              .map(p => `//*************** ${p.templateName} ***************\n${p.templateText}`)
              .join("\n\n");


            const templateProperty = findPropertyByCondition(propertyMetadata, property => property.propName.startsWith("templates"))
            const configurationProperty = findPropertyByCondition(propertyMetadata, property => property.propName.startsWith("configurations"))
            const allOptions = templateProperty?.autoCompleteMeta?.options;
            const allOptionsArr = allOptions as Array<TemplateOverview>
            const allTemplateConfigurations = allOptionsArr
              .map(p => JSON.parse(p.dataTemplateJSON))
              .reduce((previousValue, currentValue) => { return { ...previousValue, ...currentValue } }, {});
            const currentConfigurations = JSON.parse(configurationProperty?.propValue)

            const customOwnConfigurations: any = {}
            Object.keys(currentConfigurations)
              .filter(p => !allTemplateConfigurations.hasOwnProperty(p))
              .forEach(p => customOwnConfigurations[p] = currentConfigurations[p])

            const configurations = value
              .map(p => JSON.parse(p.dataTemplateJSON))
              .reduce((previousValue, currentValue) => { return { ...previousValue, ...currentValue } }, customOwnConfigurations);

            setPropertyMetadata(onChangeProperty("content", templateContent));
            setPropertyMetadata(onChangeProperty("templates", value));
            setPropertyMetadata(onChangeProperty("configurations", JSON.stringify(configurations, undefined, 2)))
          },
          onSearchTextChangeEvent: function (event: any) {
            let propValue = event.target.value;
            TemplateAPI.search(propValue, restClient, (templateOverviews) => {
              setPropertyMetadata(onChangeProperty("templates", templateOverviews, undefined, (property: PropertyMetadata) => {
                if (property.autoCompleteMeta) {
                  property.autoCompleteMeta.options = templateOverviews;
                }
              }));
            })
          }
        }
      },
      {
        propName: 'content',
        propLabel: 'Content Script',
        layoutProperties: { xs: 12 },
        labelElementProperties: { xs: 2, sx: { pl: 10 } },
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
  )

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
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
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
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
        valueElementProperties: { xs: 8 },
        propType: PropType.Switcher,
        switcherFieldMeta: {
          onChangeEvent: function (event, propValue) {
            let propName = event.target.name;
            let jobIndex = propName.replace('isAsync', '');
            setStepMetadatas(onchangeStepDefault(propName, propValue, undefined, (propertyMetadata) => {
              if (propertyMetadata.propName === `category${jobIndex}`) {
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
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
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
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
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
        propLabel: 'Schedule',
        propValue: false,
        layoutProperties: { xs: 6 },
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
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
        propLabel: 'Period',
        info: 'The period between successive executions',
        propValue: JOB_SCHEDULE_TIME_SELECTION[0].value,
        propDefaultValue: JOB_SCHEDULE_TIME_SELECTION[0].value,
        layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
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
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
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
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
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
        labelElementProperties: { xs: 2, sx: { pl: 10 } },
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
        propName: 'templates',
        propLabel: 'Templates',
        propValue: [],
        layoutProperties: { xs: 12 },
        labelElementProperties: { xs: 2, sx: { pl: 10 } },
        valueElementProperties: { xs: 10 },
        propType: PropType.Autocomplete,
        autoCompleteMeta: {
          isMultiple: true,
          options: [],
          limitTags: 4,
          filterSelectedOptions: true,
          isOptionEqualToValue(option: TemplateOverview, value: TemplateOverview) {
            return option.templateName === value.templateName
          },
          getOptionLabel: (option: TemplateOverview) => {
            return option.templateName
          },
          renderTags: (value: Array<TemplateOverview>, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              const properties = {
                ...{
                  sx: {
                    backgroundColor: CHIP_RANDOM_COLOR[Math.floor(Math.random() * CHIP_RANDOM_COLOR.length)],
                    color: 'white'
                  }
                }, ...tagProps
              }
              return (
                <Chip
                  key={key}
                  label={option.templateName}
                  {...properties}
                />
              );
            })
          ,
          onChange: function (event: React.SyntheticEvent, value: Array<TemplateOverview>, reason) {
            const templateContent = value
              .map(p => `//*************** ${p.templateName} ***************\n${p.templateText}`)
              .join("\n\n");

            const jobIndex = event.currentTarget.id.replace("templates", "").charAt(0)
            const configurations = value
              .map(p => JSON.parse(p.dataTemplateJSON))
              .reduce((previousValue, currentValue) => { return { ...previousValue, ...currentValue } });

            setStepMetadatas(onchangeStepDefault(`content${jobIndex}`, templateContent))
            setStepMetadatas(onchangeStepDefault(`configurations${jobIndex}`, JSON.stringify(configurations, undefined, 2)))
            setStepMetadatas(onchangeStepDefault(`templates${jobIndex}`, value));
          },
          onSearchTextChangeEvent: function (event: any) {
            let propValue = event.target.value;
            let propName = event.target.name;
            let jobIndex = propName.replace('templates', '');
            TemplateAPI.search(propValue, restClient, (templateOverviews) => {
              setStepMetadatas(onchangeStepDefault(propName, [], undefined, (property: PropertyMetadata) => {
                if (property.propName === `templates${jobIndex}` && property.autoCompleteMeta) {
                  property.autoCompleteMeta.options = templateOverviews;
                }
              }))
            })
          }
        }
      },
      {
        propName: 'content',
        propLabel: 'Content Script',
        isRequired: true,
        propValue: DEFAULT_JOB_CONTENT,
        propType: PropType.CodeEditor,
        layoutProperties: { xs: 12 },
        labelElementProperties: { xs: 2, sx: { pl: 10 } },
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
      properties: actionPropertyMetadata
    },
    {
      name: "job",
      label: 'Job 1',
      description: 'This step is used to define job information',
      properties: propertyMetadata
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
    TemplateAPI.search("", restClient, (templateOverviews) => {
      setPropertyMetadata(onChangeProperty("templates", templateOverviews, undefined, (property: PropertyMetadata) => {
        if (property.autoCompleteMeta) {
          property.autoCompleteMeta.options = templateOverviews;
        }
      }));
    })

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
          let nextIndex = nextStepMetadata.length
          let newStepName = `${initialTemplateStep.name}${nextIndex}`

          addtionalStep.name = newStepName
          addtionalStep.properties.forEach(property => property.propName = `${property.propName}${nextStepMetadata.length}`)
          let templatePropertyOptions = findPropertyByCondition(propertyMetadata, p => p.propName === 'templates')?.autoCompleteMeta?.options
          let newTemplateProperty = findPropertyByCondition(addtionalStep.properties, p => p.propName === `templates${nextStepMetadata.length}`)?.autoCompleteMeta
          if (newTemplateProperty && templatePropertyOptions) {
            newTemplateProperty.options = templatePropertyOptions;
          }
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

  return (
    <Stack spacing={4}>
      <PageEntityRender {...initialPageEntityMetdata} />
      <ProcessTracking isLoading={processTracking}></ProcessTracking>
    </Stack>
  );
}
