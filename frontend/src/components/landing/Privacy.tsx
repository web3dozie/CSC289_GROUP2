import React from 'react';
import { Lock, Shield, Timer, HardDrive } from 'lucide-react';

const Privacy: React.FC = () => {
  return (
    <section id="privacy" className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-900"></div>
      
      <div className="container mx-auto px-4 md:px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Privacy & Security
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Local-only storage. Your data never leaves your device. No cloud by default.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-purple-900/30 to-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/20">
              <div className="flex items-center space-x-3 mb-4">
                <Lock className="h-8 w-8 text-purple-400" />
                <h3 className="text-xl font-semibold text-white">PIN Lock Protection</h3>
              </div>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>4-8 digit PIN for quick access</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Configurable auto-lock on idle</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Default 10-minute timeout</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Secure session management</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
              <div className="flex items-center space-x-3 mb-4">
                <HardDrive className="h-8 w-8 text-purple-400" />
                <h3 className="text-xl font-semibold text-white">Local-First Storage</h3>
              </div>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>SQLite database on your device</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>No external servers required</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Works completely offline</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Export/import for backup</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 bg-gradient-to-r from-purple-900/40 to-pink-900/40 backdrop-blur-sm border border-purple-500/30 text-white rounded-2xl p-8 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-purple-400" />
            <h3 className="text-2xl font-bold mb-3">Your Data, Your Control</h3>
            <p className="text-gray-300 max-w-2xl mx-auto mb-6">
              We believe privacy is a fundamental right. That's why Task Line keeps everything local by default. 
              No tracking, no analytics, no cloud sync unless you explicitly choose to enable it.
            </p>
            <div className="inline-flex items-center bg-purple-500/20 backdrop-blur rounded-full px-6 py-3 border border-purple-400/30">
              <Timer className="h-5 w-5 mr-2 text-purple-400" />
              <span className="font-medium text-gray-200">Auto-lock keeps your tasks private</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Privacy;
