import HelpRoundedIcon from '@mui/icons-material/HelpRounded';
import { Autocomplete, Box, FormControl, Grid, Input, MenuItem, Select, Switch, TextField, Tooltip } from '@mui/material';
import * as React from 'react';
import { PropType, PropertyMetadata } from '../GenericConstants';
import CodeEditor from '../common/CodeEditor';

export default function PropertyRender(props: any) {
    let property: PropertyMetadata = props.property
    let value = !property.propValue || property.propValue === '' ? (property.propDefaultValue ? property.propDefaultValue : '') : property.propValue
    let renderNode: React.ReactNode = undefined;
    switch (property.propType) {

        case PropType.CodeEditor:
            if (!property.codeEditorMeta) {
                throw new Error(`codeEditorMeta is required for ${property.propName} code editor property`);
            }
            let codeEditorMeta = property.codeEditorMeta
            renderNode = (
                <CodeEditor
                    key={property.propName}
                    isRequired={property.isRequired}
                    propName={property.propName}
                    value={value}
                    editable={!property.disabled}
                    {...property.propExtraProperties}
                    height={codeEditorMeta.height}
                    onChange={codeEditorMeta.onChangeEvent}
                    language={codeEditorMeta.codeLanguges} />
            )
            break;

        case PropType.Textarea:
            if (!property.textareaFieldMeta) {
                throw new Error(`textareaFieldMeta is required for ${property.propName} text property`);
            }
            let textareaFieldMeta = property.textareaFieldMeta
            renderNode = (
                <TextField
                    key={property.propName}
                    required={property.isRequired}
                    name={property.propName}
                    value={value}
                    size="small"
                    sx={{ width: '100%' }}
                    disabled={property.disabled}
                    multiline
                    {...property.propExtraProperties}
                    onChange={textareaFieldMeta.onChangeEvent}
                    variant="standard" />
            )
            break;
        case PropType.Switcher:
            if (!property.switcherFieldMeta) {
                throw new Error(`switcherFieldMeta is required for ${property.propName} boolean property`);
            }
            let switcherFieldMeta = property.switcherFieldMeta
            renderNode = (
                <Switch
                    key={property.propName}
                    name={property.propName}
                    disabled={property.disabled}
                    checked={value === '' ? false : value}
                    {...property.propExtraProperties}
                    onChange={switcherFieldMeta.onChangeEvent} />
            )
            break;
        case PropType.Selection:
            if (!property.selectionMeta) {
                throw new Error(`selectionMeta is required for ${property.propName} selection property`);
            }
            let selectionMeta = property.selectionMeta;
            renderNode = (
                <FormControl sx={{ m: 1, width: '100%', margin: 0 }} size="small">
                    <Select
                        labelId={"demo-select-small".concat(property.propName)}
                        id={"demo-select-small".concat(property.propName)}
                        value={value}
                        disabled={property.disabled}
                        multiple={selectionMeta.isMultiple}
                        {...property.propExtraProperties}
                        name={property.propName}
                        label={property.propLabel}
                        onChange={selectionMeta.onChangeEvent}
                    >  {
                            selectionMeta.selections.map(selection => {
                                return (<MenuItem key={property.propName + selection.value} value={selection.value}>{selection.label}</MenuItem>)
                            })
                        }
                    </Select>
                </FormControl>
            )
            break;

        case PropType.Autocomplete:
            if (!property.autoCompleteMeta) {
                throw new Error(`autoCompleteMeta is required for ${property.propName} selection property`);
            }
            let autoCompleteMeta = property.autoCompleteMeta;
            renderNode = (
                <Autocomplete
                    key={property.propName}
                    multiple={autoCompleteMeta.isMultiple}
                    limitTags={autoCompleteMeta.limitTags}
                    id={property.propName}
                    isOptionEqualToValue={autoCompleteMeta.isOptionEqualToValue}
                    value={property.propValue}
                    disabled={property.disabled}
                    options={autoCompleteMeta.options}
                    filterSelectedOptions={autoCompleteMeta.filterSelectedOptions}
                    getOptionLabel={autoCompleteMeta.getOptionLabel}
                    defaultValue={autoCompleteMeta.defaultValue}
                    onChange={autoCompleteMeta.onChange}
                    renderTags={autoCompleteMeta.renderTags}
                    renderInput={(params) => <TextField {...params} name={property.propName} onChange={autoCompleteMeta.onSearchTextChangeEvent} placeholder="..." />}
                    sx={{ width: '100%' }}
                />
            )
            break;

        case PropType.InputText:
        default:
            if (!property.textFieldMeta) {
                throw new Error(`textFieldMeta is required for ${property.propName} text property`);
            }

            let textFieldMeta = property.textFieldMeta
            renderNode = (
                <Input required={property.isRequired}
                    size="small"
                    sx={{ width: '100%' }}
                    name={property.propName}
                    placeholder={textFieldMeta.placeholder}
                    disabled={property.disabled}
                    value={value}
                    onChange={textFieldMeta.onChangeEvent}
                    {...property.propExtraProperties} />
            )
            break;
    }

    return (
        <Grid item {...property.layoutProperties}>
            <Grid container spacing={2}>
                <Grid item {...property.labelElementProperties}>
                    <Box {...property.labelElementProperties.sx}>
                        <label>{property.propLabel} {property.isRequired ? (<span>*</span>) : (<span />)}</label>
                        {
                            property.info &&
                            <Tooltip title={property.info}>
                                <HelpRoundedIcon sx={{ fontSize: 12 }} style={{ position: "relative", top: '-5px', left: '-2px' }} />
                            </Tooltip>
                        }
                    </Box>
                </Grid>
                <Grid key={"index_" + property.propName + "_2"} item {...property.valueElementProperties}>
                    {renderNode}
                </Grid></Grid>
        </Grid>
    )
}