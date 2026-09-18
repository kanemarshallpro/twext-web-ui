import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PublishPage } from './PublishPage';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { makeAuthState, makeUser, noop } from '../test/testUtils';

vi.mock('../services/api');
vi.mock('../context/AuthContext');

const apiMock = vi.mocked(api);
const useAuthMock = vi.mocked(useAuth);
let authState: ReturnType<typeof makeAuthState>;

const manifestJson = JSON.stringify({
  id: 'demo',
  name: 'Demo Extension',
  version: '1.0.0',
  description: 'A test extension.',
});

beforeEach(() => {
  apiMock.publish.mockResolvedValue({
    success: true,
    message: 'Extension @kane/demo uploaded successfully.',
  });
  authState = makeAuthState({ hasAcceptedCurrentTerms: true });
  useAuthMock.mockReset();
  useAuthMock.mockReturnValue(authState);
});

function renderPage(onNavigate = noop) {
  return render(<PublishPage onNavigate={onNavigate} />);
}

function fillManifest() {
  fireEvent.change(screen.getByPlaceholderText(/my-extension/), {
    target: { value: manifestJson },
  });
}

function fillCode() {
  fireEvent.change(screen.getByPlaceholderText(/compiled extension JavaScript/), {
    target: { value: 'class X {}' },
  });
}

describe('PublishPage', () => {
  it('gates signed-out visitors behind a sign-in screen', async () => {
    useAuthMock.mockReturnValue(makeAuthState({ user: null, token: null, isAuthenticated: false }));
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    renderPage(onNavigate);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Sign in to Publish' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Sign in$/ }));
    expect(onNavigate).toHaveBeenCalledWith('login');
  });

  it('flags malformed manifest JSON', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByPlaceholderText(/my-extension/), 'null');
    expect(screen.getByText('Manifest must be a valid JSON object.')).toBeInTheDocument();
  });

  it('validates the compiled code is non-empty', () => {
    renderPage();
    fillManifest();
    const submit = screen.getByRole('button', { name: /Submit Extension for Review/ });
    expect(submit).toBeDisabled();
    fillCode();
    expect(submit).toBeEnabled();
  });

  it('publishes the manifest and code to the registry', async () => {
    const user = userEvent.setup();
    renderPage();
    fillManifest();
    fillCode();
    await user.click(screen.getByRole('button', { name: /Submit Extension for Review/ }));
    expect(apiMock.publish).toHaveBeenCalledWith({
      manifest: {
        id: 'demo',
        name: 'Demo Extension',
        version: '1.0.0',
        description: 'A test extension.',
      },
      code: 'class X {}',
    });
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Submission Received!' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Target:')).toBeInTheDocument();
    expect(screen.getByText('@kane/demo')).toBeInTheDocument();
  });

  it('renders submission errors returned by the API', async () => {
    apiMock.publish.mockRejectedValue(new ApiError('Manifest schema invalid.', 422));
    const user = userEvent.setup();
    renderPage();
    fillManifest();
    fillCode();
    await user.click(screen.getByRole('button', { name: /Submit Extension for Review/ }));
    expect(await screen.findByText('Manifest schema invalid.')).toBeInTheDocument();
  });

  it('prompts for terms acceptance when outstanding', async () => {
    authState = makeAuthState({
      user: makeUser({ termsAcceptedVersion: 1 }),
      hasAcceptedCurrentTerms: false,
    });
    useAuthMock.mockReturnValue(authState);
    const user = userEvent.setup();
    renderPage();
    expect(screen.getByText('Terms of Service Notice:')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Accept Now' }));
    expect(authState.acceptCurrentTerms).toHaveBeenCalled();
  });
});
