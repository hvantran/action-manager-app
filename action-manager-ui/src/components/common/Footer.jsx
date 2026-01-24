import React from 'react';
import { Box, Link, Typography, useTheme, keyframes } from '@mui/material';
import packageJson from '../../../package.json';

/**
 * Footer component for the Action Manager application.
 * Displays copyright information, system status indicator, and relevant links.
 * Features an animated status indicator to show real-time system health.
 * Supports dark mode and responsive layouts.
 */
export default function Footer() {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();
  /**
   * Determines if the application is currently in dark mode by checking the theme palette mode.
   * 
   * The `theme` object is typically provided by Material-UI's `useTheme` hook, which retrieves
   * the current theme configuration from the application's ThemeProvider. The `palette.mode` 
   * property contains either 'light' or 'dark', indicating the active color scheme.
   * 
   * @type {boolean}
   * @constant isDarkMode
   */
  const isDarkMode = theme.palette.mode === 'dark';

  // Keyframes for the pulsing green status indicator
  const pulseAnimation = keyframes`
    0% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
    }
    70% {
      transform: scale(1);
      box-shadow: 0 0 0 4px rgba(34, 197, 94, 0);
    }
    100% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
    }
  `;

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        py: 1.5,
        px: 3,
        borderTop: 1,
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        backgroundColor: isDarkMode ? '#1a1a1a' : '#f3f4f6',
        transition: 'background-color 0.3s ease, color 0.3s ease',
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          maxWidth: '100%',
          mx: 'auto',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          fontSize: '0.688rem', // 11px
          fontWeight: 500,
          letterSpacing: '0.05em',
          color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
          textTransform: 'uppercase',
        }}
      >
        {/* Left Section - Copyright & Terms */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography
            component="span"
            sx={{
              opacity: 0.75,
              fontSize: 'inherit',
              fontWeight: 'inherit',
              letterSpacing: 'inherit',
              textTransform: 'inherit',
            }}
          >
            © {currentYear} Action Manager
          </Typography>
          <Link
            href="#"
            underline="hover"
            sx={{
              fontSize: 'inherit',
              fontWeight: 'inherit',
              letterSpacing: 'inherit',
              textTransform: 'inherit',
              color: 'inherit',
              '&:hover': {
                color: theme.palette.primary.main,
              },
              transition: 'color 0.2s ease',
            }}
          >
            Terms of Service
          </Link>
        </Box>

        {/* Center Section - System Status Indicator */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)',
            px: 1.5,
            py: 0.75,
            borderRadius: '999px',
            border: 1,
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          }}
        >
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              height: '8px',
              width: '8px',
              mr: 1,
            }}
          >
            <Box
              component="span"
              sx={{
                position: 'absolute',
                display: 'inline-flex',
                height: '100%',
                width: '100%',
                borderRadius: '50%',
                backgroundColor: 'rgb(74, 222, 128)',
                opacity: 0.75,
                animation: `${pulseAnimation} 2s infinite`,
              }}
            />
            <Box
              component="span"
              sx={{
                position: 'relative',
                display: 'inline-flex',
                borderRadius: '50%',
                height: '8px',
                width: '8px',
                backgroundColor: 'rgb(34, 197, 94)',
              }}
            />
          </Box>
          <Typography
            component="span"
            sx={{
              textTransform: 'none',
              fontWeight: 400,
              fontSize: 'inherit',
              letterSpacing: 'inherit',
              color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
            }}
          >
            System Status:{' '}
            <Box
              component="span"
              sx={{
                fontWeight: 600,
                color: isDarkMode ? 'rgb(34, 197, 94)' : 'rgb(22, 163, 74)',
              }}
            >
              All systems operational
            </Box>
          </Typography>
        </Box>

        {/* Right Section - Documentation Links */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <Link
            href="https://github.com/hvantran/action-manager-app/blob/main/README.md"
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{
              fontSize: 'inherit',
              fontWeight: 'inherit',
              letterSpacing: 'inherit',
              textTransform: 'inherit',
              color: 'inherit',
              '&:hover': {
                color: theme.palette.primary.main,
              },
              transition: 'color 0.2s ease',
            }}
          >
            Documentation
          </Link>
          <Link
            href="https://github.com/hvantran/action-manager-app/issues"
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{
              fontSize: 'inherit',
              fontWeight: 'inherit',
              letterSpacing: 'inherit',
              textTransform: 'inherit',
              color: 'inherit',
              '&:hover': {
                color: theme.palette.primary.main,
              },
              transition: 'color 0.2s ease',
            }}
          >
            Support
          </Link>
          <Link
            href="https://github.com/hvantran/action-manager-app"
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{
              fontSize: 'inherit',
              fontWeight: 'inherit',
              letterSpacing: 'inherit',
              textTransform: 'inherit',
              color: 'inherit',
              '&:hover': {
                color: theme.palette.primary.main,
              },
              transition: 'color 0.2s ease',
            }}
          >
            API Reference
          </Link>
        </Box>
      </Box>
    </Box>
  );
}
