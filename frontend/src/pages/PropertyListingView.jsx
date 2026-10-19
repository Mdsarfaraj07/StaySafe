import React, { useState } from 'react';
import { Search, Filter, AlertCircle, ShieldCheck, Heart, MapPin, ChevronRight } from 'lucide-react';

export default function PropertyListingView({ properties, onSelectProperty, favorites, onToggleFavorite }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [maxPrice, setMaxPrice] = useState(25000);

  const filtered = properties.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'All' || p.type === selectedType;
    const matchesPrice = p.price <= maxPrice;
    return matchesSearch && matchesType && matchesPrice && p.status === 'Active';
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 w-full md:w-auto flex-1">
          <Search className="w-5 h-5 text-slate-400 ml-2 shrink-0" />
          <input type="text" placeholder="Search by area, landmark or PG name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-transparent text-sm font-medium focus:outline-none" />
        </div>
        <div className="text-xs text-slate-500 font-semibold">
          Found <span className="text-slate-900 font-bold">{filtered.length} verified stays</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center space-x-2 text-sm">
              <Filter className="w-4 h-4 text-teal-600" />
              <span>Filters</span>
            </h3>
            <button onClick={() => { setSelectedType('All'); setMaxPrice(25000); setSearchTerm(''); }} className="text-xs text-teal-600 hover:underline font-semibold">Reset</button>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-3">Property Type</label>
            <div className="space-y-2 text-xs font-semibold">
              {['All', 'PG', 'Flat', 'Co-living'].map((type) => (
                <label key={type} className="flex items-center space-x-3 cursor-pointer text-slate-700">
                  <input type="radio" name="type" checked={selectedType === type} onChange={() => setSelectedType(type)} className="accent-teal-600" />
                  <span>{type}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold uppercase text-slate-400 mb-3">Max Budget: ₹{maxPrice.toLocaleString()}</label>
            <input type="range" min="5000" max="30000" step="1000" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-teal-600 cursor-pointer" />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
              <span>₹5,000</span>
              <span>₹30,000</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl text-center border border-slate-200">
              <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-800">No properties match your filter</h3>
              <p className="text-slate-500 text-xs mt-1">Try adjusting the price slider or search query.</p>
            </div>
          ) : (
            filtered.map((prop) => (
              <div key={prop.id} onClick={() => onSelectProperty(prop)} className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-xl transition border border-slate-200 flex flex-col sm:flex-row gap-6 cursor-pointer group">
                <div className="relative w-full sm:w-64 h-44 rounded-xl overflow-hidden shrink-0">
                  <img src={prop.image} alt={prop.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  {prop.verified && (
                    <span className="absolute top-2 left-2 bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow flex items-center space-x-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(prop.id); }} className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 text-slate-700 shadow">
                    <Heart className={`w-3.5 h-3.5 ${favorites.includes(prop.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                  </button>
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded">{prop.type}</span>
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-teal-600 transition mt-1">{prop.name}</h3>
                        <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{prop.location}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-black text-teal-700">₹{prop.price.toLocaleString()}</span>
                        <span className="block text-[10px] text-slate-400">/ month</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-3 line-clamp-2">{prop.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-100 mt-4 gap-2">
                    <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-600 font-medium">
                      {prop.amenities.map((am, idx) => (
                        <span key={idx} className="bg-slate-100 px-2 py-0.5 rounded">{am}</span>
                      ))}
                    </div>
                    <span className="text-xs font-bold text-teal-600 group-hover:translate-x-1 transition flex items-center space-x-1">
                      <span>View & Book</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
