

import { Link, Stack, Typography } from '@mui/material';
import React from 'react';
import {
  ColumnMetadata,
  PageEntityMetadata,
  PagingOptionMetadata,
  PagingResult,
  RestClient,
  TableMetadata
} from '../GenericConstants';

import JobStatus from '../common/JobStatus';
import PageEntityRender from '../renders/PageEntityRender';


import ReadMoreIcon from '@mui/icons-material/ReadMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TimesOneMobiledataIcon from '@mui/icons-material/TimesOneMobiledata';
import { useNavigate } from 'react-router-dom';
import { JobAPI, JobOverview } from '../AppConstants';
import ProcessTracking from '../common/ProcessTracking';
import TextTruncate from '../common/TextTruncate';


export default function JobSummary() {
  const navigate = useNavigate();
  let initialPagingResult: PagingResult = { totalElements: 0, content: [] };
  const [processTracking, setCircleProcessOpen] = React.useState(false);
  const [pagingResult, setPagingResult] = React.useState(initialPagingResult);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const restClient = new RestClient(setCircleProcessOpen);

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
      actions: [{
        actionIcon: <ReadMoreIcon />,
        actionLabel: "Job details",
        actionName: "gotoJobDetail",
        onClick: (row: JobOverview) => {
          return () => navigate(`/actions/${row.actionHash}/jobs/${row.hash}`, { state: { name: row.name } })
        }
      }]
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

  return (
    <Stack spacing={2}>
      <PageEntityRender {...pageEntityMetadata}></PageEntityRender>
      <ProcessTracking isLoading={processTracking}></ProcessTracking>
    </Stack>
  );
}