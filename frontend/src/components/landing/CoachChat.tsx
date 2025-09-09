import React from 'react';
import { MessageSquare, CheckCircle, Sparkles } from 'lucide-react';

const CoachChat: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-br from-purple-50 to-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4 mr-2" />
              Optional Feature
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Coach Chat: "Zedd Mode"
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Turn thoughts into tidy tasks, set today's top 3, and review the day—only if you enable an AI URL.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-purple-600 text-white p-4">
              <h3 className="font-semibold text-lg">How It Works</h3>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                  1
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Off by Default</h4>
                  <p className="text-gray-600">The coach chat only appears when you provide an AI API URL in settings.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                  2
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Propose Changes</h4>
                  <p className="text-gray-600">AI suggests tasks and improvements, but never makes changes without your approval.</p>
                  
                  <div className="mt-3 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <MessageSquare className="h-5 w-5 text-purple-600 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 italic mb-2">
                          "I can help break down 'Complete project proposal' into smaller steps. Would you like me to create these subtasks?"
                        </p>
                        <div className="flex space-x-2">
                          <button className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md">
                            Confirm
                          </button>
                          <button className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-md">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
                  3
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">Review & Reflect</h4>
                  <p className="text-gray-600">End-of-day summaries and completion reflections help you learn and improve.</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-6 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-sm text-gray-700">
                  <strong>Privacy First:</strong> Works entirely offline. AI requests stay local unless you explicitly enable cloud AI.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CoachChat;