
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestoreIcon from '@mui/icons-material/Restore';
import ScheduleIcon from '@mui/icons-material/Schedule';

import { Badge, Stack } from '@mui/material';
import Link from '@mui/material/Link';
import { red } from '@mui/material/colors';
import React from 'react';
import {
  ColumnMetadata,
  DialogMetadata,
  LocalStorageService,
  PageEntityMetadata,
  PagingOptionMetadata,
  PagingResult,
  RestClient,
  TableMetadata
} from '../GenericConstants';
import ProcessTracking from '../common/ProcessTracking';

import { ActionAPI, ActionOverview } from '../AppConstants';
import ConfirmationDialog from '../common/ConfirmationDialog';
import PageEntityRender from '../renders/PageEntityRender';


const pageIndexStorageKey = "action-manager-action-archive-table-page-index"
const pageSizeStorageKey = "action-manager-action-archive-table-page-size"
const orderByStorageKey = "action-manager-job-table-order"

export default function ActionArchive() {
  const [processTracking, setCircleProcessOpen] = React.useState(false);
  let initialPagingResult: PagingResult = { totalElements: 0, content: [] };
  const [pagingResult, setPagingResult] = React.useState(initialPagingResult);
  const [pageIndex, setPageIndex] = React.useState(parseInt(LocalStorageService.getOrDefault(pageIndexStorageKey, 0)))
  const [pageSize, setPageSize] = React.useState(parseInt(LocalStorageService.getOrDefault(pageSizeStorageKey, 10)))
  const [orderBy, setOrderBy] = React.useState(LocalStorageService.getOrDefault(orderByStorageKey, '-name'));
  const [deleteConfirmationDialogOpen, setDeleteConfirmationDialogOpen] = React.useState(false);
  const [confirmationDialogContent, setConfirmationDialogContent] = React.useState(<p></p>);
  const [confirmationDialogTitle, setConfirmationDialogTitle] = React.useState("");
  const [confirmationDialogPositiveAction, setConfirmationDialogPositiveAction] = React.useState(() => () => { });
  const restClient = new RestClient(setCircleProcessOpen);

  const breadcrumbs = [
    <Link underline="hover" key="1" color="inherit" href='#'>
      Archive Actions
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
      label: 'No jobs',
      minWidth: 100,
      align: 'left',
      format: (value: number) => value
    },
    {
      id: 'numberOfPendingJobs',
      label: 'No pending jobs',
      minWidth: 100,
      align: 'left',
      format: (value: number) =>
        <Badge badgeContent={value} color='warning' showZero>
          <PendingIcon color='warning' />
        </Badge>
    },
    {
      id: 'numberOfFailureJobs',
      label: 'No failure jobs',
      minWidth: 100,
      align: 'left',
      format: (value: number) =>
        <Badge badgeContent={value} color="error" showZero>
          <ErrorIcon color="error" />
        </Badge>
    },
    {
      id: 'numberOfSuccessJobs',
      label: 'No success jobs',
      minWidth: 100,
      align: 'left',
      format: (value: number) =>
        <Badge badgeContent={value} color="success" showZero>
          <CheckCircleIcon color="success" />
        </Badge>
    },
    {
      id: 'numberOfScheduleJobs',
      label: 'No schedule jobs',
      minWidth: 100,
      align: 'left',
      format: (value: number) =>
        <Badge badgeContent={value} color="secondary" showZero>
          <ScheduleIcon color="secondary" />
        </Badge>
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
                ActionAPI.loadTrashSummarysAsync(pageIndex, pageSize, orderBy, restClient, (actionPagingResult) => setPagingResult(actionPagingResult));
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
            setConfirmationDialogContent(previous => <p>Are you sure you want to delete permanently <b>{row.name}</b> action?</p>)
            setConfirmationDialogPositiveAction(previous => () => ActionAPI.deleteAction(row.hash, restClient, () => {
              setDeleteConfirmationDialogOpen(false);
              ActionAPI.loadTrashSummarysAsync(pageIndex, pageSize, orderBy, restClient, (actionPagingResult) => setPagingResult(actionPagingResult));
            }));
            setDeleteConfirmationDialogOpen(true)
          }
        }
      ]
    }
  ];

  React.useEffect(() => {
    ActionAPI.loadTrashSummarysAsync(pageIndex, pageSize, orderBy, restClient, (actionPagingResult) => setPagingResult(actionPagingResult));
  }, [pageIndex, pageSize])

  let pagingOptions: PagingOptionMetadata = {
    pageIndex,
    pageSize,
    orderBy,
    component: 'div',
    rowsPerPageOptions: [5, 10, 20],
    onPageChange: (pageIndex: number, pageSize: number, orderBy: string) => {
      setPageIndex(pageIndex);
      setPageSize(pageSize);
      setOrderBy(orderBy);
      LocalStorageService.put(pageIndexStorageKey, pageIndex)
      LocalStorageService.put(pageSizeStorageKey, pageSize)
      LocalStorageService.put(orderByStorageKey, orderBy)
      ActionAPI.loadTrashSummarysAsync(pageIndex, pageSize, orderBy, restClient, (actionPagingResult) => setPagingResult(actionPagingResult));
    }
  }

  let tableMetadata: TableMetadata = {
    columns,
    name: 'Overview',
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
          ActionAPI.loadTrashSummarysAsync(pageIndex, pageSize, orderBy, restClient, (actionPagingResult) => setPagingResult(actionPagingResult));
        }
      }
    ]
  }

  return (
    <Stack spacing={2}>
      <PageEntityRender {...pageEntityMetadata}></PageEntityRender>
      <ProcessTracking isLoading={processTracking}></ProcessTracking>
      <ConfirmationDialog {...confirmationDeleteDialogMeta}></ConfirmationDialog>
    </Stack>
  );
}