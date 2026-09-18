import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExtensionDetailPage } from './ExtensionDetailPage';
import { api, ApiError } from '../services/api';
import { makeExtension, noop } from '../test/testUtils';

vi.mock('../services/api');

const apiMock = vi.mocked(api);
const installUrl = 'http://localhost:3000/api/v0/extensions/kane/demo';

beforeEach(() => {
  apiMock.getExtension.mockResolvedValue(
    makeExtension({
      namespace: 'kane',
      id: 'demo',
      name: 'Demo Extension',
      description: 'A test extension.',
      readme: '# Overview\n\nWorks great.',
      latestVersion: '1.2.0',
      author: { namespace: 'kane', displayName: 'Kane' },
    }),
  );
});

describe('ExtensionDetailPage', () => {
  it('renders the extension metadata, install URL, and CLI snippet', async () => {
    render(<ExtensionDetailPage namespace="kane" id="demo" onNavigate={noop} />);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Demo Extension' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Back to search results/ })).toBeInTheDocument();
    expect(screen.getByDisplayValue(installUrl)).toBeInTheDocument();
    expect(screen.getByText(/twext add @kane\/demo/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Overview & README' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Version History/ })).toBeInTheDocument();
  });

  it('copies the install URL to the clipboard', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    render(<ExtensionDetailPage namespace="kane" id="demo" onNavigate={noop} />);
    await screen.findByRole('heading', { level: 1, name: 'Demo Extension' });
    fireEvent.click(screen.getByTitle('Copy URL'));
    expect(writeText).toHaveBeenCalledWith(installUrl);
  });

  it('warns when an extension is pending moderation', async () => {
    apiMock.getExtension.mockResolvedValue(makeExtension({ status: 'pending', name: 'Wait List' }));
    render(<ExtensionDetailPage namespace="kane" id="demo" onNavigate={noop} />);
    expect(await screen.findByText('Pending Moderation Review')).toBeInTheDocument();
  });

  it('renders the not-found state and navigates back to explore', async () => {
    apiMock.getExtension.mockRejectedValue(new ApiError('Not Found', 404));
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(<ExtensionDetailPage namespace="ghost" id="nope" onNavigate={onNavigate} />);
    expect(await screen.findByRole('heading', { name: 'Extension Not Found' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Back to Explore/ }));
    expect(onNavigate).toHaveBeenCalledWith('search');
  });
});
