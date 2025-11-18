import { describe, it, expect } from 'vitest'
import { TUTORIAL_STEPS, type TutorialStep } from '../../src/config/tutorialSteps'

describe('tutorialSteps configuration', () => {
  it('should export TUTORIAL_STEPS array', () => {
    expect(TUTORIAL_STEPS).toBeDefined()
    expect(Array.isArray(TUTORIAL_STEPS)).toBe(true)
    expect(TUTORIAL_STEPS.length).toBeGreaterThan(0)
  })

  it('should have valid structure for each step', () => {
    TUTORIAL_STEPS.forEach((step: TutorialStep) => {
      expect(step.id).toBeDefined()
      expect(typeof step.id).toBe('string')
      expect(step.title).toBeDefined()
      expect(typeof step.title).toBe('string')
      expect(step.description).toBeDefined()
      expect(typeof step.description).toBe('string')
    })
  })

  it('should have unique step ids', () => {
    const ids = TUTORIAL_STEPS.map(step => step.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('should include welcome step', () => {
    const welcomeStep = TUTORIAL_STEPS.find(step => step.id === 'welcome')
    expect(welcomeStep).toBeDefined()
    expect(welcomeStep?.title).toContain('Welcome')
  })

  it('should include completion step', () => {
    const completeStep = TUTORIAL_STEPS.find(step => step.id === 'complete')
    expect(completeStep).toBeDefined()
  })

  it('should have valid position values when defined', () => {
    const validPositions = ['top', 'bottom', 'left', 'right', 'center']
    TUTORIAL_STEPS.forEach(step => {
      if (step.position) {
        expect(validPositions).toContain(step.position)
      }
    })
  })

  it('should have valid route patterns when defined', () => {
    TUTORIAL_STEPS.forEach(step => {
      if (step.requiredRoute) {
        expect(step.requiredRoute).toMatch(/^\//)
      }
    })
  })

  it('should have autoNavigate only when requiredRoute exists', () => {
    TUTORIAL_STEPS.forEach(step => {
      if (step.autoNavigate) {
        expect(step.requiredRoute).toBeDefined()
      }
    })
  })
})
