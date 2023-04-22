import { LanguageSupport } from '@codemirror/language';
import { ViewUpdate } from "@codemirror/view";
import { Box } from '@mui/material';
import CodeMirror from '@uiw/react-codemirror';
import { createTheme } from '@uiw/codemirror-themes';
import React from 'react';

const disableCodeMirrorTheme = createTheme({
    theme: 'light',
    settings: {
      background: '#dcd6d6'
    },
    styles: [
    ],
  });

function CodeEditor(props: CodeEditorProps) {
    return (
        <Box sx={{border: 1 }}>
            <CodeMirror
                value={props.value}
                height={props.height ? props.height : "500px"}
                extensions={props.language}
                editable={props.editable}
                theme={props.editable ? 'light' : disableCodeMirrorTheme}
                onChange={props.onChange(props.propName)}
            />
        </Box>
    );
}

export interface CodeEditorProps {
    language: Array<LanguageSupport>
    propName: string
    value: string
    isRequired?: boolean
    editable?:boolean
    height?: string
    onChange: (propertyName: string) => (value: string, viewUpdate: ViewUpdate) => void
}
export default CodeEditor;