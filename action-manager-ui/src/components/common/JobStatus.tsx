import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import { CircularProgress, Tooltip } from '@mui/material';
import { red, yellow } from "@mui/material/colors";
import React from "react";


export default function JobStatus(props: any) {

    let status = props.status as string;

    if (!status) {
        throw new Error("Status value cannot be undefined/empty/null");
    }
    switch (status) {
        case "SUCCESS":
            return (<Tooltip title={status}><CheckCircleIcon fontSize="large" color="success" /></Tooltip>)
        case "FAILURE":
            return (<Tooltip title={status}><ErrorIcon fontSize="large" sx={{ color: red[900] }} /></Tooltip>)
        case "PROCESSING":
            return (<Tooltip title={status}><CircularProgress size='35px'/></Tooltip>)
        case "PENDING":
        default:
            return (<Tooltip title={status}><PendingIcon fontSize="large" sx={{ color: yellow[900] }} /></Tooltip>)
    }
}