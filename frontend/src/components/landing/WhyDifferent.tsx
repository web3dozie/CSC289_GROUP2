import React from 'react';
import { Shield, Zap, HardDrive } from 'lucide-react';

const WhyDifferent: React.FC = () => {
  const features = [
    {
      icon: <HardDrive className="h-6 w-6 text-purple-600" />,
      title: "Local-first privacy",
      description: "Your data never leaves your device"
    },
    {
      icon: <Zap className="h-6 w-6 text-purple-600" />,
      title: "Instant and elegant",
      description: "Opens fast; calm, premium design"
    },
    {
      icon: <Shield className="h-6 w-6 text-purple-600" />,
      title: "Optional AI",
      description: "Helpful, never pushy. Off by default"
    }
  ];

  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          Why It's Different
        </h2>
        
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="flex flex-col items-center text-center p-6 rounded-2xl hover:bg-purple-50 transition-colors duration-200"
            >
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyDifferent;