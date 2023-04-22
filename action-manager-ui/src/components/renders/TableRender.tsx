import { IconButton, Paper, TableContainer, Tooltip } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import * as React from 'react';
import { TableMetadata } from '../GenericConstants';

export default function TableRender(props: TableMetadata) {

    const pagingOptions = props.pagingOptions;
    const [page, setPage] = React.useState(pagingOptions.pageIndex);
    const [rowsPerPage, setRowsPerPage] = React.useState(pagingOptions.pageSize);

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(+newPage);
        props.pagingOptions.onPageChange(newPage, rowsPerPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPage(0);
        setRowsPerPage(+event.target.value);
        props.pagingOptions.onPageChange(0, +event.target.value);
    };
    const keyColumn = props.columns.find(p => p.isKeyColumn === true)?.id
    let recordTransfromCallback = props.pagingResult.elementTransformCallback
    let pagingContent = props.pagingResult.content;
    if (recordTransfromCallback) {
        pagingContent = props.pagingResult.content.map(recordTransfromCallback);
    }

    if (!keyColumn) {
        throw new Error("Need to provide a key column for table");
    }

    return (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 640 }}>
                <Table stickyHeader aria-label="sticky table">
                    <TableHead>
                        <TableRow>
                            {props.columns.map((column) => (
                                <TableCell
                                    sx={{ display: column.isHidden ? 'none' : 'table-cell' }}
                                    key={column.id}
                                    align={column.align}
                                    style={{ minWidth: column.minWidth }}
                                >
                                    {column.label}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {pagingContent
                            .map((row) => {
                                return (
                                    <TableRow hover role="checkbox" tabIndex={-1} key={row[keyColumn]}>
                                        {props.columns.map((column) => {
                                            if (column.actions) {
                                                return (
                                                    <TableCell
                                                        sx={{ display: column.isHidden ? 'none' : 'table-cell' }}
                                                        key={column.id}
                                                        align={column.align}>
                                                        {column.actions.filter(action => !action.visible || action.visible(row)).map(action => {
                                                            return (
                                                                <IconButton
                                                                    key={action.actionName}
                                                                    onClick={action.onClick(row)}
                                                                    color="primary"
                                                                    aria-label="Next"
                                                                    component="label" 
                                                                    
                                                                    {...action.properties}>
                                                                    <Tooltip title={action.actionLabel}>
                                                                        {action.actionIcon}
                                                                    </Tooltip>
                                                                </IconButton>
                                                            );
                                                        })}
                                                    </TableCell>
                                                );
                                            }
                                            const value = row[column.id];
                                            return (
                                                <TableCell
                                                    sx={{ display: column.isHidden ? 'none' : 'table-cell' }}
                                                    key={column.id}
                                                    align={column.align}>
                                                    {column.format
                                                        ? column.format(value)
                                                        : value}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                rowsPerPageOptions={props.pagingOptions.rowsPerPageOptions}
                component="div"
                count={props.pagingResult.totalElements}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
            />
        </Paper>
    );
}