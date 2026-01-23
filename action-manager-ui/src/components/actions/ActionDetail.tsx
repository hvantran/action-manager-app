import { json } from '@codemirror/lang-json';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import InfoIcon from '@mui/icons-material/Info';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import ReplayIcon from '@mui/icons-material/Replay';
import SaveIcon from '@mui/icons-material/Save';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import Badge, { BadgeProps } from '@mui/material/Badge';
import { green, yellow } from '@mui/material/colors';
import Link from '@mui/material/Link';
import { styled, useTheme } from '@mui/material/styles';
import React, { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import {
  ACTION_STATUS_SELECTION,
  ActionAPI,
  ActionDetails,
  ROOT_BREADCRUMB,
  isAllDependOnPropsValid,
} from '../AppConstants';
import ConfirmationDialog from '../common/ConfirmationDialog';
import { Search, SearchIconWrapper, StyledInputBase } from '../common/GenericComponent';
import ProcessTracking from '../common/ProcessTracking';
import {
  DialogMetadata,
  GenericActionMetadata,
  PageEntityMetadata,
  PropType,
  PropertyMetadata,
  RestClient,
  onChangeProperty,
} from '../GenericConstants';

import ActionJobTable from './ActionJobTable';
import { ActionProvider } from './ActionProvider';

const StyledBadge = styled(Badge)<BadgeProps>(({ theme }) => ({
  '& .MuiBadge-badge': {
    border: `2px solid ${theme.palette.background.paper}`,
    padding: '0 4px',
  },
}));

const StatusChip = styled(Chip)(({ theme }) => ({
  fontWeight: 'bold',
  textTransform: 'uppercase',
  fontSize: '0.7rem',
  height: '28px',
  '& .MuiChip-icon': {
    marginLeft: '8px',
  },
}));

const StatCard = styled(Card)(({ theme }) => ({
  height: '100%',
  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : 'rgb(248, 250, 252)',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const CodeBlock = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(2),
  fontFamily: 'monospace',
  fontSize: '0.875rem',
  overflowX: 'auto',
  position: 'relative',
  maxHeight: '200px',
  '& pre': {
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
}));

export default function ActionDetail() {
  const theme = useTheme();
  const targetAction = useParams();
  const navigate = useNavigate();
  const actionRef = useRef<ActionDetails>();
  const actionId: string | undefined = targetAction.actionId;
  if (!actionId) {
    throw new Error('Action is required');
  }

  const [processTracking, setCircleProcessOpen] = React.useState(false);
  const [deleteConfirmationDialogOpen, setDeleteConfirmationDialogOpen] = React.useState(false);
  const [confirmationDialogContent, setConfirmationDialogContent] = React.useState(<p></p>);
  const [confirmationDialogTitle, setConfirmationDialogTitle] = React.useState('');
  const [confirmationDialogPositiveAction, setConfirmationDialogPositiveAction] = React.useState(
    () => () => {}
  );
  const [replayFlag, setReplayActionFlag] = React.useState(false);
  const [configDialogOpen, setConfigDialogOpen] = React.useState(false);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const restClient = React.useMemo(
    () => new RestClient(setCircleProcessOpen),
    [setCircleProcessOpen]
  );
  const [numberOfFailureJobs, setNumberOfFailureJobs] = React.useState(0);
  const [actionStats, setActionStats] = React.useState({
    totalJobs: 0,
    successRate: 0,
    avgDuration: '0s',
    failures24h: 0,
  });
  const [jobSearchText, setJobSearchText] = React.useState('');

  const [propertyMetadata, setPropertyMetadata] = React.useState<Array<PropertyMetadata>>([
    {
      propName: 'actionName',
      propLabel: 'Name',
      propValue: '',
      isRequired: true,
      disabled: true,
      disablePerpetualy: true,
      propDescription: 'This is action name',
      propType: PropType.InputText,
      layoutProperties: { xs: 6, alignItems: 'center', justifyContent: 'center' },
      labelElementProperties: { xs: 2.5, sx: { pl: 5 } },
      valueElementProperties: { xs: 9.5 },
      textFieldMeta: {
        onChangeEvent: function (event: any) {
          const propValue = event.target.value;
          const propName = event.target.name;
          setPropertyMetadata(onChangeProperty(propName, propValue));
        },
      },
    },
    {
      propName: 'actionStatus',
      propLabel: 'Status',
      propValue: '',
      propDefaultValue: '',
      disabled: true,
      isRequired: true,
      layoutProperties: { xs: 6, alignItems: 'center', justifyContent: 'center' },
      labelElementProperties: { xs: 4, sx: { pl: 15 } },
      valueElementProperties: { xs: 8 },
      propDescription: 'This is status of action',
      propType: PropType.Selection,
      selectionMeta: {
        selections: ACTION_STATUS_SELECTION,
        onChangeEvent: function (event) {
          const propValue = event.target.value;
          const propName = event.target.name;
          setPropertyMetadata(onChangeProperty(propName, propValue));
        },
      },
    },
    {
      propName: 'actionConfigurations',
      propLabel: 'Configurations',
      propValue: '{}',
      propDefaultValue: '{}',
      disabled: true,
      layoutProperties: { xs: 12 },
      labelElementProperties: { xs: 1.2, sx: { pl: 5 } },
      valueElementProperties: { xs: 10.8 },
      isRequired: true,
      propType: PropType.CodeEditor,
      codeEditorMeta: {
        height: '100px',
        codeLanguges: [json()],
        onChangeEvent: function (propName) {
          return (value, _) => {
            const propValue = value;
            setPropertyMetadata(onChangeProperty(propName, propValue));
          };
        },
      },
    },
  ]);

  const getPropertyValue = (propName: string) => {
    const prop = propertyMetadata.find((p) => p.propName === propName);
    return prop?.propValue || '';
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return {
          color: theme.palette.success.main,
          bg: theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.3)' : 'rgba(46, 125, 50, 0.1)',
          border: theme.palette.success.light,
        };
      case 'PAUSED':
        return {
          color: theme.palette.warning.main,
          bg: theme.palette.mode === 'dark' ? 'rgba(237, 108, 2, 0.3)' : 'rgba(237, 108, 2, 0.1)',
          border: theme.palette.warning.light,
        };
      default:
        return {
          color: theme.palette.grey[600],
          bg: theme.palette.mode === 'dark' ? 'rgba(158, 158, 158, 0.3)' : 'rgba(158, 158, 158, 0.1)',
          border: theme.palette.grey[400],
        };
    }
  };

  React.useEffect(() => {
    ActionAPI.loadActionDetailAsync(actionId, restClient, (actionDetail: ActionDetails) => {
      actionRef.current = actionDetail;
      Object.keys(actionDetail).forEach((propertyName: string) => {
        setPropertyMetadata(
          onChangeProperty(propertyName, actionDetail[propertyName as keyof ActionDetails])
        );
      });

      // Calculate action statistics (mock data - replace with real API calls)
      // In a real scenario, this would come from the backend
      setActionStats({
        totalJobs: 13,
        successRate: 62,
        avgDuration: '5.4s',
        failures24h: numberOfFailureJobs,
      });
    });
  }, [actionId, numberOfFailureJobs]);

  const handleCopyJSON = async () => {
    try {
      const config = getPropertyValue('actionConfigurations') || '{}';
      const formattedJSON = JSON.stringify(JSON.parse(config), null, 2);
      await navigator.clipboard.writeText(formattedJSON);
      toast.success('Configuration copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy configuration');
      console.error('Copy failed:', error);
    }
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleArchive = () => {
    handleMenuClose();
    setConfirmationDialogTitle('Archive');
    setConfirmationDialogContent(
      <p>
        Are you sure you want to archive <b>{actionRef.current?.actionName}</b> action?
      </p>
    );
    setConfirmationDialogPositiveAction(
      () => () => ActionAPI.archive(actionId, restClient, () => navigate('/actions'))
    );
    setDeleteConfirmationDialogOpen(true);
  };

  const handleReplayAll = () => {
    handleMenuClose();
    ActionAPI.replayAction(actionId, restClient, () => setReplayActionFlag((prev) => !prev));
  };

  const handleReplayFailures = () => {
    handleMenuClose();
    if (numberOfFailureJobs > 0) {
      ActionAPI.replayFailures(actionId, restClient, () => setReplayActionFlag((prev) => !prev));
    }
  };

  const handleEditAction = () => {
    // Enable editing for configuration and status only
    setPropertyMetadata((prev) =>
      prev.map((prop) => {
        if (prop.propName === 'actionStatus' || prop.propName === 'actionConfigurations') {
          return { ...prop, disabled: false };
        }
        return prop;
      })
    );
    setEditDialogOpen(true);
  };

  const handleSaveAction = () => {
    ActionAPI.updateAction(actionId, restClient, propertyMetadata, () => {
      // Reload action details after save
      ActionAPI.loadActionDetailAsync(actionId, restClient, (actionDetail: ActionDetails) => {
        actionRef.current = actionDetail;
        Object.keys(actionDetail).forEach((propertyName: string) => {
          setPropertyMetadata(
            onChangeProperty(propertyName, actionDetail[propertyName as keyof ActionDetails])
          );
        });
      });
      // Re-disable fields and close dialog
      setPropertyMetadata((prev) =>
        prev.map((prop) => {
          if (prop.propName === 'actionStatus' || prop.propName === 'actionConfigurations') {
            return { ...prop, disabled: true };
          }
          return prop;
        })
      );
      setEditDialogOpen(false);
      toast.success('Action updated successfully!');
    });
  };

  const handleCancelEdit = () => {
    // Reload original values and re-disable fields
    ActionAPI.loadActionDetailAsync(actionId, restClient, (actionDetail: ActionDetails) => {
      Object.keys(actionDetail).forEach((propertyName: string) => {
        setPropertyMetadata(
          onChangeProperty(propertyName, actionDetail[propertyName as keyof ActionDetails])
        );
      });
    });
    setPropertyMetadata((prev) =>
      prev.map((prop) => {
        if (prop.propName === 'actionStatus' || prop.propName === 'actionConfigurations') {
          return { ...prop, disabled: true };
        }
        return prop;
      })
    );
    setEditDialogOpen(false);
  };

  const confirmationDeleteDialogMeta: DialogMetadata = {
    open: deleteConfirmationDialogOpen,
    title: confirmationDialogTitle,
    content: confirmationDialogContent,
    positiveText: 'Yes',
    negativeText: 'No',
    negativeAction() {
      setDeleteConfirmationDialogOpen(false);
    },
    positiveAction: confirmationDialogPositiveAction,
  };

  const actionStatus = getPropertyValue('actionStatus');
  const statusColors = getStatusColor(actionStatus);

  return (
    <ActionProvider setNumberOfFailureJobs={setNumberOfFailureJobs}>
      <Box sx={{ maxWidth: 1600, mx: 'auto', p: 3 }}>
        {/* Breadcrumb and Actions Bar */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
            <Link underline="hover" color="inherit" href="/actions" sx={{ fontSize: '0.875rem' }}>
              {ROOT_BREADCRUMB}
            </Link>
            <Typography sx={{ fontSize: '0.875rem' }}>/</Typography>
            <Typography color="text.primary" sx={{ fontSize: '0.875rem', fontWeight: 500 }}>
              {actionId}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Edit action">
            <IconButton
              size="small"
              onClick={handleEditAction}
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
              title="Edit Action"
            >
              <EditIcon fontSize="small" />
            </IconButton>
            </Tooltip>
            <Tooltip title="Copy JSON">
            <IconButton
              size="small"
              onClick={handleCopyJSON}
              sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
            </Tooltip>
            <Tooltip title="Refresh action">
            <IconButton
              size="small"
              onClick={() => {
                ActionAPI.loadActionDetailAsync(actionId, restClient, (actionDetail: ActionDetails) => {
                  Object.keys(actionDetail).forEach((propertyName: string) => {
                    setPropertyMetadata(
                      onChangeProperty(propertyName, actionDetail[propertyName as keyof ActionDetails])
                    );
                  });
                  setReplayActionFlag((prev) => !prev);
                }}
                aria-label="Refresh action"
                sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="More options">
              <IconButton
                size="small"
                onClick={(e) => setAnchorEl(e.currentTarget)}
                aria-label="More options"
                sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Menu anchorEl={anchorEl} open={menuOpen} onClose={handleMenuClose}>
              <MenuItem onClick={handleArchive}>
                <ArchiveOutlinedIcon sx={{ mr: 2, color: 'primary.main' }} />
                Archive
              </MenuItem>
              <MenuItem onClick={handleReplayAll}>
                <ReplayIcon sx={{ mr: 2, color: 'primary.main' }} />
                Replay all
              </MenuItem>
              <MenuItem onClick={handleReplayFailures} disabled={numberOfFailureJobs === 0}>
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <StyledBadge color="error" badgeContent={numberOfFailureJobs} showZero sx={{ mr: 2 }}>
                    <ReplayIcon sx={{ color: 'primary.main' }} />
                  </StyledBadge>
                  Replay failures
                </Box>
              </MenuItem>
            </Menu>
            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => navigate(`/actions/${actionId}/jobs/new`)}
              sx={{ 
                ml: 1,
                bgcolor: '#1976d2',
                '&:hover': {
                  bgcolor: '#1565c0',
                },
              }}
            >
              New Job
            </Button>
          </Box>
        </Box>

        {/* Main Content Grid */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* Left Column - Action Details */}
          <Grid item xs={12} lg={8}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                {/* Action Name and Status */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3 }}>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        color: 'text.secondary',
                        fontSize: '0.625rem',
                        letterSpacing: 1.2,
                      }}
                    >
                      Action Name
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600, mt: 0.5 }}>
                      {getPropertyValue('actionName')}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography
                      variant="caption"
                      sx={{
                        textTransform: 'uppercase',
                        fontWeight: 700,
                        color: 'text.secondary',
                        fontSize: '0.625rem',
                        letterSpacing: 1.2,
                      }}
                    >
                      Status
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <StatusChip
                        label={actionStatus}
                        icon={
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: statusColors.color,
                              animation: actionStatus === 'ACTIVE' ? 'pulse 2s infinite' : 'none',
                              '@keyframes pulse': {
                                '0%, 100%': { opacity: 1 },
                                '50%': { opacity: 0.5 },
                              },
                            }}
                          />
                        }
                        sx={{
                          bgcolor: statusColors.bg,
                          color: statusColors.color,
                          border: `1px solid ${statusColors.border}`,
                        }}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Configuration Section */}
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SettingsIcon sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Configuration
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        startIcon={<ContentCopyIcon />}
                        onClick={handleCopyJSON}
                        sx={{ fontSize: '0.75rem', textTransform: 'none' }}
                      >
                        Copy JSON
                      </Button>
                      <Button
                        size="small"
                        startIcon={<FullscreenIcon />}
                        onClick={() => setConfigDialogOpen(true)}
                        sx={{ fontSize: '0.75rem', textTransform: 'none' }}
                      >
                        Expand
                      </Button>
                    </Box>
                  </Box>
                  <CodeBlock>
                    <pre>{JSON.stringify(JSON.parse(getPropertyValue('actionConfigurations') || '{}'), null, 2)}</pre>
                  </CodeBlock>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - Action Summary */}
          <Grid item xs={12} lg={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                  Action Summary
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3, flex: 1 }}>
                  <Grid item xs={6}>
                    <StatCard>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          Total Jobs
                        </Typography>
                        <Typography sx={{ fontWeight: 600, mt: 0.5, color: 'text.primary', fontSize: '1.5rem' }}>
                          {actionStats.totalJobs}
                        </Typography>
                      </CardContent>
                    </StatCard>
                  </Grid>
                  <Grid item xs={6}>
                    <StatCard>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          Success Rate
                        </Typography>
                        <Typography sx={{ fontWeight: 600, mt: 0.5, color: '#4ade80', fontSize: '1.5rem' }}>
                          {actionStats.successRate}%
                        </Typography>
                      </CardContent>
                    </StatCard>
                  </Grid>
                  <Grid item xs={6}>
                    <StatCard>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          Avg Duration
                        </Typography>
                        <Typography sx={{ fontWeight: 600, mt: 0.5, color: 'text.primary', fontSize: '1.5rem' }}>
                          {actionStats.avgDuration}
                        </Typography>
                      </CardContent>
                    </StatCard>
                  </Grid>
                  <Grid item xs={6}>
                    <StatCard>
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                          Failures (24h)
                        </Typography>
                        <Typography sx={{ fontWeight: 600, mt: 0.5, color: '#f87171', fontSize: '1.5rem' }}>
                          {actionStats.failures24h}
                        </Typography>
                      </CardContent>
                    </StatCard>
                  </Grid>
                </Grid>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    mt: 'auto',
                    bgcolor: '#1a1a1a',
                    color: 'common.white',
                    '&:hover': {
                      bgcolor: '#2d2d2d',
                    },
                  }}
                >
                  Run All Enabled Jobs
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Job Table */}
        <Card>
          <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
              <FormatListBulletedIcon sx={{ color: 'primary.main' }} />
              Job Table
            </Typography>
            <Search>
              <SearchIconWrapper>
                <SearchIcon />
              </SearchIconWrapper>
              <StyledInputBase
                placeholder="Filter jobs..."
                inputProps={{ 'aria-label': 'search' }}
                value={jobSearchText}
                onChange={(e) => setJobSearchText(e.target.value)}
              />
            </Search>
          </Box>
          <ActionJobTable
            setCircleProcessOpen={setCircleProcessOpen}
            replayFlag={replayFlag}
            actionId={actionId}
            searchText={jobSearchText}
          />
        </Card>

        {/* Configuration Dialog */}
        <Dialog
          open={configDialogOpen}
          onClose={() => setConfigDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Action Configuration</Typography>
              <IconButton onClick={() => setConfigDialogOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box
              sx={{
                backgroundColor: theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                p: 2,
                maxHeight: '500px',
                overflow: 'auto',
              }}
            >
              <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '0.875rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {JSON.stringify(JSON.parse(getPropertyValue('actionConfigurations') || '{}'), null, 2)}
              </pre>
            </Box>
          </DialogContent>
        </Dialog>

        {/* Edit Action Dialog */}
        <Dialog
          open={editDialogOpen}
          onClose={handleCancelEdit}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">Edit Action</Typography>
              <IconButton onClick={handleCancelEdit} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                {propertyMetadata
                  .filter((prop) => prop.propName === 'actionStatus' || prop.propName === 'actionConfigurations')
                  .map((prop) => {
                    if (prop.propName === 'actionStatus') {
                      return (
                        <Grid item xs={12} key={prop.propName}>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                            Status
                          </Typography>
                          <FormControl fullWidth size="small">
                            <Select
                              value={prop.propValue || ''}
                              onChange={(e) => {
                                setPropertyMetadata(
                                  onChangeProperty(prop.propName, e.target.value)
                                );
                              }}
                            >
                              {ACTION_STATUS_SELECTION.map((option) => (
                                <MenuItem key={option.value} value={option.value}>
                                  {option.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                      );
                    }
                    if (prop.propName === 'actionConfigurations') {
                      return (
                        <Grid item xs={12} key={prop.propName}>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                            Configuration
                          </Typography>
                          <TextField
                            fullWidth
                            multiline
                            rows={12}
                            value={prop.propValue || '{}'}
                            onChange={(e) => {
                              setPropertyMetadata(onChangeProperty(prop.propName, e.target.value));
                            }}
                            placeholder="Enter JSON configuration"
                            variant="outlined"
                            sx={{
                              '& .MuiInputBase-root': {
                                fontFamily: 'monospace',
                                fontSize: '0.875rem',
                              },
                            }}
                          />
                        </Grid>
                      );
                    }
                    return null;
                  })}
              </Grid>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                <Button onClick={handleCancelEdit} variant="outlined">
                  Cancel
                </Button>
                <Button onClick={handleSaveAction} variant="contained" startIcon={<SaveIcon />}>
                  Save Changes
                </Button>
              </Box>
            </Box>
          </DialogContent>
        </Dialog>

        <ProcessTracking isLoading={processTracking} />
        <ConfirmationDialog {...confirmationDeleteDialogMeta} />
      </Box>
    </ActionProvider>
  );
}
