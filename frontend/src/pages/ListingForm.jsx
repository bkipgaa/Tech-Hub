/**
 * ListingForm.jsx
 * ===============
 * Create (/stays/new) or edit (/stays/:id/edit) a Stays & Spaces listing.
 * Photos upload one at a time to /listings/photos and are saved with the listing.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertCircle, ImagePlus, X, Star } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { cldImage } from '../utils/media';
import { LocationPicker } from '../components/stays/ListingMap';
import usePlaces from '../hooks/usePlaces';
import {
  LISTING_GROUPS, PROPERTY_TYPES, AMENITIES, LISTER_TYPES, COUNTIES,
  categoryById, isShortStay, isBusiness, isEntertainment, amenitiesFor, priceUnitLabel,
  LISTING_FREE_MONTHS, LISTING_FREE_COUNT, LISTING_PRICE,
} from '../utils/listingCategories';

const MAX_PHOTOS = 12;

const EMPTY = {
  category: '',
  listerType: 'owner',
  title: '',
  description: '',
  propertyType: '',
  bedrooms: '',
  bathrooms: '',
  maxGuests: '',
  sizeSqft: '',
  price: '',
  deposit: '',
  county: '',
  town: '',
  estate: '',
  openingHours: '',
  landmark: '',
  lat: '',
  lng: '',
  amenities: [],
  photos: [],
  contactPhone: '',
  whatsapp: true,
  availableFrom: '',
};

const inputClass =
  'mt-1 w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none';

const Field = ({ label, hint, children, required }) => (
  <label className="block text-sm font-medium text-gray-700">
    {label} {required && <span className="text-red-500">*</span>}
    {children}
    {hint && <span className="block text-xs font-normal text-gray-400 mt-1">{hint}</span>}
  </label>
);

const Section = ({ title, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
    <h2 className="font-semibold text-gray-800">{title}</h2>
    {children}
  </div>
);

const ListingForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInput = useRef(null);

  const [form, setForm] = useState({ ...EMPTY, contactPhone: user?.phone || '' });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState('');

  // Suggestions: towns already listed in the county, estates already listed in the town
  const townSuggestions = usePlaces({ county: form.county, scope: 'all' });
  const estateSuggestions = usePlaces({ county: form.county, town: form.town.trim(), scope: 'all' });

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/listings/${id}`)
      .then((r) => {
        const l = r.data?.data;
        if (!l?.isOwner) {
          setError('You can only edit your own listings.');
          return;
        }
        setForm({
          ...EMPTY,
          ...Object.fromEntries(Object.entries(l).filter(([k]) => k in EMPTY).map(([k, v]) => [k, v ?? ''])),
          availableFrom: l.availableFrom ? l.availableFrom.slice(0, 10) : '',
        });
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load this listing.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const toggleAmenity = (a) =>
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter((x) => x !== a) : [...f.amenities, a],
    }));

  const addPhotos = async (files) => {
    const room = MAX_PHOTOS - form.photos.length;
    const picked = Array.from(files || []).slice(0, room);
    if (!picked.length) return;
    setError('');
    setUploading((n) => n + picked.length);
    for (const file of picked) {
      try {
        const body = new FormData();
        body.append('photo', file);
        const r = await api.post('/listings/photos', body);
        const photo = r.data?.data;
        if (photo?.url) setForm((f) => ({ ...f, photos: [...f.photos, photo].slice(0, MAX_PHOTOS) }));
      } catch (err) {
        setError(err.response?.data?.message || `Could not upload ${file.name}.`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (fileInput.current) fileInput.current.value = '';
  };

  const removePhoto = (url) => setForm((f) => ({ ...f, photos: f.photos.filter((p) => p.url !== url) }));
  const makeCover = (url) =>
    setForm((f) => ({ ...f, photos: [f.photos.find((p) => p.url === url), ...f.photos.filter((p) => p.url !== url)] }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.category) return setError('Please choose a category.');
    if (!form.county || !form.town.trim()) return setError('Please choose the county and fill in the town.');
    if (form.lat === '' || form.lng === '') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return setError('Please set the location on the map so clients nearby can find you.');
    }
    setSaving(true);
    try {
      const allowed = new Set(amenitiesFor(form.category).map((a) => a.id));
      const payload = { ...form, amenities: form.amenities.filter((a) => allowed.has(a)), availableFrom: form.availableFrom || null };
      const r = isEdit ? await api.put(`/listings/${id}`, payload) : await api.post('/listings', payload);
      navigate("/my-listings", { state: { notice: r.data?.message } });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save your listing. Please try again.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  const category = categoryById(form.category);
  const shortStay = isShortStay(form.category);
  const business = isBusiness(form.category);
  const entertainment = isEntertainment(form.category);
  const priceLabel = entertainment
    ? 'Entry fee (KES)'
    : `Price (KES)${category ? ` ${priceUnitLabel(category.priceUnit)}` : ''}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <form onSubmit={submit} className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <Link to="/my-listings" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-green-700">
          <ArrowLeft className="w-4 h-4" /> My listings
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{isEdit ? 'Edit listing' : 'List your property'}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Your first {LISTING_FREE_COUNT} listings are free for {LISTING_FREE_MONTHS} months. Any more, and every listing after that,
            are KES {LISTING_PRICE} a month each. New listings are checked by our team before they go live.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <Section title="What are you listing?">
          {LISTING_GROUPS.map((g) => (
            <div key={g.id}>
              <p className="inline-block text-xs font-semibold uppercase tracking-wide text-white bg-red-600 px-2.5 py-1 rounded-md mb-2">
                {g.name} · {priceUnitLabel(g.priceUnit)}
              </p>
              <div className="flex flex-wrap gap-2">
                {g.categories.map((c) => (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => setForm((f) => ({ ...f, category: c.id }))}
                    className={`px-3 py-2 rounded-lg text-sm border ${
                      form.category === c.id
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-green-100 hover:border-green-500'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <Field label="You are the">
            <select value={form.listerType} onChange={set('listerType')} className={inputClass}>
              {LISTER_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </Field>
        </Section>

        <Section title="Describe the place">
          <Field label="Title" required hint={entertainment ? 'e.g. Rooftop lounge with live band, Westlands' : 'e.g. Cosy 1-bedroom near Yaya Centre'}>
            <input value={form.title} onChange={set('title')} maxLength={120} required className={inputClass} />
          </Field>
          <Field label="Description" hint={entertainment ? 'Music, events, drinks and food, dress code, age limit.' : 'What makes it good? Rules, nearby shops, transport, water and power.'}>
            <textarea value={form.description} onChange={set('description')} rows={5} maxLength={3000} className={inputClass} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            {!business && !entertainment && (
              <Field label="Unit type">
                <select value={form.propertyType} onChange={set('propertyType')} className={inputClass}>
                  <option value="">Choose…</option>
                  {PROPERTY_TYPES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </Field>
            )}
            {!business && !entertainment && (
              <Field label="Bedrooms">
                <input type="number" min="0" value={form.bedrooms} onChange={set('bedrooms')} className={inputClass} />
              </Field>
            )}
            {!business && !entertainment && (
              <Field label="Bathrooms">
                <input type="number" min="0" value={form.bathrooms} onChange={set('bathrooms')} className={inputClass} />
              </Field>
            )}
            {shortStay && (
              <Field label="Max guests">
                <input type="number" min="1" value={form.maxGuests} onChange={set('maxGuests')} className={inputClass} />
              </Field>
            )}
            {entertainment && (
              <Field label="Opening hours" hint="e.g. Wed–Sun, 6pm–4am">
                <input value={form.openingHours} onChange={set('openingHours')} maxLength={120} className={inputClass} />
              </Field>
            )}
            {business && (
              <Field label="Size (sq ft)">
                <input type="number" min="0" value={form.sizeSqft} onChange={set('sizeSqft')} className={inputClass} />
              </Field>
            )}
          </div>
        </Section>

        <Section title="Price">
          <div className="grid grid-cols-2 gap-3">
            <Field label={priceLabel} required hint={entertainment ? 'Enter 0 for free entry' : undefined}>
              <input type="number" min={entertainment ? 0 : 1} value={form.price} onChange={set('price')} required className={inputClass} />
            </Field>
            {!shortStay && !entertainment && (
              <Field label="Deposit (KES)" hint="Leave empty if none">
                <input type="number" min="0" value={form.deposit} onChange={set('deposit')} className={inputClass} />
              </Field>
            )}
            {!entertainment && <Field label="Available from" hint="Leave empty if available now">
              <input type="date" value={form.availableFrom} onChange={set('availableFrom')} className={inputClass} />
            </Field>}
          </div>
        </Section>

        <Section title="Location">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="County" required>
              <select
                value={form.county}
                onChange={(e) => setForm((f) => ({ ...f, county: e.target.value, town: '', estate: '' }))}
                required
                className={inputClass}
              >
                <option value="">Choose a county…</option>
                {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Town" required hint={form.county ? 'Pick one or type a new town' : 'Choose the county first'}>
              <input
                value={form.town}
                onChange={(e) => setForm((f) => ({ ...f, town: e.target.value, estate: '' }))}
                list="town-options"
                maxLength={60}
                required
                disabled={!form.county}
                placeholder="e.g. Nairobi, Thika, Nyali"
                className={inputClass}
                autoComplete="off"
              />
              <datalist id="town-options">
                {townSuggestions.items.map((t) => <option key={t.name} value={t.name} />)}
              </datalist>
            </Field>
            <Field label="Estate" hint={form.town ? 'Optional. Pick one or type a new estate' : 'Optional'}>
              <input
                value={form.estate}
                onChange={set('estate')}
                list="estate-options"
                maxLength={60}
                disabled={!form.town.trim()}
                placeholder="e.g. Kilimani, South B"
                className={inputClass}
                autoComplete="off"
              />
              <datalist id="estate-options">
                {estateSuggestions.items.map((x) => <option key={x.name} value={x.name} />)}
              </datalist>
            </Field>
          </div>
          <Field label="Nearby landmark" hint="Don't add the house number. Share it once you've spoken to the client.">
            <input value={form.landmark} onChange={set('landmark')} maxLength={160} className={inputClass} />
          </Field>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Pin on the map <span className="text-red-500">*</span>
            </p>
            <p className="text-xs text-gray-500 mb-2">This is how clients searching “near me” find your place.</p>
            <LocationPicker
              value={form.lat !== '' && form.lng !== '' ? { lat: Number(form.lat), lng: Number(form.lng) } : null}
              onChange={({ lat, lng }) => setForm((f) => ({ ...f, lat, lng }))}
            />
          </div>
        </Section>

        <Section title="What it offers">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {amenitiesFor(form.category).map((a) => (
              <label key={a.id} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.amenities.includes(a.id)}
                  onChange={() => toggleAmenity(a.id)}
                  className="rounded text-green-600 focus:ring-green-500"
                />
                {a.label}
              </label>
            ))}
          </div>
        </Section>

        <Section title={`Photos (${form.photos.length}/${MAX_PHOTOS})`}>
          <p className="text-sm text-gray-500 -mt-2">Good, bright photos get far more calls. The first photo is the cover.</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {form.photos.map((p, i) => (
              <div key={p.url} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                <img src={cldImage(p.url, 300)} alt="" className="w-full h-full object-cover" />
                {i === 0 ? (
                  <span className="absolute bottom-1 left-1 bg-green-600 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">Cover</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => makeCover(p.url)}
                    title="Make cover photo"
                    className="absolute bottom-1 left-1 bg-white/90 rounded p-1 text-gray-700 hover:text-green-700"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(p.url)}
                  aria-label="Remove photo"
                  className="absolute top-1 right-1 bg-white/90 rounded-full p-1 text-gray-700 hover:text-red-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {Array.from({ length: uploading }).map((_, i) => (
              <div key={`u${i}`} className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
              </div>
            ))}
            {form.photos.length + uploading < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 hover:border-green-500 hover:text-green-700"
              >
                <ImagePlus className="w-6 h-6" />
                <span className="text-xs mt-1">Add photos</span>
              </button>
            )}
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => addPhotos(e.target.files)}
          />
        </Section>

        <Section title="How clients reach you">
          <Field label="Phone number" required hint="Only shown to signed-in Webafix users.">
            <input type="tel" value={form.contactPhone} onChange={set('contactPhone')} placeholder="0712 345 678" required className={inputClass} />
          </Field>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={form.whatsapp} onChange={set('whatsapp')} className="rounded text-green-600 focus:ring-green-500" />
            Clients can also message me on WhatsApp on this number
          </label>
        </Section>

        <div className="flex gap-3 justify-end pb-8">
          <Link to="/my-listings" className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving || uploading > 0}
            className="px-6 py-2.5 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 inline-flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEdit ? 'Save changes' : 'Publish listing'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ListingForm;
