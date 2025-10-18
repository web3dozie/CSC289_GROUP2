import React, { useEffect, useState, useCallback, useRef } from 'react'
import { X, ChevronRight, ChevronLeft, SkipForward, Move } from 'lucide-react'
import { useNavigate, useLocation } from '@tanstack/react-router'
import { useTutorial } from '../contexts/TutorialContext'

export const TutorialOverlay: React.FC = () => {
  const { isActive, currentStep, currentStepIndex, totalSteps, nextStep, previousStep, skipTutorial } = useTutorial()
  const navigate = useNavigate()
  const location = useLocation()
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [isNavigating, setIsNavigating] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [userHasDragged, setUserHasDragged] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // Handle automatic navigation when step requires a specific route
  useEffect(() => {
    if (!isActive || !currentStep) return

    // Check if current step requires a specific route
    if (currentStep.requiredRoute && currentStep.autoNavigate) {
      const currentPath = location.pathname
      
      // Only navigate if we're not already on the required route
      if (currentPath !== currentStep.requiredRoute) {
        setIsNavigating(true)
        navigate({ to: currentStep.requiredRoute as any })
        
        // Give navigation time to complete before showing tutorial
        setTimeout(() => {
          setIsNavigating(false)
        }, 500)
      }
    }
  }, [isActive, currentStep, location.pathname, navigate])

  // Find and highlight the target element
  const updateTargetElement = useCallback(() => {
    if (!currentStep?.targetSelector) {
      setTargetElement(null)
      return
    }

    const element = document.querySelector(currentStep.targetSelector) as HTMLElement
    setTargetElement(element)

    if (element) {
      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      
      // Calculate tooltip position with better height estimation
      const rect = element.getBoundingClientRect()
      const tooltipWidth = 320
      const tooltipMinHeight = 350 // Increased to account for all content including buttons
      
      let top = rect.top
      let left = rect.left

      switch (currentStep.position) {
        case 'top':
          top = rect.top - tooltipMinHeight - 20
          left = rect.left + (rect.width / 2) - (tooltipWidth / 2)
          break
        case 'bottom':
          top = rect.bottom + 20
          left = rect.left + (rect.width / 2) - (tooltipWidth / 2)
          break
        case 'left':
          top = rect.top + (rect.height / 2) - (tooltipMinHeight / 2)
          left = rect.left - tooltipWidth - 20
          break
        case 'right':
          top = rect.top + (rect.height / 2) - (tooltipMinHeight / 2)
          left = rect.right + 20
          break
        default:
          // Center position
          top = window.innerHeight / 2 - tooltipMinHeight / 2
          left = window.innerWidth / 2 - tooltipWidth / 2
      }

      // Ensure tooltip stays within viewport with more padding from edges
      const viewportPadding = 40 // Increased padding to prevent hiding behind taskbar
      top = Math.max(viewportPadding, Math.min(top, window.innerHeight - tooltipMinHeight - viewportPadding))
      left = Math.max(viewportPadding, Math.min(left, window.innerWidth - tooltipWidth - viewportPadding))

      setTooltipPosition({ top, left })
    }
  }, [currentStep])

  useEffect(() => {
    if (isActive && currentStep && !isNavigating) {
      // Reset drag state when step changes
      setUserHasDragged(false)
      
      // Delay to allow for navigation changes and DOM updates
      const timer = setTimeout(() => {
        updateTargetElement()
      }, 300)

      return () => clearTimeout(timer)
    }
  }, [isActive, currentStep, updateTargetElement, isNavigating])

  // Visual highlighting only - no z-index boost needed
  // Target elements stay below backdrop and are not clickable
  useEffect(() => {
    // No z-index manipulation needed for guided tour
    // Elements are highlighted visually with the purple ring only
  }, [targetElement])

  // Update position on window resize
  useEffect(() => {
    if (!isActive || userHasDragged) return

    const handleResize = () => {
      updateTargetElement()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isActive, updateTargetElement, userHasDragged])

  // Handle drag functionality
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only allow dragging from the header area
    const target = e.target as HTMLElement
    if (!target.closest('[data-drag-handle]')) return

    setIsDragging(true)
    setUserHasDragged(true)
    const rect = tooltipRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const newLeft = e.clientX - dragOffset.x
      const newTop = e.clientY - dragOffset.y

      // Keep within viewport bounds
      const maxLeft = window.innerWidth - (tooltipRef.current?.offsetWidth || 320)
      const maxTop = window.innerHeight - (tooltipRef.current?.offsetHeight || 400)

      setTooltipPosition({
        left: Math.max(20, Math.min(newLeft, maxLeft)),
        top: Math.max(20, Math.min(newTop, maxTop)),
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        skipTutorial()
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        nextStep()
      } else if (e.key === 'ArrowLeft') {
        previousStep()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, nextStep, previousStep, skipTutorial])

  if (!isActive || !currentStep || isNavigating) {
    return null
  }

  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === totalSteps - 1
  const isCenterPosition = currentStep.position === 'center' || !currentStep.targetSelector
  const shouldShowHighlight = targetElement && currentStep.targetSelector

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
        aria-hidden="true"
      />

      {/* Highlight for target element - now shows even when tooltip is centered */}
      {shouldShowHighlight && (
        <div
          className="fixed z-[10000] pointer-events-none"
          style={{
            top: targetElement.getBoundingClientRect().top - 4,
            left: targetElement.getBoundingClientRect().left - 4,
            width: targetElement.getBoundingClientRect().width + 8,
            height: targetElement.getBoundingClientRect().height + 8,
            border: '3px solid rgb(147, 51, 234)',
            borderRadius: '8px',
            animation: 'pulse 2s infinite',
          }}
        />
      )}

      {/* Tutorial tooltip */}
      <div
        ref={tooltipRef}
        className={`fixed z-[10001] bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-6 max-w-sm max-h-[calc(100vh-80px)] overflow-y-auto ${
          isDragging ? 'cursor-grabbing' : ''
        }`}
        style={isCenterPosition ? {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        } : {
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        aria-describedby="tutorial-description"
        onMouseDown={handleMouseDown}
      >
        {/* Header */}
        <div 
          className="flex items-start justify-between mb-4 cursor-grab active:cursor-grabbing"
          data-drag-handle
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Move className="w-4 h-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
              <span className="inline-flex items-center justify-center w-6 h-6 bg-purple-600 text-white text-xs font-bold rounded-full">
                {currentStepIndex + 1}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                of {totalSteps}
              </span>
            </div>
            <h3
              id="tutorial-title"
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              {currentStep.title}
            </h3>
          </div>
          <button
            onClick={skipTutorial}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
            aria-label="Skip tutorial"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <p
          id="tutorial-description"
          className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed"
        >
          {currentStep.description}
        </p>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
              role="progressbar"
              aria-valuenow={currentStepIndex + 1}
              aria-valuemin={0}
              aria-valuemax={totalSteps}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={previousStep}
            disabled={isFirstStep}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-md"
            aria-label="Previous step"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </button>

          <button
            onClick={skipTutorial}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 rounded-md"
            aria-label="Skip tutorial"
          >
            <SkipForward className="w-4 h-4 mr-1" />
            Skip
          </button>

          <button
            onClick={nextStep}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            aria-label={isLastStep ? 'Finish tutorial' : 'Next step'}
          >
            {isLastStep ? 'Finish' : 'Next'}
            <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>

        {/* Keyboard hints */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            <span className="inline-flex items-center gap-1 mb-1">
              <Move className="w-3 h-3" aria-hidden="true" />
              Drag to move
            </span>
            {' • '}
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">←</kbd> 
            {' '}<kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">→</kbd> 
            {' '}or{' '}
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">Enter</kbd>
            {' '}to navigate
            {' • '}
            <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600">Esc</kbd> to exit
          </p>
        </div>
      </div>

      {/* CSS for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
      `}</style>
    </>
  )
}
