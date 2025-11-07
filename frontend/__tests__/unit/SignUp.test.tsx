import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import SignUp from '../../src/components/landing/SignUp';
import * as AuthContext from '../../src/contexts/AuthContext';
import * as TutorialContext from '../../src/contexts/TutorialContext';

// Mock the contexts
const mockSetup = vi.fn();
const mockClearError = vi.fn();
const mockStartTutorial = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../src/contexts/TutorialContext', () => ({
  useTutorial: vi.fn(),
}));

describe('SignUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      setup: mockSetup,
      isLoading: false,
      error: null,
      clearError: mockClearError,
      user: null,
      login: vi.fn(),
      logout: vi.fn(),
      changePin: vi.fn(),
      changeUsername: vi.fn(),
      isAuthenticated: false,
      isLocked: false,
      unlock: vi.fn(),
      lock: vi.fn(),
      updateActivity: vi.fn(),
    });

    vi.mocked(TutorialContext.useTutorial).mockReturnValue({
      startTutorial: mockStartTutorial,
      currentStep: { id: 'welcome', title: '', description: '' },
      currentStepIndex: 0,
      totalSteps: 10,
      isActive: false,
      nextStep: vi.fn(),
      previousStep: vi.fn(),
      goToStep: vi.fn(),
      skipTutorial: vi.fn(),
    });
  });

  describe('Initial Rendering', () => {
    it('renders the signup form with all fields', () => {
      render(<SignUp />);
      
      expect(screen.getByText('Set Up Task Line')).toBeInTheDocument();
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Email (Optional)')).toBeInTheDocument();
      expect(screen.getByLabelText('PIN Code')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm PIN')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
    });

    it('renders decorative elements', () => {
      const { container } = render(<SignUp />);
      
      // Check for animated background elements
      const blobs = container.querySelectorAll('.animate-pulse');
      expect(blobs.length).toBeGreaterThan(0);
      
      // Check for floating particles
      const particles = container.querySelectorAll('.animate-ping');
      expect(particles.length).toBe(20);
    });

    it('renders UserPlus icon', () => {
      const { container } = render(<SignUp />);
      
      // The icon should be in a bouncing container
      const iconContainer = container.querySelector('.animate-bounce');
      expect(iconContainer).toBeInTheDocument();
    });

    it('has disabled submit button initially', () => {
      render(<SignUp />);
      
      const submitButton = screen.getByRole('button', { name: /Create Account/i });
      expect(submitButton).toBeDisabled();
    });

    it('renders sign in link', () => {
      render(<SignUp />);
      
      expect(screen.getByText('Already have an account?')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign In Instead/i })).toBeInTheDocument();
    });
  });

  describe('Form Input Handling', () => {
    it('updates username field on input', async () => {
      const user = userEvent.setup();
      render(<SignUp />);
      
      const usernameInput = screen.getByLabelText('Username');
      await user.type(usernameInput, 'testuser');
      
      expect(usernameInput).toHaveValue('testuser');
    });

    it('updates email field on input', async () => {
      const user = userEvent.setup();
      render(<SignUp />);
      
      const emailInput = screen.getByLabelText('Email (Optional)');
      await user.type(emailInput, 'test@example.com');
      
      expect(emailInput).toHaveValue('test@example.com');
    });

    it('updates PIN field with only digits', async () => {
      const user = userEvent.setup();
      render(<SignUp />);
      
      const pinInput = screen.getByLabelText('PIN Code');
      await user.type(pinInput, '1234abc567');
      
      // Should only contain digits
      expect(pinInput).toHaveValue('1234567');
    });

    it('limits PIN to 8 digits', async () => {
      const user = userEvent.setup();
      render(<SignUp />);
      
      const pinInput = screen.getByLabelText('PIN Code');
      await user.type(pinInput, '123456789012345');
      
      expect(pinInput).toHaveValue('12345678');
    });

    it('updates confirm PIN field with only digits', async () => {
      const user = userEvent.setup();
      render(<SignUp />);
      
      const confirmPinInput = screen.getByLabelText('Confirm PIN');
      await user.type(confirmPinInput, '1234abc');
      
      expect(confirmPinInput).toHaveValue('1234');
    });

    it('limits confirm PIN to 8 digits', async () => {
      const user = userEvent.setup();
      render(<SignUp />);
      
      const confirmPinInput = screen.getByLabelText('Confirm PIN');
      await user.type(confirmPinInput, '123456789012345');
      
      expect(confirmPinInput).toHaveValue('12345678');
    });
  });

  describe('PIN Visibility Toggle', () => {
    it('toggles PIN visibility when eye icon is clicked', async () => {
      const user = userEvent.setup();
      render(<SignUp />);
      
      const pinInput = screen.getByLabelText('PIN Code');
      expect(pinInput).toHaveAttribute('type', 'password');
      
      // Find and click the toggle button in the PIN field
      const toggleButtons = screen.getAllByRole('button', { name: '' });
      const pinToggle = toggleButtons[0]; // First toggle is for PIN
      
      await user.click(pinToggle);
      expect(pinInput).toHaveAttribute('type', 'text');
      
      await user.click(pinToggle);
      expect(pinInput).toHaveAttribute('type', 'password');
    });

    it('toggles confirm PIN visibility when eye icon is clicked', async () => {
      const user = userEvent.setup();
      render(<SignUp />);
      
      const confirmPinInput = screen.getByLabelText('Confirm PIN');
      expect(confirmPinInput).toHaveAttribute('type', 'password');
      
      // Find and click the toggle button in the confirm PIN field
      const toggleButtons = screen.getAllByRole('button', { name: '' });
      const confirmToggle = toggleButtons[1]; // Second toggle is for confirm PIN
      
      await user.click(confirmToggle);
      expect(confirmPinInput).toHaveAttribute('type', 'text');
      
      await user.click(confirmToggle);
      expect(confirmPinInput).toHaveAttribute('type', 'password');
    });
  });

  describe('PIN Validation', () => {
    it('shows error when PINs do not match', async () => {
      const user = userEvent.setup();
      render(<SignUp />);
      
      const pinInput = screen.getByLabelText('PIN Code');
      const confirmPinInput = screen.getByLabelText('Confirm PIN');
      
      await user.type(pinInput, '1234');
      await user.type(confirmPinInput, '5678');
      
      expect(screen.getByText('PINs do not match')).toBeInTheDocument();
    });

    it('does not show error when PINs match', async () => {
      const user = userEvent.setup();
      render(<SignUp />);
      
      const pinInput = screen.getByLabelText('PIN Code');
      const confirmPinInput = screen.getByLabelText('Confirm PIN');
      
      await user.type(pinInput, '1234');
      await user.type(confirmPinInput, '1234');
      
      expect(screen.queryByText('PINs do not match')).not.toBeInTheDocument();
    });

    it('disables submit button when PIN is less than 4 digits', async () => {
      const user = userEvent.setup();
      render(<SignUp />);
      
      const usernameInput = screen.getByLabelText('Username');
      const pinInput = screen.getByLabelText('PIN Code');
      const confirmPinInput = screen.getByLabelText('Confirm PIN');
      const submitButton = screen.getByRole('button', { name: /Create Account/i });
      
      await user.type(usernameInput, 'testuser');
      await user.type(pinInput, '123');
      await user.type(confirmPinInput, '123');
      
      expect(submitButton).toBeDisabled();
    });

    it('enables submit button when all conditions are met', async () => {
      const user = userEvent.setup();
      render(<SignUp />);
      
      const usernameInput = screen.getByLabelText('Username');
      const pinInput = screen.getByLabelText('PIN Code');
      const confirmPinInput = screen.getByLabelText('Confirm PIN');
      const submitButton = screen.getByRole('button', { name: /Create Account/i });
      
      await user.type(usernameInput, 'testuser');
      await user.type(pinInput, '1234');
      await user.type(confirmPinInput, '1234');
      
      expect(submitButton).not.toBeDisabled();
    });

    it('displays PIN requirements text', () => {
      render(<SignUp />);
      
      expect(screen.getByText('4-8 digits • Numbers only')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('calls setup with correct data on successful submission', async () => {
      const user = userEvent.setup();
      mockSetup.mockResolvedValue(undefined);
      
      render(<SignUp />);
      
      await user.type(screen.getByLabelText('Username'), 'testuser');
      await user.type(screen.getByLabelText('Email (Optional)'), 'test@example.com');
      await user.type(screen.getByLabelText('PIN Code'), '1234');
      await user.type(screen.getByLabelText('Confirm PIN'), '1234');
      
      const submitButton = screen.getByRole('button', { name: /Create Account/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockSetup).toHaveBeenCalledWith({
          pin: '1234',
          username: 'testuser',
          email: 'test@example.com',
        });
      });
    });

    it('calls setup without email when email is not provided', async () => {
      const user = userEvent.setup();
      mockSetup.mockResolvedValue(undefined);
      
      render(<SignUp />);
      
      await user.type(screen.getByLabelText('Username'), 'testuser');
      await user.type(screen.getByLabelText('PIN Code'), '1234');
      await user.type(screen.getByLabelText('Confirm PIN'), '1234');
      
      const submitButton = screen.getByRole('button', { name: /Create Account/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(mockSetup).toHaveBeenCalledWith({
          pin: '1234',
          username: 'testuser',
          email: '',
        });
      });
    });

    it('navigates to /app on successful signup', async () => {
      const user = userEvent.setup();
      mockSetup.mockResolvedValue(undefined);
      
      render(<SignUp />);
      
      await user.type(screen.getByLabelText('Username'), 'testuser');
      await user.type(screen.getByLabelText('PIN Code'), '1234');
      await user.type(screen.getByLabelText('Confirm PIN'), '1234');
      
      await user.click(screen.getByRole('button', { name: /Create Account/i }));
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith({ to: '/app' });
      });
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when isLoading is true', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        setup: mockSetup,
        isLoading: true,
        error: null,
        clearError: mockClearError,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        changePin: vi.fn(),
        changeUsername: vi.fn(),
        isAuthenticated: false,
        isLocked: false,
        unlock: vi.fn(),
        lock: vi.fn(),
        updateActivity: vi.fn(),
      });
      
      render(<SignUp />);
      
      expect(screen.getByText('Creating Account...')).toBeInTheDocument();
      
      // Check for spinner element
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('disables submit button when loading', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        setup: mockSetup,
        isLoading: true,
        error: null,
        clearError: mockClearError,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        changePin: vi.fn(),
        changeUsername: vi.fn(),
        isAuthenticated: false,
        isLocked: false,
        unlock: vi.fn(),
        lock: vi.fn(),
        updateActivity: vi.fn(),
      });
      
      render(<SignUp />);
      
      const submitButton = screen.getByRole('button', { name: /Creating Account/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('displays error from auth context', () => {
      vi.mocked(AuthContext.useAuth).mockReturnValue({
        setup: mockSetup,
        isLoading: false,
        error: 'Failed to create account',
        clearError: mockClearError,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        changePin: vi.fn(),
        changeUsername: vi.fn(),
        isAuthenticated: false,
        isLocked: false,
        unlock: vi.fn(),
        lock: vi.fn(),
        updateActivity: vi.fn(),
      });
      
      render(<SignUp />);
      
      expect(screen.getByText('Failed to create account')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('requires username field', () => {
      render(<SignUp />);
      
      const usernameInput = screen.getByLabelText('Username');
      expect(usernameInput).toBeRequired();
    });

    it('requires PIN field', () => {
      render(<SignUp />);
      
      const pinInput = screen.getByLabelText('PIN Code');
      expect(pinInput).toBeRequired();
    });

    it('requires confirm PIN field', () => {
      render(<SignUp />);
      
      const confirmPinInput = screen.getByLabelText('Confirm PIN');
      expect(confirmPinInput).toBeRequired();
    });

    it('does not require email field', () => {
      render(<SignUp />);
      
      const emailInput = screen.getByLabelText('Email (Optional)');
      expect(emailInput).not.toBeRequired();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<SignUp />);
      
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('Email (Optional)')).toBeInTheDocument();
      expect(screen.getByLabelText('PIN Code')).toBeInTheDocument();
      expect(screen.getByLabelText('Confirm PIN')).toBeInTheDocument();
    });

    it('has focus styles on submit button', () => {
      render(<SignUp />);
      
      const submitButton = screen.getByRole('button', { name: /Create Account/i });
      expect(submitButton).toHaveClass('focus:outline-none');
      expect(submitButton).toHaveClass('focus:ring-2');
    });
  });
});
