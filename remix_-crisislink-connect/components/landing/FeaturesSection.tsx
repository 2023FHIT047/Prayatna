
import React from 'react';
import { Map, Zap, Users, BarChart3, Bell, Smartphone } from 'lucide-react';

const features = [
  {
    title: 'Live Crisis Map',
    description: 'Get real-time situational awareness with our high-precision emergency mapping system.',
    icon: <Map className="text-red-600" size={24} />,
    color: 'bg-red-50'
  },
  {
    title: 'Instant Alerts',
    description: 'Receive critical updates based on your current location and interests directly to your device.',
    icon: <Bell className="text-orange-600" size={24} />,
    color: 'bg-orange-50'
  },
  {
    title: 'Resource Coordination',
    description: 'Connect rescue teams with the necessary supplies and personnel through our unified hub.',
    icon: <Zap className="text-blue-600" size={24} />,
    color: 'bg-blue-50'
  },
  {
    title: 'Community Reporting',
    description: 'Empower citizens to act as first-reporters with easy-to-use incident verification tools.',
    icon: <Smartphone className="text-green-600" size={24} />,
    color: 'bg-green-50'
  },
  {
    title: 'Volunteer Network',
    description: 'A global database of verified responders ready to deploy when disasters strike.',
    icon: <Users className="text-purple-600" size={24} />,
    color: 'bg-purple-50'
  },
  {
    title: 'Data Analytics',
    description: 'Powerful forecasting and post-incident analysis for better future preparedness.',
    icon: <BarChart3 className="text-slate-600" size={24} />,
    color: 'bg-slate-50'
  }
];

const FeaturesSection: React.FC = () => {
  return (
    <section className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-red-600 font-bold tracking-widest uppercase text-sm mb-4">Core Capabilities</h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-6">Built for Modern Emergency Response</h3>
          <p className="text-slate-600 text-lg max-w-2xl mx-auto">
            CrisisLink provides a comprehensive suite of tools designed to streamline information flow and accelerate rescue efforts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6`}>
                {feature.icon}
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h4>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
