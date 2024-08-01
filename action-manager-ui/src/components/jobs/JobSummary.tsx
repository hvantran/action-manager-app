

import { Link, Stack, Typography } from '@mui/material';
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

import JobStatus from '../common/JobStatus';
import PageEntityRender from '../renders/PageEntityRender';


import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TimesOneMobiledataIcon from '@mui/icons-material/TimesOneMobiledata';
import { useNavigate } from 'react-router-dom';
import { JobAPI, JobOverview } from '../AppConstants';
import ProcessTracking from '../common/ProcessTracking';
import TextTruncate from '../common/TextTruncate';
import ConfirmationDialog from '../common/ConfirmationDialog';
import { red } from '@mui/material/colors';

const pageIndexStorageKey = "action-manager-job-table-page-index"
const pageSizeStorageKey = "action-manager-job-table-page-size"

export default function JobSummary() {
  const navigate = useNavigate();
  const selectedJob = React.useRef({ jobName: '', jobId: '' })
  let initialPagingResult: PagingResult = { totalElements: 0, content: [] };
  const [processTracking, setCircleProcessOpen] = React.useState(false);
  const [pagingResult, setPagingResult] = React.useState(initialPagingResult);
  const [pageIndex, setPageIndex] = React.useState(parseInt(LocalStorageService.getOrDefault(pageIndexStorageKey, 0)))
  const [pageSize, setPageSize] = React.useState(parseInt(LocalStorageService.getOrDefault(pageSizeStorageKey, 10)))
  const restClient = new RestClient(setCircleProcessOpen);
  const [deleteConfirmationDialogOpen, setDeleteConfirmationDialogOpen] = React.useState(false)

  const breadcrumbs = [
    <Link underline="hover" key="1" color="inherit" href='#'>
      Jobs
    </Link>,
    <Typography key="3" color="text.primary">
      Summary
    </Typography>
  ];

  const columns: ColumnMetadata[] = [
    { id: 'hash', label: 'Hash', minWidth: 100, isHidden: true, isKeyColumn: true },
    { id: 'name', label: 'Name', minWidth: 100 },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      align: 'left',
      format: (value: string) => value
    },
    {
      id: 'state',
      label: 'Execution State',
      minWidth: 100,
      align: 'left',
      format: (value: number) => value.toLocaleString('en-US'),
    },
    {
      id: 'executionStatus',
      label: 'Execution Status',
      minWidth: 100,
      align: 'left',
      format: (value: string) => (<JobStatus status={value} />)
    },
    {
      id: 'schedule',
      label: 'Type',
      minWidth: 100,
      align: 'left',
      format: (value: boolean) => value ? (<ScheduleIcon />) : (<TimesOneMobiledataIcon />)
    },
    {
      id: 'startedAt',
      label: 'Started At',
      minWidth: 100,
      align: 'left',
      format: (value: number) => {
        if (!value) {
          return "";
        }

        let createdAtDate = new Date(value);
        return createdAtDate.toISOString();
      }
    },
    {
      id: 'updatedAt',
      label: 'Last run',
      minWidth: 100,
      align: 'left',
      format: (value: number) => {
        if (!value) {
          return "";
        }

        let createdAtDate = new Date(value);
        return createdAtDate.toISOString();
      }
    },
    {
      id: 'elapsedTime',
      label: 'Elapsed Time',
      minWidth: 100,
      align: 'left',
      format: (value: string) => value
    },
    {
      id: 'failureNotes',
      label: 'Failure Notes',
      minWidth: 200,
      align: 'left',
      format: (value: string) => (<TextTruncate text={value} maxTextLength={100} />)
    },
    {
      id: 'actions',
      label: '',
      align: 'left',
      actions: [
        {
            actionIcon: <DeleteForeverIcon />,
            properties: { sx: { color: red[800] } },
            actionLabel: "Delete",
            actionName: "deleteAction",
            onClick: (row: JobOverview) => () => {
                selectedJob.current = { jobName: row.name, jobId: row.hash }
                setDeleteConfirmationDialogOpen(true)
            }
        },
        {
        actionIcon: <ReadMoreIcon />,
        actionLabel: "Job details",
        actionName: "gotoJobDetail",
        onClick: (row: JobOverview) => {
          return () => navigate(`/actions/${row.actionHash}/jobs/${row.hash}`, { state: { name: row.name } })
        }
      }
    ]
    }
  ];

  React.useEffect(() => {
    JobAPI.loadRelatedJobsAsync(pageIndex, pageSize, restClient, setPagingResult);
  }, [])

  let pagingOptions: PagingOptionMetadata = {
    pageIndex,
    component: 'div',
    pageSize,
    rowsPerPageOptions: [5, 10, 20],
    onPageChange: (pageIndex: number, pageSize: number) => {
      setPageIndex(pageIndex);
      setPageSize(pageSize);
      LocalStorageService.put(pageIndexStorageKey, pageIndex)
      LocalStorageService.put(pageSizeStorageKey, pageSize)
      JobAPI.loadRelatedJobsAsync(pageIndex, pageSize, restClient, setPagingResult);
    }
  }

  let tableMetadata: TableMetadata = {
    columns,
    onRowClickCallback(row) {
      navigate(`/actions/${row.actionHash}/jobs/${row.hash}`, { state: { name: row.name } })
    },
    pagingOptions: pagingOptions,
    pagingResult: pagingResult
  }

  let pageEntityMetadata: PageEntityMetadata = {
    pageName: 'job-summary',
    breadcumbsMeta: breadcrumbs,
    tableMetadata: tableMetadata,
    pageEntityActions: [
      {
        actionIcon: <RefreshIcon />,
        actionLabel: "Refresh action",
        actionName: "refreshAction",
        onClick: () => JobAPI.loadRelatedJobsAsync(pageIndex, pageSize, restClient, setPagingResult)
      }
    ]
  }
  let confirmationDeleteDialogMeta: DialogMetadata = {
      open: deleteConfirmationDialogOpen,
      title: "Delete Job",
      content: <p>Are you sure you want to delete <b>{selectedJob.current.jobName}</b> job?</p>,
      positiveText: "Yes",
      negativeText: "No",
      negativeAction() {
          setDeleteConfirmationDialogOpen(false);
      },
      positiveAction() {
          JobAPI.delete(selectedJob.current.jobId, selectedJob.current.jobName, restClient, () => {
            JobAPI.loadRelatedJobsAsync(pageIndex, pageSize, restClient, setPagingResult);
          });
          setDeleteConfirmationDialogOpen(false);
      }
  }

  return (
    <Stack spacing={2}>
      <PageEntityRender {...pageEntityMetadata}></PageEntityRender>
      <ProcessTracking isLoading={processTracking}></ProcessTracking>
      <ConfirmationDialog {...confirmationDeleteDialogMeta}></ConfirmationDialog>
    </Stack>
  );
}