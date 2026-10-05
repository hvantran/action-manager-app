import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  JobDetailTemplate,
  ConfirmationDialog,
  PropertyMetadata,
  PropType,
  GenericActionMetadata,
} from '@hvantran/ui-component-library';
import {
  Edit2,
  Save,
  Trash2,
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  Wrench,
  ExternalLink,
} from 'lucide-react';
import {
  JobAPI,
  ActionAPI,
  JobDetailMetadata,
  TemplateAPI,
  TemplateOverview,
  JOB_CATEGORY_VALUES,
  JOB_OUTPUT_TARGET_VALUES,
  JOB_SCHEDULE_TIME_SELECTION,
  JOB_STATUS_SELECTION,
  ROOT_BREADCRUMB,
} from '../AppConstants';
import { RestClient } from '../GenericConstants';

export default function JobDetail() {
  const navigate = useNavigate();
  const targetJob = useParams();
  const jobId = targetJob.jobId;
  const actionId = targetJob.actionId || '';

  if (!jobId) {
    throw new Error('JobId is required');
  }

  const jobName = useRef('');
  const [isEditing, setIsEditing] = useState(false);
  const [isPausedJob, setIsPausedJob] = useState(false);
  const [processTracking, setCircleProcessOpen] = useState(false);
  const [deleteConfirmationDialogOpen, setDeleteConfirmationDialogOpen] = useState(false);

  const restClient = useMemo(() => new RestClient(setCircleProcessOpen), [setCircleProcessOpen]);

  const [properties, setProperties] = useState<PropertyMetadata[]>([
    {
      propName: 'name',
      propLabel: 'Name',
      propValue: '',
      isRequired: true,
      disabled: true,
      colSpan: 6,
      propType: PropType.InputText,
    },
    {
      propName: 'status',
      propLabel: 'Status',
      propValue: 'INITIAL',
      disabled: true,
      colSpan: 6,
      propType: PropType.Selection,
      selectionMeta: {
        selections: JOB_STATUS_SELECTION,
      },
    },
    {
      propName: 'isAsync',
      propLabel: 'Asynchronous Execution',
      propValue: false,
      disabled: true,
      colSpan: 6,
      propType: PropType.Switcher,
    },
    {
      propName: 'category',
      propLabel: 'Category',
      propValue: 'IO',
      disabled: true,
      colSpan: 6,
      propType: PropType.Selection,
      selectionMeta: {
        selections: JOB_CATEGORY_VALUES,
      },
    },
    {
      propName: 'isScheduled',
      propLabel: 'Scheduled Job',
      propValue: false,
      disabled: true,
      colSpan: 6,
      propType: PropType.Switcher,
    },
    {
      propName: 'scheduleInterval',
      propLabel: 'Schedule Period',
      propValue: 0,
      disabled: true,
      colSpan: 6,
      propType: PropType.Selection,
      selectionMeta: {
        selections: JOB_SCHEDULE_TIME_SELECTION,
      },
    },
    {
      propName: 'outputTargets',
      propLabel: 'Output Target',
      propValue: ['CONSOLE'],
      disabled: true,
      colSpan: 6,
      propType: PropType.Selection,
      selectionMeta: {
        selections: JOB_OUTPUT_TARGET_VALUES,
        isMultiple: true,
      },
    },
    {
      propName: 'description',
      propLabel: 'Description',
      propValue: '',
      disabled: true,
      colSpan: 12,
      propType: PropType.Textarea,
      textareaFieldMeta: {
        rows: 3,
        placeholder: 'Job description...',
      },
    },
    {
      propName: 'configurations',
      propLabel: 'Configurations (JSON)',
      isRequired: true,
      propValue: '{}',
      disabled: true,
      colSpan: 12,
      propType: PropType.CodeEditor,
      codeEditorMeta: {
        height: '150px',
        codeLanguages: ['json'],
      },
    },
    {
      propName: 'content',
      propLabel: 'Content Script (JavaScript)',
      isRequired: true,
      propValue: '',
      disabled: true,
      colSpan: 12,
      propType: PropType.CodeEditor,
      codeEditorMeta: {
        height: '400px',
        codeLanguages: ['javascript'],
      },
    },
  ]);

  const loadJob = () => {
    JobAPI.load(jobId, restClient, (jobDetail: JobDetailMetadata) => {
      jobName.current = jobDetail.name || '';
      setIsPausedJob(jobDetail.status === 'PAUSED');

      setProperties((prev) =>
        prev.map((p) => {
          const val = (jobDetail as any)[p.propName];
          return val !== undefined ? { ...p, propValue: val } : p;
        })
      );
    });
  };

  useEffect(() => {
    loadJob();
  }, [jobId]);

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
        if (p.propName === 'name') return p; // Name is read-only
        return { ...p, disabled: !nextEditing };
      })
    );
  };

  const handleSave = () => {
    JobAPI.update(jobId, restClient, properties as any, () => {
      handleToggleEdit();
      loadJob();
    });
  };

  const handlePauseResume = () => {
    if (isPausedJob) {
      setIsPausedJob(false);
      JobAPI.resume(actionId, jobId, jobName.current, restClient);
    } else {
      setIsPausedJob(true);
      JobAPI.pause(jobId, jobName.current, restClient);
    }
  };

  const breadcrumbs = [
    { label: ROOT_BREADCRUMB, href: '/actions' },
    { label: actionId || 'Action', href: `/actions/${actionId}` },
    { label: 'Jobs', href: '/jobs' },
    { label: jobName.current || jobId },
  ];

  const headerActions: GenericActionMetadata[] = [
    {
      actionName: 'refresh',
      actionLabel: 'Refresh',
      actionIcon: <RefreshCw className="w-4 h-4" />,
      onClick: loadJob,
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
      actionName: 'pauseResume',
      actionLabel: isPausedJob ? 'Resume Job' : 'Pause Job',
      actionIcon: isPausedJob ? (
        <Play className="w-4 h-4 text-success-600" />
      ) : (
        <Pause className="w-4 h-4 text-warning-600" />
      ),
      onClick: handlePauseResume,
    },
    {
      actionName: 'replay',
      actionLabel: 'Replay Job',
      actionIcon: <RotateCcw className="w-4 h-4" />,
      onClick: () => ActionAPI.replayJob(actionId, jobId, restClient),
    },
    {
      actionName: 'dryRun',
      actionLabel: 'Dry Run',
      actionIcon: <Wrench className="w-4 h-4" />,
      onClick: () => JobAPI.dryRun(restClient, properties as any, actionId),
    },
    {
      actionName: 'delete',
      actionLabel: 'Delete Job',
      actionIcon: <Trash2 className="w-4 h-4 text-error-600" />,
      onClick: () => setDeleteConfirmationDialogOpen(true),
    }
  );

  return (
    <>
      <JobDetailTemplate
        pageTitle={`Job: ${jobName.current || jobId}`}
        breadcrumbs={breadcrumbs}
        headerActions={headerActions}
        properties={properties}
        onPropertyChange={handlePropertyChange}
        disabled={!isEditing}
      />

      <ConfirmationDialog
        open={deleteConfirmationDialogOpen}
        title="Delete Job"
        content={
          <p>
            Are you sure you want to delete <b>{jobName.current}</b> job? This action cannot be undone.
          </p>
        }
        positiveText="Yes, Delete"
        negativeText="Cancel"
        negativeAction={() => setDeleteConfirmationDialogOpen(false)}
        positiveAction={() => {
          JobAPI.delete(jobId, jobName.current, restClient, () => {
            navigate(actionId ? `/actions/${actionId}` : '/jobs');
          });
          setDeleteConfirmationDialogOpen(false);
        }}
      />
    </>
  );
}
