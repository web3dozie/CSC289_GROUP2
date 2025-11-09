import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TutorialOverlay } from '../../src/components/TutorialOverlay'

// Mock TutorialContext
const mockUseTutorial = vi.fn()
vi.mock('../../src/contexts/TutorialContext', async () => {
  const actual = await vi.importActual('../../src/contexts/TutorialContext')
  return {
    ...actual,
    useTutorial: () => mockUseTutorial()
  }
})

// Mock router hooks
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/' })
  }
})

const renderWithProviders = (component: React.ReactElement) => {
  return render(component)
}

describe('TutorialOverlay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should not render when tutorial is not active', () => {
      mockUseTutorial.mockReturnValue({
        isActive: false,
        currentStep: null,
        currentStepIndex: 0,
        totalSteps: 5,
        nextStep: vi.fn(),
        previousStep: vi.fn(),
        skipTutorial: vi.fn()
      })

      const { container } = renderWithProviders(<TutorialOverlay />)
      expect(container.firstChild).toBeNull()
    })

    it('should render tutorial overlay when active', () => {
      mockUseTutorial.mockReturnValue({
        isActive: true,
        currentStep: {
          id: 'step1',
          title: 'Welcome',
          description: 'Welcome to the tutorial',
          position: 'center',
          targetSelector: null
        },
        currentStepIndex: 0,
        totalSteps: 5,
        nextStep: vi.fn(),
        previousStep: vi.fn(),
        skipTutorial: vi.fn()
      })

      renderWithProviders(<TutorialOverlay />)
      expect(screen.getByText('Welcome')).toBeInTheDocument()
      expect(screen.getByText('Welcome to the tutorial')).toBeInTheDocument()
    })

    it('should show step progress', () => {
      mockUseTutorial.mockReturnValue({
        isActive: true,
        currentStep: {
          id: 'step2',
          title: 'Step 2',
          description: 'Second step',
          position: 'center'
        },
        currentStepIndex: 1,
        totalSteps: 5,
        nextStep: vi.fn(),
        previousStep: vi.fn(),
        skipTutorial: vi.fn()
      })

      renderWithProviders(<TutorialOverlay />)
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('of 5')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should call nextStep when Next button is clicked', async () => {
      const nextStep = vi.fn()
      mockUseTutorial.mockReturnValue({
        isActive: true,
        currentStep: {
          id: 'step1',
          title: 'Step 1',
          description: 'First step',
          position: 'center'
        },
        currentStepIndex: 0,
        totalSteps: 5,
        nextStep,
        previousStep: vi.fn(),
        skipTutorial: vi.fn()
      })

      renderWithProviders(<TutorialOverlay />)
      const nextButton = screen.getByRole('button', { name: /next step/i })
      await userEvent.click(nextButton)
      
      expect(nextStep).toHaveBeenCalled()
    })

    it('should call previousStep when Back button is clicked', async () => {
      const previousStep = vi.fn()
      mockUseTutorial.mockReturnValue({
        isActive: true,
        currentStep: {
          id: 'step2',
          title: 'Step 2',
          description: 'Second step',
          position: 'center'
        },
        currentStepIndex: 1,
        totalSteps: 5,
        nextStep: vi.fn(),
        previousStep,
        skipTutorial: vi.fn()
      })

      renderWithProviders(<TutorialOverlay />)
      const backButton = screen.getByRole('button', { name: /previous step/i })
      await userEvent.click(backButton)
      
      expect(previousStep).toHaveBeenCalled()
    })

    it('should call skipTutorial when Skip button is clicked', async () => {
      const skipTutorial = vi.fn()
      mockUseTutorial.mockReturnValue({
        isActive: true,
        currentStep: {
          id: 'step1',
          title: 'Step 1',
          description: 'First step',
          position: 'center'
        },
        currentStepIndex: 0,
        totalSteps: 5,
        nextStep: vi.fn(),
        previousStep: vi.fn(),
        skipTutorial
      })

      renderWithProviders(<TutorialOverlay />)
      const skipButtons = screen.getAllByRole('button', { name: /skip tutorial/i })
      await userEvent.click(skipButtons[0])
      
      expect(skipTutorial).toHaveBeenCalled()
    })

    it('should disable Back button on first step', () => {
      mockUseTutorial.mockReturnValue({
        isActive: true,
        currentStep: {
          id: 'step1',
          title: 'Step 1',
          description: 'First step',
          position: 'center'
        },
        currentStepIndex: 0,
        totalSteps: 5,
        nextStep: vi.fn(),
        previousStep: vi.fn(),
        skipTutorial: vi.fn()
      })

      renderWithProviders(<TutorialOverlay />)
      const backButton = screen.getByRole('button', { name: /previous step/i })
      
      expect(backButton).toBeDisabled()
    })

    it('should show Finish button on last step', () => {
      mockUseTutorial.mockReturnValue({
        isActive: true,
        currentStep: {
          id: 'step5',
          title: 'Final Step',
          description: 'Last step',
          position: 'center'
        },
        currentStepIndex: 4,
        totalSteps: 5,
        nextStep: vi.fn(),
        previousStep: vi.fn(),
        skipTutorial: vi.fn()
      })

      renderWithProviders(<TutorialOverlay />)
      expect(screen.getByRole('button', { name: /finish tutorial/i })).toBeInTheDocument()
    })
  })

  describe('Progress Bar', () => {
    it('should show correct progress percentage', () => {
      mockUseTutorial.mockReturnValue({
        isActive: true,
        currentStep: {
          id: 'step3',
          title: 'Step 3',
          description: 'Third step',
          position: 'center'
        },
        currentStepIndex: 2,
        totalSteps: 5,
        nextStep: vi.fn(),
        previousStep: vi.fn(),
        skipTutorial: vi.fn()
      })

      renderWithProviders(<TutorialOverlay />)
      const progressBar = screen.getByRole('progressbar')
      
      expect(progressBar).toHaveAttribute('aria-valuenow', '3')
      expect(progressBar).toHaveAttribute('aria-valuemax', '5')
    })
  })
})
