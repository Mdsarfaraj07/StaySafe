import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Plus, X, Pencil, Trash2 } from 'lucide-react';
import { getOwnerProperties, getOwnerBookings, getOwnerStats, createOwnerProperty, updateOwnerProperty, deleteOwnerProperty } from '../../api/services';

const AMENITY_OPTIONS = ['WiFi', 'AC', 'Food Included', 'Laundry', 'Parking', 'Gym', 'Housekeeping'];
const STATUS_STYLE = { Active: 'bg-teal-100 text-teal-800', 'Under Review': 'bg-amber-100 text-amber-800', Rejected: 'bg-rose-100 text-rose-700' };

export default function OwnerDashboardView({ user, showToast, unreadCount, onOpenNotif, onChanged }) {
  const [activeTab, setActiveTab] = useState('properties');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProperty, setEditingProperty] = useState(null);
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({ listedProperties: 0, activeBookings: 0, totalEarnings: 0, pendingVerifications: 0 });

  const emptyForm = { name: '', type: 'PG', location: '', price: '', deposit: '', description: '', image: '', amenities: ['WiFi', 'AC'] };
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(() => {
    getOwnerProperties().then(setProperties).catch(() => {});
    getOwnerBookings().then(setBookings).catch(() => {});
    getOwnerStats().then(setStats).catch(() => {});
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const closePropertyModal = () => { setShowAddModal(false); setEditingProperty(null); setForm(emptyForm); };

  const startEdit = (p) => {
    setEditingProperty(p);
    setForm({
      name: p.name || '', type: p.type || 'PG', location: p.location || '',
      price: String(p.price ?? ''), deposit: String(p.deposit ?? ''),
      description: p.description || '', image: p.image || '',
      amenities: Array.isArray(p.amenities) ? p.amenities : []
    });
    setShowAddModal(true);
  };

  const toggleAmenity = (a) => setForm({ ...form, amenities: form.amenities.includes(a) ? form.amenities.filter(x => x !== a) : [...form.amenities, a] });

  const removeProperty = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await deleteOwnerProperty(p.id);
      refresh();
      onChanged();
      showToast('Property deleted successfully.');
    } catch (err) { showToast(err.message || 'Could not delete property.'); }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const isEditing = Boolean(editingProperty);
    try {
      const payload = {
        name: form.name, type: form.type, location: form.location,
        price: Number(form.price), deposit: form.deposit ? Number(form.deposit) : null,
        description: form.description, amenities: form.amenities,
        images: form.image ? [form.image] : []
      };
      if (editingProperty) {
        await updateOwnerProperty(editingProperty.id, payload);
      } else {
        await createOwnerProperty(payload);
      }
      closePropertyModal();
      refresh();
      onChanged();
      showToast(isEditing ? 'Property updated and sent for admin verification.' : 'New property submitted to Admin Verification Queue!');
    } catch (err) { showToast(err.message); }
    finally { setSaving(false); }
  };

  const initials = user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const field = 'w-full p-2.5 rounded-lg border border-slate-200 focus:outline-none';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg">{initials}</div>
          <div>
            <span className="inline-block bg-blue-500/20 text-blue-300 font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-md mb-1 border border-blue-500/30">Verified Partner Host</span>
            <h1 className="text-2xl font-black text-white">Welcome, {user.name}</h1>
            <p className="text-slate-400 text-xs">Property Owner Console</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button onClick={onOpenNotif} className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-bold px-4 py-3 rounded-xl transition flex items-center space-x-2">
            <Bell className="w-4 h-4 text-blue-400" /><span>Alerts</span>
            {unreadCount > 0 && <span className="bg-blue-500 text-white font-black text-[10px] px-1.5 rounded-full">{unreadCount}</span>}
          </button>
          <button onClick={() => { setEditingProperty(null); setForm(emptyForm); setShowAddModal(true); }} className="bg-gradient-to-r from-teal-500 to-blue-600 text-white font-bold text-xs px-5 py-3 rounded-xl shadow-md flex items-center space-x-2">
            <Plus className="w-4 h-4" /><span>Add New Property</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Listed Properties" value={stats.listedProperties} />
        <Stat label="Active Bookings" value={stats.activeBookings} />
        <Stat label="Net Earnings (after 10% fee)" value={`₹${Number(stats.totalEarnings).toLocaleString()}`} valueClass="text-teal-700" />
        <Stat label="Pending Verifications" value={stats.pendingVerifications} valueClass="text-amber-500" />
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="flex space-x-3 border-b border-slate-100 pb-4">
          {[{ id: 'properties', label: 'My Properties' }, { id: 'bookings', label: 'Incoming Guests' }, { id: 'payouts', label: 'Payout History' }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === t.id ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 text-slate-600'}`}>{t.label}</button>
          ))}
        </div>

        {activeTab === 'properties' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="pb-3">Property</th><th className="pb-3">Location</th><th className="pb-3">Rent / mo</th><th className="pb-3">Verification Status</th><th className="pb-3 text-right">Bookings</th><th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {properties.length === 0 && <tr><td colSpan="6" className="py-6 text-center text-slate-400 font-semibold">No properties yet. Click "Add New Property".</td></tr>}
                {properties.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3"><div className="flex items-center space-x-3 font-bold text-slate-900"><img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" /><span>{p.name}</span></div></td>
                    <td className="py-3 text-slate-600">{p.location}</td>
                    <td className="py-3 font-bold text-teal-700">₹{p.price.toLocaleString()}</td>
                    <td className="py-3"><span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${STATUS_STYLE[p.status] || ''}`}>{p.status}</span></td>
                    <td className="py-3 text-right font-bold text-slate-800">{p.bookingsCount} Guests</td>
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => startEdit(p)} title="Edit property" className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-2 font-bold text-blue-700 hover:bg-blue-50"><Pencil className="w-3.5 h-3.5" />Edit</button>
                        <button onClick={() => removeProperty(p)} title="Delete property" className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-2 font-bold text-rose-700 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" />Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-3">
            {bookings.length === 0 && <p className="text-xs text-slate-400">No bookings yet.</p>}
            {bookings.map(b => (
              <div key={b.dbId} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-900 block">{b.customerName} — {b.propertyName}</span>
                  <span className="text-slate-500">{b.checkIn} → {b.checkOut} • {b.guests} {b.customerPhone ? `• ${b.customerPhone}` : ''}</span>
                </div>
                <span className={`font-bold px-3 py-1 rounded-lg ${b.status === 'Cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-teal-100 text-teal-800'}`}>
                  {b.status === 'Cancelled' ? 'Cancelled' : 'Approved & Paid'}
                </span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'payouts' && (
          <div className="space-y-3 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="font-bold text-slate-800 block mb-1">Razorpay Direct Payout Account: Active</span>
              <p className="text-slate-500">Platform fee of 10% is deducted from each booking.</p>
            </div>
            {bookings.filter(b => b.status !== 'Cancelled').map(b => (
              <div key={b.dbId} className="p-3 border border-slate-200 rounded-xl flex justify-between">
                <span><b>{b.id}</b> • {b.propertyName} • {b.customerName}</span>
                <span className="font-bold text-teal-700">+ ₹{Math.round(b.amount * 0.9).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white p-6 rounded-2xl max-w-lg w-full shadow-2xl space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-900 text-base">{editingProperty ? 'Edit Property' : 'List New Property for StaySafe Verification'}</h3>
              <button onClick={closePropertyModal}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3 text-xs">
              <div><label className="block font-bold uppercase text-slate-500 mb-1">Property Title</label>
                <input className={field} placeholder="e.g. Urban Heights Deluxe PG" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-bold uppercase text-slate-500 mb-1">Property Type</label>
                  <select className={field} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="PG">PG</option><option value="Flat">Flat / Apartment</option><option value="Co-living">Co-living Space</option>
                  </select></div>
                <div><label className="block font-bold uppercase text-slate-500 mb-1">Monthly Rent (₹)</label>
                  <input type="number" min="1" className={field} placeholder="8500" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block font-bold uppercase text-slate-500 mb-1">Security Deposit (₹)</label>
                  <input type="number" className={field} placeholder="Defaults to 2x rent" value={form.deposit} onChange={(e) => setForm({ ...form, deposit: e.target.value })} /></div>
                <div><label className="block font-bold uppercase text-slate-500 mb-1">Image URL (optional)</label>
                  <input className={field} placeholder="https://..." value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></div>
              </div>
              <div><label className="block font-bold uppercase text-slate-500 mb-1">Full Location Address</label>
                <input className={field} placeholder="Street, Area, City" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required /></div>
              <div><label className="block font-bold uppercase text-slate-500 mb-1">Description</label>
                <textarea className={`${field} h-16`} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><label className="block font-bold uppercase text-slate-500 mb-1">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {AMENITY_OPTIONS.map(a => (
                    <button type="button" key={a} onClick={() => toggleAmenity(a)} className={`px-2.5 py-1 rounded-full border font-semibold ${form.amenities.includes(a) ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200'}`}>{a}</button>
                  ))}
                </div></div>
              <div className="p-3 bg-teal-50 rounded-lg text-[11px] text-teal-800 border border-teal-200">
                <span className="font-bold block">Verification Requirement:</span>Submitted stays are reviewed by StaySafe Admins before going live.
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={closePropertyModal} className="w-full bg-slate-100 font-bold py-2.5 rounded-lg">Cancel</button>
                <button type="submit" disabled={saving} className="w-full bg-teal-600 text-white font-bold py-2.5 rounded-lg shadow hover:bg-teal-700 disabled:opacity-60">{saving ? 'Saving...' : editingProperty ? 'Save Changes' : 'Submit Listing'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, valueClass = 'text-slate-900' }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{label}</span>
      <span className={`text-3xl font-black block mt-1 ${valueClass}`}>{value}</span>
    </div>
  );
}
