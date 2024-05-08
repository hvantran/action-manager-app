
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import EditIcon from '@mui/icons-material/Edit';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReplayIcon from '@mui/icons-material/Replay';
import SaveIcon from '@mui/icons-material/Save';
import ErrorIcon from '@mui/icons-material/Error';
import { Box, Stack } from '@mui/material';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import React from 'react';
import { json } from '@codemirror/lang-json';
import { green, yellow } from '@mui/material/colors';
import { useNavigate, useParams } from 'react-router-dom';
import { ACTION_STATUS_SELECTION, ActionAPI, ActionDetails, ROOT_BREADCRUMB, isAllDependOnPropsValid } from '../AppConstants';
import { DialogMetadata, GenericActionMetadata, PageEntityMetadata, PropType, PropertyMetadata, RestClient, onChangeProperty } from '../GenericConstants';
import ConfirmationDialog from '../common/ConfirmationDialog';
import ProcessTracking from '../common/ProcessTracking';
import PageEntityRender from '../renders/PageEntityRender';
import ActionJobTable from './ActionJobTable';

import Badge, { BadgeProps } from '@mui/material/Badge';
import { styled } from '@mui/material/styles';

const StyledBadge = styled(Badge)<BadgeProps>(({ theme }) => ({
  '& .MuiBadge-badge': {
    border: `2px solid ${theme.palette.background.paper}`,
    padding: '0 4px',
  },
}));


export default function ActionDetail() {

  const targetAction = useParams();
  const navigate = useNavigate();
  const actionId: string | undefined = targetAction.actionId;
  if (!actionId) {
    throw new Error("Action is required");
  }

  const [processTracking, setCircleProcessOpen] = React.useState(false);
  const [deleteConfirmationDialogOpen, setDeleteConfirmationDialogOpen] = React.useState(false);
  const [confirmationDialogContent, setConfirmationDialogContent] = React.useState("");
  const [confirmationDialogTitle, setConfirmationDialogTitle] = React.useState("");
  const [confirmationDialogPositiveAction, setConfirmationDialogPositiveAction] = React.useState(() => () => { });
  const [replayFlag, setReplayActionFlag] = React.useState(false);
  const restClient = new RestClient(setCircleProcessOpen);


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
      onClick: () => ActionAPI.updateAction(actionId, restClient, propertyMetadata, () => enableEditFunction(false))
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
        propName: 'actionName',
        propLabel: 'Name',
        propValue: '',
        isRequired: true,
        disabled: true,
        disablePerpetualy: true,
        propDescription: 'This is action name',
        propType: PropType.InputText,
        layoutProperties: { xs: 6, alignItems: "center", justifyContent: "center" },
        labelElementProperties: { xs: 2.5, sx: { pl: 5 } },
        valueElementProperties: { xs: 9.5 },
        textFieldMeta: {
          onChangeEvent: function (event: any) {
            let propValue = event.target.value;
            let propName = event.target.name;
            setPropertyMetadata(onChangeProperty(propName, propValue));
          }
        }
      },
      {
        propName: 'actionStatus',
        propLabel: 'Status',
        propValue: '',
        propDefaultValue: '',
        disabled: true,
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
            setPropertyMetadata(onChangeProperty(propName, propValue));
          }
        }
      },
      {
        propName: 'actionConfigurations',
        propLabel: 'Configurations',
        propValue: '{}',
        propDefaultValue: '{}',
        disabled: true,
        layoutProperties: { xs: 12 },
        labelElementProperties: { xs: 1.2, sx: { pl: 5 } },
        valueElementProperties: { xs: 10.8 },
        isRequired: true,
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
      }
    ])

  React.useEffect(() => {
    ActionAPI.loadActionDetailAsync(actionId, restClient, (actionDetail: ActionDetails) => {
      Object.keys(actionDetail).forEach((propertyName: string) => {
        setPropertyMetadata(onChangeProperty(propertyName, actionDetail[propertyName as keyof ActionDetails]));
      })
    })
  }, [actionId]);

  let confirmationDeleteDialogMeta: DialogMetadata = {
    open: deleteConfirmationDialogOpen,
    title: confirmationDialogTitle,
    content: confirmationDialogContent,
    positiveText: "Yes",
    negativeText: "No",
    negativeAction() {
      setDeleteConfirmationDialogOpen(false);
    },
    positiveAction: confirmationDialogPositiveAction
  }

  let pageEntityMetadata: PageEntityMetadata = {
    pageName: 'action-details',
    breadcumbsMeta: [
      <Link underline="hover" key="1" color="inherit" href="/actions">
        {ROOT_BREADCRUMB}
      </Link>,
      <Typography key="3" color="text.primary">{actionId}</Typography>,
    ],
    pageEntityActions: [
      editActionMeta,
      saveActionMeta,
      {
        actionIcon: <RefreshIcon />,
        actionLabel: "Refresh action",
        actionName: "refreshAction",
        onClick: () => {
          ActionAPI.loadActionDetailAsync(actionId, restClient, (actionDetail: ActionDetails) => {
            Object.keys(actionDetail).forEach((propertyName: string) => {
              setPropertyMetadata(onChangeProperty(propertyName, actionDetail[propertyName as keyof ActionDetails]));
            })
          })
          setReplayActionFlag(previous => !previous);
        }
      },
      {
        actionIcon: <ArchiveOutlinedIcon />,
        actionLabel: "Archive",
        actionName: "archiveAction",
        isSecondary: true,
        onClick: () => {
          setConfirmationDialogTitle("Archive")
          setConfirmationDialogContent(previous => "Are you sure you want to archive this action?")
          setConfirmationDialogPositiveAction(previous => () => ActionAPI.archive(actionId, restClient, () => navigate("/actions")));
          setDeleteConfirmationDialogOpen(true)
        }
      },
      {
        actionIcon: <ReplayIcon />,
        actionLabel: "Replay all",
        isSecondary: true,
        actionLabelContent:
          <Box sx={{ display: 'flex', alignItems: "center", flexDirection: 'row' }}>
            <InfoIcon />
            <p>Replay function only support for <b>one time</b> and <b>schedule jobs</b></p>
          </Box>,
        actionName: "replayAction",
        onClick: () => ActionAPI.replayAction(actionId, restClient, () => setReplayActionFlag(previous => !previous))
      },
      {
        actionIcon: <>
          <StyledBadge color="error" badgeContent={<ErrorIcon sx={{ fontSize: 10 }} />}>
            <ReplayIcon />
          </StyledBadge>
        </>,
        isSecondary: true,
        actionLabel: "Replay failures",
        actionName: "replayOnlyFailureAction",
        onClick: () => ActionAPI.replayFailures(actionId, restClient, () => setReplayActionFlag(previous => !previous))
      },
      {
        actionIcon: <AddCircleOutlineIcon />,
        properties: { sx: { color: green[800] } },
        actionLabel: "Add Jobs",
        actionName: "addAction",
        onClick: () => navigate("/actions/" + actionId + "/jobs/new")
      }
    ],
    properties: propertyMetadata
  }

  let actionJobTableParams = {
    setCircleProcessOpen,
    replayFlag
  }


  return (
    <Stack spacing={4}>
      <PageEntityRender {...pageEntityMetadata}></PageEntityRender>
      <ActionJobTable {...actionJobTableParams} actionId={actionId}></ActionJobTable>
      <ProcessTracking isLoading={processTracking}></ProcessTracking>
      <ConfirmationDialog {...confirmationDeleteDialogMeta}></ConfirmationDialog>
    </Stack >
  );
}