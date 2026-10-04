import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EntitySummaryTemplate,
  ConfirmationDialog,
  ViewModeToggle,
  ColumnMetadata,
  GenericActionMetadata,
  SpeedDialActionMetadata,
  PagingResult,
} from '@hvantran/ui-component-library';
import {
  LayoutGrid,
  List,
  RefreshCw,
  PlusCircle,
  Eye,
  Trash2,
  Star,
  Download,
} from 'lucide-react';
import { ActionAPI, ActionOverview, ROOT_BREADCRUMB } from '../AppConstants';
import {
  DataTypeDisplayer,
  LocalStorageService,
  RestClient,
} from '../GenericConstants';
import BoardView from './BoardView';

const pageIndexStorageKey = 'action-manager-action-table-page-index';
const pageSizeStorageKey = 'action-manager-action-table-size';
const orderByStorageKey = 'action-manager-action-table-order';
const viewModeStorageKey = 'action-manager-view-mode';

export default function ActionSummary() {
  const navigate = useNavigate();
  const [processTracking, setCircleProcessOpen] = useState(false);
  const initialPagingResult: PagingResult<ActionOverview> = { totalElements: 0, content: [] };
  const [pagingResult, setPagingResult] = useState<PagingResult<ActionOverview>>(initialPagingResult);

  const [viewMode, setViewMode] = useState<'board' | 'list'>(
    (LocalStorageService.getOrDefault(viewModeStorageKey, 'board') as 'board' | 'list')
  );

  const [pageIndex, setPageIndex] = useState(
    parseInt(LocalStorageService.getOrDefault(pageIndexStorageKey, 0), 10)
  );
  const [pageSize, setPageSize] = useState(
    parseInt(LocalStorageService.getOrDefault(pageSizeStorageKey, 10), 10)
  );
  const [orderBy, setOrderBy] = useState(
    LocalStorageService.getOrDefault(orderByStorageKey, '-name')
  );
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const selectedAction = useRef<{ name: string; hash: string }>({ name: '', hash: '' });
  const [deleteConfirmationDialogOpen, setDeleteConfirmationDialogOpen] = useState(false);

  const restClient = useMemo(() => new RestClient(setCircleProcessOpen), [setCircleProcessOpen]);
  const boardRestClient = useMemo(() => new RestClient(() => {}), []);

  const handleViewModeChange = (mode: 'board' | 'list') => {
    setViewMode(mode);
    LocalStorageService.put(viewModeStorageKey, mode);
  };

  const loadActionList = () => {
    ActionAPI.loadActionSummarysAsync(
      pageIndex,
      pageSize,
      orderBy,
      restClient,
      (result) => {
        setPagingResult(result);
      }
    );
  };

  useEffect(() => {
    if (viewMode === 'list') {
      loadActionList();
    }
  }, [pageIndex, pageSize, orderBy, viewMode, refreshTrigger]);

  const breadcrumbs = [
    { label: ROOT_BREADCRUMB, href: '#' },
    { label: 'Summary' },
  ];

  const columns: ColumnMetadata<ActionOverview>[] = [
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
      minWidth: 150,
    },
    {
      id: 'status',
      label: 'Status',
      isSortable: true,
      minWidth: 100,
    },
    {
      id: 'numberOfJobs',
      label: 'Total Jobs',
      isSortable: true,
      minWidth: 90,
      align: 'center',
    },
    {
      id: 'numberOfSuccessJobs',
      label: 'Success',
      isSortable: true,
      minWidth: 90,
      align: 'center',
      renderCell: (row) => (
        <span className="text-emerald-600 font-semibold">{row.numberOfSuccessJobs}</span>
      ),
    },
    {
      id: 'numberOfFailureJobs',
      label: 'Failed',
      isSortable: true,
      minWidth: 90,
      align: 'center',
      renderCell: (row) => (
        <span className="text-red-600 font-semibold">{row.numberOfFailureJobs}</span>
      ),
    },
    {
      id: 'numberOfPendingJobs',
      label: 'Pending',
      isSortable: true,
      minWidth: 90,
      align: 'center',
      renderCell: (row) => (
        <span className="text-purple-600 font-semibold">{row.numberOfPendingJobs}</span>
      ),
    },
    {
      id: 'createdAt',
      label: 'Created At',
      isSortable: true,
      minWidth: 150,
      format: (val: number) => DataTypeDisplayer.formatDate(val),
    },
    {
      id: 'actions',
      label: '',
      minWidth: 120,
      align: 'right',
      actions: [
        {
          actionIcon: <Star className="w-4 h-4 text-amber-500" />,
          actionLabel: 'Toggle Favorite',
          actionName: 'toggleFavorite',
          onClick: (row: ActionOverview) => () => {
            ActionAPI.setFavoriteAction(row.hash, !row.isFavorite, restClient, () => {
              loadActionList();
            });
          },
        },
        {
          actionIcon: <Download className="w-4 h-4" />,
          actionLabel: 'Export Action',
          actionName: 'exportAction',
          onClick: (row: ActionOverview) => () => {
            ActionAPI.export(row.hash, row.name, restClient);
          },
        },
        {
          actionIcon: <Eye className="w-4 h-4" />,
          actionLabel: 'View details',
          actionName: 'viewDetails',
          onClick: (row: ActionOverview) => () => navigate(`/actions/${row.hash}`),
        },
        {
          actionIcon: <Trash2 className="w-4 h-4 text-error-600" />,
          actionLabel: 'Delete',
          actionName: 'deleteAction',
          onClick: (row: ActionOverview) => () => {
            selectedAction.current = { name: row.name, hash: row.hash };
            setDeleteConfirmationDialogOpen(true);
          },
        },
      ],
    },
  ];

  const viewModeToggleAction: GenericActionMetadata = {
    actionName: 'viewModeToggle',
    actionLabel: 'Toggle View Mode',
    actionIcon: (
      <ViewModeToggle<'board' | 'list'>
        mode={viewMode}
        modes={[
          { value: 'board', label: 'Board', icon: <LayoutGrid className="w-3.5 h-3.5 mr-1" /> },
          { value: 'list', label: 'List', icon: <List className="w-3.5 h-3.5 mr-1" /> },
        ]}
        onChange={handleViewModeChange}
        size="sm"
      />
    ),
    onClick: () => {},
  };

  const refreshAction: GenericActionMetadata = {
    actionName: 'refresh',
    actionLabel: 'Refresh',
    actionIcon: <RefreshCw className="w-4 h-4" />,
    onClick: () => {
      setRefreshTrigger((prev) => prev + 1);
      if (viewMode === 'list') {
        loadActionList();
      }
    },
  };

  const headerActions: GenericActionMetadata[] = [viewModeToggleAction, refreshAction];

  const floatingActions: SpeedDialActionMetadata[] = [
    {
      actionName: 'newAction',
      actionLabel: 'New Action',
      actionIcon: <PlusCircle className="w-5 h-5" />,
      onClick: () => navigate('/actions/new'),
    },
  ];

  return (
    <>
      {viewMode === 'board' ? (
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-secondary-500 mb-1">
                <span>{ROOT_BREADCRUMB}</span>
                <span>/</span>
                <span>Summary</span>
              </div>
              <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
                Action Status Monitor
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <ViewModeToggle<'board' | 'list'>
                mode={viewMode}
                modes={[
                  { value: 'board', label: 'Board', icon: <LayoutGrid className="w-3.5 h-3.5 mr-1" /> },
                  { value: 'list', label: 'List', icon: <List className="w-3.5 h-3.5 mr-1" /> },
                ]}
                onChange={handleViewModeChange}
                size="sm"
              />
              <button
                type="button"
                aria-label="Refresh board"
                onClick={() => setRefreshTrigger((prev) => prev + 1)}
                className="p-2 rounded-btn text-secondary-600 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/actions/new')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-btn bg-primary-600 text-white hover:bg-primary-700 font-medium text-xs shadow-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Action</span>
              </button>
            </div>
          </div>
          <BoardView
            restClient={boardRestClient}
            refreshTrigger={refreshTrigger}
            onStatusChange={() => setRefreshTrigger((prev) => prev + 1)}
          />
        </div>
      ) : (
        <EntitySummaryTemplate<ActionOverview>
          pageTitle="Action Summary"
          breadcrumbs={breadcrumbs}
          headerActions={headerActions}
          floatingActions={floatingActions}
          tableProps={{
            name: 'Action Overview',
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
            onRowClickCallback: (row: ActionOverview) => navigate(`/actions/${row.hash}`),
          }}
        />
      )}

      <ConfirmationDialog
        open={deleteConfirmationDialogOpen}
        title="Delete Action"
        content={
          <p>
            Are you sure you want to delete action <b>{selectedAction.current.name}</b>?
          </p>
        }
        positiveText="Yes, Delete"
        negativeText="Cancel"
        negativeAction={() => setDeleteConfirmationDialogOpen(false)}
        positiveAction={() => {
          ActionAPI.deleteAction(selectedAction.current.hash, restClient, () => {
            if (viewMode === 'list') {
              loadActionList();
            } else {
              setRefreshTrigger((prev) => prev + 1);
            }
          });
          setDeleteConfirmationDialogOpen(false);
        }}
      />
    </>
  );
}
