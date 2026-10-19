import React, { useState } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import { createBooking } from '../api/services';

export default function BookingPaymentView({ property, draft, onBack, onDone }) {
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // NOTE: payment is simulated. For real Razorpay: create an order on the backend,
  // open Razorpay Checkout here, then send the payment id + signature to POST /api/bookings.
  const handlePay = async () => {
    setLoading(true);
    setError('');
    try {
      await createBooking({
        propertyId: property.id,
        checkIn: draft.checkIn,
        checkOut: draft.checkOut,
        guests: draft.guests,
        paymentMethod
      });
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button onClick={onBack} className="flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-teal-600 transition mb-6 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit">
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <h2 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4">Checkout & Secure Payment</h2>

        <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <img src={property.image} alt={property.name} className="w-16 h-16 rounded-xl object-cover" />
          <div>
            <h4 className="font-bold text-sm text-slate-900">{property.name}</h4>
            <p className="text-xs text-slate-500">{property.location}</p>
            <span className="text-xs font-bold text-teal-700 mt-1 block">Monthly Rent: ₹{property.price.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200"><span className="block text-[10px] uppercase font-bold text-slate-400">Check-in</span><b>{draft.checkIn}</b></div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200"><span className="block text-[10px] uppercase font-bold text-slate-400">Check-out</span><b>{draft.checkOut}</b></div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200"><span className="block text-[10px] uppercase font-bold text-slate-400">Occupancy</span><b>{draft.guests}</b></div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-400 mb-3">Select Payment Method</label>
          <div className="grid grid-cols-3 gap-3">
            {[{ id: 'upi', label: 'UPI / GPay' }, { id: 'card', label: 'Credit/Debit Card' }, { id: 'netbank', label: 'Net Banking' }].map(m => (
              <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                className={`p-3 rounded-xl border text-xs font-bold transition ${paymentMethod === m.id ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-slate-200 bg-white text-slate-600'}`}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {paymentMethod === 'upi' && (
          <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-200">
            <label className="block text-xs font-bold text-slate-700">Enter VPA / UPI ID</label>
            <input type="text" placeholder="priya@paytm" className="w-full bg-white p-2.5 rounded-lg border border-slate-200 text-xs focus:outline-none" defaultValue="priya@oksbi" />
          </div>
        )}

        <p className="text-[11px] text-slate-500 flex items-center space-x-1.5">
          <Lock className="w-3.5 h-3.5 text-teal-600" />
          <span>Refundable security deposit of ₹{property.deposit.toLocaleString()} is collected at check-in.</span>
        </p>

        {error && <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">{error}</p>}

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Total Payable</span>
            <span className="text-2xl font-black text-teal-700">₹{property.price.toLocaleString()}</span>
          </div>
          <button onClick={handlePay} disabled={loading} className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition text-sm disabled:opacity-60">
            {loading ? 'Processing...' : 'Pay Now via Razorpay'}
          </button>
        </div>
      </div>
    </div>
  );
}
