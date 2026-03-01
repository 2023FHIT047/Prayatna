
import React from 'react';
import { Link } from 'react-router-dom';

const CTASection: React.FC = () => {
  return (
    <section className="py-24 bg-red-600 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0 100 L100 0 L100 100 Z" fill="white" />
        </svg>
      </div>
      <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
        <h2 className="text-3xl sm:text-5xl font-black text-white mb-8">Ready to make a difference?</h2>
        <p className="text-red-100 text-xl mb-10 max-w-2xl mx-auto">
          Whether you're a local citizen, a professional responder, or a resource manager, your participation saves lives.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/auth?tab=register" className="w-full sm:w-auto px-10 py-5 bg-white text-red-600 font-black rounded-2xl shadow-2xl hover:bg-slate-50 transition-all text-lg">
            Join the Network
          </Link>
          <Link to="/map" className="w-full sm:w-auto px-10 py-5 bg-red-700 text-white font-black rounded-2xl hover:bg-red-800 transition-all text-lg border border-red-500">
            View Live Map
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
