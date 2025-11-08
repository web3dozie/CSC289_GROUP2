import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import FAQ from '../../src/components/landing/FAQ';

// Mock @tanstack/react-router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

describe('FAQ', () => {
  describe('Initial Rendering', () => {
    it('renders the FAQ section with heading', () => {
      render(<FAQ />);
      
      expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
      expect(screen.getByText('Everything you need to know about Task Line')).toBeInTheDocument();
    });

    it('renders all FAQ items closed by default', () => {
      render(<FAQ />);
      
      // Check that all questions are rendered
      expect(screen.getByText('Does this work offline?')).toBeInTheDocument();
      expect(screen.getByText('Is my data private?')).toBeInTheDocument();
      expect(screen.getByText('Do I need AI?')).toBeInTheDocument();
      expect(screen.getByText('Can I export my data?')).toBeInTheDocument();
      expect(screen.getByText('How does the PIN lock work?')).toBeInTheDocument();
      expect(screen.getByText('What views are available?')).toBeInTheDocument();
      expect(screen.getByText('Can I use keyboard shortcuts?')).toBeInTheDocument();
      expect(screen.getByText('Is there a mobile version?')).toBeInTheDocument();
      
      // Check that answers are not visible initially
      expect(screen.queryByText(/All your data is stored locally/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Your data never leaves your device/)).not.toBeInTheDocument();
    });

    it('renders all 8 FAQ items', () => {
      render(<FAQ />);
      
      const buttons = screen.getAllByRole('button');
      // 8 FAQ buttons + link in the footer
      expect(buttons.length).toBeGreaterThanOrEqual(8);
    });

    it('renders the documentation link in footer', () => {
      render(<FAQ />);
      
      expect(screen.getByText('Still have questions?')).toBeInTheDocument();
      expect(screen.getByText('Check out our comprehensive documentation for more information.')).toBeInTheDocument();
      expect(screen.getByText('Read Documentation →')).toBeInTheDocument();
    });
  });

  describe('FAQ Accordion Interactions', () => {
    it('expands FAQ when clicked', async () => {
      const user = userEvent.setup();
      render(<FAQ />);
      
      const question = screen.getByText('Does this work offline?');
      await user.click(question);
      
      // Answer should now be visible
      expect(screen.getByText(/All your data is stored locally/)).toBeInTheDocument();
      expect(screen.getByText(/no internet connection is required/)).toBeInTheDocument();
    });

    it('collapses FAQ when clicked again', async () => {
      const user = userEvent.setup();
      render(<FAQ />);
      
      const question = screen.getByText('Is my data private?');
      
      // Open
      await user.click(question);
      expect(screen.getByText(/Your data never leaves your device/)).toBeInTheDocument();
      
      // Close
      await user.click(question);
      expect(screen.queryByText(/Your data never leaves your device/)).not.toBeInTheDocument();
    });

    it('closes previous FAQ when opening a new one', async () => {
      const user = userEvent.setup();
      render(<FAQ />);
      
      // Open first FAQ
      const question1 = screen.getByText('Does this work offline?');
      await user.click(question1);
      expect(screen.getByText(/All your data is stored locally/)).toBeInTheDocument();
      
      // Open second FAQ
      const question2 = screen.getByText('Is my data private?');
      await user.click(question2);
      
      // First should be closed, second should be open
      expect(screen.queryByText(/All your data is stored locally/)).not.toBeInTheDocument();
      expect(screen.getByText(/Your data never leaves your device/)).toBeInTheDocument();
    });

    it('toggles chevron icon when expanding/collapsing', async () => {
      const user = userEvent.setup();
      render(<FAQ />);
      
      const question = screen.getByText('Can I export my data?');
      const button = question.closest('button');
      
      // Initially closed - should show ChevronDown
      expect(button).toHaveAttribute('aria-expanded', 'false');
      
      // Open
      await user.click(question);
      expect(button).toHaveAttribute('aria-expanded', 'true');
      
      // Close
      await user.click(question);
      expect(button).toHaveAttribute('aria-expanded', 'false');
    });
  });

  describe('FAQ Content Verification', () => {
    it('displays correct answer for offline question', async () => {
      const user = userEvent.setup();
      render(<FAQ />);
      
      await user.click(screen.getByText('Does this work offline?'));
      
      expect(screen.getByText(/Task Line is designed to work completely offline/)).toBeInTheDocument();
      expect(screen.getByText(/All your data is stored locally on your device/)).toBeInTheDocument();
    });

    it('displays correct answer for privacy question', async () => {
      const user = userEvent.setup();
      render(<FAQ />);
      
      await user.click(screen.getByText('Is my data private?'));
      
      expect(screen.getByText(/Your data never leaves your device/)).toBeInTheDocument();
      expect(screen.getByText(/local SQLite storage/)).toBeInTheDocument();
    });

    it('displays correct answer for AI question', async () => {
      const user = userEvent.setup();
      render(<FAQ />);
      
      await user.click(screen.getByText('Do I need AI?'));
      
      expect(screen.getByText(/AI is completely optional/)).toBeInTheDocument();
      expect(screen.getByText(/off by default/)).toBeInTheDocument();
    });

    it('displays correct answer for export question', async () => {
      const user = userEvent.setup();
      render(<FAQ />);
      
      await user.click(screen.getByText('Can I export my data?'));
      
      expect(screen.getByText(/export all your data/)).toBeInTheDocument();
      expect(screen.getByText(/to a single JSON file/)).toBeInTheDocument();
    });

    it('displays correct answer for PIN lock question', async () => {
      const user = userEvent.setup();
      render(<FAQ />);
      
      await user.click(screen.getByText('How does the PIN lock work?'));
      
      expect(screen.getByText(/4-8 digit PIN/)).toBeInTheDocument();
      expect(screen.getByText(/automatically locks after 10 minutes/)).toBeInTheDocument();
    });

    it('displays correct answer for views question', async () => {
      const user = userEvent.setup();
      render(<FAQ />);
      
      await user.click(screen.getByText('What views are available?'));
      
      expect(screen.getByText(/four views/)).toBeInTheDocument();
      expect(screen.getByText(/List/)).toBeInTheDocument();
      expect(screen.getByText(/Board/)).toBeInTheDocument();
      expect(screen.getByText(/Calendar/)).toBeInTheDocument();
      expect(screen.getByText(/Review/)).toBeInTheDocument();
    });

    it('displays correct answer for keyboard shortcuts question', async () => {
      const user = userEvent.setup();
      render(<FAQ />);
      
      await user.click(screen.getByText('Can I use keyboard shortcuts?'));
      
      expect(screen.getByText(/keyboard-friendly/)).toBeInTheDocument();
      expect(screen.getByText(/adding tasks/)).toBeInTheDocument();
    });

    it('displays correct answer for mobile version question', async () => {
      const user = userEvent.setup();
      render(<FAQ />);
      
      await user.click(screen.getByText('Is there a mobile version?'));
      
      expect(screen.getByText(/optimized for desktop and tablet/)).toBeInTheDocument();
      expect(screen.getByText(/desktop-first design/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<FAQ />);
      
      const buttons = screen.getAllByRole('button').filter(btn => 
        btn.hasAttribute('aria-expanded')
      );
      
      // All FAQ buttons should have aria-expanded
      expect(buttons.length).toBe(8);
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-expanded', 'false');
      });
    });

    it('updates aria-expanded when opened', async () => {
      const user = userEvent.setup();
      render(<FAQ />);
      
      const button = screen.getByText('Does this work offline?').closest('button');
      
      expect(button).toHaveAttribute('aria-expanded', 'false');
      
      await user.click(button!);
      
      expect(button).toHaveAttribute('aria-expanded', 'true');
    });

    it('has focus ring styles on buttons', () => {
      render(<FAQ />);
      
      const button = screen.getByText('Does this work offline?').closest('button');
      
      // Check that focus ring classes are present
      expect(button).toHaveClass('focus:outline-none');
      expect(button).toHaveClass('focus:ring-2');
      expect(button).toHaveClass('focus:ring-purple-400');
    });
  });

  describe('Navigation Links', () => {
    it('renders documentation link with correct href', () => {
      render(<FAQ />);
      
      const link = screen.getByText('Read Documentation →');
      expect(link).toHaveAttribute('href', '/overview');
    });
  });

  describe('Multiple Interactions', () => {
    it('allows opening multiple FAQs in sequence', async () => {
      const user = userEvent.setup();
      render(<FAQ />);
      
      // Open first FAQ
      await user.click(screen.getByText('Does this work offline?'));
      expect(screen.getByText(/All your data is stored locally/)).toBeInTheDocument();
      
      // Open second FAQ (closes first)
      await user.click(screen.getByText('Is my data private?'));
      expect(screen.getByText(/Your data never leaves your device/)).toBeInTheDocument();
      
      // Open third FAQ (closes second)
      await user.click(screen.getByText('Do I need AI?'));
      expect(screen.getByText(/AI is completely optional/)).toBeInTheDocument();
    });

    it('allows rapid toggling of same FAQ', async () => {
      const user = userEvent.setup();
      render(<FAQ />);
      
      const question = screen.getByText('Can I export my data?');
      
      // Rapid toggle
      await user.click(question);
      await user.click(question);
      await user.click(question);
      await user.click(question);
      
      // Should be open (odd number of clicks)
      expect(screen.queryByText(/export all your data/)).not.toBeInTheDocument();
    });
  });
});
