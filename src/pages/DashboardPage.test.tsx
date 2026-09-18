import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardPage } from './DashboardPage';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { makeAuthState, makeExtension, makeUser, paginated, noop } from '../test/testUtils';

vi.mock('../services/api');
vi.mock('../context/AuthContext');

const apiMock = vi.mocked(api);
const useAuthMock = vi.mocked(useAuth);
let authState: ReturnType<typeof makeAuthState>;

beforeEach(() => {
  apiMock.searchExtensions.mockResolvedValue(paginated([makeExtension()]));
  apiMock.updateUser.mockResolvedValue(makeUser());
  authState = makeAuthState();
  useAuthMock.mockReset();
  useAuthMock.mockReturnValue(authState);
});

describe('DashboardPage', () => {
  it('renders the authenticated profile header and shortcuts', async () => {
    render(<DashboardPage onNavigate={noop} />);
    expect(await screen.findByText('Your Extensions')).toBeInTheDocument();
    expect(screen.getByText('Automation Tokens & Sessions')).toBeInTheDocument();
    expect(screen.getAllByText('Publish Extension').length).toBeGreaterThan(0);
    expect(screen.getByText(/Terms Accepted/)).toBeInTheDocument();
  });

  it('lists extensions owned by the current user', async () => {
    render(<DashboardPage onNavigate={noop} />);
    expect(await screen.findByText('Demo Extension')).toBeInTheDocument();
    expect(apiMock.searchExtensions).toHaveBeenCalledWith('kane', { limit: 50 });
  });

  it('shows an empty state when the user has no published extensions', async () => {
    apiMock.searchExtensions.mockResolvedValue(paginated([]));
    render(<DashboardPage onNavigate={noop} />);
    expect(await screen.findByText('No extensions under @kane yet')).toBeInTheDocument();
  });

  it('saves profile changes', async () => {
    const user = userEvent.setup();
    render(<DashboardPage onNavigate={noop} />);
    await screen.findByText('Your Extensions');
    await user.click(screen.getByRole('button', { name: 'Edit Profile' }));
    const displayName = screen.getByPlaceholderText('e.g. Kane Marshall');
    await user.clear(displayName);
    await user.type(displayName, 'Kane Marshall');
    await user.click(screen.getByRole('button', { name: 'Save Profile Changes' }));
    expect(apiMock.updateUser).toHaveBeenCalledWith('kane', { displayName: 'Kane Marshall' });
    expect(authState.refreshUser).toHaveBeenCalled();
    expect(await screen.findByText('Account profile updated successfully.')).toBeInTheDocument();
  });

  it('redirects a signed-out visitor to login', async () => {
    useAuthMock.mockReturnValue(makeAuthState({ user: null, token: null, isAuthenticated: false }));
    const onNavigate = vi.fn();
    render(<DashboardPage onNavigate={onNavigate} />);
    expect(await screen.findByText('Redirecting to login...')).toBeInTheDocument();
    expect(onNavigate).toHaveBeenCalledWith('login');
  });
});
