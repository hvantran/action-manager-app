import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  EntityDetailTemplate,
  ConfirmationDialog,
  DataTable,
  JobStatusBadge,
  TextTruncate,
  PropertyMetadata,
  PropType,
  GenericActionMetadata,
  ColumnMetadata,
  PagingResult,
} from '@hvantran/ui-component-library';
import {
  Edit2,
  Save,
  Trash2,
  RefreshCw,
  PlusCircle,
  Download,
  Archive,
  Clock,
  Zap,
  Play,
  Pause,
  Copy,
  Eye,
  List,
} from 'lucide-react';
import {
  ActionAPI,
  ActionDetails,
  JobAPI,
  JobOverview,
  ACTION_STATUS_SELECTION,
  ROOT_BREADCRUMB,
} from '../AppConstants';
import { DataTypeDisplayer, RestClient } from '../GenericConstants';

export default function ActionDetail() {
  const navigate = useNavigate();
  const targetAction = useParams();
  const actionId = targetAction.actionId;

  if (!actionId) {
    throw new Error('Action is required');
  }

  const actionNameRef = useRef('');
  const [isEditing, setIsEditing] = useState(false);
  const [processTracking, setCircleProcessOpen] = useState(false);
  const [deleteConfirmationDialogOpen, setDeleteConfirmationDialogOpen] = useState(false);

  // Job table state
  const [jobPageIndex, setJobPageIndex] = useState(0);
  const [jobPageSize, setJobPageSize] = useState(10);
  const [jobOrderBy, setJobOrderBy] = useState('-startedAt');
  const [jobSearchText, setJobSearchText] = useState('');
  const [jobPagingResult, setJobPagingResult] = useState<PagingResult>({
    totalElements: 0,
    content: [],
  });
  const [jobProcessTracking, setJobProcessTracking] = useState(false);
  const [deleteJobDialogOpen, setDeleteJobDialogOpen] = useState(false);
  const selectedJob = useRef({ jobId: '', jobName: '' });

  const restClient = useMemo(() => new RestClient(setCircleProcessOpen), [setCircleProcessOpen]);
  const jobRestClient = useMemo(
    () => new RestClient(setJobProcessTracking),
    [setJobProcessTracking]
  );

  const [properties, setProperties] = useState<PropertyMetadata[]>([
    {
      propName: 'actionName',
      propLabel: 'Name',
      propValue: '',
      isRequired: true,
      disabled: true,
      colSpan: 6,
      propType: PropType.InputText,
    },
    {
      propName: 'actionStatus',
      propLabel: 'Status',
      propValue: 'INITIAL',
      isRequired: true,
      disabled: true,
      colSpan: 6,
      propType: PropType.Selection,
      selectionMeta: {
        selections: ACTION_STATUS_SELECTION,
      },
    },
    {
      propName: 'actionConfigurations',
      propLabel: 'Configurations (JSON)',
      isRequired: true,
      propValue: '{}',
      disabled: true,
      colSpan: 12,
      propType: PropType.CodeEditor,
      codeEditorMeta: {
        height: '350px',
        codeLanguages: ['json'],
      },
    },
  ]);

  const loadAction = useCallback(() => {
    ActionAPI.loadActionDetailAsync(actionId, restClient, (actionDetail: ActionDetails) => {
      actionNameRef.current = actionDetail.actionName || '';
      setProperties((prev) =>
        prev.map((p) => {
          const val = (actionDetail as any)[p.propName];
          return val !== undefined ? { ...p, propValue: val } : p;
        })
      );
    });
  }, [actionId, restClient]);

  const loadJobs = useCallback(() => {
    ActionAPI.loadRelatedJobsAsync(
      jobPageIndex,
      jobPageSize,
      jobOrderBy,
      actionId,
      jobRestClient,
      (data) => {
        setJobPagingResult(data);
      },
      jobSearchText
    );
  }, [actionId, jobPageIndex, jobPageSize, jobOrderBy, jobSearchText, jobRestClient]);

  useEffect(() => {
    loadAction();
  }, [loadAction]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handlePropertyChange = (propName: string, value: any) => {
    setProperties((prev) =>
      prev.map((p) => {
        if (p.propName === propName) {
          return { ...p, propValue: value };
        }
        return p;
      })
    );
  };

  const handleToggleEdit = () => {
    const nextEditing = !isEditing;
    setIsEditing(nextEditing);
    setProperties((prev) =>
      prev.map((p) => {
        if (p.propName === 'actionName') return p; // Name is read-only
        return { ...p, disabled: !nextEditing };
      })
    );
  };

  const handleSave = () => {
    ActionAPI.updateAction(actionId, restClient, properties as any, () => {
      handleToggleEdit();
      loadAction();
    });
  };

  const handleExport = () => {
    ActionAPI.export(actionId, actionNameRef.current, restClient);
  };

  const handleArchive = () => {
    ActionAPI.archive(actionId, restClient, () => {
      navigate('/actions');
    });
  };

  const breadcrumbs = [
    { label: ROOT_BREADCRUMB, href: '/actions' },
    { label: actionNameRef.current || actionId },
  ];

  const headerActions: GenericActionMetadata[] = [
    {
      actionName: 'refresh',
      actionLabel: 'Refresh',
      actionIcon: <RefreshCw className="w-4 h-4" />,
      onClick: () => {
        loadAction();
        loadJobs();
      },
    },
    {
      actionName: 'toggleEdit',
      actionLabel: isEditing ? 'Cancel Edit' : 'Edit',
      actionIcon: <Edit2 className="w-4 h-4" />,
      onClick: handleToggleEdit,
    },
  ];

  if (isEditing) {
    headerActions.push({
      actionName: 'save',
      actionLabel: 'Save Changes',
      actionIcon: <Save className="w-4 h-4 text-primary-600" />,
      onClick: handleSave,
    });
  }

  headerActions.push(
    {
      actionName: 'addJob',
      actionLabel: 'Add Job',
      actionIcon: <PlusCircle className="w-4 h-4 text-primary-600" />,
      onClick: () => navigate(`/actions/${actionId}/jobs/new`),
    },
    {
      actionName: 'export',
      actionLabel: 'Export Action',
      actionIcon: <Download className="w-4 h-4" />,
      onClick: handleExport,
    },
    {
      actionName: 'archive',
      actionLabel: 'Archive Action',
      actionIcon: <Archive className="w-4 h-4" />,
      onClick: handleArchive,
    },
    {
      actionName: 'delete',
      actionLabel: 'Delete Action',
      actionIcon: <Trash2 className="w-4 h-4 text-error-600" />,
      onClick: () => setDeleteConfirmationDialogOpen(true),
    }
  );

  const jobColumns: ColumnMetadata<JobOverview>[] = [
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
      minWidth: 160,
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
      label: 'Last Run',
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
      label: 'Actions',
      minWidth: 160,
      align: 'right',
      actions: [
        {
          actionIcon: <Play className="w-4 h-4 text-emerald-600" />,
          actionLabel: 'Resume Job',
          actionName: 'resumeJob',
          visible: (row: JobOverview) => row.status === 'PAUSED',
          onClick: (row: JobOverview) => () => {
            JobAPI.resume(actionId, row.hash, row.name, restClient).then(loadJobs);
          },
        },
        {
          actionIcon: <Pause className="w-4 h-4 text-amber-600" />,
          actionLabel: 'Pause Job',
          actionName: 'pauseJob',
          visible: (row: JobOverview) => row.status === 'ACTIVE',
          onClick: (row: JobOverview) => () => {
            JobAPI.pause(row.hash, row.name, restClient).then(loadJobs);
          },
        },
        {
          actionIcon: <Copy className="w-4 h-4 text-secondary-600" />,
          actionLabel: 'Clone Job',
          actionName: 'cloneJob',
          onClick: (row: JobOverview) => () => {
            navigate(`/actions/${actionId}/jobs/new`, { state: { copyJobId: row.hash } });
          },
        },
        {
          actionIcon: <Eye className="w-4 h-4 text-primary-600" />,
          actionLabel: 'Job Details',
          actionName: 'gotoJobDetail',
          onClick: (row: JobOverview) => () => {
            navigate(`/actions/${actionId}/jobs/${row.hash}`, { state: { name: row.name } });
          },
        },
        {
          actionIcon: <Trash2 className="w-4 h-4 text-error-600" />,
          actionLabel: 'Delete Job',
          actionName: 'deleteJob',
          onClick: (row: JobOverview) => () => {
            selectedJob.current = { jobId: row.hash, jobName: row.name };
            setDeleteJobDialogOpen(true);
          },
        },
      ],
    },
  ];

  return (
    <>
      <EntityDetailTemplate
        pageTitle={`Action: ${actionNameRef.current || actionId}`}
        breadcrumbs={breadcrumbs}
        headerActions={headerActions}
        properties={properties}
        onPropertyChange={handlePropertyChange}
        disabled={!isEditing}
      />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 font-sans -mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-secondary-900 dark:text-white flex items-center gap-2">
              <List className="w-5 h-5 text-primary-600" />
              Jobs in this Action
            </h2>
            <p className="text-xs text-secondary-500">
              Manage and monitor jobs linked to this action definition
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate(`/actions/${actionId}/jobs/new`)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-btn bg-primary-600 text-white hover:bg-primary-700 font-medium text-xs shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Job</span>
          </button>
        </div>

        <DataTable<JobOverview>
          name="Action Jobs"
          columns={jobColumns}
          keyColumn="hash"
          loading={jobProcessTracking}
          pagingResult={jobPagingResult}
          pagingOptions={{
            pageIndex: jobPageIndex,
            pageSize: jobPageSize,
            orderBy: jobOrderBy,
            searchText: jobSearchText,
            rowsPerPageOptions: [5, 10, 20, 50],
            onPageChange: (pIndex, pSize, pOrderBy, pSearch) => {
              setJobPageIndex(pIndex);
              setJobPageSize(pSize);
              setJobOrderBy(pOrderBy);
              setJobSearchText(pSearch);
            },
          }}
          visibleSearchbar={true}
          searchPlaceholder="Filter jobs..."
          onRowClickCallback={(row: JobOverview) =>
            navigate(`/actions/${actionId}/jobs/${row.hash}`, { state: { name: row.name } })
          }
        />
      </div>

      <ConfirmationDialog
        open={deleteConfirmationDialogOpen}
        title="Delete Action"
        content={
          <p>
            Are you sure you want to delete action <b>{actionNameRef.current}</b>?
          </p>
        }
        positiveText="Yes, Delete"
        negativeText="Cancel"
        negativeAction={() => setDeleteConfirmationDialogOpen(false)}
        positiveAction={() => {
          ActionAPI.deleteAction(actionId, restClient, () => {
            navigate('/actions');
          });
          setDeleteConfirmationDialogOpen(false);
        }}
      />

      <ConfirmationDialog
        open={deleteJobDialogOpen}
        title="Delete Job"
        content={
          <p>
            Are you sure you want to delete job <b>{selectedJob.current.jobName}</b>?
          </p>
        }
        positiveText="Yes, Delete"
        negativeText="Cancel"
        negativeAction={() => setDeleteJobDialogOpen(false)}
        positiveAction={() => {
          JobAPI.delete(selectedJob.current.jobId, selectedJob.current.jobName, restClient, () => {
            loadJobs();
          });
          setDeleteJobDialogOpen(false);
        }}
      />
    </>
  );
}
