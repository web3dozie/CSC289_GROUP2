import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';

const Hero: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-b from-purple-50 via-white to-white py-20 md:py-32">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse animation-delay-2000"></div>
      </div>
      
      <div className="container mx-auto px-4 md:px-6 text-center relative">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-6 animate-fade-in">
          Lock in. Get it done. Stay zen.
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-10 animate-slide-up">
          A classy, local-first task companion that's fast, private, and helps you lock in—so you finish what matters and enjoy the process.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animation-delay-200">
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-full transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2"
          >
            Open App
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
        
        <div className="mt-16 relative">
          <div className="aspect-w-16 aspect-h-9 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl shadow-2xl p-8 md:p-12">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-900">Today's Focus</h3>
                    <p className="text-sm text-gray-500">3 tasks to complete</p>
                  </div>
                  <div className="text-3xl">✨</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                    <div className="w-5 h-5 border-2 border-purple-600 rounded mr-3"></div>
                    <span className="text-gray-700">Complete project proposal</span>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-5 h-5 border-2 border-gray-400 rounded mr-3"></div>
                    <span className="text-gray-700">Review team feedback</span>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-5 h-5 border-2 border-gray-400 rounded mr-3"></div>
                    <span className="text-gray-700">Prepare for tomorrow's meeting</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;