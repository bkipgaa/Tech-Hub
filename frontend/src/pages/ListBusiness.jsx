/**
 * ListBusiness.jsx
 * ================
 * /businesses/new — step one of listing a business: pick its group
 * (Hardware & Building Supplies, Health & Pharmacy, Stays & Accommodation…).
 * Each group opens its own listing page, /businesses/new/:groupId.
 */

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { LISTING_GROUPS, LISTING_FREE_MONTHS, LISTING_FREE_COUNT, LISTING_PRICE, LISTING_PRICE_CHANGE_NOTE } from '../utils/listingCategories';
import { groupIcon } from '../components/stays/groupIcons';

const ListBusiness = () => {
  const navigate = useNavigate();
  // Shops first: that's what most people list; stays and rentals after
  const groups = [...LISTING_GROUPS].sort((a, b) => (a.kind === 'shop' ? 0 : 1) - (b.kind === 'shop' ? 0 : 1));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <Link to="/businesses" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-green-700">
          <ArrowLeft className="w-4 h-4" /> Businesses
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mt-3">List your business</h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          What kind of business is it? Pick its group to continue.
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Your first {LISTING_FREE_COUNT} listings are free for {LISTING_FREE_MONTHS} months, then KES {LISTING_PRICE} a month each{LISTING_PRICE_CHANGE_NOTE}.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
          {groups.map((g) => {
            const Icon = groupIcon(g.id);
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => navigate(`/businesses/new/${g.id}`)}
                className="group text-left bg-white border border-gray-200 rounded-xl p-4 hover:border-green-500 hover:shadow-sm active:scale-[0.99] transition flex gap-3"
              >
                <span className="w-11 h-11 rounded-lg bg-green-50 text-green-700 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-gray-900 group-hover:text-green-700">{g.name}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-600 flex-shrink-0" />
                  </span>
                  <span className="block text-sm text-gray-500 mt-0.5">{g.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ListBusiness;
