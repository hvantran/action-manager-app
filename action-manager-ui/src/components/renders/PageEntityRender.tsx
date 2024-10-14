import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Box, Divider, Grid, IconButton, Stack, Tab, Tabs, Tooltip } from '@mui/material';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import * as React from 'react';
import { PageEntityMetadata, PropertyMetadata, TableMetadata } from '../GenericConstants';
import BreadcrumbsComponent from '../common/Breadcrumbs';
import FloatingSpeedDialButtons from '../common/FloatingActions';
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
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

const renderProperties = (pageName: string, propertiesMetadata: Array<PropertyMetadata>, tabId = ''): React.ReactNode => {
    return (
        <Box key={pageName + tabId + "-properties"}>
            <Grid container spacing={2} sx={{ py: 1 }}>
                {propertiesMetadata
                    .map((propertyMeta, index) => {
                        return (
                            <PropertyRender key={`${propertyMeta.propName}-${index}`} property={propertyMeta} />
                        )
                    })}
            </Grid>
        </Box>
    )
}
export default function PageEntityRender(props: PageEntityMetadata) {
    let floatingActions = props.floatingActions
    let stepMetadatas = props.stepMetadatas
    let tableMetadata = props.tableMetadata
    let breadcrumbsMetadata = props.breadcumbsMeta
    let propertiesMetadata = props.properties
    let pageEntityActions = props.pageEntityActions
    let pageName = props.pageName
    let tabMetadatas = props.tabMetadata

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [currentTabIndex, setCurrentTabIndex] = React.useState(0);
    const open = Boolean(anchorEl);

    const handleChangeTab = (event: React.SyntheticEvent, newValue: number) => {
        setCurrentTabIndex(newValue);
    };


    let nodes: Array<React.ReactNode> = []
    let gridItems: Array<React.ReactNode> = [];
    if (breadcrumbsMetadata && pageEntityActions) {
        const secondaryActions = pageEntityActions.filter(p => p.isSecondary)
        const primaryActions = pageEntityActions.filter(p => !p.isSecondary)
        gridItems.push((<Grid item key="grid-breadcrumbs" xs={6}><BreadcrumbsComponent breadcrumbs={breadcrumbsMetadata} /></Grid>))
        gridItems.push((<Grid item key="grid-actions" xs={6} >
            <Box display="flex" key={pageName + "-box-actions"} justifyContent="flex-end" sx={{ px: 2 }}>
                {
                    primaryActions.map(action => {
                        return (action.visible === true || action.visible === undefined) && (
                            <IconButton
                                key={action.actionName}
                                onClick={action.onClick}
                                aria-label={action.actionLabel}
                                color="primary"
                                component="label"
                                {...action.properties}
                                disabled={action.disable}>
                                <Tooltip
                                    title={
                                        <>
                                            {action.actionLabel}
                                            {action.actionLabelContent ? (action.actionLabelContent) : ""
                                            }
                                        </>
                                    }>
                                    {action.actionIcon}
                                </Tooltip>
                            </IconButton>
                        ) || <></>;
                    })
                }
                {
                    secondaryActions.length ? (<>
                        <IconButton
                            aria-label="more"
                            id="long-button"
                            aria-controls={open ? 'long-menu' : undefined}
                            aria-expanded={open ? 'true' : undefined}
                            aria-haspopup="true"
                            onClick={(event) => setAnchorEl(event.currentTarget)}
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
                            onClose={() => setAnchorEl(null)}>

                            {
                                secondaryActions.map((action) => (
                                    <MenuItem key={action.actionName} disabled={action.disable} onClick={() => {
                                        action.onClick && action.onClick()
                                        setAnchorEl(null)
                                    }}>
                                        <Box paddingRight={5} >
                                            <IconButton sx={{ paddingRight: 4 }}
                                                key={action.actionName}
                                                aria-label={action.actionLabel}
                                                color="primary"
                                                disableRipple={true}
                                                component="label"
                                                {...action.properties}
                                                disabled={action.disable}>

                                                <Tooltip
                                                    title={
                                                        <>
                                                            {action.actionLabel}
                                                            {action.actionLabelContent ? (action.actionLabelContent) : ""
                                                            }
                                                        </>
                                                    }>
                                                    {action.actionIcon}
                                                </Tooltip>
                                            </IconButton>
                                            {action.actionLabel}
                                        </Box>
                                    </MenuItem>
                                ))
                            }
                        </Menu>
                    </>)
                        : ""
                }
            </Box>
        </Grid>))
        gridItems.push((<Grid item key="grid-line" xs={12}><Divider /></Grid>))
    } else if (breadcrumbsMetadata) {
        gridItems.push((<Grid item key="grid-breadcrumbs" xs={12}><BreadcrumbsComponent breadcrumbs={breadcrumbsMetadata} /></Grid>))
        gridItems.push((<Grid item key="grid-line" xs={12}><Divider /></Grid>))
    } else if (pageEntityActions) {
        gridItems.push((<Grid item xs={12} key="grid-actions" justifyContent="flex-end">
            <Box display="flex" key={pageName + "-box-actions"} justifyContent="flex-end">{pageEntityActions.map(action => {
                return (action.visible === true || action.visible === undefined) && (
                    <IconButton
                        key={action.actionName}
                        onClick={action.onClick}
                        aria-label={action.actionLabel}
                        color="primary"
                        component="label"
                        {...action.properties}
                        disabled={action.disable}>
                        <Tooltip title={action.actionLabel}>
                            {action.actionIcon}
                        </Tooltip>
                    </IconButton>
                ) || <></>;
            })}</Box>
        </Grid>))
        gridItems.push((<Grid key="line" item xs={12}><Divider /></Grid>))
    }
    if (gridItems.length > 1) {
        nodes.push((<Grid container key={pageName} spacing={2}>{gridItems}</Grid>));
    }
    if (tabMetadatas) {
        nodes.push((
            <Box sx={{ width: '100%' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                        value={currentTabIndex}
                        onChange={handleChangeTab}
                        textColor="primary"
                        indicatorColor="primary"
                        aria-label="primary tabs"
                    >
                        {tabMetadatas
                            .map((tabMetadata, index) => {
                                return (
                                    <Tab label={tabMetadata.name} {... {
                                        id: `simple-tab-${index}`,
                                        'aria-controls': `simple-tabpanel-${index}`,
                                    }} />
                                )
                            })}
                    </Tabs>
                </Box>

                {tabMetadatas
                    .map((tabMetadata, index) => {
                        let tableMetadata: TableMetadata | undefined = tabMetadata.tableMetadata
                        let propertyMetadata: Array<PropertyMetadata> | undefined = tabMetadata.properties
                        return (
                            <CustomTabPanel value={currentTabIndex} index={index}>
                                {tableMetadata ? <TableRender key={pageName + tabMetadata.name + '-table'} {...tableMetadata} /> : <></>}
                                {propertyMetadata ? renderProperties(pageName, propertyMetadata, tabMetadata.name) : <></>}
                            </CustomTabPanel>
                        )
                    })}
            </Box>
        ))
    }
    if (propertiesMetadata) {
        nodes.push(renderProperties(pageName, propertiesMetadata))
    }
    if (floatingActions) {
        nodes.push(<FloatingSpeedDialButtons key={pageName + '-floating-actions'} actions={floatingActions} />)
    }

    if (stepMetadatas) {
        nodes.push(<StepperRender key={pageName + '-step-render'} initialStepMetadata={stepMetadatas} />)
    }

    if (tableMetadata) {
        nodes.push(<TableRender key={pageName + '-table'} {...tableMetadata} />)
    }

    return (
        <Stack spacing={1} sx={{ px: 2 }}>
            {nodes}
        </Stack>
    )
}
