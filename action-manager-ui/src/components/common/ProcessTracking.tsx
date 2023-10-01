import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import * as React from 'react';

export default function ProcessTracking(props: any) {
  let isLoading: boolean = props.isLoading;
  return (
    <div>
      <Backdrop open={isLoading}>
        <CircularProgress {...props}/>
      </Backdrop>
    </div>
  );
}
