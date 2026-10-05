import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ActionCreationTemplate,
  StepMetadata,
  PropertyMetadata,
  PropType,
} from '@hvantran/ui-component-library';
import {
  ACTION_STATUS_SELECTION,
  ActionAPI,
  ROOT_BREADCRUMB,
} from '../AppConstants';
import { RestClient } from '../GenericConstants';

export default function ActionCreation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const statusFromQuery = searchParams.get('status') || ACTION_STATUS_SELECTION[0].value;

  const [activeStep, setActiveStep] = useState(0);
  const [processTracking, setCircleProcessOpen] = useState(false);
  const restClient = useMemo(() => new RestClient(setCircleProcessOpen), [setCircleProcessOpen]);

  const [steps, setSteps] = useState<StepMetadata[]>([
    {
      name: 'actionDefinition',
      label: 'Action Information',
      description: 'Define action properties and configuration settings',
      properties: [
        {
          propName: 'actionName',
          propLabel: 'Name',
          propValue: '',
          isRequired: true,
          colSpan: 6,
          propType: PropType.InputText,
        },
        {
          propName: 'actionStatus',
          propLabel: 'Status',
          propValue: statusFromQuery,
          isRequired: true,
          colSpan: 6,
          propType: PropType.Selection,
          selectionMeta: {
            selections: ACTION_STATUS_SELECTION,
          },
        },
        {
          propName: 'actionConfigurations',
          propLabel: 'Action Configurations (JSON)',
          isRequired: true,
          propValue: '{}',
          colSpan: 12,
          propType: PropType.CodeEditor,
          codeEditorMeta: {
            height: '250px',
            codeLanguages: ['json'],
          },
        },
      ],
    },
  ]);

  const handlePropertyChange = (stepIndex: number, propName: string, value: any) => {
    setSteps((prev) =>
      prev.map((step, idx) => {
        if (idx !== stepIndex) return step;
        return {
          ...step,
          properties: step.properties.map((p) => {
            if (p.propName === propName) {
              return { ...p, propValue: value };
            }
            return p;
          }),
        };
      })
    );
  };

  const handleFinish = (finalSteps: StepMetadata[]) => {
    const props = finalSteps[0].properties;
    ActionAPI.createAction(restClient, props as any, () => {
      navigate('/actions');
    });
  };

  const breadcrumbs = [
    { label: ROOT_BREADCRUMB, href: '/actions' },
    { label: 'New Action' },
  ];

  return (
    <ActionCreationTemplate
      pageTitle="Create New Action"
      breadcrumbs={breadcrumbs}
      steps={steps}
      activeStep={activeStep}
      onStepChange={setActiveStep}
      onPropertyChange={handlePropertyChange}
      onFinish={handleFinish}
      onCancel={() => navigate('/actions')}
      loading={processTracking}
    />
  );
}
