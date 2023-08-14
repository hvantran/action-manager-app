
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestoreIcon from '@mui/icons-material/Restore';

import { Stack } from '@mui/material';
import Link from '@mui/material/Link';
import { red } from '@mui/material/colors';
import React from 'react';
import {
  ColumnMetadata,
  DialogMetadata,
  PageEntityMetadata,
  PagingOptionMetadata,
  PagingResult,
  RestClient,
  SnackbarAlertMetadata,
  SnackbarMessage,
  TableMetadata
} from '../GenericConstants';
import ProcessTracking from '../common/ProcessTracking';

import { ActionAPI, ActionOverview } from '../AppConstants';
import ConfirmationDialog from '../common/ConfirmationDialog';
import SnackbarAlert from '../common/SnackbarAlert';
import PageEntityRender from '../renders/PageEntityRender';


export default function ActionTrash() {
  const [processTracking, setCircleProcessOpen] = React.useState(false);
  let initialPagingResult: PagingResult = { totalElements: 0, content: [] };
  const [pagingResult, setPagingResult] = React.useState(initialPagingResult);
  const [openError, setOpenError] = React.useState(false);
  const [openSuccess, setOpenSuccess] = React.useState(false);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [deleteConfirmationDialogOpen, setDeleteConfirmationDialogOpen] = React.useState(false);
  const [confirmationDialogContent, setConfirmationDialogContent] = React.useState("");
  const [confirmationDialogTitle, setConfirmationDialogTitle] = React.useState("");
  const [confirmationDialogPositiveAction, setConfirmationDialogPositiveAction] = React.useState(() => () => { });
  const [messageInfo, setMessageInfo] = React.useState<SnackbarMessage | undefined>(undefined);
  const restClient = new RestClient(setCircleProcessOpen, setMessageInfo, setOpenError, setOpenSuccess);

  const breadcrumbs = [
    <Link underline="hover" key="1" color="inherit" href='#'>
      Trash
    </Link>
  ];

  const confirmationDeleteDialogMeta: DialogMetadata = {
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

  const columns: ColumnMetadata[] = [
    { id: 'hash', label: 'Hash', minWidth: 100, isHidden: true, isKeyColumn: true },
    { id: 'name', label: 'Name', minWidth: 100 },
    {
      id: 'status',
      label: 'Status',
      minWidth: 170,
      align: 'left',
      format: (value: string) => value,
    },
    {
      id: 'numberOfJobs',
      label: 'Total jobs',
      minWidth: 170,
      align: 'left',
      format: (value: number) => value.toLocaleString('en-US'),
    },
    {
      id: 'numberOfFailureJobs',
      label: 'Number of failure jobs',
      minWidth: 170,
      align: 'left',
      format: (value: number) => value.toLocaleString('en-US'),
    },
    {
      id: 'numberOfSuccessJobs',
      label: 'Number of success jobs',
      minWidth: 170,
      align: 'left',
      format: (value: number) => value,
    },
    {
      id: 'numberOfScheduleJobs',
      label: 'Number of schedule jobs',
      minWidth: 170,
      align: 'left',
      format: (value: number) => value,
    },
    {
      id: 'createdAt',
      label: 'Created at',
      minWidth: 170,
      align: 'left',
      format: (value: number) => {

        if (!value) {
          return "";
        }

        let createdAtDate = new Date(0);
        createdAtDate.setUTCSeconds(value);
        return createdAtDate.toISOString();
      }
    },
    {
      id: 'actions',
      label: '',
      align: 'right',
      actions: [
        {
          actionIcon: <RestoreIcon />,
          actionLabel: "Restore",
          actionName: "restoreAction",
          onClick: (row: ActionOverview) => {
            return () => {
              return ActionAPI.restore(row.hash, restClient, () => {
                ActionAPI.loadTrashSummarysAsync(pageIndex, pageSize, restClient, (actionPagingResult) => setPagingResult(actionPagingResult))
              });
            }
          }
        },
        {
          actionIcon: <DeleteForeverIcon />,
          properties: { sx: { color: red[800] } },
          actionLabel: "Delete action permanently",
          actionName: "deleteAction",
          onClick: (row: ActionOverview) => () => {
            setConfirmationDialogTitle("Delete Action Permanently")
            setConfirmationDialogContent(previous => `Are you sure you want to delete permanently ${row.name} action?`)
            setConfirmationDialogPositiveAction(previous => () => ActionAPI.deleteAction(row.hash, restClient, () => {
              setDeleteConfirmationDialogOpen(false);
              ActionAPI.loadTrashSummarysAsync(pageIndex, pageSize, restClient, (actionPagingResult) => setPagingResult(actionPagingResult));
            }));
            setDeleteConfirmationDialogOpen(true)
          }
        }
      ]
    }
  ];

  React.useEffect(() => {
    ActionAPI.loadTrashSummarysAsync(pageIndex, pageSize, restClient, (actionPagingResult) => setPagingResult(actionPagingResult));
  }, [pageIndex, pageSize])

  let pagingOptions: PagingOptionMetadata = {
    pageIndex,
    pageSize,
    component: 'div',
    rowsPerPageOptions: [5, 10, 20],
    onPageChange: (pageIndex: number, pageSize: number) => {
      setPageIndex(pageIndex);
      setPageSize(pageSize);
    }
  }

  let tableMetadata: TableMetadata = {
    columns,
    pagingOptions: pagingOptions,
    pagingResult: pagingResult
  }

  let pageEntityMetadata: PageEntityMetadata = {
    pageName: 'action-trash',
    tableMetadata: tableMetadata,
    breadcumbsMeta: breadcrumbs,
    pageEntityActions: [
      {
        actionIcon: <RefreshIcon />,
        actionLabel: "Refresh action",
        actionName: "refreshAction",
        onClick: () => {
          ActionAPI.loadTrashSummarysAsync(pageIndex, pageSize, restClient, (actionPagingResult) => setPagingResult(actionPagingResult));
        }
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
    <Stack spacing={2}>
      <PageEntityRender {...pageEntityMetadata}></PageEntityRender>
      <ProcessTracking isLoading={processTracking}></ProcessTracking>
      <SnackbarAlert {...snackbarAlertMetadata}></SnackbarAlert>
      <ConfirmationDialog {...confirmationDeleteDialogMeta}></ConfirmationDialog>
    </Stack>
  );
}