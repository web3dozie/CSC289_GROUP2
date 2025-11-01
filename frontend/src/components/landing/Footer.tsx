import React from 'react';
import { Github, FileText} from 'lucide-react';
import { Link } from '@tanstack/react-router';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">Task Line</h3>
            <p className="text-sm text-gray-400 mb-3">Lock in. Get it done. Stay zen.</p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li>
                <Link 
                  to="/app" 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Open App
                </Link>
              </li>
              <li>
                <a 
                  href="#features" 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Features
                </a>
              </li>
              <li>
                <a 
                  href="#privacy" 
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Privacy
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
              Resources
            </h4>
            <ul className="space-y-2">
              <li>
                <a 
                  href="https://github.com/web3dozie/CSC289_GROUP2" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors inline-flex items-center"
                >
                  <Github className="h-4 w-4 mr-2" />
                  Repository Root
                </a>
              </li>
              <li>
                <Link 
                  to="/overview" 
                  className="text-gray-400 hover:text-white transition-colors inline-flex items-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Project Overview
                </Link>
              </li>
              <li>
                {/* <a 
                  href="/SDLC" 
                  className="text-gray-400 hover:text-white transition-colors inline-flex items-center"
                >
                  <Folder className="h-4 w-4 mr-2" />
                  SDLC Documentation
                </a> */}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-500 mb-4 md:mb-0">
              <p>© 2025 CSC289 Group 2 Capstone Project</p>
              <p className="mt-1">Built with React, TypeScript, and Tailwind CSS</p>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <span className="text-gray-500">Local-first</span>
              <span className="text-gray-700">·</span>
              <span className="text-gray-500">Privacy-focused</span>
              <span className="text-gray-700">·</span>
              <span className="text-gray-500">Open source</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

