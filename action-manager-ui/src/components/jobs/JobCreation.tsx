import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import AddTaskTwoToneIcon from '@mui/icons-material/AddTaskTwoTone';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import SaveIcon from '@mui/icons-material/Save';
import { Chip, Stack } from '@mui/material';
import LinkBreadcrumd from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import {
  CHIP_RANDOM_COLOR,
  DEFAULT_JOB_CONTENT,
  JOB_CATEGORY_VALUES,
  JOB_OUTPUT_TARGET_VALUES,
  JOB_SCHEDULE_TIME_SELECTION,
  JOB_STATUS_SELECTION,
  JobAPI,
  JobDefinition,
  JobDetailMetadata,
  ROOT_BREADCRUMB,
  TemplateAPI,
  TemplateOverview,
  findPropertyByCondition,
  getJobDetails,
} from '../AppConstants';
import ProcessTracking from '../common/ProcessTracking';
import {
  PageEntityMetadata,
  PropType,
  PropertyMetadata,
  RestClient,
  StepMetadata,
  onChangeProperty,
  onchangeStepDefault,
} from '../GenericConstants';
import PageEntityRender from '../renders/PageEntityRender';

export default function JobCreation() {
  const navigate = useNavigate();
  const targetAction = useParams();
  const location = useLocation();
  const actionId: string | undefined = targetAction.actionId;
  const copyJobId = location.state?.copyJobId || '';
  if (!actionId) {
    throw new Error('Action is required');
  }

  const [processTracking, setCircleProcessOpen] = React.useState(false);
  const [stepMetadatas, setStepMetadatas] = React.useState<Array<StepMetadata>>([]);
  const restClient = React.useMemo(
    () => new RestClient(setCircleProcessOpen),
    [setCircleProcessOpen]
  );

  const initialTemplateStep: StepMetadata = {
    name: 'job',
    label: 'Job 1',
    description: 'This step is used to define job information',
    properties: [
      {
        propName: 'name',
        propLabel: 'Name',
        isRequired: true,
        propValue: '',
        propDescription: 'This is name of job',
        layoutProperties: { xs: 6, alignItems: 'center', justifyContent: 'center' },
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
        valueElementProperties: { xs: 8 },
        propType: PropType.InputText,
        textFieldMeta: {
          onChangeEvent: function (event: any) {
            const propValue = event.target.value;
            const propName = event.target.name;
            const jobIndex = propName.replace('name', '');

            setStepMetadatas(
              onchangeStepDefault(propName, propValue, (stepMetadata) => {
                if (stepMetadata.name === `job${jobIndex}`) {
                  stepMetadata.label = propValue;
                }
              })
            );
          },
        },
      },
      {
        propName: 'isAsync',
        propLabel: 'Asynchronous',
        propValue: false,
        layoutProperties: { xs: 6, alignItems: 'center', justifyContent: 'center' },
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
        valueElementProperties: { xs: 8 },
        propType: PropType.Switcher,
        switcherFieldMeta: {
          onChangeEvent: function (event, propValue) {
            const propName = event.target.name;
            const jobIndex = propName.replace('isAsync', '');
            setStepMetadatas(
              onchangeStepDefault(propName, propValue, undefined, (propertyMetadata) => {
                if (propertyMetadata.propName === `jobCategory${jobIndex}`) {
                  propertyMetadata.disabled = !propValue;
                }
              })
            );
          },
        },
      },
      {
        propName: 'outputTargets',
        propLabel: 'Output',
        propValue: [JOB_OUTPUT_TARGET_VALUES[0].value],
        propDefaultValue: [JOB_OUTPUT_TARGET_VALUES[0].value],
        layoutProperties: { xs: 6, alignItems: 'center', justifyContent: 'center' },
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
        valueElementProperties: { xs: 8 },
        propType: PropType.Selection,
        selectionMeta: {
          selections: JOB_OUTPUT_TARGET_VALUES,
          isMultiple: true,
          onChangeEvent: function (event) {
            const propValue = event.target.value;
            const propName = event.target.name;
            setStepMetadatas(onchangeStepDefault(propName, propValue));
          },
        },
      },
      {
        propName: 'category',
        propLabel: 'Category',
        disabled: true,
        propValue: JOB_CATEGORY_VALUES[0].value,
        propDefaultValue: JOB_CATEGORY_VALUES[0].value,
        layoutProperties: { xs: 6, alignItems: 'center', justifyContent: 'center' },
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
        valueElementProperties: { xs: 8 },
        propType: PropType.Selection,
        selectionMeta: {
          selections: JOB_CATEGORY_VALUES,
          onChangeEvent: function (event) {
            const propValue = event.target.value;
            const propName = event.target.name;
            setStepMetadatas(onchangeStepDefault(propName, propValue));
          },
        },
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
            const propName = event.target.name;
            const jobIndex = propName.replace('isScheduled', '');
            setStepMetadatas(
              onchangeStepDefault(propName, propValue, undefined, (propertyMetadata) => {
                if (propertyMetadata.propName === `scheduleInterval${jobIndex}`) {
                  propertyMetadata.disabled = !propValue;
                }
              })
            );
          },
        },
      },
      {
        propName: 'scheduleInterval',
        propLabel: 'Period',
        info: 'The period between successive executions',
        propValue: JOB_SCHEDULE_TIME_SELECTION[0].value,
        propDefaultValue: JOB_SCHEDULE_TIME_SELECTION[0].value,
        layoutProperties: { xs: 6, alignItems: 'center', justifyContent: 'center' },
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
        valueElementProperties: { xs: 8 },
        propType: PropType.Selection,
        selectionMeta: {
          selections: JOB_SCHEDULE_TIME_SELECTION,
          onChangeEvent: function (event) {
            const propValue = event.target.value;
            const propName = event.target.name;
            setStepMetadatas(onchangeStepDefault(propName, propValue));
          },
        },
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
            const propValue = event.target.value;
            const propName = event.target.name;
            setStepMetadatas(onchangeStepDefault(propName, propValue));
          },
        },
      },
      {
        propName: 'status',
        propLabel: 'Status',
        propValue: JOB_STATUS_SELECTION[0].value,
        propDefaultValue: JOB_STATUS_SELECTION[0].value,
        layoutProperties: { xs: 6, alignItems: 'center', justifyContent: 'center' },
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
        valueElementProperties: { xs: 8 },
        propType: PropType.Selection,
        selectionMeta: {
          selections: JOB_STATUS_SELECTION,
          onChangeEvent: function (event) {
            const propValue = event.target.value;
            const propName = event.target.name;
            setStepMetadatas(onchangeStepDefault(propName, propValue));
          },
        },
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
        codeEditorMeta: {
          height: '100px',
          codeLanguges: [json()],
          onChangeEvent: function (propName) {
            return (value, _) => {
              const propValue = value;
              setStepMetadatas(onchangeStepDefault(propName, propValue));
            };
          },
        },
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
        codeEditorMeta: {
          codeLanguges: [javascript({ jsx: true })],
          onChangeEvent: function (propName) {
            return (value, _) => {
              const propValue = value;
              setStepMetadatas(onchangeStepDefault(propName, propValue));
            };
          },
        },
      },
    ],
  };

  const [propertyMetadata, setPropertyMetadata] = React.useState<Array<PropertyMetadata>>([
    {
      propName: 'name',
      propLabel: 'Name',
      propValue: '',
      isRequired: true,
      propDescription: 'This is name of job',
      propType: PropType.InputText,
      layoutProperties: { xs: 6, alignItems: 'center', justifyContent: 'center' },
      labelElementProperties: { xs: 4, sx: { pl: 10 } },
      valueElementProperties: { xs: 8 },
      textFieldMeta: {
        onChangeEvent: function (event: any) {
          const propValue = event.target.value;
          const propName = event.target.name;
          setStepMetadatas(
            onchangeStepDefault(propName, propValue, (stepMetadata) => {
              if (stepMetadata.name === 'job') {
                stepMetadata.label = propValue;
              }
            })
          );
        },
      },
    },
    {
      propName: 'isAsync',
      propLabel: 'Asynchronous',
      propValue: false,
      layoutProperties: { xs: 6, alignItems: 'center', justifyContent: 'center' },
      labelElementProperties: { xs: 4, sx: { pl: 10 } },
      valueElementProperties: { xs: 8 },
      propType: PropType.Switcher,
      switcherFieldMeta: {
        onChangeEvent: function (event, propValue) {
          const propName = event.target.name;
          setStepMetadatas(
            onchangeStepDefault(propName, propValue, undefined, (propertyMetadata) => {
              if (propertyMetadata.propName === 'category') {
                propertyMetadata.disabled = !propValue;
              }
            })
          );
        },
      },
    },
    {
      propName: 'outputTargets',
      propLabel: 'Output',
      propValue: [JOB_OUTPUT_TARGET_VALUES[0].value],
      propDefaultValue: [JOB_OUTPUT_TARGET_VALUES[0].value],
      layoutProperties: { xs: 6, alignItems: 'center', justifyContent: 'center' },
      labelElementProperties: { xs: 4, sx: { pl: 10 } },
      valueElementProperties: { xs: 8 },
      propType: PropType.Selection,
      selectionMeta: {
        selections: JOB_OUTPUT_TARGET_VALUES,
        isMultiple: true,
        onChangeEvent: function (event) {
          const propValue = event.target.value;
          const propName = event.target.name;
          setStepMetadatas(onchangeStepDefault(propName, propValue));
        },
      },
    },
    {
      propName: 'category',
      propLabel: 'Category',
      disabled: true,
      propValue: JOB_CATEGORY_VALUES[0].value,
      propDefaultValue: JOB_CATEGORY_VALUES[0].value,
      layoutProperties: { xs: 6, alignItems: 'center', justifyContent: 'center' },
      labelElementProperties: { xs: 4, sx: { pl: 10 } },
      valueElementProperties: { xs: 8 },
      propType: PropType.Selection,
      selectionMeta: {
        selections: JOB_CATEGORY_VALUES,
        onChangeEvent: function (event) {
          const propValue = event.target.value;
          const propName = event.target.name;
          setStepMetadatas(onchangeStepDefault(propName, propValue));
        },
      },
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
          const propName = event.target.name;
          setStepMetadatas(
            onchangeStepDefault(propName, propValue, undefined, (propertyMetadata) => {
              if (propertyMetadata.propName === 'scheduleInterval') {
                propertyMetadata.disabled = !propValue;
              }
            })
          );
        },
      },
    },
    {
      propName: 'scheduleInterval',
      propLabel: 'Period',
      disabled: true,
      info: 'The period between successive executions',
      propValue: JOB_SCHEDULE_TIME_SELECTION[0].value,
      propDefaultValue: JOB_SCHEDULE_TIME_SELECTION[0].value,
      layoutProperties: { xs: 6, alignItems: 'center', justifyContent: 'center' },
      labelElementProperties: { xs: 4, sx: { pl: 10 } },
      valueElementProperties: { xs: 8 },
      propType: PropType.Selection,
      selectionMeta: {
        selections: JOB_SCHEDULE_TIME_SELECTION,
        onChangeEvent: function (event) {
          const propValue = event.target.value;
          const propName = event.target.name;
          setStepMetadatas(onchangeStepDefault(propName, propValue));
        },
      },
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
          const propValue = event.target.value;
          const propName = event.target.name;
          setStepMetadatas(onchangeStepDefault(propName, propValue));
        },
      },
    },
    {
      propName: 'status',
      propLabel: 'Status',
      propValue: JOB_STATUS_SELECTION[0].value,
      propDefaultValue: JOB_STATUS_SELECTION[0].value,
      layoutProperties: { xs: 6, alignItems: 'center', justifyContent: 'center' },
      labelElementProperties: { xs: 4, sx: { pl: 10 } },
      valueElementProperties: { xs: 8 },
      propType: PropType.Selection,
      selectionMeta: {
        selections: JOB_STATUS_SELECTION,
        onChangeEvent: function (event) {
          const propValue = event.target.value;
          const propName = event.target.name;
          setStepMetadatas(onchangeStepDefault(propName, propValue));
        },
      },
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
      codeEditorMeta: {
        height: '100px',
        codeLanguges: [json()],
        onChangeEvent: function (propName) {
          return (value, _) => {
            const propValue = value;
            setStepMetadatas(onchangeStepDefault(propName, propValue));
          };
        },
      },
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
          return option.templateName === value.templateName;
        },
        getOptionLabel: (option: TemplateOverview) => {
          return option.templateName;
        },
        renderTags: (value: Array<TemplateOverview>, getTagProps) =>
          value.map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index });
            const properties = {
              ...{
                sx: {
                  backgroundColor:
                    CHIP_RANDOM_COLOR[Math.floor(Math.random() * CHIP_RANDOM_COLOR.length)],
                  color: 'white',
                },
              },
              ...tagProps,
            };
            return <Chip key={key} label={option.templateName} {...properties} />;
          }),
        onChange: function (event, value: Array<TemplateOverview>, reason) {
          const templateContent = value
            .map((p) => `//*************** ${p.templateName} ***************\n${p.templateText}`)
            .join('\n\n');

          const templateProperty = findPropertyByCondition(propertyMetadata, (property) =>
            property.propName.startsWith('templates')
          );
          const configurationProperty = findPropertyByCondition(propertyMetadata, (property) =>
            property.propName.startsWith('configurations')
          );
          const allOptions = templateProperty?.autoCompleteMeta?.options;
          const allOptionsArr = allOptions as Array<TemplateOverview>;
          const allTemplateConfigurations = allOptionsArr
            .map((p) => JSON.parse(p.dataTemplateJSON))
            .reduce((previousValue, currentValue) => {
              return { ...previousValue, ...currentValue };
            }, {});
          const currentConfigurations = JSON.parse(configurationProperty?.propValue);

          const customOwnConfigurations: any = {};
          Object.keys(currentConfigurations)
            .filter((p) => !allTemplateConfigurations.hasOwnProperty(p))
            .forEach((p) => (customOwnConfigurations[p] = currentConfigurations[p]));

          const configurations = value
            .map((p) => JSON.parse(p.dataTemplateJSON))
            .reduce((previousValue, currentValue) => {
              return { ...previousValue, ...currentValue };
            }, customOwnConfigurations);
          setPropertyMetadata(onChangeProperty('content', templateContent));
          setPropertyMetadata(onChangeProperty('templates', value));
          setPropertyMetadata(
            onChangeProperty('configurations', JSON.stringify(configurations, undefined, 2))
          );
        },
        onSearchTextChangeEvent: function (event: any) {
          const propValue = event.target.value;
          TemplateAPI.search(propValue, restClient, (templateOverviews) => {
            setPropertyMetadata(
              onChangeProperty(
                'templates',
                templateOverviews,
                undefined,
                (property: PropertyMetadata) => {
                  if (property.autoCompleteMeta) {
                    property.autoCompleteMeta.options = templateOverviews;
                  }
                }
              )
            );
          });
        },
      },
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
      codeEditorMeta: {
        codeLanguges: [javascript({ jsx: true })],
        onChangeEvent: function (propName) {
          return (value, _) => {
            const propValue = value;
            setStepMetadatas(onchangeStepDefault(propName, propValue));
          };
        },
      },
    },
  ]);
  const initialStepMetadatas: Array<StepMetadata> = [
    {
      name: 'job',
      label: 'Job 1',
      description: 'This step is used to define job information',
      properties: propertyMetadata,
    },
  ];

  React.useEffect(() => {
    TemplateAPI.search('', restClient, (templateOverviews) => {
      setPropertyMetadata(
        onChangeProperty(
          'templates',
          templateOverviews,
          undefined,
          (property: PropertyMetadata) => {
            if (property.autoCompleteMeta) {
              property.autoCompleteMeta.options = templateOverviews;
            }
          }
        )
      );
    });

    setStepMetadatas(initialStepMetadatas);
    if (copyJobId) {
      JobAPI.load(copyJobId, restClient, (jobDetail: JobDetailMetadata) => {
        jobDetail.templates = JSON.parse(jobDetail.templates);
        jobDetail.name = `${jobDetail.name}-Copy`;
        Object.keys(jobDetail).forEach((propertyName: string) => {
          setPropertyMetadata(
            onChangeProperty(propertyName, jobDetail[propertyName as keyof JobDetailMetadata])
          );
        });
      });
    }
  }, []);

  const initialPageEntityMetdata: PageEntityMetadata = {
    pageName: 'job-creation',
    breadcumbsMeta: [
      <LinkBreadcrumd underline="hover" key="1" color="inherit" href="/actions">
        {ROOT_BREADCRUMB}
      </LinkBreadcrumd>,
      <LinkBreadcrumd underline="hover" key="1" color="inherit" href={'/actions/' + actionId}>
        {actionId}
      </LinkBreadcrumd>,
      <LinkBreadcrumd underline="hover" key="1" color="inherit" href={'/actions/' + actionId}>
        Jobs
      </LinkBreadcrumd>,
      <Typography key="3" color="text.primary">
        new
      </Typography>,
    ],
    pageEntityActions: [
      {
        actionIcon: <EngineeringOutlinedIcon />,
        actionLabel: 'Dry run',
        actionName: 'dryRunJobs',
        onClick: () => {
          stepMetadatas.forEach((stepMetadata) => {
            JobAPI.dryRun(restClient, stepMetadata.properties, actionId);
          });
        },
      },
      {
        actionIcon: <AddTaskTwoToneIcon />,
        actionName: 'newJob',
        actionLabel: 'New Job',
        onClick: () => {
          setStepMetadatas((previous) => {
            const nextStepMetadata: Array<StepMetadata> = [...previous];
            const addtionalStep = { ...initialTemplateStep };
            const newStepName = `${initialTemplateStep.name}${nextStepMetadata.length}`;
            addtionalStep.name = newStepName;
            addtionalStep.properties.forEach(
              (property) => (property.propName = `${property.propName}${nextStepMetadata.length}`)
            );
            nextStepMetadata.splice(previous.length - 1, 0, addtionalStep);
            return nextStepMetadata;
          });
        },
      },
      {
        actionIcon: <SaveIcon />,
        actionLabel: 'Save',
        actionName: 'saveJob',
        onClick: () => {
          const jobDefinitions: Array<JobDefinition> = getJobDetails(stepMetadatas);
          JobAPI.new(actionId, jobDefinitions, restClient, () => navigate('/actions/' + actionId));
        },
      },
    ],
    stepMetadatas: stepMetadatas,
  };

  return (
    <Stack 
      spacing={4}
      className="p-6 space-y-6 bg-slate-50 min-h-screen"
      sx={{
        padding: 3,
        gap: 3,
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
      }}
    >
      <PageEntityRender {...initialPageEntityMetdata} />
      <ProcessTracking isLoading={processTracking}></ProcessTracking>
    </Stack>
  );
}
