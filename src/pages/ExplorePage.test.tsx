import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExplorePage } from './ExplorePage';
import { api } from '../services/api';
import { makeExtension, paginated, noop } from '../test/testUtils';

vi.mock('../services/api');

const apiMock = vi.mocked(api);
const PAGE_RESULT = paginated(
  [makeExtension({ id: 'demo', name: 'Demo Extension' })],
  'cursor-2',
  true,
);

beforeEach(() => {
  apiMock.getExtensions.mockResolvedValue(PAGE_RESULT);
  apiMock.searchExtensions.mockResolvedValue(PAGE_RESULT);
});

describe('ExplorePage', () => {
  it('lists published extensions in the default grid', async () => {
    render(<ExplorePage onNavigate={noop} />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Explore Twext Extensions' }),
    ).toBeInTheDocument();
    expect(apiMock.getExtensions).toHaveBeenCalledWith({ cursor: undefined, limit: 12 });
    await screen.findByText('Demo Extension');
  });

  it('paginates using the server-provided cursor', async () => {
    const user = userEvent.setup();
    render(<ExplorePage onNavigate={noop} />);
    await screen.findByText('Demo Extension');

    await user.click(screen.getByRole('button', { name: /Next/i }));
    expect(apiMock.getExtensions).toHaveBeenLastCalledWith({ cursor: 'cursor-2', limit: 12 });

    await user.click(screen.getByRole('button', { name: /Previous/i }));
    expect(apiMock.getExtensions).toHaveBeenLastCalledWith({ cursor: undefined, limit: 12 });
  });

  it('performs a search when querying', async () => {
    const user = userEvent.setup();
    render(<ExplorePage onNavigate={noop} />);
    await screen.findByText('Demo Extension');
    const search = screen.getByPlaceholderText(/Search/i);
    await user.type(search, 'physics');
    await user.click(screen.getByRole('button', { name: /^Search$/i }));
    expect(apiMock.searchExtensions).toHaveBeenCalledWith('physics', {
      cursor: undefined,
      limit: 12,
    });
  });

  it('navigates to an extension detail on card click', async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(<ExplorePage onNavigate={onNavigate} />);
    await user.click(await screen.findByText('Demo Extension'));
    expect(onNavigate).toHaveBeenCalledWith('ext/kane/demo');
  });
});
