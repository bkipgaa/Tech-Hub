// Links into the services pages: /services/:mainCategory[/:serviceCategory]
export const categoryPath = (mainCategory, serviceCategory) =>
  `/services/${encodeURIComponent(mainCategory)}${
    serviceCategory ? `/${encodeURIComponent(serviceCategory)}` : ''
  }`;
