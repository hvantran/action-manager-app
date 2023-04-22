import { Box, FormControl, Grid, Input, MenuItem, Select, Switch, TextField } from '@mui/material';
import * as React from 'react';
import CodeEditor from '../common/CodeEditor';
import { PropertyMetadata, PropType } from '../GenericConstants';

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
                    checked={value}
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
                <FormControl sx={{ m: 1, width: '100%' }} size="small">
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
                                return (<MenuItem key={property.propName + selection} value={selection}>{selection}</MenuItem>)
                            })
                        }
                    </Select>
                </FormControl>
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
                    {...property.propExtraProperties}/>
            )
            break;
    }

    return (
        <Grid container spacing={2} sx={{ py: 1 }} {...property.layoutProperties}>
            <Grid item {...property.labelElementProperties}>
                <Box {...property.labelElementProperties.sx}>
                    <label>{property.propLabel} {property.isRequired ? (<span>*</span>) : (<span />)}</label>
                </Box>
            </Grid>
            <Grid item {...property.valueElementProperties}>
                {renderNode}
            </Grid>
        </Grid>
    )
}