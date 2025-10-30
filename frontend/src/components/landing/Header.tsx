import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link } from '@tanstack/react-router';

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Features', href: '#features' },
    { name: 'Views', href: '#views' },
    { name: 'Privacy', href: '#privacy' },
    { name: 'FAQ', href: '#faq' },
  ];

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-purple-600 text-white px-4 py-2 rounded-md">
        Skip to main content
      </a>
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2 flex-1">
              <div className="text-2xl font-bold text-purple-600">Task Line</div>
            </div>

            <nav className="hidden md:flex items-center justify-center space-x-8 flex-1" aria-label="Main navigation">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 rounded-md px-2 py-1"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="flex items-center justify-end space-x-4 flex-1">
              <Link
                to="/login"
                className="hidden md:inline-flex items-center justify-center px-6 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
              >
                Open App
              </Link>
              <Link
                to="/overview"
                className="hidden md:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 rounded-md"
              >
                Read Overview
              </Link>
              
              <button
                className="md:hidden p-2 text-gray-700 hover:text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 rounded-md"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <nav className="container mx-auto px-4 py-4 space-y-2" aria-label="Mobile navigation">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 space-y-2">
                <Link
                  to="/login"
                  className="block w-full text-center px-4 py-2 text-base font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Open App
                </Link>
                <Link
                  to="/overview"
                  className="block w-full text-center px-4 py-2 text-base font-medium text-purple-600 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Read Overview
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;

