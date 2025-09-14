import React from 'react';
import { ArrowRight, FileText } from 'lucide-react';
import { Link } from '@tanstack/react-router';

const CTA: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-purple-600 to-purple-700">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
            Ready to Lock In?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Start managing your tasks with style, privacy, and focus.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-purple-600 bg-white rounded-full hover:bg-purple-50 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-600 shadow-xl"
            >
              Open App
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            
            <a
              href="/OVERVIEW.md"
              className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-white/20 backdrop-blur border-2 border-white/50 rounded-full hover:bg-white/30 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-600"
            >
              <FileText className="mr-2 h-5 w-5" />
              Read Overview
            </a>
          </div>

          <div className="mt-12 text-purple-100">
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