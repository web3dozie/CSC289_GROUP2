import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: "Does this work offline?",
      answer: "Yes! Task Line is designed to work completely offline. All your data is stored locally on your device, and no internet connection is required for any core features. You only need internet during initial setup to download the app."
    },
    {
      question: "Is my data private?",
      answer: "Absolutely. Your data never leaves your device unless you explicitly export it. We use local SQLite storage, PIN protection with auto-lock, and no telemetry or analytics are collected. You have complete control over your information."
    },
    {
      question: "Do I need AI?",
      answer: "No, AI is completely optional and off by default. The app works perfectly without any AI features. If you want to enable the coach chat ('Zedd Mode'), you can add an AI API URL in settings, but it's never required."
    },
    {
      question: "Can I export my data?",
      answer: "Yes! You can export all your data (tasks, categories, settings, notes) to a single JSON file at any time. This serves as both a backup and a way to move your data to another device. You can also import from a previously exported file."
    },
    {
      question: "How does the PIN lock work?",
      answer: "You set a 4-8 digit PIN when you first use the app. The app automatically locks after 10 minutes of inactivity (configurable in settings). Your PIN is stored securely and never transmitted anywhere."
    },
    {
      question: "What views are available?",
      answer: "Task Line offers four views: List (fast, keyboard-friendly), Board (visual Todo/In-Progress/Done lanes), Calendar (agenda-style with Today/Tomorrow/This Week), and Review (history, notes, and analytics)."
    },
    {
      question: "Can I use keyboard shortcuts?",
      answer: "Yes! Task Line is designed to be keyboard-friendly. Common shortcuts include adding tasks, navigating between views, searching, and marking tasks complete. The tutorial covers all available shortcuts."
    },
    {
      question: "Is there a mobile version?",
      answer: "Task Line is currently optimized for desktop and tablet use. While it works on mobile browsers, the experience is best on larger screens. We focused on desktop-first design for maximum productivity."
    }
  ];

  return (
    <section id="faq" className="py-16 md:py-24 bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-400">
              Everything you need to know about Task Line
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg hover:border-slate-600 transition-all duration-200"
              >
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-slate-900 rounded-lg"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  aria-expanded={openIndex === index}
                >
                  <span className="font-medium text-white">{faq.question}</span>
                  {openIndex === index ? (
                    <ChevronUp className="h-5 w-5 text-purple-400 flex-shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0 ml-2" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-300">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center p-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-2">
              Still have questions?
            </h3>
            <p className="text-gray-400 mb-4">
              Check out our comprehensive documentation for more information.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/OVERVIEW.md"
                className="text-purple-400 hover:text-purple-300 font-medium"
              >
                Read Documentation →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;

