import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Share2, MapPin, ShieldCheck, CheckCircle, Check, Star, ChevronRight } from 'lucide-react';
import { getProperty, getReviews, addReview } from '../api/services';

export default function PropertyDetailView({ property: initial, user, initialDraft, onBack, onProceedToBooking, onReviewAdded, showToast, favorites, onToggleFavorite }) {
  const [property, setProperty] = useState(initial);
  const [activeTab, setActiveTab] = useState('overview');
  const [reviews, setReviews] = useState([]);
  const [checkIn, setCheckIn] = useState(initialDraft.checkIn);
  const [checkOut, setCheckOut] = useState(initialDraft.checkOut);
  const [guests, setGuests] = useState(initialDraft.guests === '2 Guests' ? '2 Guests' : '1 Guest');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    getProperty(initial.id).then(setProperty).catch(() => {});
    getReviews(initial.id).then(setReviews).catch(() => {});
  }, [initial.id]);

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      await addReview(property.id, Number(rating), comment);
      setComment('');
      setReviews(await getReviews(property.id));
      setProperty(await getProperty(property.id));
      onReviewAdded();
      showToast('Thanks for your review!');
    } catch (err) {
      showToast(err.message);
    }
  };

  const book = () => {
    if (!checkIn || !checkOut || checkOut <= checkIn) { showToast('Check-out must be after check-in'); return; }
    if (checkIn < today) { showToast('Check-in cannot be in the past'); return; }
    onProceedToBooking({ checkIn, checkOut, guests });
  };

  const share = () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    showToast('Property URL copied to clipboard');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-teal-600 transition bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm">
          <ArrowLeft className="w-4 h-4" /><span>Back to Properties</span>
        </button>
        <div className="flex items-center space-x-3">
          <button onClick={() => onToggleFavorite(property.id)} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-rose-500 shadow-sm transition">
            <Heart className={`w-4 h-4 ${favorites.includes(property.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
          <button onClick={share} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-teal-600 shadow-sm transition">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="md:col-span-2 h-80 rounded-2xl overflow-hidden shadow-md">
          <img src={property.images[0]} alt={property.name} className="w-full h-full object-cover" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-1 gap-4 md:col-span-2">
          <div className="h-40 rounded-2xl overflow-hidden shadow-md">
            <img src={property.images[1] || property.images[0]} alt={property.name} className="w-full h-full object-cover" />
          </div>
          <div className="h-40 rounded-2xl overflow-hidden shadow-md relative">
            <img src={property.images[2] || property.images[0]} alt={property.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center text-white font-bold text-xs">{property.images.length} photo{property.images.length > 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h1 className="text-2xl font-black text-slate-900">{property.name}</h1>
              {property.verified && (
                <span className="bg-teal-50 text-teal-700 text-xs font-bold px-3 py-1 rounded-full flex items-center space-x-1 border border-teal-200">
                  <ShieldCheck className="w-4 h-4 text-teal-600" /><span>StaySafe Verified</span>
                </span>
              )}
            </div>
            <p className="text-slate-500 text-xs flex items-center space-x-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /><span>{property.location}</span></p>
            <p className="text-slate-400 text-[11px] mt-1">Hosted by {property.owner}</p>
          </div>

          <div className="flex space-x-2 border-b border-slate-200">
            {['overview', 'amenities', 'rules', 'reviews'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 px-4 font-bold text-xs capitalize transition border-b-2 ${activeTab === tab ? 'border-teal-600 text-teal-600' : 'border-transparent text-slate-500'}`}>{tab}</button>
            ))}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-sm">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-base">Description</h3>
                <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">{property.description}</p>
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-bold text-xs uppercase mb-3 text-teal-700">StaySafe Verification Passport</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {['Govt ID Verified Host', 'Property Deed Verified', 'On-Site Safety Audit', '24/7 Security On Duty'].map(item => (
                      <div key={item} className="flex items-center space-x-2 p-3 bg-slate-50 rounded-xl"><CheckCircle className="w-4 h-4 text-teal-600" /><span>{item}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'amenities' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {property.amenities.map((am, i) => (
                  <div key={i} className="flex items-center space-x-2.5 p-3 bg-slate-50 rounded-xl font-semibold text-xs text-slate-700"><Check className="w-4 h-4 text-teal-600" /><span>{am}</span></div>
                ))}
              </div>
            )}

            {activeTab === 'rules' && (
              <div className="space-y-2 text-xs text-slate-700">
                <p>• Gate closes at 11:00 PM for safety.</p>
                <p>• Guests allowed in common lobby till 8:00 PM.</p>
                <p>• No smoking inside room premises.</p>
                <p>• Security deposit: ₹{property.deposit.toLocaleString()} (refundable).</p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2 mb-4">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                  <span className="font-bold text-base text-slate-900">{property.rating} / 5.0</span>
                  <span className="text-xs text-slate-400">({property.reviewsCount} resident reviews)</span>
                </div>

                {reviews.length === 0 && <p className="text-xs text-slate-400">No written reviews yet.</p>}
                {reviews.map(r => (
                  <div key={r.id} className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                    <div className="flex justify-between"><span className="font-bold text-slate-800">{r.userName}</span><span className="text-amber-500 font-bold">{'★'.repeat(r.rating)}</span></div>
                    <p className="mt-1">{r.comment}</p>
                    <span className="text-[10px] text-slate-400">{r.date}</span>
                  </div>
                ))}

                {user?.role === 'CUSTOMER' && (
                  <form onSubmit={submitReview} className="mt-4 p-4 border border-slate-200 rounded-xl space-y-2 text-xs">
                    <h4 className="font-bold uppercase text-slate-500">Write a review (requires a booking)</h4>
                    <select value={rating} onChange={(e) => setRating(e.target.value)} className="p-2 rounded-lg border border-slate-200">
                      {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} stars</option>)}
                    </select>
                    <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." className="w-full p-2.5 rounded-lg border border-slate-200 h-20 focus:outline-none" />
                    <button className="bg-teal-600 text-white font-bold px-4 py-2 rounded-lg">Submit Review</button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200 sticky top-24 space-y-6">
            <div className="flex justify-between items-baseline">
              <div>
                <span className="text-2xl font-black text-slate-900">₹{property.price.toLocaleString()}</span>
                <span className="text-xs text-slate-500"> / month</span>
              </div>
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">Fully Inclusive</span>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <label className="block text-[10px] font-bold uppercase text-slate-400">Check-in Date</label>
                <input type="date" min={today} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="bg-transparent font-semibold mt-1 w-full focus:outline-none" />
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <label className="block text-[10px] font-bold uppercase text-slate-400">Check-out Date</label>
                <input type="date" min={checkIn} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="bg-transparent font-semibold mt-1 w-full focus:outline-none" />
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <label className="block text-[10px] font-bold uppercase text-slate-400">Occupancy</label>
                <select value={guests} onChange={(e) => setGuests(e.target.value)} className="bg-transparent font-semibold mt-1 w-full focus:outline-none">
                  <option value="1 Guest">1 Guest (Single Bed)</option>
                  <option value="2 Guests">2 Guests (Double Sharing)</option>
                </select>
              </div>
            </div>

            <button onClick={book} className="w-full bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition text-sm flex items-center justify-center space-x-2">
              <span>Book & Pay Online</span><ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
