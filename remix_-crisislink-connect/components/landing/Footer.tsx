
import React from 'react';
import { Shield, Twitter, Github, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 text-white mb-6">
              <Shield className="text-red-600" size={32} />
              <span className="text-2xl font-bold">CrisisLink</span>
            </div>
            <p className="max-w-md text-slate-500 leading-relaxed">
              Unified emergency management platform connecting communities and responders in real-time. Built for a safer, more resilient world.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Platform</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><Link to="/map" className="hover:text-red-500 transition-colors">Live Map</Link></li>
              <li><Link to="/report" className="hover:text-red-500 transition-colors">Incident Reporting</Link></li>
              <li><Link to="/reviews" className="hover:text-red-500 transition-colors">Public Testimonials</Link></li>
              <li><Link to="/auth?tab=register" className="hover:text-red-500 transition-colors">Volunteer Portal</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Legal</h4>
            <ul className="space-y-4 text-sm font-medium">
              <li><a href="#" className="hover:text-red-500 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-red-500 transition-colors">Security</a></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs">© 2024 CrisisLink Connect. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"><Twitter size={16} /></a>
            <a href="#" className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"><Github size={16} /></a>
            <a href="#" className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"><Linkedin size={16} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
