// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock window._env_ for tests
window._env_ = {
  REACT_APP_API_URL: 'http://localhost:8080',
  REACT_APP_PAGES: JSON.stringify([
    { name: 'Home', path: '/' },
    { name: 'Test', path: '/test' }
  ])
};
