import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import EditIcon from '@mui/icons-material/Edit';
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined';
import InfoIcon from '@mui/icons-material/Info';
import PauseCircleOutline from '@mui/icons-material/PauseCircleOutline';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReplayIcon from '@mui/icons-material/Replay';
import SaveIcon from '@mui/icons-material/Save';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';

import { Box, Stack } from '@mui/material';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import React from 'react';
import {
  DialogMetadata,
  GenericActionMetadata,
  PageEntityMetadata,
  PropType,
  PropertyMetadata,
  RestClient,
  onChangeProperty
} from '../GenericConstants';
import ProcessTracking from '../common/ProcessTracking';

import { red, yellow } from '@mui/material/colors';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ActionAPI,
  JOB_CATEGORY_VALUES,
  JOB_OUTPUT_TARGET_VALUES,
  JOB_SCHEDULE_TIME_SELECTION,
  JOB_STATUS_SELECTION,
  JobAPI,
  JobDetailMetadata,
  ROOT_BREADCRUMB,
  TemplateAPI,
  TemplateOverview,
  isAllDependOnPropsValid
} from '../AppConstants';
import ConfirmationDialog from '../common/ConfirmationDialog';
import PageEntityRender from '../renders/PageEntityRender';

export default function JobDetail() {
  const navigate = useNavigate();
  const targetJob = useParams();
  const location = useLocation();

  const jobName = React.useRef(location.state?.name || "");
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

        if (p.dependOn && !isAllDependOnPropsValid(p.dependOn, previous)) {
          return p;
        }

        if (!p.disablePerpetualy) {
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
      properties: { sx: { color: yellow[800] } },
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
        disablePerpetualy: true,
        propDescription: 'This is name of job',
        propType: PropType.InputText,
        layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
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
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
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
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
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
        dependOn: ["isAsync", true],
        layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
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
        propLabel: 'Schedule',
        propValue: false,
        disabled: true,
        layoutProperties: { xs: 6 },
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
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
        propLabel: 'Period',
        info: 'The period between successive executions',
        disabled: true,
        dependOn: ["isScheduled", true],
        propValue: 0,
        layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
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
        layoutProperties: { xs: 6 },
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
        valueElementProperties: { xs: 8 },
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
        propName: 'status',
        propLabel: 'Status',
        disabled: true,
        propValue: '',
        layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 4, sx: { pl: 10 } },
        valueElementProperties: { xs: 8 },
        propType: PropType.Selection,
        selectionMeta: {
          selections: JOB_STATUS_SELECTION,
          onChangeEvent: function (event) {
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
              setPropertyMetadata(onChangeProperty(propName, propValue))
            }
          }
        }
      },
      {
        propName: 'templates',
        propLabel: 'Content Templates',
        propValue: [],
        disabled: true,
        layoutProperties: { xs: 12 },
        labelElementProperties: { xs: 2, sx: { pl: 10 } },
        valueElementProperties: { xs: 10 },
        propType: PropType.Autocomplete,
        autoCompleteMeta: {
          isMultiple: true,
          options: [],
          limitTags: 5,
          filterSelectedOptions: true,
          isOptionEqualToValue(option: TemplateOverview, value: TemplateOverview) {
              return option.templateName === value.templateName
          },
          getOptionLabel: (option: TemplateOverview) => {
            return option.templateName
          },
          onChange: function (event, value: Array<TemplateOverview>, reason) {
            const templateContent = value
            .map(p => `
//*************** ${p.templateName} ***************
${p.templateText}
              `)
            .join("\n\n");

            switch (reason) {
              case 'selectOption':
              case 'clear':
              case 'removeOption':
              case 'createOption':
              case 'blur':
                setPropertyMetadata(onChangeProperty("content", templateContent));
                setPropertyMetadata(onChangeProperty("templates", value));
                break
            }
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
        propLabel: 'Job Content',
        layoutProperties: { xs: 12 },
        labelElementProperties: { xs: 2, sx: { pl: 10 } },
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
  const [deleteConfirmationDialogOpen, setDeleteConfirmationDialogOpen] = React.useState(false);
  const restClient = React.useMemo(() => new RestClient(setCircleProcessOpen), []);

  const breadcrumbs = [
    <Link underline="hover" key="1" color="inherit" href="/actions">
      {ROOT_BREADCRUMB}
    </Link>,
    <Link underline="hover" key="1" color="inherit" href={`/actions/${actionId}`}>{actionId}</Link>,
    <Typography key="3" color="text.primary">Jobs</Typography>,
    <Typography key="3" color="text.primary">{jobId}</Typography>
  ];

  const onLoad = () => {

    TemplateAPI.search("", restClient, (templateOverviews) => {
      setPropertyMetadata(onChangeProperty("templates", templateOverviews, undefined, (property: PropertyMetadata) => {
        if (property.autoCompleteMeta) {
          property.autoCompleteMeta.options = templateOverviews;
        }
      }));
    })
    JobAPI.load(jobId, restClient, (jobDetail: JobDetailMetadata) => {
      jobName.current = jobDetail.name
      setIsPausedJob(jobDetail.status === "PAUSED")
      const valueCallback = (property: PropertyMetadata, value: any) => {
        return property.propValue = property.propName === 'templates' ? JSON.parse(value) : value
      }
      Object.keys(jobDetail).forEach((propertyName: string) => {
        let rawPropValue = jobDetail[propertyName as keyof JobDetailMetadata]
        setPropertyMetadata(
          onChangeProperty(
            propertyName,
            rawPropValue,
            undefined,
            valueCallback
          ));
      })
    })
  }

  const onPause = () => {
    setIsPausedJob(true);
    JobAPI.pause(jobId, jobName.current, restClient);
  }

  const onResume = () => {
    setIsPausedJob(false);
    JobAPI.resume(actionId, jobId, jobName.current, restClient);
  }

  React.useEffect(onLoad, [jobId, restClient])

  let pageEntityMetadata: PageEntityMetadata = {
    pageName: 'template-details',
    breadcumbsMeta: breadcrumbs,
    pageEntityActions: [
      editActionMeta,
      saveActionMeta,
      {
        actionIcon:
          <Link underline="hover" key="1" color="black" target="_blank" href={`${process.env.REACT_APP_TROUBLESHOOTING_BASE_URL}app/discover#/?_g=(filters:!(),refreshInterval:(pause:!t,value:0),time:(from:now%2Fd,to:now%2Fd))&_a=(columns:!(),filters:!(('$state':(store:appState),meta:(alias:!n,disabled:!f,index:'364e818f-85bf-4cd6-8608-c4e43ec6f98e',key:jobName.keyword,negate:!f,params:(query:${jobName}),type:phrase),query:(match_phrase:(jobName.keyword:${jobName})))),index:'364e818f-85bf-4cd6-8608-c4e43ec6f98e',interval:auto,query:(language:kuery,query:''),sort:!(!('@timestamp',desc)))`} rel="noopener noreferrer">
            <TroubleshootIcon />
          </Link>,
        actionLabel: "Troubleshoot",
        actionName: "troubleshootAction",
        isSecondary: true
      },
      {
        actionIcon: <EngineeringOutlinedIcon />,
        // properties: {color: 'success'},
        actionLabel: "Dry run",
        actionName: "dryRunAction",
        isSecondary: true,
        onClick: () => JobAPI.dryRun(restClient, propertyMetadata, actionId)
      },
      {
        actionIcon: <ReplayIcon />,
        actionLabel: "Replay",
        isSecondary: true,
        actionLabelContent:
          <Box sx={{ display: 'flex', alignItems: "center", flexDirection: 'row' }}>
            <InfoIcon />
            <p>Replay function only support for <b>one time</b> and <b>schedule jobs</b></p>
          </Box>,
        actionName: "replayJob",
        onClick: () => ActionAPI.replayJob(actionId, jobId, restClient)
      },
      {
        actionIcon: <DeleteForeverIcon />,
        properties: { sx: { color: red[800] } },
        actionLabel: "Delete",
        actionName: "deleteAction",
        actionLabelContent: <Box sx={{ display: 'flex', alignItems: "center", flexDirection: 'row' }}>
          <InfoIcon />
          <p>The job will be <b>deleted forever</b></p>
        </Box>,
        onClick: () => setDeleteConfirmationDialogOpen(true)
      },
      {
        actionIcon: <PlayCircleIcon />,
        visible: isPausedJob,
        actionLabelContent: <Box sx={{ display: 'flex', alignItems: "center", flexDirection: 'row' }}>
          <InfoIcon />
          <p>Paused/Resume function only support for schedule jobs, <b>doesn't support for one time jobs</b></p>
        </Box>,
        actionLabel: "Resume",
        actionName: "resumeAction",
        onClick: onResume
      },
      {
        actionIcon: <PauseCircleOutline />,
        visible: !isPausedJob,
        actionLabelContent: <Box sx={{ display: 'flex', alignItems: "center", flexDirection: 'row' }}>
          <InfoIcon />
          <p>Paused/Resume function only support for schedule jobs, <b>doesn't support for one time jobs</b></p>
        </Box>,
        actionLabel: "Pause",
        actionName: "pauseAction",
        onClick: onPause
      },
      {
        actionIcon: <RefreshIcon />,
        actionLabel: "Refresh",
        actionName: "refreshAction",
        onClick: onLoad
      }
    ],
    properties: propertyMetadata
  }

  let confirmationDeleteDialogMeta: DialogMetadata = {
    open: deleteConfirmationDialogOpen,
    title: "Delete Job",
    content: <p>Are you sure you want to delete <b>{jobName.current}</b> job?</p>,
    positiveText: "Yes",
    negativeText: "No",
    negativeAction() {
      setDeleteConfirmationDialogOpen(false);
    },
    positiveAction() {
      JobAPI.delete(jobId, jobName.current, restClient, () => navigate("/actions/" + actionId));
    },
  }

  return (
    <Stack spacing={2}>
      <PageEntityRender {...pageEntityMetadata}></PageEntityRender>
      <ProcessTracking isLoading={processTracking}></ProcessTracking>
      <ConfirmationDialog {...confirmationDeleteDialogMeta}></ConfirmationDialog>
    </Stack>
  );
}