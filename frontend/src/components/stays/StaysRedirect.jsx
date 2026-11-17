/**
 * Old /stays links (shared before Stays & Spaces became Businesses) → the
 * same page under /businesses, keeping the rest of the path and the query.
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const StaysRedirect = () => {
  const { pathname, search } = useLocation();
  return <Navigate to={pathname.replace(/^\/stays/, '/businesses') + search} replace />;
};

export default StaysRedirect;
