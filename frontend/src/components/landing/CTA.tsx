import React from 'react';
import { ArrowRight, FileText } from 'lucide-react';
import { Link } from '@tanstack/react-router';

const CTA: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-purple-900 via-slate-900 to-pink-900 relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
      </div>
      
      <div className="container mx-auto px-4 md:px-6 relative">
        <div className="text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Ready to Lock In?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Start managing your tasks with style, privacy, and focus.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-slate-900 bg-white rounded-full hover:bg-gray-100 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-900 shadow-xl"
            >
              Open App
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            
            <Link
              to="/overview"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-white/10 backdrop-blur border-2 border-white/30 rounded-full hover:bg-white/20 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-900"
            >
              <FileText className="mr-2 h-5 w-5" />
              Read Overview
            </Link>
          </div>

          <div className="mt-12 text-gray-300">
            <p className="text-sm">
              No sign-up required • Works offline • Your data stays yours
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;