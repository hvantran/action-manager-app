
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReplayIcon from '@mui/icons-material/Replay';
import { Box, Stack } from '@mui/material';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import React from 'react';

import { red } from '@mui/material/colors';
import { useNavigate, useParams } from 'react-router-dom';
import { ACTION_MANAGER_API_URL, ActionDetails, ROOT_BREADCRUMB } from '../AppConstants';
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
  const [openSuccess, setOpenSuccess] = React.useState(false);
  const [replayFlag, setReplayActionFlag] = React.useState(false);
  const [messageInfo, setMessageInfo] = React.useState<SnackbarMessage | undefined>(undefined);
  const restClient = new RestClient(setCircleProcessOpen, setMessageInfo, setOpenError, setOpenSuccess);

  const loadActionDetailAsync = async () => {
    const requestOptions = {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    }

    const targetURL = `${ACTION_MANAGER_API_URL}/${encodeURIComponent(actionId)}`;
    await restClient.sendRequest(requestOptions, targetURL, async (response) => {
      let actionDetailResult = await response.json() as ActionDetails;
      setActionDetailData(actionDetailResult);
      return undefined;
    }, async (response: Response) => {
      let responseJSON = await response.json();
      return { 'message': responseJSON['message'], key: new Date().getTime() } as SnackbarMessage;
    });
  }

  const deleteAction = async (actionId: string) => {

    const requestOptions = {
      method: "DELETE",
      headers: {
        "Accept": "application/json"
      }
    }
    const targetURL = `${ACTION_MANAGER_API_URL}/${actionId}`;
    await restClient.sendRequest(requestOptions, targetURL, () => {
      navigate("/actions");
      return undefined;
    }, async (response: Response) => {
      let responseJSON = await response.json();
      return { 'message': responseJSON['message'], key: new Date().getTime() } as SnackbarMessage;
    });
  }

  const replayAction = async (actionId: string) => {

    const requestOptions = {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    }
    const targetURL = `${ACTION_MANAGER_API_URL}/${actionId}/replay`;
    await restClient.sendRequest(requestOptions, targetURL, async () => {
      setReplayActionFlag(previous => !previous);
      return undefined
    }, async (response: Response) => {
      let responseJSON = await response.json();
      return { 'message': responseJSON['message'], key: new Date().getTime() } as SnackbarMessage;
    });
  }

  React.useEffect(() => {
    loadActionDetailAsync();
  }, []);

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
        onClick: () => () => {
          loadActionDetailAsync();
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
        onClick: () => () => replayAction(actionId)
      },
      {
        actionIcon: <DeleteIcon />,
        properties: { sx: { color: red[800] } },
        actionLabel: "Delete action",
        actionName: "deleteAction",
        onClick: () => () => setDeleteConfirmationDialogOpen(true)
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

  let confirmationDeleteDialogMeta: DialogMetadata = {
    open: deleteConfirmationDialogOpen,
    title: "Delete Action",
    content: "Are you sure you want to delete this action?",
    positiveText: "Yes",
    negativeText: "No",
    negativeAction() {
      setDeleteConfirmationDialogOpen(false);
    },
    positiveAction() {
      deleteAction(actionId);
    },
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