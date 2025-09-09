import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Features', href: '#features' },
    { name: 'Views', href: '#views' },
    { name: 'Privacy', href: '#privacy' },
    { name: 'Tutorial', href: '#tutorial' },
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
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-purple-600">Momentum</div>
              <div className="hidden lg:flex text-xs text-gray-500 ml-2">
                <span>FlowState</span>
                <span className="mx-1">·</span>
                <span>Zen</span>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-8" aria-label="Main navigation">
              {navItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 rounded-md px-2 py-1"
                >
                  {item.name}
                </a>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <a
                href="/#/app"
                className="hidden md:inline-flex items-center justify-center px-6 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
              >
                Open App
              </a>
              <a
                href="/OVERVIEW.md"
                className="hidden md:inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 rounded-md"
              >
                Read Overview
              </a>
              
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
                <a
                  key={item.name}
                  href={item.href}
                  className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              <div className="pt-4 space-y-2">
                <a
                  href="/#/app"
                  className="block w-full text-center px-4 py-2 text-base font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Open App
                </a>
                <a
                  href="/OVERVIEW.md"
                  className="block w-full text-center px-4 py-2 text-base font-medium text-purple-600 hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Read Overview
                </a>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;