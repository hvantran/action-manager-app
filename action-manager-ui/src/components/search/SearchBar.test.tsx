import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import SearchBar from './SearchBar';

const mockSearchActions = jest.fn();

jest.mock('../AppConstants', () => ({
  ActionAPI: {
    searchActions: (...args: unknown[]) => mockSearchActions(...args),
  },
}));

describe('SearchBar', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockSearchActions.mockReset();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('does not search before the minimum query length', () => {
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SearchBar restClient={{} as never} />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Search actions...'), {
      target: { value: 'a' },
    });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockSearchActions).not.toHaveBeenCalled();
  });

  it('searches after debounce and navigates on enter', async () => {
    const onNavigate = jest.fn();
    mockSearchActions.mockImplementation(
      async (
        query: string,
        pageIndex: number,
        pageSize: number,
        _restClient: unknown,
        successCallback: (response: {
          content: Array<{
            hash: string;
            name: string;
            description: string;
            isFavorite: boolean;
            createdAt: number;
            numberOfJobs: number;
            numberOfScheduledJobs: number;
            numberOfFailedJobs: number;
            status: string;
          }>;
          totalElements: number;
        }) => void
      ) => {
        successCallback({
          content: [
            {
              hash: 'action-1',
              name: 'Deploy Application',
              description: 'Deploy to production',
              isFavorite: false,
              createdAt: 1712476800,
              numberOfJobs: 12,
              numberOfScheduledJobs: 1,
              numberOfFailedJobs: 0,
              status: 'ACTIVE',
            },
          ],
          totalElements: 1,
        });
        return Promise.resolve();
      }
    );

    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <SearchBar restClient={{} as never} onNavigate={onNavigate} />
      </MemoryRouter>
    );

    const input = screen.getByPlaceholderText('Search actions...');
    fireEvent.change(input, { target: { value: 'de' } });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    await waitFor(() => {
      expect(mockSearchActions).toHaveBeenCalledWith('de', 0, 10, expect.anything(), expect.any(Function));
    });

    await waitFor(() => {
      expect(screen.getByText('Deploy Application')).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onNavigate).toHaveBeenCalledWith('action-1');
  });
});
