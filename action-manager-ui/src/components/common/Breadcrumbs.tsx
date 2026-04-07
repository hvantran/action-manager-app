import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import * as React from 'react';

export default function BreadcrumbsComponent(props: any) {
  const breadcrumbs1 = props.breadcrumbs;

  return (
    <Breadcrumbs
      separator={<NavigateNextIcon fontSize="small" />}
      aria-label="breadcrumb"
      className="text-sm font-semibold text-slate-500"
      sx={{
        fontWeight: 'bold',
        '& .MuiBreadcrumbs-ol': {
          alignItems: 'center',
          gap: 0.5,
          flexWrap: 'wrap',
        },
        '& .MuiBreadcrumbs-separator': {
          color: '#94a3b8',
          marginInline: 6,
        },
        '& .MuiTypography-root, & .MuiLink-root': {
          color: '#475569',
          fontSize: '0.875rem',
          fontWeight: 600,
          textDecoration: 'none',
        },
      }}
    >
      {breadcrumbs1}
    </Breadcrumbs>
  );
}
