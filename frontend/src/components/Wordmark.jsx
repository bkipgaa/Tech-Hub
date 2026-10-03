/**
 * Wordmark Component
 * ==================
 * The "Webalink" logotype.
 *
 * Design:
 *  - "W" is a green → red gradient, ~1.75× larger than the rest
 *  - "ebalink" is dark gray (or white on dark backgrounds)
 *
 * Size is controlled entirely by the `className` you pass in
 * (it's applied to the parent, and the "W" scales relatively).
 *
 * Usage:
 *   <Wordmark className="text-2xl" />
 *   <Wordmark className="text-4xl" onDark />
 */

import React from 'react';

export const Wordmark = ({ className = 'text-3xl', onDark = false }) => (
  <span
    role="img"
    aria-label="Webalink"
    className={`inline-flex items-baseline font-extrabold tracking-tight leading-none ${className}`}
  >
    {/* The "W" — 1.75× the parent font-size */}
    <span
      aria-hidden="true"
      className={`inline-block text-[1.75em] bg-clip-text text-transparent ${
        onDark
          ? 'bg-[linear-gradient(115deg,#22c55e_50%,#ef4444_50%)]'
          : 'bg-[linear-gradient(115deg,#16a34a_50%,#dc2626_50%)]'
      }`}
    >
      W
    </span>

    {/* "ebalink" — normal size, coloured for contrast */}
    <span
      aria-hidden="true"
      className={onDark ? 'text-white' : 'text-gray-800'}
    >
      ebalink
    </span>
  </span>
);

export default Wordmark;