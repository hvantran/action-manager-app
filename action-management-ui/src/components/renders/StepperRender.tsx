
import DoneAllIcon from '@mui/icons-material/DoneAll';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBeforeRounded';
import NavigateNextIcon from '@mui/icons-material/NavigateNextRounded';
import { Grid, IconButton, Stack, Tooltip } from '@mui/material';
import Box from '@mui/material/Box';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';
import * as React from 'react';
import { StepMetadata } from '../GenericConstants';
import PropertyRender from './PropertyRender';

export default function StepperRender(props: any) {
    let initialStepMetadata: Array<StepMetadata> = props.initialStepMetadata;
    const [activeStep, setActiveStep] = React.useState(0);

    const isStepOptional = (stepMetadata: StepMetadata) => {
        return stepMetadata.isOptional;
    };

    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleFinish = () => {
        let onFinishStepClick = initialStepMetadata[activeStep].onFinishStepClick
        if (onFinishStepClick) {
            onFinishStepClick(initialStepMetadata);
        }
    }


    return (
        <Box sx={{ width: '100%' }} >
            <Stack spacing={4}>
                <Stepper activeStep={activeStep} alternativeLabel>
                    {initialStepMetadata.map((stepMetadata, index) => {
                        const stepProps: { completed?: boolean } = {};
                        const labelProps: { optional?: React.ReactNode } = {};

                        if (isStepOptional(stepMetadata)) {
                            labelProps.optional = (<Typography variant="caption">Optional</Typography>);
                        }
                        return (
                            <Step key={stepMetadata.name} {...stepProps}>
                                <StepLabel {...labelProps}>{stepMetadata.label}</StepLabel>
                            </Step>
                        );
                    })}
                </Stepper>
                <React.Fragment>
                    {/* Render the Stepper properties */}
                    <Grid container spacing={2} sx={{ py: 1 }}>
                        <Grid item xs={1} >
                            <Box
                                display="flex"
                                justifyContent="center"
                                alignItems="center"
                                minHeight="70vh"
                            >
                                <IconButton
                                    disabled={activeStep === 0}
                                    sx={{ mr: 1 }}
                                    color="inherit"
                                    onClick={handleBack}
                                    aria-label="Next"
                                    component="label">
                                    <Tooltip title="Back">
                                        <NavigateBeforeIcon sx={{ fontSize: 40 }}/>
                                    </Tooltip>
                                </IconButton>
                            </Box>
                        </Grid>
                        <Grid container xs={10} sx={{ flexGrow: 1 }}>
                            {initialStepMetadata
                                .filter((_, index) => index === activeStep)
                                .flatMap((stepDefinition) => stepDefinition.properties)
                                .flatMap((propertyMeta, index) => {
                                    return (
                                        <PropertyRender key={propertyMeta.propName} property={propertyMeta} />
                                    )
                                })}
                        </Grid>
                        <Grid item xs={1}>
                            <Box
                                display="flex"
                                justifyContent="center"
                                alignItems="center"
                                minHeight="70vh"
                            >
                                {
                                    activeStep !== initialStepMetadata.length - 1 ?
                                        (<IconButton onClick={handleNext} color="primary" aria-label="Next" component="label">
                                            <Tooltip title="Next">
                                                <NavigateNextIcon sx={{ fontSize: 40 }}/>
                                            </Tooltip>
                                        </IconButton>)
                                        :
                                        (<IconButton onClick={handleFinish} color="primary" aria-label="Next" component="label">
                                            <Tooltip title="Finish">
                                                <DoneAllIcon sx={{ fontSize: 40 }}/>
                                            </Tooltip>
                                        </IconButton>)
                                }
                            </Box>
                        </Grid>
                    </Grid>

                </React.Fragment>
            </Stack>
        </Box >
    )
}