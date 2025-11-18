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
    <section id="features" className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-40"></div>
      
      <div className="container mx-auto px-4 md:px-6 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Everything You Need to Stay Organized
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            A powerful yet simple task management system designed for privacy, speed, and focus.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 transition-all duration-300"
              >
                <div className="flex flex-col items-start h-full">
                  <div className="mb-4 p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-colors">
                    <Icon className="h-6 w-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-block bg-gradient-to-r from-purple-900/40 to-pink-900/40 backdrop-blur-sm rounded-2xl px-8 py-6 border border-purple-500/30">
            <p className="text-white font-medium mb-2">
              Plus optional AI coaching
            </p>
            <p className="text-gray-300 text-sm">
              Enable "Zedd Mode" with your own AI API URL for smart task suggestions and daily planning assistance
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
