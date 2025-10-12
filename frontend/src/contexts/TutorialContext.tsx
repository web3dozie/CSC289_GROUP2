import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { TUTORIAL_STEPS, type TutorialStep } from '../config/tutorialSteps'

interface TutorialContextType {
  isActive: boolean
  currentStepIndex: number
  currentStep: TutorialStep | null
  totalSteps: number
  startTutorial: () => void
  nextStep: () => void
  previousStep: () => void
  skipTutorial: () => void
  goToStep: (index: number) => void
}

const TutorialContext = createContext<TutorialContextType | undefined>(undefined)

export const useTutorial = () => {
  const context = useContext(TutorialContext)
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider')
  }
  return context
}

interface TutorialProviderProps {
  children: React.ReactNode
}

const TUTORIAL_COMPLETED_KEY = 'taskline_tutorial_completed'
const TUTORIAL_ACTIVE_KEY = 'taskline_tutorial_active'

export const TutorialProvider: React.FC<TutorialProviderProps> = ({ children }) => {
  const [isActive, setIsActive] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // Check if tutorial should auto-start for first-time users
  useEffect(() => {
    const tutorialCompleted = localStorage.getItem(TUTORIAL_COMPLETED_KEY)
    const tutorialWasActive = sessionStorage.getItem(TUTORIAL_ACTIVE_KEY)
    
    // Auto-start tutorial if it's never been completed and wasn't active in this session
    if (!tutorialCompleted && !tutorialWasActive) {
      // Delay to allow the app to render first
      const timer = setTimeout(() => {
        setIsActive(true)
        sessionStorage.setItem(TUTORIAL_ACTIVE_KEY, 'true')
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const startTutorial = useCallback(() => {
    setIsActive(true)
    setCurrentStepIndex(0)
    sessionStorage.setItem(TUTORIAL_ACTIVE_KEY, 'true')
  }, [])

  const nextStep = useCallback(() => {
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    } else {
      // Tutorial complete
      setIsActive(false)
      localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true')
      sessionStorage.removeItem(TUTORIAL_ACTIVE_KEY)
    }
  }, [currentStepIndex])

  const previousStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
    }
  }, [currentStepIndex])

  const skipTutorial = useCallback(() => {
    setIsActive(false)
    localStorage.setItem(TUTORIAL_COMPLETED_KEY, 'true')
    sessionStorage.removeItem(TUTORIAL_ACTIVE_KEY)
  }, [])

  const goToStep = useCallback((index: number) => {
    if (index >= 0 && index < TUTORIAL_STEPS.length) {
      setCurrentStepIndex(index)
    }
  }, [])

  const currentStep = isActive ? TUTORIAL_STEPS[currentStepIndex] : null

  const value: TutorialContextType = {
    isActive,
    currentStepIndex,
    currentStep,
    totalSteps: TUTORIAL_STEPS.length,
    startTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    goToStep,
  }

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  )
}
