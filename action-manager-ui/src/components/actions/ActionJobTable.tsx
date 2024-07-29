
import { Box, Stack } from '@mui/material';
import React, { useRef } from 'react';
import {
    ActionAPI,
    JobAPI,
    JobOverview
} from '../AppConstants';
import {
    ColumnMetadata, DialogMetadata, LocalStorageService, PageEntityMetadata, PagingOptionMetadata,
    PagingResult, RestClient, TableMetadata
} from '../GenericConstants';


import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import InfoIcon from '@mui/icons-material/Info';
import PauseCircleOutline from '@mui/icons-material/PauseCircleOutline';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TimesOneMobiledataIcon from '@mui/icons-material/TimesOneMobiledata';
import { red } from '@mui/material/colors';
import { useNavigate } from 'react-router-dom';
import ConfirmationDialog from '../common/ConfirmationDialog';
import JobStatus from '../common/JobStatus';
import TextTruncate from '../common/TextTruncate';
import PageEntityRender from '../renders/PageEntityRender';
import { ActionContext } from './ActionProvider';

const pageIndexStorageKey = "action-manager-action-job-table-page-index"
const pageSizeStorageKey = "action-manager-action-job-table-page-size"

export default function ActionJobTable(props: any) {

    const selectedJob = useRef({ jobName: '', jobId: '' })
    const { setNumberOfFailureJobs } = React.useContext(ActionContext)
    const navigate = useNavigate()
    const actionId = props.actionId
    const setCircleProcessOpen = props.setCircleProcessOpen
    const replayFlag = props.replayFlag;
    const [internalReload, setInternalReload] = React.useState(false)
    let initialPagingResult: PagingResult = { totalElements: 0, content: [] }
    const [pagingResult, setPagingResult] = React.useState(initialPagingResult)
    const [pageIndex, setPageIndex] = React.useState(LocalStorageService.getOrDefault(pageIndexStorageKey, 0))
    const [pageSize, setPageSize] = React.useState(LocalStorageService.getOrDefault(pageSizeStorageKey, 10))
    const restClient = new RestClient(setCircleProcessOpen)
    const [deleteConfirmationDialogOpen, setDeleteConfirmationDialogOpen] = React.useState(false)

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
            align: 'right',
            actions: [
                {
                  actionIcon: <PlayCircleIcon/>,
                  visible: (row: any) => row.status === "PAUSED",
                  actionLabelContent: <Box sx={{ display: 'flex', alignItems: "center", flexDirection: 'row' }}>
                    <InfoIcon />
                    <p>Paused/Resume function only support for schedule jobs, <b>doesn't support for one time jobs</b></p>
                  </Box>,
                  actionLabel: "Resume",
                  actionName: "resumeAction",
                  onClick: (row: JobOverview) => () => {
                    JobAPI.resume(actionId, row.hash, row.name, restClient);
                    setInternalReload((previous: boolean) => !previous)
                  }
                },
                {
                  actionIcon: <PauseCircleOutline/>,
                  visible: (row: any) => row.status === "ACTIVE",
                  actionLabel: "Pause",
                  actionName: "pauseAction",
                  onClick: (row: JobOverview) => () => {
                    JobAPI.pause(row.hash, row.name, restClient);
                    setInternalReload((previous: boolean) => !previous)
                  }
                },
                {
                    actionIcon: <ContentCopyIcon />,
                    actionLabel: "Clone",
                    actionName: "cloneJob",
                    onClick: (row: JobOverview) => () => {
                        navigate("/actions/" + actionId + "/jobs/new", { state: { copyJobId: row.hash } })
                    }
                },
                {
                    actionIcon: <DeleteForeverIcon />,
                    properties: { sx: { color: red[800] } },
                    actionLabel: "Delete",
                    actionName: "deleteJob",
                    onClick: (row: JobOverview) => () => {
                        selectedJob.current = { jobName: row.name, jobId: row.hash }
                        setDeleteConfirmationDialogOpen(true)
                    }
                },
                {
                    actionIcon: <ReadMoreIcon />,
                    actionLabel: "Go to details",
                    actionName: "gotoActionDetail",
                    onClick: (row: JobOverview) => () => navigate(`/actions/${actionId}/jobs/${row.hash}`, { state: { name: row.name } })
                }
            ]
        }
    ];


    React.useEffect(() => {
        ActionAPI.loadRelatedJobsAsync(pageIndex, pageSize, actionId, restClient, (data) => {
            setPagingResult(data)
            const numberOfFailureJobs = data.content.filter(p => p.executionStatus === 'FAILURE').length
            setNumberOfFailureJobs(numberOfFailureJobs)
        });
    }, [replayFlag, internalReload])

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
            ActionAPI.loadRelatedJobsAsync(pageIndex, pageSize, actionId, restClient, (data) => {
                setPagingResult(data)
            });
        }
    }

    const onRowClickCallback = function (row: any) {
        navigate(`/actions/${actionId}/jobs/${row.hash}`, { state: { name: row.name } })
    }

    const onMouseWheelClick = function (row: any) {
        window.open(`/actions/${actionId}/jobs/${row.hash}`, '_blank')
    }

    let tableMetadata: TableMetadata = {
        columns,
        onRowClickCallback,
        onMouseWheelClick,
        pagingOptions: pagingOptions,
        pagingResult: pagingResult
    }

    let pageEntityMetadata: PageEntityMetadata = {
        pageName: 'action-job-summary',
        tableMetadata: tableMetadata
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
                ActionAPI.loadRelatedJobsAsync(pageIndex, pageSize, actionId, restClient, (data) => {
                    setPagingResult(data)
                    const numberOfFailureJobs = data.content.filter(p => p.executionStatus === 'FAILURE').length
                    setNumberOfFailureJobs(numberOfFailureJobs)
                });
            });
            setDeleteConfirmationDialogOpen(false);

        },
    }

    return (
        <Stack spacing={2}>
            <PageEntityRender {...pageEntityMetadata}></PageEntityRender>
            <ConfirmationDialog {...confirmationDeleteDialogMeta}></ConfirmationDialog>
        </Stack>
    );
}