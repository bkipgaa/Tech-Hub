/**
 * ProductsOrder.jsx
 * =================
 * A business's products on its page. Customers pick quantities and send the
 * order to the business on WhatsApp (or call). Webafix takes no payment:
 * customers pay the business directly.
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Minus, Plus, MessageCircle, Phone, Package, Truck, ImageOff } from 'lucide-react';
import { cldImage } from '../../utils/media';

const kes = (n) => `KES ${Number(n).toLocaleString('en-KE')}`;

const ProductsOrder = ({ listing, phone }) => {
  const location = useLocation();
  const products = listing.products || [];
  const [qty, setQty] = useState({}); // product _id → quantity
  const [delivery, setDelivery] = useState(false);
  const [note, setNote] = useState('');

  if (!products.length) return null;

  const change = (id, delta) => setQty((q) => ({ ...q, [id]: Math.max(0, Math.min(999, (q[id] || 0) + delta)) }));
  const picked = products.filter((p) => qty[p._id] > 0);
  const priced = picked.every((p) => p.price != null);
  const total = picked.reduce((sum, p) => sum + (p.price || 0) * qty[p._id], 0);
  const count = picked.reduce((sum, p) => sum + qty[p._id], 0);

  const message = [
    `Hi ${listing.title}, I'd like to order from Webafix:`,
    ...picked.map((p) => `• ${qty[p._id]} × ${p.name}${p.unit ? ` (${p.unit})` : ''}${p.price != null ? ` – ${kes(p.price * qty[p._id])}` : ''}`),
    picked.length && priced ? `Total: ${kes(total)}` : '',
    listing.delivery ? (delivery ? 'Please deliver it.' : "I'll pick it up.") : '',
    note.trim() ? `Note: ${note.trim()}` : '',
  ].filter(Boolean).join('\n');

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
      <h2 className="font-semibold text-gray-800 flex items-center gap-2">
        <Package className="w-5 h-5 text-green-600" /> Products ({products.length})
      </h2>
      <p className="text-sm text-gray-500 mt-0.5">Pick what you want, then send your order to the business.</p>

      <div className="mt-4 divide-y divide-gray-100">
        {products.map((p) => {
          const n = qty[p._id] || 0;
          const out = p.inStock === false;
          return (
            <div key={p._id} className={`py-3 flex gap-3 ${out ? 'opacity-60' : ''}`}>
              <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                {p.photo?.url ? (
                  <img src={cldImage(p.photo.url, 200)} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                ) : (
                  <ImageOff className="w-5 h-5 text-gray-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 leading-snug">{p.name}</p>
                {p.description && <p className="text-xs text-gray-500 line-clamp-2">{p.description}</p>}
                <p className="text-sm font-semibold text-green-700 mt-0.5">
                  {p.price != null ? kes(p.price) : 'Ask for price'}
                  {p.unit && <span className="font-normal text-gray-500"> {p.unit}</span>}
                </p>
                {out && <p className="text-xs font-semibold text-red-600">Out of stock</p>}
              </div>
              {!out && (
                <div className="flex items-center gap-1 self-center">
                  {n > 0 && (
                    <>
                      <button type="button" onClick={() => change(p._id, -1)} aria-label={`One less ${p.name}`} className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-7 text-center font-semibold text-gray-800">{n}</span>
                    </>
                  )}
                  <button type="button" onClick={() => change(p._id, 1)} aria-label={`Add ${p.name}`} className="w-9 h-9 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {picked.length > 0 && (
        <div className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-gray-800">
              Your order · {count} item{count === 1 ? '' : 's'}
            </p>
            {priced && <p className="font-bold text-green-700">{kes(total)}</p>}
          </div>
          {listing.delivery && (
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={delivery} onChange={(e) => setDelivery(e.target.checked)} className="rounded text-green-600 focus:ring-green-500" />
              <Truck className="w-4 h-4 text-green-600" /> Deliver it to me
            </label>
          )}
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder="Note for the business (optional), e.g. delivery location"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-green-500 outline-none"
          />
          {listing.isOwner ? (
            <p className="text-xs text-gray-500">This is how customers order from you.</p>
          ) : phone ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {listing.whatsapp && (
                <a
                  href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-green-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-green-700"
                >
                  <MessageCircle className="w-4 h-4" /> Order on WhatsApp
                </a>
              )}
              <a
                href={`tel:+${phone}`}
                className="inline-flex items-center justify-center gap-2 border border-green-600 text-green-700 font-semibold px-4 py-2.5 rounded-lg hover:bg-white"
              >
                <Phone className="w-4 h-4" /> Call to order
              </a>
            </div>
          ) : (
            <Link
              to="/login"
              state={{ from: location }}
              className="w-full inline-flex items-center justify-center gap-2 bg-green-600 text-white font-semibold px-4 py-2.5 rounded-lg hover:bg-green-700"
            >
              Sign in to send your order
            </Link>
          )}
          <p className="text-xs text-gray-500">You pay the business directly when you get your order.</p>
        </div>
      )}
    </div>
  );
};

export default ProductsOrder;
