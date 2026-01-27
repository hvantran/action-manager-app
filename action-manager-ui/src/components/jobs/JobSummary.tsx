import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TimesOneMobiledataIcon from '@mui/icons-material/TimesOneMobiledata';
import CloseIcon from '@mui/icons-material/Close';
import { Link, Stack, Typography, Alert, IconButton } from '@mui/material';
import { red } from '@mui/material/colors';
import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { JobAPI, JobOverview } from '../AppConstants';
import ConfirmationDialog from '../common/ConfirmationDialog';
import JobStatus from '../common/JobStatus';
import ProcessTracking from '../common/ProcessTracking';
import TextTruncate from '../common/TextTruncate';
import {
  ColumnMetadata,
  DialogMetadata,
  LocalStorageService,
  PageEntityMetadata,
  PagingOptionMetadata,
  PagingResult,
  RestClient,
  TableMetadata,
} from '../GenericConstants';
import PageEntityRender from '../renders/PageEntityRender';

const pageIndexStorageKey = 'action-manager-job-table-page-index';
const pageSizeStorageKey = 'action-manager-job-table-page-size';
const orderByStorageKey = 'action-manager-job-table-order';

export default function JobSummary() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status');
  const selectedJob = React.useRef({ jobName: '', jobId: '' });
  const initialPagingResult: PagingResult = { totalElements: 0, content: [] };
  const [processTracking, setCircleProcessOpen] = React.useState(false);
  const [pagingResult, setPagingResult] = React.useState(initialPagingResult);

  const [pageIndex, setPageIndex] = React.useState(
    parseInt(LocalStorageService.getOrDefault(pageIndexStorageKey, 0))
  );
  const [pageSize, setPageSize] = React.useState(
    parseInt(LocalStorageService.getOrDefault(pageSizeStorageKey, 10))
  );
  const [orderBy, setOrderBy] = React.useState(
    LocalStorageService.getOrDefault(orderByStorageKey, '-updatedAt')
  );
  const restClient = React.useMemo(
    () => new RestClient(setCircleProcessOpen),
    [setCircleProcessOpen]
  );
  const [deleteConfirmationDialogOpen, setDeleteConfirmationDialogOpen] = React.useState(false);

  const clearFilter = () => {
    searchParams.delete('status');
    setSearchParams(searchParams);
    setPageIndex(0);
    LocalStorageService.put(pageIndexStorageKey, 0);
  };

  React.useEffect(() => {
    // Reset page index when status filter changes
    setPageIndex(0);
    LocalStorageService.put(pageIndexStorageKey, 0);
  }, [statusFilter]);

  const breadcrumbs = [
    <Link underline="hover" key="1" color="inherit" href="#">
      Jobs
    </Link>,
    <Typography key="3" color="text.primary">
      Summary
    </Typography>,
  ];

  const columns: ColumnMetadata[] = [
    {
      id: 'hash',
      label: 'Hash',
      minWidth: 100,
      isHidden: true,
      isKeyColumn: true,
    },
    {
      id: 'name',
      label: 'Name',
      isSortable: true,
      minWidth: 100,
    },
    {
      id: 'status',
      label: 'Status',
      isSortable: true,
      minWidth: 100,
      align: 'left',
      format: (value: string) => value,
    },
    {
      id: 'state',
      label: 'Execution State',
      isSortable: true,
      minWidth: 100,
      align: 'left',
      format: (value: number) => value.toLocaleString('en-US'),
    },
    {
      id: 'executionStatus',
      label: 'Execution Status',
      isSortable: true,
      minWidth: 100,
      align: 'left',
      format: (value: string) => <JobStatus status={value} />,
    },
    {
      id: 'schedule',
      isSortable: true,
      label: 'Type',
      minWidth: 100,
      align: 'left',
      format: (value: boolean) => (value ? <ScheduleIcon /> : <TimesOneMobiledataIcon />),
    },
    {
      id: 'startedAt',
      label: 'Started At',
      isSortable: true,
      minWidth: 100,
      align: 'left',
      format: (value: number) => {
        if (!value) {
          return '';
        }

        const createdAtDate = new Date(value);
        return createdAtDate.toISOString();
      },
    },
    {
      id: 'updatedAt',
      label: 'Updated At',
      isSortable: true,
      minWidth: 100,
      align: 'left',
      format: (value: number) => {
        if (!value) {
          return '';
        }

        const createdAtDate = new Date(value);
        return createdAtDate.toISOString();
      },
    },
    {
      id: 'elapsedTime',
      label: 'Elapsed Time',
      minWidth: 100,
      align: 'left',
      format: (value: string) => value,
    },
    {
      id: 'failureNotes',
      label: 'Failure Notes',
      minWidth: 200,
      align: 'left',
      format: (value: string) => <TextTruncate text={value} maxTextLength={100} />,
    },
    {
      id: 'actions',
      label: '',
      align: 'left',
      actions: [
        {
          actionIcon: <DeleteForeverIcon />,
          properties: { sx: { color: red[800] } },
          actionLabel: 'Delete',
          actionName: 'deleteAction',
          onClick: (row: JobOverview) => () => {
            selectedJob.current = { jobName: row.name, jobId: row.hash };
            setDeleteConfirmationDialogOpen(true);
          },
        },
        {
          actionIcon: <ReadMoreIcon />,
          actionLabel: 'Job details',
          actionName: 'gotoJobDetail',
          onClick: (row: JobOverview) => {
            return () =>
              navigate(`/actions/${row.actionHash}/jobs/${row.hash}`, {
                state: { name: row.name },
              });
          },
        },
      ],
    },
  ];

  React.useEffect(() => {
    JobAPI.loadRelatedJobsAsync(pageIndex, pageSize, orderBy, restClient, setPagingResult, statusFilter);
  }, [pageIndex, pageSize, orderBy, statusFilter, restClient]);

  const pagingOptions: PagingOptionMetadata = {
    pageIndex,
    component: 'div',
    orderBy,
    pageSize,
    searchText: '',
    rowsPerPageOptions: [5, 10, 20],
    onPageChange: (pageIndex: number, pageSize: number, orderBy: string) => {
      setPageIndex(pageIndex);
      setPageSize(pageSize);
      setOrderBy(orderBy);
      LocalStorageService.put(pageIndexStorageKey, pageIndex);
      LocalStorageService.put(pageSizeStorageKey, pageSize);
      LocalStorageService.put(orderByStorageKey, orderBy);
      JobAPI.loadRelatedJobsAsync(pageIndex, pageSize, orderBy, restClient, setPagingResult);
    },
  };

  const tableMetadata: TableMetadata = {
    name: 'Overview',
    columns,
    onRowClickCallback(row) {
      navigate(`/actions/${row.actionHash}/jobs/${row.hash}`, { state: { name: row.name } });
    },
    pagingOptions: pagingOptions,
    pagingResult: pagingResult,
  };

  const pageEntityMetadata: PageEntityMetadata = {
    pageName: 'job-summary',
    breadcumbsMeta: breadcrumbs,
    tableMetadata: tableMetadata,
    pageEntityActions: [
      {
        actionIcon: statusFilter ? (
          <Alert
            severity="info"
            sx={{ mr: 2 }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={clearFilter}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
          >
            Showing only jobs with status: <strong>{statusFilter}</strong>
            {statusFilter === 'FAILURE' && ` (${pagingResult.totalElements} failed jobs)`}
          </Alert>
        ) : <></>,
        actionLabel: '',
        actionName: 'filterAlert',
        onClick: () => {},
        visible: !!statusFilter,
      },
      {
        actionIcon: <RefreshIcon />,
        actionLabel: 'Refresh action',
        actionName: 'refreshAction',
        onClick: () =>
          JobAPI.loadRelatedJobsAsync(pageIndex, pageSize, orderBy, restClient, setPagingResult, statusFilter),
      },
    ],
  };
  const confirmationDeleteDialogMeta: DialogMetadata = {
    open: deleteConfirmationDialogOpen,
    title: 'Delete Job',
    content: (
      <p>
        Are you sure you want to delete <b>{selectedJob.current.jobName}</b> job?
      </p>
    ),
    positiveText: 'Yes',
    negativeText: 'No',
    negativeAction() {
      setDeleteConfirmationDialogOpen(false);
    },
    positiveAction() {
      JobAPI.delete(selectedJob.current.jobId, selectedJob.current.jobName, restClient, () => {
        JobAPI.loadRelatedJobsAsync(pageIndex, pageSize, orderBy, restClient, setPagingResult, statusFilter);
      });
      setDeleteConfirmationDialogOpen(false);
    },
  };

  return (
    <>
      <PageEntityRender {...pageEntityMetadata}></PageEntityRender>
      <ProcessTracking isLoading={processTracking}></ProcessTracking>
      <ConfirmationDialog {...confirmationDeleteDialogMeta}></ConfirmationDialog>
    </>
  );
}
