import React from 'react';
import { TrendingUp, Timer, Target, PieChart } from 'lucide-react';

const Analytics: React.FC = () => {
  const features = [
    {
      icon: <Timer className="h-6 w-6" />,
      title: "Time Tracking",
      description: "Estimates, completed_at timestamp, optional focus timer"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Completion Streaks",
      description: "Track your daily and weekly completion patterns"
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Estimate Accuracy",
      description: "Learn how well you predict task duration"
    },
    {
      icon: <PieChart className="h-6 w-6" />,
      title: "Category Insights",
      description: "See where you spend your time across categories"
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Time & Analytics
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Local analytics help you understand your productivity patterns—completions, streaks, estimate accuracy, and category distribution.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 p-3 bg-purple-100 rounded-lg text-purple-600">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Sample Weekly Review</h3>
            <span className="text-sm text-gray-500">Computed locally on-demand</span>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">24</div>
              <div className="text-sm text-gray-600">Tasks Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">5</div>
              <div className="text-sm text-gray-600">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-1">85%</div>
              <div className="text-sm text-gray-600">Estimate Accuracy</div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Most productive day:</span>
              <span className="font-medium text-gray-900">Tuesday (8 tasks)</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-gray-600">Top category:</span>
              <span className="font-medium text-gray-900">Work (60%)</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Analytics;