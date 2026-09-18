import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SessionsTokensPage } from './SessionsTokensPage';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { makeAuthState, makeSession, makeToken, paginated, noop } from '../test/testUtils';

vi.mock('../services/api');
vi.mock('../context/AuthContext');

const apiMock = vi.mocked(api);
const useAuthMock = vi.mocked(useAuth);
let authState: ReturnType<typeof makeAuthState>;

beforeEach(() => {
  apiMock.getSessions.mockResolvedValue(paginated([makeSession()]));
  apiMock.getTokens.mockResolvedValue(paginated([makeToken()]));
  apiMock.createToken.mockResolvedValue(
    makeToken({ id: 'tok-new', name: 'ci-dev', token: 'TWEXT-secret-1' }),
  );
  authState = makeAuthState();
  useAuthMock.mockReset();
  useAuthMock.mockReturnValue(authState);
});

describe('SessionsTokensPage', () => {
  const tokenNameInput = () => screen.getByPlaceholderText(/github-actions-ci or release-bot/);

  it('renders the token and session panels', async () => {
    render(<SessionsTokensPage onNavigate={noop} />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Sessions & Automation Tokens' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('Active Tokens (1)')).toBeInTheDocument();
    expect(screen.getByText('Active Web Sessions')).toBeInTheDocument();
    expect(screen.getByText('ci-deploy')).toBeInTheDocument();
  });

  it('requires a token name and at least one scope', async () => {
    const user = userEvent.setup();
    render(<SessionsTokensPage onNavigate={noop} />);
    await screen.findByText('Active Tokens (1)');
    const form = document.querySelector('form');
    expect(form).not.toBeNull();
    fireEvent.submit(form!);
    expect(screen.getByText('Please provide a name for the automation token.')).toBeInTheDocument();

    await user.type(tokenNameInput(), 'ci-dev');
    await user.click(screen.getByRole('checkbox', { name: /publish/ }));
    await user.click(screen.getByRole('button', { name: /Create Automation Token/ }));
    expect(
      screen.getByText('At least one scope (publish or yank) must be selected.'),
    ).toBeInTheDocument();
  });

  it('creates a token and reveals the one-time secret', async () => {
    const user = userEvent.setup();
    render(<SessionsTokensPage onNavigate={noop} />);
    await screen.findByText('Active Tokens (1)');
    await user.type(tokenNameInput(), 'ci-dev');
    await user.click(screen.getByRole('button', { name: /Create Automation Token/ }));
    expect(apiMock.createToken).toHaveBeenCalledWith({ name: 'ci-dev', scopes: ['publish'] });
    expect(await screen.findByText('Your New Automation Token')).toBeInTheDocument();
    expect(screen.getByText('TWEXT-secret-1')).toBeInTheDocument();
    expect(screen.getByText('Automation token generated successfully.')).toBeInTheDocument();
  });

  it('revokes an active session', async () => {
    const user = userEvent.setup();
    render(<SessionsTokensPage onNavigate={noop} />);
    await screen.findByText('Active Tokens (1)');
    await user.click(screen.getAllByRole('button', { name: 'Revoke' })[0]);
    expect(apiMock.revokeSession).toHaveBeenCalledWith('sess-1');
    expect(await screen.findByText('Session revoked successfully.')).toBeInTheDocument();
  });

  it('deletes an automation token after confirmation', async () => {
    const user = userEvent.setup();
    render(<SessionsTokensPage onNavigate={noop} />);
    await screen.findByText('Active Tokens (1)');
    await user.click(screen.getByRole('button', { name: 'Revoke Token' }));
    expect(apiMock.deleteToken).toHaveBeenCalledWith('tok-1');
    expect(await screen.findByText('Token deleted successfully.')).toBeInTheDocument();
  });
});
