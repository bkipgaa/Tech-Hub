import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Wordmark } from '../Wordmark';
import { LEGAL } from '../../config/legal';

/** Inline markup: **bold** and {{placeholder}} (highlighted so nothing is missed). */
export { Wordmark };
export const Rich = ({ text }) =>
  String(text)
    .split(/(\*\*[^*]+\*\*|\{\{[^}]+\}\})/g)
    .map((p, i) => {
      if (p.startsWith('**'))
        return <strong key={i} className="font-semibold text-gray-900">{p.slice(2, -2)}</strong>;
      if (p.startsWith('{{'))
        return (
          <mark key={i} title="Fill this in before publishing" className="rounded bg-amber-100 px-1 text-amber-900">
            {p.slice(2, -2)}
          </mark>
        );
      return <React.Fragment key={i}>{p}</React.Fragment>;
    });

const Block = ({ b }) => {
  if (typeof b === 'string') return <p className="mt-3"><Rich text={b} /></p>;
  if (b.h) return <h3 className="mt-6 font-sans text-base font-semibold text-gray-900">{b.h}</h3>;
  if (b.ul || b.ol) {
    const Tag = b.ol ? 'ol' : 'ul';
    return (
      <Tag className={`mt-3 space-y-1.5 pl-6 marker:text-green-600 ${b.ol ? 'list-decimal' : 'list-disc'}`}>
        {(b.ul || b.ol).map((li, i) => <li key={i}><Rich text={li} /></li>)}
      </Tag>
    );
  }
  if (b.note)
    return (
      <div className="mt-4 rounded-r-lg border-l-4 border-red-500 bg-red-50 px-4 py-3 font-sans text-[15px] leading-7 text-gray-800">
        <Rich text={b.note} />
      </div>
    );
  if (b.table)
    return (
      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[34rem] border-collapse text-left font-sans text-sm leading-6">
          <thead className="bg-green-50 text-green-900">
            <tr>{b.table.head.map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {b.table.rows.map((r, i) => (
              <tr key={i} className="align-top">
                {r.map((c, j) => (
                  <td key={j} className={`px-3 py-2 ${j === 0 ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                    <Rich text={c} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  return null;
};

/** Adds section numbers. A `divider` starts a new group and can restart numbering with a prefix. */
const number = (sections) => {
  let n = 0;
  let prefix = '';
  return sections.map((s) => {
    if (s.divider) { n = 0; prefix = s.prefix || ''; return s; }
    n += 1;
    return { ...s, num: `${prefix}${n}` };
  });
};

const Toc = ({ items, active, onPick }) => (
  <nav aria-label="Table of contents" className="font-sans text-sm">
    <ul className="space-y-0.5">
      {items.map((s) =>
        s.divider ? (
          <li key={s.id} className="pt-4 pb-1 text-xs font-semibold text-red-600">{s.divider}</li>
        ) : (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              onClick={onPick}
              className={`flex gap-2 rounded-md px-2 py-1.5 leading-5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 ${
                active === s.id
                  ? 'bg-green-50 font-semibold text-green-800'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="w-6 shrink-0 tabular-nums text-gray-400">{s.num}</span>
              <span>{s.title}</span>
            </a>
          </li>
        )
      )}
    </ul>
  </nav>
);

export default function LegalLayout({ title, intro, sections, other }) {
  const items = number(sections);
  const { hash } = useLocation();
  const [active, setActive] = useState(items.find((s) => !s.divider)?.id);
  const hasBlanks = JSON.stringify(sections).includes('{{') || JSON.stringify(LEGAL).includes('{{');

  useEffect(() => {
    document.title = `${title} | ${LEGAL.company}`;
    const target = hash && document.getElementById(hash.slice(1));
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [title, hash]);

  useEffect(() => {
    const els = items.filter((s) => !s.divider).map((s) => document.getElementById(s.id)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: '-96px 0px -65% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  return (
    <div className="bg-white">
      <div className="h-1.5 bg-[linear-gradient(90deg,#16a34a_50%,#dc2626_50%)]" aria-hidden="true" />

      <header className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <Link to="/" className="inline-block rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600">
            <Wordmark className="text-4xl sm:text-5xl" />
          </Link>
          <h1 className="mt-6 font-sans text-3xl font-bold text-gray-900 sm:text-4xl">{title}</h1>
          <p className="mt-2 font-sans text-sm text-gray-600">
            Effective <Rich text={LEGAL.effectiveDate} />. Version {LEGAL.version}. Applies to the {LEGAL.platform} platform, operated by <Rich text={LEGAL.legalEntity} />.
          </p>
          {import.meta.env.DEV && hasBlanks && (
            <p className="mt-4 max-w-2xl rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 font-sans text-sm text-amber-900">
              Draft mode: the highlighted fields still need your details. Fill them in <code>src/config/legal.js</code>. This notice only shows in development.
            </p>
          )}
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:px-8">
        <aside>
          <details className="rounded-lg border border-gray-200 lg:hidden">
            <summary className="cursor-pointer px-4 py-3 font-sans text-sm font-semibold text-gray-800">Jump to a section</summary>
            <div className="max-h-72 overflow-y-auto border-t border-gray-200 p-2">
              <Toc items={items} active={active} onPick={(e) => e.currentTarget.closest('details').removeAttribute('open')} />
            </div>
          </details>
          <div className="sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 lg:block">
            <Toc items={items} active={active} />
          </div>
        </aside>

        <article className="max-w-[68ch] font-serif text-[17px] leading-8 text-gray-700 print:max-w-none">
          {intro && <div className="-mt-3 mb-4"><Block b={{ note: intro }} /></div>}

          {items.map((s) =>
            s.divider ? (
              <div key={s.id} id={s.id} className="mt-16 scroll-mt-24 rounded-xl bg-gray-900 p-6 font-sans text-white">
                <div className="mb-4 h-1 w-16 bg-[linear-gradient(90deg,#22c55e_50%,#ef4444_50%)]" aria-hidden="true" />
                <h2 className="text-2xl font-bold">{s.divider}</h2>
                {s.intro && <p className="mt-2 text-sm leading-6 text-gray-300"><Rich text={s.intro} /></p>}
              </div>
            ) : (
              <section key={s.id} id={s.id} className="scroll-mt-24 border-t border-gray-200 pt-8 mt-10 first:border-0 first:mt-0 first:pt-0">
                <h2 className="flex gap-3 font-sans text-xl font-bold text-gray-900">
                  <span className="min-w-[2rem] tabular-nums text-green-700">{s.num}</span>
                  <span>{s.title}</span>
                </h2>
                {s.body.map((b, i) => <Block key={i} b={b} />)}
              </section>
            )
          )}

          <footer className="mt-16 rounded-xl border border-gray-200 bg-gray-50 p-6 font-sans text-sm leading-6 text-gray-700">
            <p>
              Questions about this document? Email <Rich text={LEGAL.legalEmail} /> or write to <Rich text={LEGAL.address} />.
            </p>
            <p className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {other && (
                <Link to={other.to} className="font-semibold text-green-700 underline underline-offset-2 hover:text-green-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600">
                  Read our {other.label}
                </Link>
              )}
              <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0 }); }} className="font-semibold text-red-600 underline underline-offset-2 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-600">
                Back to top
              </a>
            </p>
          </footer>
        </article>
      </div>
    </div>
  );
}
