import { Alert, Snackbar, Stack } from '@mui/material';
import React from 'react';
import { SnackbarAlertMetadata } from '../GenericConstants';


export default function SnackbarAlert(props: SnackbarAlertMetadata) {

    const handleCloseError = (event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        props.setOpenError(false);
    };

    const handleCloseSuccess = (event: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
            return;
        }
        props.setOpenSuccess(false);
    };

    return (
        <Stack spacing={1}>
            <Snackbar open={props.openSuccess} autoHideDuration={6000} onClose={handleCloseSuccess}>
                <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: '100%' }}>
                    {props.messageInfo?.message}
                </Alert>
            </Snackbar>
            <Snackbar open={props.openError} autoHideDuration={6000} onClose={handleCloseError}>
                <Alert onClose={handleCloseError} sx={{ width: '100%' }} severity="error">
                    {props.messageInfo?.message}
                </Alert>
            </Snackbar>
        </Stack>
    );
}