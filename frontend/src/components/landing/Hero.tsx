import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';

const Hero: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20 md:py-32 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-4000"></div>
      </div>
      
      <div className="container mx-auto px-4 md:px-6 text-center relative">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 animate-fade-in drop-shadow-2xl">
          Lock in. Get it done. Stay zen.
        </h1>
        
        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-10 animate-slide-up">
          A classy, local-first task companion that's fast, private, and helps you lock in—so you finish what matters and enjoy the process.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up animation-delay-200">
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-8 py-3 text-base font-medium text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-full transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-900 shadow-lg shadow-purple-500/50"
          >
            Open App
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
        
        <div className="mt-16 relative">
          <div className="aspect-w-16 aspect-h-9 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/20 p-8 md:p-12">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-white">Today's Focus</h3>
                    <p className="text-sm text-gray-400">3 tasks to complete</p>
                  </div>
                  <div className="text-3xl">✨</div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-lg border border-purple-500/30">
                    <div className="w-5 h-5 border-2 border-purple-400 rounded mr-3"></div>
                    <span className="text-gray-200">Complete project proposal</span>
                  </div>
                  <div className="flex items-center p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
                    <div className="w-5 h-5 border-2 border-gray-500 rounded mr-3"></div>
                    <span className="text-gray-300">Review team feedback</span>
                  </div>
                  <div className="flex items-center p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
                    <div className="w-5 h-5 border-2 border-gray-500 rounded mr-3"></div>
                    <span className="text-gray-300">Prepare for tomorrow's meeting</span>
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