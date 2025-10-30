import React from 'react';
import { CheckSquare, Kanban, Calendar, BarChart3 } from 'lucide-react';

const Views: React.FC = () => {
  const views = [
    {
      icon: CheckSquare,
      name: 'List View',
      description: 'Fast, keyboard-friendly list of all your tasks. Perfect for quick overviews and daily planning.',
      features: [
        'Quick add and edit',
        'Inline filters and search',
        'Keyboard shortcuts',
        'Drag to reorder'
      ],
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Kanban,
      name: 'Board View',
      description: 'Visual Kanban board with Todo, In Progress, and Done columns. Great for workflow visualization.',
      features: [
        'Drag between stages',
        'Visual task cards',
        'Status at a glance',
        'Move buttons for accessibility'
      ],
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Calendar,
      name: 'Calendar View',
      description: 'Agenda-style calendar showing tasks grouped by date. See Today, Tomorrow, and This Week.',
      features: [
        'Date-grouped tasks',
        'Quick date changes',
        'Due date visibility',
        'Weekly overview'
      ],
      color: 'from-green-500 to-green-600'
    },
    {
      icon: BarChart3,
      name: 'Review View',
      description: 'Analyze your productivity with completion history, notes, and insights.',
      features: [
        'Completion statistics',
        'Productivity streaks',
        'Completion notes',
        'Time estimate accuracy'
      ],
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <section id="views" className="py-16 md:py-24 bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Four Powerful Views
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            See your tasks from different perspectives. Switch views instantly to match your workflow.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {views.map((view, index) => {
            const Icon = view.icon;
            return (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 hover:border-slate-600 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
              >
                <div className={`bg-gradient-to-r ${view.color} p-6`}>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">
                      {view.name}
                    </h3>
                  </div>
                  <p className="text-white/90 text-sm">
                    {view.description}
                  </p>
                </div>
                
                <div className="p-6 bg-slate-800/80">
                  <ul className="space-y-3">
                    {view.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center text-gray-300"
                      >
                        <svg
                          className="h-5 w-5 text-purple-400 mr-3 flex-shrink-0"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-400">
            All views sync instantly and support drag-and-drop or keyboard navigation
          </p>
        </div>
      </div>
    </section>
  );
};

export default Views;
