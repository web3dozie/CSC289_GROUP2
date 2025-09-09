import React from 'react';
import { PlayCircle, Clock, RefreshCw } from 'lucide-react';

const Tutorial: React.FC = () => {
  return (
    <section id="tutorial" className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Interactive Tutorial
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Take the 60-second tour and learn by doing.
          </p>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl shadow-xl p-8 md:p-12 text-white">
            <div className="flex justify-center mb-6">
              <PlayCircle className="h-20 w-20 text-white opacity-90" />
            </div>
            
            <h3 className="text-2xl font-bold mb-4">
              Learn Momentum in 60-90 Seconds
            </h3>
            
            <p className="text-purple-100 mb-8 max-w-2xl mx-auto">
              Our guided tour walks you through creating your first task, organizing with categories, 
              using different views, and mastering keyboard shortcuts—all by doing, not just reading.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <Clock className="h-8 w-8 mb-2 mx-auto" />
                <p className="font-semibold">60-90 seconds</p>
                <p className="text-sm text-purple-100">Quick and focused</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <RefreshCw className="h-8 w-8 mb-2 mx-auto" />
                <p className="font-semibold">Always Available</p>
                <p className="text-sm text-purple-100">Replay anytime</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <PlayCircle className="h-8 w-8 mb-2 mx-auto" />
                <p className="font-semibold">Learn by Doing</p>
                <p className="text-sm text-purple-100">Interactive steps</p>
              </div>
            </div>

            <a
              href="/#/tutorial"
              className="inline-flex items-center justify-center px-8 py-3 bg-white text-purple-600 font-semibold rounded-full hover:bg-purple-50 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-purple-600"
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              Start Tutorial
            </a>
          </div>

          <div className="mt-8 text-sm text-gray-600">
            You can always access the tutorial from the app's help menu.
          </div>
        </div>
      </div>
    </section>
  );
};

export default Tutorial;