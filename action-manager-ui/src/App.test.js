import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

import App from './App';
import { UserInfoProvider } from './contexts/UserInfoContext';

test('renders app with providers', () => {
  render(
    <MemoryRouter>
      <UserInfoProvider>
        <App />
      </UserInfoProvider>
    </MemoryRouter>
  );
  // App should render without crashing
  expect(document.body).toBeInTheDocument();
});
