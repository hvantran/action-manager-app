import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Box,
  Divider,
  Grid,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import * as React from 'react';

import BreadcrumbsComponent from '../common/Breadcrumbs';
import FloatingSpeedDialButtons from '../common/FloatingActions';
import { PageEntityMetadata, PropertyMetadata, TableMetadata } from '../GenericConstants';

import PropertyRender from './PropertyRender';
import StepperRender from './StepperRender';
import TableRender from './TableRender';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box className="px-1 py-5 md:px-2" sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const renderProperties = (
  pageName: string,
  propertiesMetadata: Array<PropertyMetadata>,
  tabId = ''
): React.ReactNode => {
  return (
    <Box key={pageName + tabId + '-properties'} className="rounded-[2rem] bg-white/80 shadow-sm ring-1 ring-slate-200/70">
      <Grid container spacing={2} sx={{ py: 1 }} className="px-2 md:px-4">
        {propertiesMetadata.map((propertyMeta, index) => {
          return (
            <PropertyRender key={`${propertyMeta.propName}-${index}`} property={propertyMeta} />
          );
        })}
      </Grid>
    </Box>
  );
};
export default function PageEntityRender(props: PageEntityMetadata) {
  const floatingActions = props.floatingActions;
  const stepMetadatas = props.stepMetadatas;
  const tableMetadata = props.tableMetadata;
  const breadcrumbsMetadata = props.breadcumbsMeta;
  const propertiesMetadata = props.properties;
  const pageEntityActions = props.pageEntityActions;
  const pageName = props.pageName;
  const tabMetadatas = props.tabMetadata;
  const pageTitle = props.pageTitle;

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [currentTabIndex, setCurrentTabIndex] = React.useState(0);
  const open = Boolean(anchorEl);

  const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTabIndex(newValue);
  };

  const nodes: Array<React.ReactNode> = [];
  const gridItems: Array<React.ReactNode> = [];
  if (breadcrumbsMetadata && pageEntityActions) {
    const secondaryActions = pageEntityActions.filter((p) => p.isSecondary);
    const primaryActions = pageEntityActions.filter((p) => !p.isSecondary);
    gridItems.push(
      <Grid item key="grid-breadcrumbs" xs={12} md={6} sx={{ marginTop: 2, px: 3 }}>
        <BreadcrumbsComponent breadcrumbs={breadcrumbsMetadata} />
      </Grid>
    );
    gridItems.push(
      <Grid item key="grid-actions" xs={12} md={6} sx={{ marginTop: 2, px: 3 }}>
        <Box
          display="flex"
          key={pageName + '-box-actions'}
          justifyContent="flex-end"
          className="flex-wrap gap-2"
        >
          {primaryActions.map((action) => {
            return (
              ((action.visible === true || action.visible === undefined) && (
                <IconButton
                  key={action.actionName}
                  onClick={action.onClick}
                  aria-label={action.actionLabel}
                  color="primary"
                  component="label"
                  {...action.properties}
                  disabled={action.disable}
                  className="rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <Tooltip
                    title={
                      <>
                        {action.actionLabel}
                        {action.actionLabelContent ? action.actionLabelContent : ''}
                      </>
                    }
                  >
                    {action.actionIcon}
                  </Tooltip>
                </IconButton>
              )) || <></>
            );
          })}
          {secondaryActions.length ? (
            <>
              <IconButton
                aria-label="more"
                id="long-button"
                aria-controls={open ? 'long-menu' : undefined}
                aria-expanded={open ? 'true' : undefined}
                aria-haspopup="true"
                onClick={(event) => setAnchorEl(event.currentTarget)}
                className="rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <MoreVertIcon />
              </IconButton>
              <Menu
                id="long-menu"
                MenuListProps={{
                  'aria-labelledby': 'long-button',
                }}
                anchorEl={anchorEl}
                open={open}
                onClose={() => setAnchorEl(null)}
                PaperProps={{
                  className: 'rounded-2xl border border-slate-200 bg-white shadow-xl',
                }}
              >
                {secondaryActions.map((action) => (
                  <MenuItem
                    key={action.actionName}
                    disabled={action.disable}
                    className="gap-2"
                    onClick={() => {
                      action.onClick && action.onClick();
                      setAnchorEl(null);
                    }}
                  >
                    <Box
                      sx={{ backgroundColor: 'background.default' }}
                      paddingRight={5}
                      className="flex items-center gap-2 bg-transparent"
                    >
                      <IconButton
                        sx={{ paddingRight: 4 }}
                        key={action.actionName}
                        aria-label={action.actionLabel}
                        color="primary"
                        disableRipple={true}
                        component="label"
                        {...action.properties}
                        disabled={action.disable}
                        className="rounded-full text-slate-700"
                      >
                        <Tooltip
                          title={
                            <>
                              {action.actionLabel}
                              {action.actionLabelContent ? action.actionLabelContent : ''}
                            </>
                          }
                        >
                          {action.actionIcon}
                        </Tooltip>
                      </IconButton>
                      {action.actionLabel}
                    </Box>
                  </MenuItem>
                ))}
              </Menu>
            </>
          ) : (
            ''
          )}
        </Box>
      </Grid>
    );
    gridItems.push(
      <Grid item key="grid-line" xs={12}>
        <Divider />
      </Grid>
    );
    {
      pageTitle &&
        gridItems.push(
          <Grid item key="grid-heading" xs={12} sx={{ px: 3, pt: 2 }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600, mt: 1 }}>
              {pageTitle}
            </Typography>
          </Grid>
        );
    }
  } else if (breadcrumbsMetadata) {
    gridItems.push(
      <Grid item key="grid-breadcrumbs" xs={12} sx={{ marginTop: 2, px: 3 }}>
        <BreadcrumbsComponent breadcrumbs={breadcrumbsMetadata} />
      </Grid>
    );
    gridItems.push(
      <Grid item key="grid-line" xs={12}>
        <Divider />
      </Grid>
    );
    {
      pageTitle &&
        gridItems.push(
          <Grid item key="grid-heading" xs={12} sx={{ px: 3, pt: 2 }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600, mt: 1 }}>
              {pageTitle}
            </Typography>
          </Grid>
        );
    }
  } else if (pageEntityActions) {
    gridItems.push(
      <Grid item xs={12} key="grid-actions" justifyContent="flex-end">
        <Box
          display="flex"
          key={pageName + '-box-actions'}
          justifyContent="flex-end"
          className="flex-wrap gap-2"
        >
          {pageEntityActions.map((action) => {
            return (
              ((action.visible === true || action.visible === undefined) && (
                <IconButton
                  key={action.actionName}
                  onClick={action.onClick}
                  aria-label={action.actionLabel}
                  color="primary"
                  component="label"
                  {...action.properties}
                  disabled={action.disable}
                  className="rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  <Tooltip title={action.actionLabel}>{action.actionIcon}</Tooltip>
                </IconButton>
              )) || <></>
            );
          })}
        </Box>
      </Grid>
    );
    gridItems.push(
      <Grid key="line" item xs={12}>
        <Divider />
      </Grid>
    );
  }
  if (gridItems.length > 1) {
    nodes.push(
      <Grid container key={pageName} spacing={2} className="rounded-[2rem] bg-slate-50/90 pb-4 shadow-sm ring-1 ring-slate-200/70">
        {gridItems}
      </Grid>
    );
  }
  if (tabMetadatas) {
    nodes.push(
      <Box
        sx={{ backgroundColor: 'background.default', width: '100%' }}
        className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-slate-200/70"
      >
        <Box
          sx={{ borderBottom: 1, backgroundColor: 'background.default', borderColor: 'divider' }}
          className="border-b border-slate-200 bg-slate-50"
        >
          <Tabs
            value={currentTabIndex}
            onChange={handleChangeTab}
            textColor="primary"
            indicatorColor="primary"
            aria-label="primary tabs"
            variant="scrollable"
            scrollButtons="auto"
            className="px-2 md:px-4"
            sx={{
              '& .MuiTabs-indicator': {
                height: 3,
                borderRadius: 9999,
                backgroundColor: '#f59e0b',
              },
              '& .MuiTab-root': {
                minHeight: 64,
                textTransform: 'none',
                fontWeight: 600,
                color: '#64748b',
              },
              '& .Mui-selected': {
                color: '#0f172a',
              },
            }}
          >
            {tabMetadatas.map((tabMetadata, index) => {
              return (
                <Tab
                  key={tabMetadata.name}
                  label={tabMetadata.name}
                  {...{
                    id: `simple-tab-${index}`,
                    'aria-controls': `simple-tabpanel-${index}`,
                  }}
                />
              );
            })}
          </Tabs>
        </Box>

        {tabMetadatas.map((tabMetadata, index) => {
          const tableMetadata: TableMetadata | undefined = tabMetadata.tableMetadata;
          const propertyMetadata: Array<PropertyMetadata> | undefined = tabMetadata.properties;
          return (
            <CustomTabPanel key={tabMetadata.name} value={currentTabIndex} index={index}>
              {tableMetadata ? (
                <TableRender key={pageName + tabMetadata.name + '-table'} {...tableMetadata} />
              ) : (
                <></>
              )}
              {propertyMetadata ? (
                renderProperties(pageName, propertyMetadata, tabMetadata.name)
              ) : (
                <></>
              )}
            </CustomTabPanel>
          );
        })}
      </Box>
    );
  }
  if (propertiesMetadata) {
    nodes.push(renderProperties(pageName, propertiesMetadata));
  }
  if (floatingActions) {
    nodes.push(
      <FloatingSpeedDialButtons key={pageName + '-floating-actions'} actions={floatingActions} />
    );
  }

  if (stepMetadatas) {
    nodes.push(
      <StepperRender key={pageName + '-step-render'} initialStepMetadata={stepMetadatas} />
    );
  }

  if (tableMetadata) {
    nodes.push(<TableRender key={pageName + '-table'} {...tableMetadata} />);
  }

  return (
    <Stack
      spacing={3}
      sx={{ backgroundColor: 'background.default', px: 2, py: 2 }}
      className="bg-gradient-to-b from-slate-50 via-white to-amber-50/40"
    >
      {nodes}
    </Stack>
  );
}
