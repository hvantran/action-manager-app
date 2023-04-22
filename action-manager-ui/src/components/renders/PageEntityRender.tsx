import { Box, Grid, IconButton, Stack, Tooltip } from '@mui/material';
import * as React from 'react';
import { PageEntityMetadata } from '../GenericConstants';
import FloatingSpeedDialButtons from '../common/FloatingActions';
import StepperRender from './StepperRender';
import TableRender from './TableRender';
import BreadcrumbsComponent from '../common/Breadcrumbs';
import PropertyRender from './PropertyRender';

export default function PageRender(props: PageEntityMetadata) {
    let floatingActions = props.floatingActions
    let stepMetadatas = props.stepMetadatas
    let tableMetadata = props.tableMetadata
    let breadcrumbsMetadata = props.breadcumbsMeta
    let propertiesMetadata = props.properties
    let pageEntityActions = props.pageEntityActions
    let pageName = props.pageName

    let nodes: Array<React.ReactNode> = []
    let gridItems: Array<React.ReactNode> = [];
    if (breadcrumbsMetadata && pageEntityActions) {
        gridItems.push((<Grid item xs={6}><BreadcrumbsComponent breadcrumbs={breadcrumbsMetadata} /></Grid>))
        gridItems.push((<Grid item xs={6} >
            <Box display="flex" justifyContent="flex-end" sx={{ px: 2 }}>{pageEntityActions.map(action => {
                return (
                    <IconButton
                        key={action.actionName}
                        onClick={action.onClick()}
                        color="primary"
                        aria-label="Next"
                        component="label"

                        {...action.properties}>
                        <Tooltip
                            title={
                                <>
                                    {action.actionLabel}
                                    {action.actionLabelContent ? (action.actionLabelContent): ""
                                    }
                                </>
                            }>
                            {action.actionIcon}
                        </Tooltip>
                    </IconButton>
                );
            })}</Box>
        </Grid>))
    } else if (breadcrumbsMetadata) {
        gridItems.push((<Grid item xs={12}><BreadcrumbsComponent breadcrumbs={breadcrumbsMetadata} /></Grid>))
    } else if (pageEntityActions) {
        gridItems.push((<Grid item xs={12} justifyContent="flex-end">
            <Box display="flex" justifyContent="flex-end">{pageEntityActions.map(action => {
                return (
                    <IconButton
                        key={action.actionName}
                        onClick={action.onClick()}
                        color="primary"
                        aria-label="Next"
                        component="label"

                        {...action.properties}>
                        <Tooltip title={action.actionLabel}>
                            {action.actionIcon}
                        </Tooltip>
                    </IconButton>
                );
            })}</Box>
        </Grid>))
    }
    nodes.push((<Grid container spacing={2}>{gridItems}</Grid>));
    if (propertiesMetadata) {
        nodes.push((
            <Box sx={{ px: '100px' }}>
                <Grid spacing={2} sx={{ py: 1 }}>
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
        <Stack spacing={1} sx={{px: 2}}>
            {nodes}
        </Stack>
    )
}
