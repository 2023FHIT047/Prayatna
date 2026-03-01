
import React from 'react';
import Header from '../components/layout/Header';
import { MapPin, Search } from 'lucide-react';

const Resources: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Resource Directory</h1>
          <p className="text-slate-500">Search and track emergency supplies across all sectors.</p>
        </header>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by category, name, or location..."
            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-red-500 outline-none shadow-sm"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase">Medical</span>
                <span className="text-xs font-bold text-green-600">Available</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Emergency Station #{i}</h3>
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
                <MapPin size={14} />
                <span>Sector B-9, Central Area</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <div className="text-sm">
                  <span className="text-slate-400">Stock:</span> <span className="font-bold text-slate-800">100%</span>
                </div>
                <button className="text-red-600 font-bold text-sm">Request Supply</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Resources;
