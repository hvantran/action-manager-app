import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  EntityDetailTemplate,
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
  PlusCircle,
  Download,
  Archive,
} from 'lucide-react';
import {
  ActionAPI,
  ActionDetails,
  ACTION_STATUS_SELECTION,
  ROOT_BREADCRUMB,
} from '../AppConstants';
import { RestClient } from '../GenericConstants';

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

  const restClient = useMemo(() => new RestClient(setCircleProcessOpen), [setCircleProcessOpen]);

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

  const loadAction = () => {
    ActionAPI.loadActionDetailAsync(actionId, restClient, (actionDetail: ActionDetails) => {
      actionNameRef.current = actionDetail.actionName || '';
      setProperties((prev) =>
        prev.map((p) => {
          const val = (actionDetail as any)[p.propName];
          return val !== undefined ? { ...p, propValue: val } : p;
        })
      );
    });
  };

  useEffect(() => {
    loadAction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionId]);

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
      onClick: loadAction,
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
    </>
  );
}
