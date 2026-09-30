import React from 'react';

/**
 * "Webalink" wordmark: the W is split half green, half red; the rest stays plain.
 * Use onDark on dark backgrounds (footer, hero) so "ebalink" turns white.
 * Pass className="" to inherit the surrounding font size.
 */
export const Wordmark = ({ className = 'text-3xl', onDark = false }) => (
  <span
    role="img"
    aria-label="Webalink"
    className={`inline-block font-extrabold tracking-tight leading-none ${className}`}
  >
    <span
      aria-hidden="true"
      className={`inline-block bg-clip-text text-transparent ${
        onDark
          ? 'bg-[linear-gradient(115deg,#22c55e_50%,#ef4444_50%)]'
          : 'bg-[linear-gradient(115deg,#16a34a_50%,#dc2626_50%)]'
      }`}
    >
      W
    </span>
    <span aria-hidden="true" className={onDark ? 'text-white' : 'text-gray-800'}>ebalink</span>
  </span>
);

export default Wordmark;
