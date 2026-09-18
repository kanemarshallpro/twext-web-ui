import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminPage } from './AdminPage';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  makeAdminUser,
  makeAuthState,
  makeExtension,
  makePendingVersion,
  makeStats,
  makeUser,
  paginated,
  noop,
} from '../test/testUtils';

vi.mock('../services/api');
vi.mock('../context/AuthContext');

const apiMock = vi.mocked(api);
const useAuthMock = vi.mocked(useAuth);
let authState: ReturnType<typeof makeAuthState>;

const termsDoc = { version: 2, body: '# Terms', updatedAt: '2026-01-01T00:00:00Z' };

const manifestJson = JSON.stringify(
  {
    id: 'demo',
    name: 'Demo Extension',
    version: '1.0.0',
    license: 'Apache-2.0',
    description: 'A version awaiting review.',
  },
  null,
  2,
);
const codeJs = 'class DemoExtension {}\nScratch.extensions.register(new DemoExtension());';

beforeEach(() => {
  apiMock.getStats.mockResolvedValue(makeStats());
  apiMock.listVersionsForReview.mockResolvedValue(paginated([makePendingVersion()]));
  apiMock.getExtensions.mockResolvedValue(paginated([makeExtension()]));
  apiMock.getUsers.mockResolvedValue(paginated([makeUser({ role: 'normal' })]));
  apiMock.getTerms.mockResolvedValue(termsDoc);
  apiMock.getPrivacy.mockResolvedValue({
    version: 2,
    body: '# Privacy',
    updatedAt: '2026-01-01T00:00:00Z',
  });
  apiMock.downloadVersion.mockResolvedValue(codeJs);
  authState = makeAuthState({ user: makeAdminUser() });
  useAuthMock.mockReset();
  useAuthMock.mockReturnValue(authState);
});

describe('AdminPage', () => {
  it('restricts access to administrators', () => {
    useAuthMock.mockReturnValue(makeAuthState({ user: makeUser({ role: 'normal' }) }));
    render(<AdminPage onNavigate={noop} />);
    expect(
      screen.getByRole('heading', { name: 'Administrator Access Required' }),
    ).toBeInTheDocument();
  });

  it('renders the admin console and its tabs', async () => {
    render(<AdminPage onNavigate={noop} />);
    expect(screen.getByRole('heading', { name: 'Registry Administration' })).toBeInTheDocument();
    expect(screen.getByText('Admin Console')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Moderation Queue/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Extension Catalog/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /User Accounts/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Platform Policies/ })).toBeInTheDocument();
  });

  it('lists the pending moderation queue with review actions', async () => {
    render(<AdminPage onNavigate={noop} />);
    expect(await screen.findByText('Demo Extension')).toBeInTheDocument();
    expect(screen.getByText('@kane/demo')).toBeInTheDocument();
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Approve' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reject' })).toBeInTheDocument();
  });

  it('approves a pending submission', async () => {
    const user = userEvent.setup();
    render(<AdminPage onNavigate={noop} />);
    await screen.findByText('Demo Extension');
    await user.click(screen.getByRole('button', { name: 'Approve' }));
    expect(apiMock.reviewVersion).toHaveBeenCalledWith('kane', 'demo', '1.0.0', {
      status: 'approved',
    });
    expect(
      await screen.findByText('Version v1.0.0 of @kane/demo has been approved and published!'),
    ).toBeInTheDocument();
  });

  it('rejects a pending submission with feedback through the modal', async () => {
    const user = userEvent.setup();
    render(<AdminPage onNavigate={noop} />);
    await screen.findByText('Demo Extension');
    await user.click(screen.getByRole('button', { name: 'Reject' }));
    expect(screen.getByText('Reject Extension Submission')).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/Manifest icon is missing/), 'Missing icon asset.');
    await user.click(screen.getByRole('button', { name: 'Confirm Rejection' }));
    expect(apiMock.reviewVersion).toHaveBeenCalledWith('kane', 'demo', '1.0.0', {
      status: 'rejected',
      reason: 'Missing icon asset.',
    });
    expect(
      await screen.findByText('Version v1.0.0 of @kane/demo was rejected.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Reject Extension Submission')).not.toBeInTheDocument();
  });

  it('filters the catalog via search', async () => {
    const user = userEvent.setup();
    render(<AdminPage onNavigate={noop} />);
    await screen.findByText('Demo Extension');
    await user.click(screen.getByRole('button', { name: /Extension Catalog/ }));
    await user.type(screen.getByPlaceholderText(/Search extensions in catalog/), 'physics');
    await user.keyboard('{Enter}');
    expect(apiMock.searchExtensions).toHaveBeenCalledWith('physics', { limit: 50 });
  });

  it('opens the source review editor with manifest and code tabs', async () => {
    const user = userEvent.setup();
    render(<AdminPage onNavigate={noop} />);
    await screen.findByText('Demo Extension');
    await user.click(screen.getByRole('button', { name: /Inspect/ }));

    expect(
      await screen.findByRole('heading', { name: 'Demo Extension' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /manifest.json/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /extension.js/ })).toBeInTheDocument();

    const manifestEditor = await screen.findByRole('textbox', {
      name: 'manifest.json editor',
    });
    expect(manifestEditor).toHaveValue(manifestJson);

    await user.click(screen.getByRole('button', { name: /extension.js/ }));
    const codeEditor = await screen.findByRole('textbox', { name: 'extension.js editor' });
    expect(codeEditor).toHaveValue(codeJs);
    expect(apiMock.downloadVersion).toHaveBeenCalledWith('kane', 'demo', '1.0.0');
  });

  it('flags invalid manifest JSON while reviewing sources', async () => {
    const user = userEvent.setup();
    render(<AdminPage onNavigate={noop} />);
    await screen.findByText('Demo Extension');
    await user.click(screen.getByRole('button', { name: /Inspect/ }));

    const editor = await screen.findByRole('textbox', { name: 'manifest.json editor' });
    await user.clear(editor);
    await user.type(editor, '{{ invalid');

    expect(await screen.findByText(/Unexpected token|Expected property name/)).toBeInTheDocument();
  });

  it('explains that code is not downloadable while the version is pending', async () => {
    const user = userEvent.setup();
    apiMock.downloadVersion.mockRejectedValue(new ApiError('Not Found', 404));
    render(<AdminPage onNavigate={noop} />);
    await screen.findByText('Demo Extension');
    await user.click(screen.getByRole('button', { name: /Inspect/ }));
    await user.click(screen.getByRole('button', { name: /extension.js/ }));

    expect(
      await screen.findByText(/extension.js is not downloadable yet/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Unable to load extension.js/i)).not.toBeInTheDocument();
  });
});
