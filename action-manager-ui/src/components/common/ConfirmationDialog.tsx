import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import * as React from 'react';

import { DialogMetadata } from '../GenericConstants';

export default function ConfirmationDialog(props: DialogMetadata) {
  return (
    <div>
      <Dialog
        open={props.open}
        onClose={props.negativeAction}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        PaperProps={{
          className: 'rounded-3xl border border-slate-200 bg-white shadow-2xl',
        }}
      >
        <DialogTitle id="alert-dialog-title" className="px-6 pt-6 text-xl font-semibold text-slate-900">
          {props.title}
        </DialogTitle>
        <DialogContent className="px-6 pb-2">
          <DialogContentText
            id="alert-dialog-description"
            className="text-sm leading-6 text-slate-600"
          >
            {props.content}
          </DialogContentText>
        </DialogContent>
        <DialogActions className="px-6 pb-6 pt-2">
          <Button
            onClick={props.negativeAction}
            variant="contained"
            aria-label="button group"
            autoFocus
            className="rounded-full bg-slate-900 px-5 py-2 text-xs font-semibold tracking-[0.18em] text-white shadow-none hover:bg-slate-800"
          >
            {props.negativeText}
          </Button>
          <Button
            onClick={props.positiveAction}
            className="rounded-full px-5 py-2 text-xs font-semibold tracking-[0.18em] text-slate-600"
          >
            {props.positiveText}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
