import { IconButton, Paper, styled, TableContainer, TableSortLabel, TextField, Toolbar, Tooltip, Typography } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import * as React from 'react';
import { TableMetadata } from '../GenericConstants';
import FilterListIcon from '@mui/icons-material/FilterList';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
        fontWeight: 'bold',
        backgroundColor: theme.palette.primary.main,
        borderBottom: '2px solid black'
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,
    },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));

export default function TableRender(props: TableMetadata) {

    const pagingOptions = props.pagingOptions;
    const [page, setPage] = React.useState(pagingOptions.pageIndex);
    const [orderBy, setOrderBy] = React.useState(pagingOptions.orderBy);
    const [rowsPerPage, setRowsPerPage] = React.useState(pagingOptions.pageSize);

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(+newPage);
        props.pagingOptions.onPageChange(newPage, rowsPerPage, orderBy);
    };
    const handleChangeOrder = (orderByColumn: string) => (event: React.MouseEvent<unknown>) => {
        let newOrderBy = orderByColumn
        let previousColumnName = orderBy.replace('-', '')
        if (orderByColumn === previousColumnName) {
            newOrderBy = orderBy.startsWith('-') ? previousColumnName : `-${orderBy}`
        }
        setOrderBy(newOrderBy)
        props.pagingOptions.onPageChange(page, rowsPerPage, newOrderBy);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPage(0);
        setRowsPerPage(+event.target.value);
        props.pagingOptions.onPageChange(0, +event.target.value, orderBy);
    };
    let recordTransfromCallback = props.pagingResult.elementTransformCallback
    let pagingContent = props.pagingResult.content;
    const keyColumn = props.columns.find(p => p.isKeyColumn === true)?.id
    if (recordTransfromCallback) {
        pagingContent = props.pagingResult.content.map(recordTransfromCallback);
    }

    if (!keyColumn) {
        throw new Error("Need to provide a key column for table");
    }

    return (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>

            <Toolbar
                sx={[
                    {
                        pl: { sm: 2 },
                        pr: { xs: 1, sm: 1 },
                    }
                ]}
            >
                <Typography
                    sx={{ flex: '1 1 100%' }}
                    variant="h6"
                    id="tableTitle"
                    component="div"
                >
                    {props.name}
                </Typography>
                <TextField id="standard-basic" sx={{ width: '30%' }} label="Search" variant="standard" />
            </Toolbar>
            <TableContainer sx={{ maxHeight: 640 }}>
                <Table stickyHeader aria-label="sticky table">
                    <TableHead>
                        <StyledTableRow>
                            {props.columns.map((column) => (
                                <StyledTableCell
                                    sx={{
                                        display: column.isHidden ? 'none' : 'table-cell',
                                    }}
                                    key={column.id}
                                    align={column.align}
                                    style={{ minWidth: column.minWidth }}
                                >
                                    <TableSortLabel
                                        active={orderBy.replace('-', '') === column.id}
                                        direction={orderBy.replace('-', '') === column.id ? (orderBy.startsWith('-') ? 'desc' : 'asc') : 'asc'}
                                        onClick={handleChangeOrder(column.id)}>
                                        {column.label}
                                    </TableSortLabel>
                                </StyledTableCell>
                            ))}
                        </StyledTableRow>
                    </TableHead>
                    <TableBody>
                        {pagingContent
                            .map((row) => {
                                return (
                                    <StyledTableRow hover role="checkbox" tabIndex={-1} key={row[keyColumn]}>
                                        {props.columns.map((column) => {
                                            if (column.actions) {
                                                return (
                                                    <StyledTableCell
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
                                                    </StyledTableCell>
                                                );
                                            }
                                            const value = row[column.id];
                                            return (
                                                <StyledTableCell onMouseDown={(event) => {
                                                    event.button === 1 && props.onMouseWheelClick && props.onMouseWheelClick(row)
                                                }} onClick={() => props.onRowClickCallback && props.onRowClickCallback(row)}
                                                    sx={{ display: column.isHidden ? 'none' : 'table-cell' }}
                                                    key={column.id}
                                                    align={column.align}>
                                                    {column.format
                                                        ? column.format(value, row)
                                                        : value}
                                                </StyledTableCell>
                                            );
                                        })}
                                    </StyledTableRow>
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