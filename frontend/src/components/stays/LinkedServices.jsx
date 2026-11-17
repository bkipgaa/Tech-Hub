/**
 * LinkedServices.jsx
 * ==================
 * On a business's page: the services that go with its group (Hardware →
 * Plumbing, Electrical…), each linking to that service's page, labelled with
 * what its experts are called (Fundis, Stylists, …).
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Wrench, ChevronRight } from 'lucide-react';
import useServiceBuckets from '../../hooks/useServiceBuckets';
import { categoryPath } from '../../utils/servicePaths';
import { groupById } from '../../utils/listingCategories';

const LinkedServices = ({ groupId, near }) => {
  const { bucketOf } = useServiceBuckets();
  const services = groupById(groupId)?.services || [];
  if (!services.length) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="font-semibold text-gray-800 flex items-center gap-2">
        <Wrench className="w-4 h-4 text-green-600" /> Need an expert for this?
      </p>
      <p className="text-sm text-gray-500 mt-1">
        Services that go with this business{near ? `, near ${near}` : ''}.
      </p>
      <div className="mt-3 space-y-1">
        {services.map((s) => (
          <Link
            key={s}
            to={categoryPath(s)}
            className="flex items-center justify-between gap-2 px-2 py-2 -mx-2 rounded-md text-sm hover:bg-green-50 group"
          >
            <span className="font-medium text-gray-800 group-hover:text-green-700">{s}</span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              {bucketOf(s)?.expertTerm || 'Experts'} <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default LinkedServices;
