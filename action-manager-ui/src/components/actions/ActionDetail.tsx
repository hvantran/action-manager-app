
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArchiveIcon from '@mui/icons-material/Archive';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReplayIcon from '@mui/icons-material/Replay';
import { Box, Stack } from '@mui/material';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import React from 'react';

import { green } from '@mui/material/colors';
import { useNavigate, useParams } from 'react-router-dom';
import { ActionAPI, ActionDetails, ROOT_BREADCRUMB } from '../AppConstants';
import { DialogMetadata, PageEntityMetadata, RestClient, SnackbarAlertMetadata, SnackbarMessage } from '../GenericConstants';
import ConfirmationDialog from '../common/ConfirmationDialog';
import ProcessTracking from '../common/ProcessTracking';
import SnackbarAlert from '../common/SnackbarAlert';
import PageEntityRender from '../renders/PageEntityRender';
import ActionJobTable from './ActionJobTable';


export default function ActionDetail() {

  const targetAction = useParams();
  const navigate = useNavigate();
  const initialActionDetailData: ActionDetails = {
    hash: '',
    name: '',
    numberOfSuccessJobs: 0,
    numberOfFailureJobs: 0,
    numberOfJobs: 0,
    createdAt: 0,
    configurations: '',
    description: ''
  };
  const actionId: string | undefined = targetAction.actionId;
  if (!actionId) {
    throw new Error("Action is required");
  }

  const [processTracking, setCircleProcessOpen] = React.useState(false);
  const [_, setActionDetailData] = React.useState(initialActionDetailData);
  const [openError, setOpenError] = React.useState(false);
  const [deleteConfirmationDialogOpen, setDeleteConfirmationDialogOpen] = React.useState(false);
  const [confirmationDialogContent, setConfirmationDialogContent] = React.useState("");
  const [confirmationDialogTitle, setConfirmationDialogTitle] = React.useState("");
  const [confirmationDialogPositiveAction, setConfirmationDialogPositiveAction] = React.useState(() => () => {});
  const [openSuccess, setOpenSuccess] = React.useState(false);
  const [replayFlag, setReplayActionFlag] = React.useState(false);
  const [messageInfo, setMessageInfo] = React.useState<SnackbarMessage | undefined>(undefined);
  const restClient = new RestClient(setCircleProcessOpen, setMessageInfo, setOpenError, setOpenSuccess);

  React.useEffect(() => {
    ActionAPI.loadActionDetailAsync(actionId, restClient, setActionDetailData);
  }, []);

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
      {
        actionIcon: <RefreshIcon />,
        actionLabel: "Refresh action",
        actionName: "refreshAction",
        onClick: () => {
          ActionAPI.loadActionDetailAsync(actionId, restClient, setActionDetailData);
          setReplayActionFlag(previous => !previous);
        }
      },
      {
        actionIcon: <ReplayIcon />,
        actionLabel: "Replay action",
        actionLabelContent:
          <Box sx={{ display: 'flex', alignItems: "center", flexDirection: 'row' }}>
            <InfoIcon />
            <p>Replay function only support for one time jobs, <b>doesn't support for schedule jobs</b></p>
          </Box>,
        actionName: "replayAction",
        onClick: () => ActionAPI.replayAction(actionId, restClient, () => setReplayActionFlag(previous => !previous))
      },
      {
        actionIcon: <ArchiveIcon />,
        actionLabel: "Archive",
        actionName: "archiveAction",
        onClick: () => {
          setConfirmationDialogTitle("Archive")
          setConfirmationDialogContent(previous => "Are you sure you want to archive this action?")
          setConfirmationDialogPositiveAction(previous => () => ActionAPI.archive(actionId, restClient, () => navigate("/actions")));
          setDeleteConfirmationDialogOpen(true)
        }
      },
      {
        actionIcon: <AddCircleOutlineIcon />,
        properties: { sx: { color: green[800] } },
        actionLabel: "Add Jobs",
        actionName: "addAction",
        onClick: () => navigate("/actions/" + actionId + "/jobs/new")
      }
    ],
    properties: [
    ]
  }


  let snackbarAlertMetadata: SnackbarAlertMetadata = {
    openError,
    openSuccess,
    setOpenError,
    setOpenSuccess,
    messageInfo
  }

  let actionJobTableParams = {
    setCircleProcessOpen,
    setMessageInfo,
    setOpenError,
    setOpenSuccess,
    replayFlag
  }


  return (
    <Stack spacing={4}>
      <PageEntityRender {...pageEntityMetadata}></PageEntityRender>
      <ActionJobTable {...actionJobTableParams} actionId={actionId}></ActionJobTable>
      <ProcessTracking isLoading={processTracking}></ProcessTracking>
      <SnackbarAlert {...snackbarAlertMetadata}></SnackbarAlert>
      <ConfirmationDialog {...confirmationDeleteDialogMeta}></ConfirmationDialog>
    </Stack >
  );
}