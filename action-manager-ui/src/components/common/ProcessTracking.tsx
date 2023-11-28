import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import * as React from 'react';

export default function ProcessTracking({isLoading=true, ...progressProperties}) {
  return (
    <div>
      <Backdrop open={isLoading}>
        <CircularProgress {...progressProperties}/>
      </Backdrop>
    </div>
  );
}
