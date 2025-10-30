import React from 'react';
import { CheckSquare, Lock, Zap, Calendar, BarChart3, Layout, Shield, Download } from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: CheckSquare,
      title: 'Smart Task Management',
      description: 'Create, organize, and track tasks with categories, priorities, and due dates. Star important tasks and reorder with drag-and-drop.'
    },
    {
      icon: Layout,
      title: 'Multiple Views',
      description: 'Switch between List, Board (Kanban), Calendar, and Review views to see your tasks from different perspectives.'
    },
    {
      icon: Lock,
      title: 'Private & Secure',
      description: 'PIN protection with auto-lock keeps your data safe. Everything is stored locally on your device - no cloud, no tracking.'
    },
    {
      icon: Zap,
      title: 'Works Offline',
      description: 'Fully functional without internet. Your data stays on your device and you never need to worry about connectivity.'
    },
    {
      icon: Calendar,
      title: 'Time Tracking',
      description: 'Set time estimates, track completion times, and use the optional Pomodoro timer to stay focused on your work.'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'Track completion rates, productivity streaks, and estimate accuracy. Reflect on your progress with completion notes.'
    },
    {
      icon: Shield,
      title: 'Local-First Design',
      description: 'All your data is stored in a local SQLite database. Export and import your data anytime for complete control.'
    },
    {
      icon: Download,
      title: 'Export & Backup',
      description: 'Export all your tasks, categories, and settings to a single JSON file. Perfect for backups or moving to another device.'
    }
  ];

  return (
    <section id="features" className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Stay Organized
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A powerful yet simple task management system designed for privacy, speed, and focus.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex flex-col items-start h-full">
                  <div className="mb-4 p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                    <Icon className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-block bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl px-8 py-6 border border-purple-200">
            <p className="text-gray-900 font-medium mb-2">
              Plus optional AI coaching
            </p>
            <p className="text-gray-600 text-sm">
              Enable "Zedd Mode" with your own AI API URL for smart task suggestions and daily planning assistance
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
