/**
 * HeroSlideshow Component
 * =======================
 * Full-bleed background for the home hero. Cross-fades through photos of
 * experts at work, one per service area, with a label for the current one.
 *
 * - Auto-advances every INTERVAL ms, unless the visitor prefers reduced motion.
 * - Dots let the visitor jump to a slide.
 * - Photos are free Unsplash images; each slide credits its photographer.
 *
 * Usage (inside a `relative` container):
 *   <HeroSlideshow />
 */

import React, { useEffect, useState } from 'react';

const INTERVAL = 6000;

const unsplash = (id) => {
  const base = `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=75&w=`;
  return { src: `${base}1920`, srcSet: `${base}768 768w, ${base}1280 1280w, ${base}1920 1920w` };
};

const SLIDES = [
  {
    label: 'Electrical Services',
    alt: 'Electrician in a hard hat and workwear repairing power lines from a lift',
    photo: unsplash('1747110594869-789610507597'),
    position: 'object-[40%_35%]',
    credit: 'EriGle Gon',
    href: 'https://unsplash.com/photos/an-electrician-works-on-power-lines-from-a-lift-QBeTa2KoTyI',
  },
  {
    label: 'Telecommunication',
    alt: 'Cell towers with antennas against a cloudy blue sky',
    photo: unsplash('1673798880756-889117cacb7e'),
    position: 'object-[50%_30%]',
    credit: 'Mudit Agarwal',
    href: 'https://unsplash.com/photos/a-group-of-cell-towers-sitting-under-a-cloudy-blue-sky-QfAnNvh3qTw',
  },
  {
    label: 'IT & Networking',
    alt: 'Modern data centre with rows of white server cabinets',
    photo: unsplash('1784652852605-6945598f2af3'),
    position: 'object-center',
    credit: 'Tony Marinescu',
    href: 'https://unsplash.com/photos/modern-data-center-with-rows-of-white-server-cabinets-fImCPTZ026U',
  },
  {
    label: 'Civil Engineering & Construction',
    alt: 'Two builders in blue overalls at a construction site',
    photo: unsplash('1787672357497-9d9e025f01b3'),
    position: 'object-[50%_20%]',
    credit: 'Divaris Shirichena',
    href: 'https://unsplash.com/photos/men-in-blue-work-uniforms-ndR5lv2aK10',
  },
  {
    label: 'Mechanical Engineering',
    alt: 'Mechanic tightening a car engine part with a wrench',
    photo: unsplash('1775590766345-c117265f0c1b'),
    position: 'object-center',
    credit: 'Sasun Bughdaryan',
    href: 'https://unsplash.com/photos/mechanic-using-a-wrench-on-a-car-engine-9gB7APNSquE',
  },
  {
    label: 'Plumbing',
    alt: 'White water pipes fitted with red valves',
    photo: unsplash('1786294112341-b86211513b92'),
    position: 'object-center',
    credit: 'Sylvain Miklaszewski',
    href: 'https://unsplash.com/photos/industrial-pipes-with-red-valves-PBhR1Kw1wXk',
  },
  {
    label: 'Electronics & Repairs',
    alt: 'Engineer testing a circuit board at an electronics workbench',
    photo: unsplash('1705579610200-d7e0f6000bb1'),
    position: 'object-[50%_35%]',
    credit: 'ThisisEngineering',
    href: 'https://unsplash.com/photos/a-woman-looking-at-a-piece-of-electronic-equipment-R-9lrQEb_Hg',
  },
];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const HeroSlideshow = () => {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const timer = setTimeout(() => setActive((i) => (i + 1) % SLIDES.length), INTERVAL);
    return () => clearTimeout(timer);
  }, [active]);

  const current = SLIDES[active];

  return (
    <div className="absolute inset-0">
      {SLIDES.map((slide, i) => (
        <img
          key={slide.photo.src}
          src={slide.photo.src}
          srcSet={slide.photo.srcSet}
          sizes="100vw"
          alt={i === active ? slide.alt : ''}
          aria-hidden={i !== active}
          loading={i === 0 ? 'eager' : 'lazy'}
          decoding="async"
          className={`absolute inset-0 w-full h-full object-cover ${slide.position} transition-opacity duration-1000 ease-in-out ${
            i === active ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {/* Light overlay: keeps photos bright; the hero text carries a shadow for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/30 to-black/55" />

      {/* Current service label + slide dots */}
      <div className="absolute bottom-4 inset-x-0 z-20 flex flex-col items-center gap-2 px-4">
        <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-white/90 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
          {current.label}
        </span>
        <div className="flex gap-1">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.label}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show ${slide.label}`}
              aria-current={i === active}
              className="p-1.5 sm:p-1"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-300 ${
                  i === active ? 'w-6 bg-green-500' : 'w-1.5 bg-white/60 hover:bg-white'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Photo credit (Unsplash licence) */}
      <a
        href={current.href}
        target="_blank"
        rel="noopener noreferrer"
        className="hidden sm:block absolute bottom-2 right-3 z-20 text-[10px] text-white/50 hover:text-white/80"
      >
        Photo: {current.credit} / Unsplash
      </a>
    </div>
  );
};

export default HeroSlideshow;
