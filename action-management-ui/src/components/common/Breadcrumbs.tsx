import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import * as React from 'react';


export default function BreadcrumbsComponent(props: any) {
    const breadcrumbs1 = props.breadcrumbs

    return (
        <Breadcrumbs
            separator={<NavigateNextIcon fontSize="small" />}
            aria-label="breadcrumb"
        >
            {breadcrumbs1}
        </Breadcrumbs>
    );
}