import { describe, it, expect } from 'vitest'
import { render, screen, act } from './test-utils'
import userEvent from '@testing-library/user-event'
import Login from '../src/components/landing/Login'

describe('Login', () => {
  it('renders the login form with all fields', () => {
    render(<Login />)

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/pin code/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /unlock app/i })).toBeInTheDocument()
  })

  it('validates PIN input to only allow numbers', async () => {
    const user = userEvent.setup()
    render(<Login />)

    const pinInput = screen.getByLabelText(/pin code/i)
    await act(async () => {
      await user.type(pinInput, 'abc123def')
    })

    expect(pinInput).toHaveValue('123')
  })

  it('limits PIN to 8 digits', async () => {
    const user = userEvent.setup()
    render(<Login />)

    const pinInput = screen.getByLabelText(/pin code/i)
    await act(async () => {
      await user.type(pinInput, '123456789')
    })

    expect(pinInput).toHaveValue('12345678')
  })

  it('toggles PIN visibility', async () => {
    const user = userEvent.setup()
    render(<Login />)

    const pinInput = screen.getByLabelText(/pin code/i)
    const toggleButton = screen.getByRole('button', { name: '' }) // The eye icon button

    expect(pinInput).toHaveAttribute('type', 'password')

    await act(async () => {
      await user.click(toggleButton)
    })
    expect(pinInput).toHaveAttribute('type', 'text')

    await act(async () => {
      await user.click(toggleButton)
    })
    expect(pinInput).toHaveAttribute('type', 'password')
  })

  it('disables submit button when form is invalid', () => {
    render(<Login />)

    const submitButton = screen.getByRole('button', { name: /unlock app/i })
    expect(submitButton).toBeDisabled()
  })

  it('enables submit button when form is valid', async () => {
    const user = userEvent.setup()
    render(<Login />)

    const pinInput = screen.getByLabelText(/pin code/i)
    const submitButton = screen.getByRole('button', { name: /unlock app/i })


    await act(async () => {
      await user.type(usernameInput, 'testuser')
      await user.type(pinInput, '1234')
    })


    expect(submitButton).not.toBeDisabled()
  })
})