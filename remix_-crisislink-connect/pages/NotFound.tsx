
import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Home } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div className="inline-flex items-center justify-center p-6 bg-red-100 rounded-full text-red-600 animate-bounce">
          <ShieldAlert size={64} />
        </div>
        <h1 className="text-6xl font-black text-slate-900">404</h1>
        <h2 className="text-2xl font-bold text-slate-800">Mission Obstructed</h2>
        <p className="text-slate-500 max-w-md mx-auto">
          The area you're trying to reach doesn't exist or is currently restricted. Return to HQ to resume coordination.
        </p>
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 px-8 py-4 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-all"
        >
          <Home size={20} />
          Back to Safety
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
