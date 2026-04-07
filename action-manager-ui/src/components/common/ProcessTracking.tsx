import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import * as React from 'react';

export default function ProcessTracking({ isLoading = true, ...progressProperties }) {
  return (
    <div>
      <Backdrop
        open={isLoading}
        className="backdrop-blur-sm"
        sx={{ backgroundColor: 'rgba(15, 23, 42, 0.32)', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <div className="rounded-3xl border border-white/20 bg-slate-950/80 px-6 py-5 shadow-2xl">
          <CircularProgress className="text-amber-400" {...progressProperties} />
        </div>
      </Backdrop>
    </div>
  );
}
