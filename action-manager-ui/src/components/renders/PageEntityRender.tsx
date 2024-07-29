import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Box, Divider, Grid, IconButton, Stack, Tooltip } from '@mui/material';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import * as React from 'react';
import { PageEntityMetadata } from '../GenericConstants';
import BreadcrumbsComponent from '../common/Breadcrumbs';
import FloatingSpeedDialButtons from '../common/FloatingActions';
import PropertyRender from './PropertyRender';
import StepperRender from './StepperRender';
import TableRender from './TableRender';

export default function PageEntityRender(props: PageEntityMetadata) {
    let floatingActions = props.floatingActions
    let stepMetadatas = props.stepMetadatas
    let tableMetadata = props.tableMetadata
    let breadcrumbsMetadata = props.breadcumbsMeta
    let propertiesMetadata = props.properties
    let pageEntityActions = props.pageEntityActions
    let pageName = props.pageName

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

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
                        return (action.visible==true || action.visible==undefined) && (
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
                return (action.visible==true || action.visible==undefined) && (
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
    nodes.push((<Grid container key={pageName} spacing={2}>{gridItems}</Grid>));
    if (propertiesMetadata) {
        nodes.push((
            <Box key={pageName + "-properties"}>
                <Grid container spacing={2} sx={{ py: 1 }}>
                    {propertiesMetadata
                        .map((propertyMeta, index) => {
                            return (
                                <PropertyRender key={propertyMeta.propName} property={propertyMeta} />
                            )
                        })}
                </Grid>
            </Box>
        ))
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
