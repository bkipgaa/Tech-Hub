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
    alt: 'Electrician in a hard hat and safety gloves repairing an electrical meter panel',
    photo: unsplash('1621905251918-48416bd8575a'),
    position: 'object-[30%_30%]',
    credit: 'Emmanuel Ikwuegbu',
    href: 'https://unsplash.com/photos/man-in-brown-and-white-plaid-dress-shirt-and-yellow-hard-hat-holding-black-and-orange--0-kl1BjvFc',
  },
  {
    label: 'Telecommunication',
    alt: 'Technician sorting a bundle of telecommunication cables',
    photo: unsplash('1708980047954-1400f412d67c'),
    position: 'object-[75%_60%]',
    credit: 'Brock Wegner',
    href: 'https://unsplash.com/photos/a-man-holding-a-bunch-of-wires-in-his-hand-6tUsv-H35E8',
  },
  {
    label: 'IT & Networking',
    alt: 'Network technician patching cables in a server cabinet',
    photo: unsplash('1629837093109-11325d6e7afd'),
    position: 'object-[50%_30%]',
    credit: 'Sammyayot254',
    href: 'https://unsplash.com/photos/man-in-blue-denim-button-up-shirt-standing-beside-white-metal-frame-knUZi7dzb58',
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
    alt: 'Welder in a protective helmet fabricating metal in a workshop',
    photo: unsplash('1686819649144-d5592c6f0f60'),
    position: 'object-[50%_20%]',
    credit: 'Divaris Shirichena',
    href: 'https://unsplash.com/photos/a-man-wearing-a-helmet-standing-next-to-a-machine-jquy4-lYwIY',
  },
  {
    label: 'Plumbing',
    alt: 'Worker in a safety vest carrying water pipes on site',
    photo: unsplash('1785096046242-6e5b9260c630'),
    position: 'object-[40%_15%]',
    credit: 'Shane Ryan Herilalaina',
    href: 'https://unsplash.com/photos/worker-in-orange-vest-carrying-pipes-on-a-dirt-path-ofqkpvqFJic',
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

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/55 to-black/75" />

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
