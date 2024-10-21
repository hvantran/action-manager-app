
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import PendingIcon from '@mui/icons-material/Pending';
import ReadMoreIcon from '@mui/icons-material/ReadMore';
import RefreshIcon from '@mui/icons-material/Refresh';
import ScheduleIcon from '@mui/icons-material/Schedule';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import { Badge, Box, IconButton, Stack } from '@mui/material';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { green, yellow } from '@mui/material/colors';
import React from 'react';
import {
  ColumnMetadata,
  DialogMetadata,
  LocalStorageService,
  PageEntityMetadata,
  PagingOptionMetadata,
  PagingResult,
  RestClient,
  SpeedDialActionMetadata,
  TableMetadata,
  WithLink
} from '../GenericConstants';
import ProcessTracking from '../common/ProcessTracking';

import { useNavigate } from 'react-router-dom';
import { ActionAPI, ActionOverview, ROOT_BREADCRUMB } from '../AppConstants';
import ConfirmationDialog from '../common/ConfirmationDialog';
import PageEntityRender from '../renders/PageEntityRender';


const pageIndexStorageKey = "action-manager-action-table-page-index"
const pageSizeStorageKey = "action-manager-action-table-page-size"
const orderByStorageKey = "action-manager-action-table-order"


export default function ActionSummary() {
  const navigate = useNavigate();
  const [processTracking, setCircleProcessOpen] = React.useState(false);
  let initialPagingResult: PagingResult = { totalElements: 0, content: [] };
  const [pagingResult, setPagingResult] = React.useState(initialPagingResult);
  const [pageIndex, setPageIndex] = React.useState(parseInt(LocalStorageService.getOrDefault(pageIndexStorageKey, 0)))
  const [pageSize, setPageSize] = React.useState(parseInt(LocalStorageService.getOrDefault(pageSizeStorageKey, 10)));
  const [orderBy, setOrderBy] = React.useState(LocalStorageService.getOrDefault(orderByStorageKey, '-name'));
  const restClient = React.useMemo(() =>  new RestClient(setCircleProcessOpen), [setCircleProcessOpen]);
  const [deleteConfirmationDialogOpen, setDeleteConfirmationDialogOpen] = React.useState(false);
  const [confirmationDialogContent, setConfirmationDialogContent] = React.useState(<p></p>);
  const [confirmationDialogTitle, setConfirmationDialogTitle] = React.useState("");
  const [confirmationDialogPositiveAction, setConfirmationDialogPositiveAction] = React.useState(() => () => { });

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

  const breadcrumbs = [
    <Link underline="hover" key="1" color="inherit" href='#'>
      {ROOT_BREADCRUMB}
    </Link>,
    <Typography key="3" color="text.primary">
      Summary
    </Typography>
  ];

  const columns: ColumnMetadata[] = [
    { 
      id: 'hash', 
      label: 'Hash', 
      minWidth: 100, 
      isHidden: true, 
      isKeyColumn: true 
    },
    { 
      id: 'name', 
      label: 'Name', 
      isSortable: true,
      minWidth: 100 
    },
    {
      id: 'status',
      label: 'Status',
      isSortable: true,
      minWidth: 50,
      align: 'left',
      format: (value: string) => value,
    },
    {
      id: 'createdAt',
      label: 'Created at',
      isSortable: true,
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
          <WarningAmberIcon color="error" />
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
      id: 'actions',
      label: '',
      align: 'right',
      actions: [
        {
          actionIcon: <StarBorderIcon />,
          properties: { sx: { color: yellow[800] } },
          actionLabel: "Favorite action",
          visible: (row: ActionOverview) => !row.isFavorite,
          actionName: "favoriteAction",
          onClick: (row: ActionOverview) => {
            return () => ActionAPI.setFavoriteAction(row.hash, true, restClient, () => {
              ActionAPI.loadActionSummarysAsync(pageIndex, pageSize, orderBy, restClient, (actionPagingResult) => setPagingResult(actionPagingResult));
            });
          }
        },
        {
          actionIcon: <StarIcon />,
          properties: { sx: { color: yellow[800] } },
          actionLabel: "Unfavorite action",
          visible: (row: ActionOverview) => row.isFavorite,
          actionName: "unFavoriteAction",
          onClick: (row: ActionOverview) => {
            return () => ActionAPI.setFavoriteAction(row.hash, false, restClient, () => {
              ActionAPI.loadActionSummarysAsync(pageIndex, pageSize, orderBy, restClient, (actionPagingResult) => setPagingResult(actionPagingResult));
            });
          }
        },
        {
          actionIcon: <ArchiveOutlinedIcon />,
          actionLabel: "Archive",
          actionName: "archive",
          onClick: (row: ActionOverview) => {
            return () => {

              setConfirmationDialogTitle("Archive")
              setConfirmationDialogContent(previous => <p>Are you sure you want to archive <b>{row.name}</b> action?</p>)
              setConfirmationDialogPositiveAction(previous => () => ActionAPI.archive(row.hash, restClient, () => {
                ActionAPI.loadActionSummarysAsync(pageIndex, pageSize, orderBy, restClient, (actionPagingResult) => setPagingResult(actionPagingResult));
                setDeleteConfirmationDialogOpen(previous => !previous);
              }))
              setDeleteConfirmationDialogOpen(previous => !previous)
            }
          }
        },
        {
          actionIcon: <FileDownloadOutlinedIcon />,
          actionLabel: "Export",
          actionName: "export",
          onClick: (row: ActionOverview) => {
            return () => {
              return ActionAPI.export(row.hash, row.name, restClient);
            }
          }
        },
        {
          actionIcon: <ReadMoreIcon />,
          actionLabel: "Action details",
          actionName: "gotoActionDetail",
          onClick: (row: ActionOverview) => {
            return () => navigate(`/actions/${row.hash}`)
          }
        }
      ]
    }
  ];

  React.useEffect(() => {
    ActionAPI.loadActionSummarysAsync(pageIndex, pageSize, orderBy, restClient, (actionPagingResult) => setPagingResult(actionPagingResult));
  }, [pageIndex, pageSize, orderBy, restClient])

  const actions: Array<SpeedDialActionMetadata> = [
    {
      actionIcon: WithLink('/actions/new', <AddCircleOutlineIcon />), actionName: 'create', actionLabel: 'New Action', properties: {
        sx: {
          bgcolor: green[500],
          '&:hover': {
            bgcolor: green[800],
          }
        }
      }
    }
  ];

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
      ActionAPI.loadActionSummarysAsync(pageIndex, pageSize, orderBy, restClient, (actionPagingResult) => setPagingResult(actionPagingResult))
    }
  }

  let tableMetadata: TableMetadata = {
    columns,
    name: 'Overview',
    onRowClickCallback: (row: ActionOverview) => navigate(`/actions/${row.hash}`),
    pagingOptions: pagingOptions,
    pagingResult: pagingResult
  }
  const importActionFunc = function (target: any) {
    let importAction = (document.getElementById("raised-button-file") as HTMLInputElement);
    if (importAction === null || importAction.files === null || importAction.files.length === 0) {
      return
    }
    let uploadFormData = new FormData()
    uploadFormData.append('file', importAction.files[0])
    ActionAPI.importFromFile(uploadFormData, restClient, (actionName) => {
      ActionAPI.loadActionSummarysAsync(pageIndex, pageSize, orderBy, restClient, (actionPagingResult) => setPagingResult(actionPagingResult));
    })
  }

  let pageEntityMetadata: PageEntityMetadata = {
    pageName: 'action-summary',
    floatingActions: actions,
    tableMetadata: tableMetadata,
    breadcumbsMeta: breadcrumbs,
    pageEntityActions: [
      {
        actionIcon: <Box><input
          id="raised-button-file"
          accept=".zip"
          hidden
          multiple
          onChange={importActionFunc}
          type="file"
        />
          <label htmlFor="raised-button-file">
            <IconButton component="span" color="primary">
              <FileUploadOutlinedIcon />
            </IconButton>
          </label>
        </Box>,
        actionLabel: "Import action",
        actionName: "importAction"
      },
      {
        actionIcon: <RefreshIcon />,
        actionLabel: "Refresh action",
        actionName: "refreshAction",
        onClick: () => ActionAPI.loadActionSummarysAsync(pageIndex, pageSize, orderBy, restClient, (actionPagingResult) => setPagingResult(actionPagingResult))
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