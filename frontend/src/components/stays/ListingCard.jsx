/**
 * ListingCard.jsx
 * ===============
 * One Stays & Spaces listing in a results grid.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, BedDouble, Users, Ruler, ImageOff, Navigation, Clock } from 'lucide-react';
import { cldImage } from '../../utils/media';
import { categoryById, formatPrice, formatDistance, propertyTypeLabel, placeLabel } from '../../utils/listingCategories';

const ListingCard = ({ listing }) => {
  const cover = listing.photos?.[0]?.url;
  const category = categoryById(listing.category);

  const facts = [];
  if (listing.propertyType) facts.push({ icon: BedDouble, text: propertyTypeLabel(listing.propertyType) });
  else if (listing.bedrooms) facts.push({ icon: BedDouble, text: `${listing.bedrooms} bed${listing.bedrooms === 1 ? '' : 's'}` });
  if (listing.maxGuests) facts.push({ icon: Users, text: `Up to ${listing.maxGuests} guests` });
  if (listing.sizeSqft) facts.push({ icon: Ruler, text: `${listing.sizeSqft.toLocaleString()} sq ft` });
  if (listing.openingHours) facts.push({ icon: Clock, text: listing.openingHours });

  return (
    <Link
      to={`/stays/${listing._id}`}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-green-400 transition-all flex flex-col"
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        {cover ? (
          <img
            src={cldImage(cover, 600)}
            alt={listing.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <ImageOff className="w-10 h-10" />
          </div>
        )}
        {category && (
          <span className="absolute top-2 left-2 bg-white/95 text-gray-700 text-xs font-medium px-2 py-1 rounded-md shadow-sm">
            {category.name}
          </span>
        )}
        {listing.distanceKm != null && (
          <span className="absolute bottom-2 left-2 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-md shadow-sm flex items-center gap-1">
            <Navigation className="w-3 h-3" /> {formatDistance(listing.distanceKm)}
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-800 group-hover:text-green-700 line-clamp-1">{listing.title}</h3>
        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="line-clamp-1">{placeLabel(listing)}</span>
        </p>

        {facts.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
            {facts.map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1">
                <Icon className="w-3.5 h-3.5" /> {text}
              </span>
            ))}
          </div>
        )}

        <p className="mt-auto pt-3 text-lg font-bold text-green-700">
          {formatPrice(listing.price, listing.priceUnit)}
        </p>
      </div>
    </Link>
  );
};

export default ListingCard;
