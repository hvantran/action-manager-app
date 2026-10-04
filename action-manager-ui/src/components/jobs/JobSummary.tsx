import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  EntitySummaryTemplate,
  ConfirmationDialog,
  JobStatusBadge,
  TextTruncate,
  ColumnMetadata,
  GenericActionMetadata,
  PagingResult,
} from '@hvantran/ui-component-library';
import { Trash2, Eye, RefreshCw, Clock, Zap, X } from 'lucide-react';
import { JobAPI, JobOverview } from '../AppConstants';
import {
  DataTypeDisplayer,
  LocalStorageService,
  RestClient,
} from '../GenericConstants';

const pageIndexStorageKey = 'action-manager-job-table-page-index';
const pageSizeStorageKey = 'action-manager-job-table-page-size';
const orderByStorageKey = 'action-manager-job-table-order';

export default function JobSummary() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get('status');
  const selectedJob = useRef({ jobName: '', jobId: '' });

  const [processTracking, setCircleProcessOpen] = useState(false);
  const initialPagingResult: PagingResult<JobOverview> = { totalElements: 0, content: [] };
  const [pagingResult, setPagingResult] = useState<PagingResult<JobOverview>>(initialPagingResult);

  const [pageIndex, setPageIndex] = useState(
    parseInt(LocalStorageService.getOrDefault(pageIndexStorageKey, 0), 10)
  );
  const [pageSize, setPageSize] = useState(
    parseInt(LocalStorageService.getOrDefault(pageSizeStorageKey, 10), 10)
  );
  const [orderBy, setOrderBy] = useState(
    LocalStorageService.getOrDefault(orderByStorageKey, '-updatedAt')
  );
  const [deleteConfirmationDialogOpen, setDeleteConfirmationDialogOpen] = useState(false);

  const restClient = useMemo(() => new RestClient(setCircleProcessOpen), [setCircleProcessOpen]);

  const clearFilter = () => {
    searchParams.delete('status');
    setSearchParams(searchParams);
    setPageIndex(0);
    LocalStorageService.put(pageIndexStorageKey, 0);
  };

  useEffect(() => {
    setPageIndex(0);
    LocalStorageService.put(pageIndexStorageKey, 0);
  }, [statusFilter]);

  const loadJobs = () => {
    JobAPI.loadRelatedJobsAsync(pageIndex, pageSize, orderBy, restClient, setPagingResult, statusFilter);
  };

  useEffect(() => {
    loadJobs();
  }, [pageIndex, pageSize, orderBy, statusFilter]);

  const breadcrumbs = [
    { label: 'Jobs', href: '#' },
    { label: 'Summary' },
  ];

  const columns: ColumnMetadata<JobOverview>[] = [
    {
      id: 'hash',
      label: 'Hash',
      isHidden: true,
      isKeyColumn: true,
    },
    {
      id: 'name',
      label: 'Name',
      isSortable: true,
      minWidth: 140,
    },
    {
      id: 'status',
      label: 'Status',
      isSortable: true,
      minWidth: 100,
    },
    {
      id: 'executionStatus',
      label: 'Execution Status',
      isSortable: true,
      minWidth: 140,
      renderCell: (row: JobOverview) => (
        <JobStatusBadge status={(row.executionStatus || 'PENDING') as any} />
      ),
    },
    {
      id: 'schedule',
      label: 'Type',
      isSortable: true,
      minWidth: 90,
      renderCell: (row: JobOverview) =>
        row.schedule ? (
          <span title="Scheduled Job" className="flex items-center gap-1 text-primary-600">
            <Clock className="w-4 h-4" />
            <span className="text-xs">Cron</span>
          </span>
        ) : (
          <span title="One-time Job" className="flex items-center gap-1 text-secondary-500">
            <Zap className="w-4 h-4" />
            <span className="text-xs">Once</span>
          </span>
        ),
    },
    {
      id: 'startedAt',
      label: 'Started At',
      isSortable: true,
      minWidth: 150,
      format: (val: number) => DataTypeDisplayer.formatDate(val),
    },
    {
      id: 'updatedAt',
      label: 'Updated At',
      isSortable: true,
      minWidth: 150,
      format: (val: number) => DataTypeDisplayer.formatDate(val),
    },
    {
      id: 'failureNotes',
      label: 'Failure Notes',
      minWidth: 180,
      renderCell: (row: JobOverview) =>
        row.failureNotes ? (
          <TextTruncate text={row.failureNotes} maxTextLength={60} tooltipVisiable={true} />
        ) : (
          <span className="text-secondary-400 text-xs">-</span>
        ),
    },
    {
      id: 'actions',
      label: '',
      minWidth: 80,
      align: 'right',
      actions: [
        {
          actionIcon: <Eye className="w-4 h-4" />,
          actionLabel: 'Job details',
          actionName: 'gotoJobDetail',
          onClick: (row: JobOverview) => () => {
            const targetUrl = row.actionHash
              ? `/actions/${row.actionHash}/jobs/${row.hash}`
              : `/jobs/${row.hash}`;
            navigate(targetUrl, {
              state: { name: row.name },
            });
          },
        },
        {
          actionIcon: <Trash2 className="w-4 h-4 text-error-600" />,
          actionLabel: 'Delete job',
          actionName: 'deleteAction',
          onClick: (row: JobOverview) => () => {
            selectedJob.current = { jobName: row.name, jobId: row.hash };
            setDeleteConfirmationDialogOpen(true);
          },
        },
      ],
    },
  ];

  const headerActions: GenericActionMetadata[] = [];
  if (statusFilter) {
    headerActions.push({
      actionName: 'clearFilter',
      actionLabel: `Filtered: ${statusFilter}`,
      actionIcon: (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
          Status: {statusFilter}
          <button
            type="button"
            onClick={clearFilter}
            className="hover:text-primary-900 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ),
      onClick: clearFilter,
    });
  }

  headerActions.push({
    actionIcon: <RefreshCw className="w-4 h-4" />,
    actionLabel: 'Refresh jobs',
    actionName: 'refreshAction',
    onClick: loadJobs,
  });

  return (
    <>
      <EntitySummaryTemplate<JobOverview>
        pageTitle="Job Summary"
        breadcrumbs={breadcrumbs}
        headerActions={headerActions}
        tableProps={{
          name: 'Job Overview',
          columns,
          keyColumn: 'hash',
          loading: processTracking,
          pagingResult,
          pagingOptions: {
            pageIndex,
            pageSize,
            orderBy,
            searchText: '',
            rowsPerPageOptions: [5, 10, 20],
            onPageChange: (pIndex, pSize, pOrderBy) => {
              setPageIndex(pIndex);
              setPageSize(pSize);
              setOrderBy(pOrderBy);
              LocalStorageService.put(pageIndexStorageKey, pIndex);
              LocalStorageService.put(pageSizeStorageKey, pSize);
              LocalStorageService.put(orderByStorageKey, pOrderBy);
            },
          },
          onRowClickCallback: (row: JobOverview) => {
            const targetUrl = row.actionHash
              ? `/actions/${row.actionHash}/jobs/${row.hash}`
              : `/jobs/${row.hash}`;
            navigate(targetUrl, {
              state: { name: row.name },
            });
          },
        }}
      />

      <ConfirmationDialog
        open={deleteConfirmationDialogOpen}
        title="Delete Job"
        content={
          <p>
            Are you sure you want to delete <b>{selectedJob.current.jobName}</b>?
          </p>
        }
        positiveText="Yes, Delete"
        negativeText="Cancel"
        negativeAction={() => setDeleteConfirmationDialogOpen(false)}
        positiveAction={() => {
          JobAPI.delete(selectedJob.current.jobId, selectedJob.current.jobName, restClient, () => {
            loadJobs();
          });
          setDeleteConfirmationDialogOpen(false);
        }}
      />
    </>
  );
}
