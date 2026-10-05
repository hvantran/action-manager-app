import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  JobCreationTemplate,
  StepMetadata,
  PropertyMetadata,
  PropType,
} from '@hvantran/ui-component-library';
import {
  DEFAULT_JOB_CONTENT,
  JOB_CATEGORY_VALUES,
  JOB_OUTPUT_TARGET_VALUES,
  JOB_SCHEDULE_TIME_SELECTION,
  JOB_STATUS_SELECTION,
  JobAPI,
  JobDetailMetadata,
  ROOT_BREADCRUMB,
} from '../AppConstants';
import { RestClient } from '../GenericConstants';

export default function JobCreation() {
  const navigate = useNavigate();
  const targetAction = useParams();
  const location = useLocation();
  const actionId = targetAction.actionId;
  const copyJobId = location.state?.copyJobId || '';

  if (!actionId) {
    throw new Error('Action is required');
  }

  const [activeStep, setActiveStep] = useState(0);
  const [processTracking, setCircleProcessOpen] = useState(false);
  const restClient = useMemo(() => new RestClient(setCircleProcessOpen), [setCircleProcessOpen]);

  const [steps, setSteps] = useState<StepMetadata[]>([
    {
      name: 'jobDefinition',
      label: 'Job Information',
      description: 'Define job configurations, execution schedule and script content',
      properties: [
        {
          propName: 'name',
          propLabel: 'Name',
          propValue: '',
          isRequired: true,
          colSpan: 6,
          propType: PropType.InputText,
        },
        {
          propName: 'status',
          propLabel: 'Status',
          propValue: 'INITIAL',
          isRequired: true,
          colSpan: 6,
          propType: PropType.Selection,
          selectionMeta: {
            selections: JOB_STATUS_SELECTION,
          },
        },
        {
          propName: 'isAsync',
          propLabel: 'Asynchronous Execution',
          propValue: false,
          colSpan: 6,
          propType: PropType.Switcher,
        },
        {
          propName: 'category',
          propLabel: 'Category',
          propValue: 'IO',
          colSpan: 6,
          propType: PropType.Selection,
          selectionMeta: {
            selections: JOB_CATEGORY_VALUES,
          },
        },
        {
          propName: 'isScheduled',
          propLabel: 'Scheduled Job',
          propValue: false,
          colSpan: 6,
          propType: PropType.Switcher,
        },
        {
          propName: 'scheduleInterval',
          propLabel: 'Schedule Period',
          propValue: 0,
          colSpan: 6,
          propType: PropType.Selection,
          selectionMeta: {
            selections: JOB_SCHEDULE_TIME_SELECTION,
          },
        },
        {
          propName: 'outputTargets',
          propLabel: 'Output Target',
          propValue: ['CONSOLE'],
          colSpan: 12,
          propType: PropType.Selection,
          selectionMeta: {
            selections: JOB_OUTPUT_TARGET_VALUES,
            isMultiple: true,
          },
        },
        {
          propName: 'description',
          propLabel: 'Description',
          propValue: '',
          colSpan: 12,
          propType: PropType.Textarea,
          textareaFieldMeta: {
            rows: 3,
            placeholder: 'Job description...',
          },
        },
        {
          propName: 'configurations',
          propLabel: 'Configurations (JSON)',
          isRequired: true,
          propValue: '{}',
          colSpan: 12,
          propType: PropType.CodeEditor,
          codeEditorMeta: {
            height: '150px',
            codeLanguages: ['json'],
          },
        },
        {
          propName: 'content',
          propLabel: 'Job Script (JavaScript)',
          isRequired: true,
          propValue: DEFAULT_JOB_CONTENT,
          colSpan: 12,
          propType: PropType.CodeEditor,
          codeEditorMeta: {
            height: '350px',
            codeLanguages: ['javascript'],
          },
        },
      ],
    },
  ]);

  useEffect(() => {
    if (copyJobId) {
      JobAPI.load(copyJobId, restClient, (jobDetail: JobDetailMetadata) => {
        setSteps((prevSteps) => [
          {
            ...prevSteps[0],
            properties: prevSteps[0].properties.map((p) => {
              if (p.propName === 'name') {
                return { ...p, propValue: `${jobDetail.name || ''} - Copy` };
              }
              const val = (jobDetail as any)[p.propName];
              return val !== undefined ? { ...p, propValue: val } : p;
            }),
          },
        ]);
      });
    }
  }, [copyJobId, restClient]);

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
    JobAPI.create(actionId, restClient, props as any, () => {
      navigate(`/actions/${actionId}`);
    });
  };

  const breadcrumbs = [
    { label: ROOT_BREADCRUMB, href: '/actions' },
    { label: actionId, href: `/actions/${actionId}` },
    { label: 'New Job' },
  ];

  return (
    <JobCreationTemplate
      pageTitle="Create New Job"
      breadcrumbs={breadcrumbs}
      steps={steps}
      activeStep={activeStep}
      onStepChange={setActiveStep}
      onPropertyChange={handlePropertyChange}
      onFinish={handleFinish}
      onCancel={() => navigate(`/actions/${actionId}`)}
      loading={processTracking}
    />
  );
}
