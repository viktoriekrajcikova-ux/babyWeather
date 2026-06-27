import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from './login'

const mockNavigate = vi.fn()
const mockSignIn = vi.fn()

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}))


vi.mock('../hooks/useAuth', () => ({
    useAuth: () => ({ signIn: mockSignIn, signUp: vi.fn() }),
}))

describe('Login', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('po úspěšném přihlášení zavolá signIn a přesměruje na /', async () => {
        mockSignIn.mockResolvedValue({})
        const user = userEvent.setup()
        render(<Login />)

        await user.type(screen.getByPlaceholderText('Email'), 'a@b.cz')
        await user.type(screen.getByPlaceholderText('Password'), 'tajneheslo')
        await user.click(screen.getByRole('button', { name: 'Sign In' }))

        expect(mockSignIn).toHaveBeenCalledWith('a@b.cz', 'tajneheslo')
        expect(mockNavigate).toHaveBeenCalledWith('/')
    })

    it('po neúspěšném přihlášení zobrazí chybu', async () => {
        mockSignIn.mockRejectedValue(new Error('Špatné heslo'))
        const user = userEvent.setup()
        render(<Login />)

        await user.type(screen.getByPlaceholderText('Email'), 'a@b.cz')
        await user.type(screen.getByPlaceholderText('Password'), 'spatne')
        await user.click(screen.getByRole('button', { name: 'Sign In' }))

        expect(await screen.findByText('Špatné heslo')).toBeInTheDocument()
        expect(mockNavigate).not.toHaveBeenCalled()
})})
