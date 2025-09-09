import React from 'react';
import { List, Columns3, Calendar, BarChart3 } from 'lucide-react';

const Views: React.FC = () => {
  const views = [
    {
      icon: <List className="h-8 w-8 text-purple-600" />,
      name: "List",
      description: "Your fastest way to get things done.",
      preview: (
        <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-purple-600 rounded"></div>
            <div className="h-2 bg-gray-300 rounded w-32"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-gray-400 rounded"></div>
            <div className="h-2 bg-gray-300 rounded w-24"></div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-gray-400 rounded"></div>
            <div className="h-2 bg-gray-300 rounded w-28"></div>
          </div>
        </div>
      )
    },
    {
      icon: <Columns3 className="h-8 w-8 text-purple-600" />,
      name: "Board",
      description: "Visual flow from Todo → In-Progress → Done.",
      preview: (
        <div className="grid grid-cols-3 gap-2 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <div className="h-2 bg-purple-200 rounded"></div>
            <div className="h-8 bg-purple-100 rounded"></div>
            <div className="h-8 bg-purple-100 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-2 bg-blue-200 rounded"></div>
            <div className="h-8 bg-blue-100 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-2 bg-green-200 rounded"></div>
            <div className="h-8 bg-green-100 rounded"></div>
            <div className="h-8 bg-green-100 rounded"></div>
          </div>
        </div>
      )
    },
    {
      icon: <Calendar className="h-8 w-8 text-purple-600" />,
      name: "Calendar (Agenda)",
      description: "Today, Tomorrow, This Week—at a glance.",
      preview: (
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-xs font-semibold text-purple-600 mb-1">TODAY</div>
            <div className="h-6 bg-purple-100 rounded"></div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-1">TOMORROW</div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-1">THIS WEEK</div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
        </div>
      )
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-purple-600" />,
      name: "Review",
      description: "What you finished, notes you wrote, simple charts.",
      preview: (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-end space-x-2 h-16">
            <div className="w-6 bg-purple-300 rounded-t" style={{height: '60%'}}></div>
            <div className="w-6 bg-purple-400 rounded-t" style={{height: '80%'}}></div>
            <div className="w-6 bg-purple-500 rounded-t" style={{height: '40%'}}></div>
            <div className="w-6 bg-purple-600 rounded-t" style={{height: '90%'}}></div>
            <div className="w-6 bg-purple-400 rounded-t" style={{height: '70%'}}></div>
          </div>
          <div className="mt-2 h-2 bg-gray-300 rounded"></div>
        </div>
      )
    }
  ];

  return (
    <section id="views" className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Multiple Views for Every Workflow
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Switch between different views to match your working style and current needs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {views.map((view, index) => (
            <div 
              key={index}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow duration-200"
            >
              <div className="flex items-start space-x-4 mb-4">
                <div className="flex-shrink-0">
                  {view.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-1">
                    {view.name}
                  </h3>
                  <p className="text-gray-600">
                    {view.description}
                  </p>
                </div>
              </div>
              {view.preview}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Views;