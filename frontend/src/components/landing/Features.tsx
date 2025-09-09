import React from 'react';
import { Plus, Edit3, Trash2, Folder, Star, Calendar, Search, Save, RotateCcw, Download, Upload } from 'lucide-react';

const Features: React.FC = () => {
  const featureList = [
    { icon: <Plus className="h-5 w-5" />, text: "Add tasks" },
    { icon: <Edit3 className="h-5 w-5" />, text: "Edit tasks" },
    { icon: <Trash2 className="h-5 w-5" />, text: "Delete tasks" },
    { icon: <Folder className="h-5 w-5" />, text: "Categories" },
    { icon: <Star className="h-5 w-5" />, text: "Star/Highlight" },
    { icon: <Calendar className="h-5 w-5" />, text: "Dates" },
    { icon: <Search className="h-5 w-5" />, text: "Search/Filters" },
    { icon: <Save className="h-5 w-5" />, text: "Autosave" },
    { icon: <RotateCcw className="h-5 w-5" />, text: "Undo" },
    { icon: <Download className="h-5 w-5" />, text: "Export" },
    { icon: <Upload className="h-5 w-5" />, text: "Import" },
  ];

  return (
    <section id="features" className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Core Features
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Add, organize, and finish tasks with categories, drag-to-reorder, highlights, dates, search, autosave/undo, and simple backup (export/import JSON).
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {featureList.map((feature, index) => (
            <div 
              key={index}
              className="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="text-purple-600">
                {feature.icon}
              </div>
              <span className="text-gray-700 font-medium">{feature.text}</span>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Everything You Need</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Organization</h4>
              <p className="text-gray-600 text-sm">
                Create categories for personal, work, and other tasks. Drag to reorder your priorities. Star important items to keep them at the top.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Time Management</h4>
              <p className="text-gray-600 text-sm">
                Set start and due dates. Add time estimates. Track completion timestamps. Optional focus timer for deep work sessions.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Data Safety</h4>
              <p className="text-gray-600 text-sm">
                Automatic saving protects your work. Undo recent changes. Export everything to JSON. Import from backup anytime.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Quick Access</h4>
              <p className="text-gray-600 text-sm">
                Instant search across all tasks. Filter by category or status. Keyboard shortcuts for power users. Clear validation and error messages.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;