import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import SearchDropdown from './SearchDropdown';
import type { SearchResult } from './SearchBar';

const baseResult: SearchResult = {
  hash: 'action-1',
  name: 'Deploy Application',
  description: 'Deploy to production',
  isFavorite: true,
  createdAt: 1712476800,
  numberOfJobs: 10,
  numberOfScheduledJobs: 2,
  numberOfFailedJobs: 1,
  status: 'ACTIVE',
};

describe('SearchDropdown', () => {
  it('renders loading state', () => {
    render(
      <SearchDropdown
        results={[]}
        loading
        error={null}
        selectedIndex={-1}
        totalResults={0}
        query="de"
        onResultClick={jest.fn()}
      />
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders error state', () => {
    render(
      <SearchDropdown
        results={[]}
        loading={false}
        error="Search failed"
        selectedIndex={-1}
        totalResults={0}
        query="de"
        onResultClick={jest.fn()}
      />
    );

    expect(screen.getByText('Search failed')).toBeInTheDocument();
  });

  it('renders empty state', () => {
    render(
      <SearchDropdown
        results={[]}
        loading={false}
        error={null}
        selectedIndex={-1}
        totalResults={0}
        query="unknown"
        onResultClick={jest.fn()}
      />
    );

    expect(screen.getByText(/No actions found for "unknown"/i)).toBeInTheDocument();
  });

  it('renders results and handles selection', () => {
    const onResultClick = jest.fn();
    const onMouseEnter = jest.fn();

    render(
      <SearchDropdown
        results={[baseResult]}
        loading={false}
        error={null}
        selectedIndex={0}
        totalResults={1}
        query="deploy"
        onResultClick={onResultClick}
        onMouseEnter={onMouseEnter}
      />
    );

    const resultButton = screen.getByRole('button', { name: /Deploy Application/i });
    fireEvent.mouseEnter(resultButton);
    fireEvent.click(resultButton);

    expect(onMouseEnter).toHaveBeenCalledWith(0);
    expect(onResultClick).toHaveBeenCalledWith('action-1');
    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText(/Jobs: 10/)).toBeInTheDocument();
  });
});
