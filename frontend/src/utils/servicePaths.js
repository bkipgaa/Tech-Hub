// Links into the services pages: /services/:mainCategory[/:serviceCategory]
export const categoryPath = (mainCategory, serviceCategory) =>
  `/services/${encodeURIComponent(mainCategory)}${
    serviceCategory ? `/${encodeURIComponent(serviceCategory)}` : ''
  }`;

// Section ids on the Services pages (ServicesHighlights), for the jump buttons
export const HIGHLIGHT_SECTIONS = { popular: 'popular-services', top: 'top-experts', nearby: 'experts-near-you' };
