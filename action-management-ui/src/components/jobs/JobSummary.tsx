

import { Link, Stack, Typography } from '@mui/material';
import React from 'react';
import {
  ColumnMetadata,
  PageEntityMetadata,
  PagingOptionMetadata,
  PagingResult,
  RestClient,
  SnackbarAlertMetadata,
  SnackbarMessage,
  TableMetadata
} from '../GenericConstants';

import JobStatus from '../common/JobStatus';
import PageEntityRender from '../renders/PageEntityRender';


import ScheduleIcon from '@mui/icons-material/Schedule';
import TimesOneMobiledataIcon from '@mui/icons-material/TimesOneMobiledata';
import { JOB_MANAGER_API_URL } from '../AppConstants';
import ProcessTracking from '../common/ProcessTracking';
import SnackbarAlert from '../common/SnackbarAlert';
import TextTruncate from '../common/TextTruncate';
import RefreshIcon from '@mui/icons-material/Refresh';


export default function JobSummary() {
  // const navigate = useNavigate();
  const [processTracking, setCircleProcessOpen] = React.useState(false);
  const [openError, setOpenError] = React.useState(false);
  const [openSuccess, setOpenSuccess] = React.useState(false);
  let initialPagingResult: PagingResult = { totalElements: 0, content: [] };
  const [pagingResult, setPagingResult] = React.useState(initialPagingResult);
  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [messageInfo, setMessageInfo] = React.useState<SnackbarMessage | undefined>(undefined);
  const restClient = new RestClient(setCircleProcessOpen, setMessageInfo, setOpenError, setOpenSuccess);

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
      id: 'state',
      label: 'State',
      minWidth: 100,
      align: 'left',
      format: (value: number) => value.toLocaleString('en-US'),
    },
    {
      id: 'status',
      label: 'Status',
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
    // {
    //   id: 'actions',
    //   label: '',
    //   align: 'left',
    //   actions: [{
    //     actionIcon: <ReadMoreIcon />,
    //     actionLabel: "Job details",
    //     actionName: "gotoJobDetail",
    //     onClick: (row: JobOverview) => {
    //       return () => navigate(`/jobs/${row.hash}`)
    //     }
    //   }]
    // }
  ];

  const loadRelatedJobsAsync = async (pageIndex: number, pageSize: number) => {
    const requestOptions = {
      method: "GET",
      headers: {
        "Accept": "application/json"
      }
    }

    const targetURL = `${JOB_MANAGER_API_URL}?pageIndex=${encodeURIComponent(pageIndex)}&pageSize=${encodeURIComponent(pageSize)}`;
    await restClient.sendRequest(requestOptions, targetURL, async (response) => {
      let responseJSON = await response.json() as PagingResult;
      setPagingResult(responseJSON);
      return { 'message': 'Loading jobs sucessfully!!!', key: new Date().getTime() } as SnackbarMessage;
    }, async (response: Response) => {
      return { 'message': "An interal error occurred during your request!", key: new Date().getTime() } as SnackbarMessage;
    });
  }

  React.useEffect(() => {
    loadRelatedJobsAsync(pageIndex, pageSize);
  }, [])

  let pagingOptions: PagingOptionMetadata = {
    pageIndex,
    component: 'div',
    pageSize,
    rowsPerPageOptions: [5, 10, 20],
    onPageChange: (pageIndex: number, pageSize: number) => {
      setPageIndex(pageIndex);
      setPageSize(pageSize);
      loadRelatedJobsAsync(pageIndex, pageSize);
    }
  }

  let tableMetadata: TableMetadata = {
    columns,
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
        onClick: () => () => loadRelatedJobsAsync(pageIndex, pageSize)
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
    </Stack>
  );
}