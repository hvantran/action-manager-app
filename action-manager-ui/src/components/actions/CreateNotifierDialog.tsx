import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import React, { useState } from 'react';
import { KafkaNotifierAPI, NotifierConfigurationRequest, DEFAULT_SLACK_WEBHOOK } from '../AppConstants';
import { RestClient } from '../GenericConstants';

interface CreateNotifierDialogProps {
  open: boolean;
  jobName: string;
  actionId: string;
  onClose: () => void;
  onSuccess: () => void;
  setCircleProcessOpen: (open: boolean) => void;
}

export default function CreateNotifierDialog(props: CreateNotifierDialogProps) {
  const { open, jobName, actionId, onClose, onSuccess, setCircleProcessOpen } = props;
  
  const topic = KafkaNotifierAPI.formatTopicName(jobName);
  const defaultMessage = `Job "${jobName}" metric alert: \${value}`;
  
  const [notifierName, setNotifierName] = useState(jobName);
  const [description, setDescription] = useState('');
  const [ruleOperator, setRuleOperator] = useState('$gte');
  const [ruleValue, setRuleValue] = useState('1');
  const [webhookUrl, setWebhookUrl] = useState(DEFAULT_SLACK_WEBHOOK);
  const [messageTemplate, setMessageTemplate] = useState(defaultMessage);
  const [error, setError] = useState<string | null>(null);

  const restClient = new RestClient(setCircleProcessOpen);

  React.useEffect(() => {
    if (open) {
      // Reset form when dialog opens
      setNotifierName(jobName);
      setDescription('');
      setRuleOperator('$gte');
      setRuleValue('1');
      setWebhookUrl(DEFAULT_SLACK_WEBHOOK);
      setMessageTemplate(`Job "${jobName}" metric alert: \${value}`);
      setError(null);
    }
  }, [open, jobName]);

  const handleClose = () => {
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    // Validation - only validate required fields per NotifierConfigurationRequest DTO
    if (!ruleValue.trim() || isNaN(Number(ruleValue))) {
      setError('Rule value must be a valid number');
      return;
    }
    if (!webhookUrl.trim()) {
      setError('Webhook URL is required');
      return;
    }
    if (!messageTemplate.trim()) {
      setError('Message template is required');
      return;
    }

    const request: NotifierConfigurationRequest = {
      notifier: jobName,
      topic: topic,
      rules: {
        [ruleOperator]: Number(ruleValue),
      },
      actions: [
        {
          type: 'call',
          params: {
            provider: 'SLACK',
            webhookURL: webhookUrl.trim(),
            message: messageTemplate.trim(),
          },
        },
      ],
      enabled: true,
    };

    // Add optional fields if provided
    if (description.trim()) {
      request.description = description.trim();
    }
    request.throttlePeriodMinutes = 5;
    request.throttlePermitsPerPeriod = 1;

    try {
      setError(null);
      await KafkaNotifierAPI.createNotifierConfiguration(
        request,
        restClient,
        (response) => {
          console.log('Notifier configuration created:', response);
          onSuccess();
          handleClose();
        }
      );
    } catch (err: any) {
      console.error('Failed to create notifier configuration:', err);
      setError(err.message || 'Failed to create notifier configuration. Please try again.');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Create Notifier Configuration</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            label="Notifier Name"
            value={notifierName}
            fullWidth
            required
            disabled
            helperText="Uses job name as notifier name (read-only)"
          />

          <TextField
            label="Topic"
            value={topic}
            fullWidth
            disabled
            helperText="Auto-generated from job name (read-only)"
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
            helperText="Describe when this notifier should trigger (optional)"
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth required>
              <InputLabel>Rule Operator</InputLabel>
              <Select
                value={ruleOperator}
                label="Rule Operator"
                onChange={(e) => setRuleOperator(e.target.value)}
              >
                <MenuItem value="$gt">Greater Than (&gt;)</MenuItem>
                <MenuItem value="$gte">Greater Than or Equal (≥)</MenuItem>
                <MenuItem value="$lt">Less Than (&lt;)</MenuItem>
                <MenuItem value="$lte">Less Than or Equal (≤)</MenuItem>
                <MenuItem value="$eq">Equal (=)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Rule Value"
              value={ruleValue}
              onChange={(e) => setRuleValue(e.target.value)}
              fullWidth
              required
              type="number"
              helperText="Threshold value for the alert"
            />
          </Box>

          <TextField
            label="Slack Webhook URL"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            fullWidth
            required
            helperText="Slack webhook endpoint for notifications"
          />

          <TextField
            label="Message Template"
            value={messageTemplate}
            onChange={(e) => setMessageTemplate(e.target.value)}
            fullWidth
            required
            multiline
            rows={3}
            helperText="Use ${value} as placeholder for the metric value"
          />

          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            <strong>Throttling:</strong> Notifications are limited to 1 per 5 minutes by default to prevent spam.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Create Notifier
        </Button>
      </DialogActions>
    </Dialog>
  );
}
