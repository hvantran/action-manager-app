
import { Stack } from '@mui/material';
import React from 'react';
import {
    ColumnMetadata, PageEntityMetadata, PagingOptionMetadata,
    PagingResult, RestClient,
    TableMetadata
} from '../GenericConstants';


import ReadMoreIcon from '@mui/icons-material/ReadMore';
import ScheduleIcon from '@mui/icons-material/Schedule';
import TimesOneMobiledataIcon from '@mui/icons-material/TimesOneMobiledata';
import { useNavigate } from 'react-router-dom';
import { ActionAPI, JobOverview } from '../AppConstants';
import JobStatus from '../common/JobStatus';
import TextTruncate from '../common/TextTruncate';
import PageEntityRender from '../renders/PageEntityRender';
import { ActionContext } from './ActionProvider';


export default function ActionJobTable(props: any) {

    const { setNumberOfFailureJobs } = React.useContext(ActionContext)
    const navigate = useNavigate()
    const targetAction = props.actionId
    const setCircleProcessOpen = props.setCircleProcessOpen
    const replayFlag = props.replayFlag;
    let initialPagingResult: PagingResult = { totalElements: 0, content: [] }
    const [pagingResult, setPagingResult] = React.useState(initialPagingResult)
    const [pageIndex, setPageIndex] = React.useState(0)
    const [pageSize, setPageSize] = React.useState(10)
    const restClient = new RestClient(setCircleProcessOpen)

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
                    actionIcon: <ReadMoreIcon />,
                    actionLabel: "Action details",
                    actionName: "gotoActionDetail",
                    onClick: (row: JobOverview) => () => navigate(`/actions/${targetAction}/jobs/${row.hash}`, { state: { name: row.name } })
                }
            ]
        }
    ];


    React.useEffect(() => {
        ActionAPI.loadRelatedJobsAsync(pageIndex, pageSize, targetAction, restClient, (data) => {
            setPagingResult(data)
            const numberOfFailureJobs = data.content.filter(p => p.executionStatus === 'FAILURE').length
            setNumberOfFailureJobs(numberOfFailureJobs)
        });
    }, [replayFlag])

    let pagingOptions: PagingOptionMetadata = {
        pageIndex,
        component: 'div',
        pageSize,
        rowsPerPageOptions: [5, 10, 20],
        onPageChange: (pageIndex: number, pageSize: number) => {
            setPageIndex(pageIndex);
            setPageSize(pageSize);
            ActionAPI.loadRelatedJobsAsync(pageIndex, pageSize, targetAction, restClient, (data) => {
                setPagingResult(data)
            });
        }
    }

    let tableMetadata: TableMetadata = {
        columns,
        onRowClickCallback(row) {
            navigate(`/actions/${targetAction}/jobs/${row.hash}`, { state: { name: row.name } })
        },
        pagingOptions: pagingOptions,
        pagingResult: pagingResult
    }

    let pageEntityMetadata: PageEntityMetadata = {
        pageName: 'action-job-summary',
        tableMetadata: tableMetadata
    }

    return (
        <Stack spacing={2}>
            <PageEntityRender {...pageEntityMetadata}></PageEntityRender>
        </Stack>
    );
}