/**
 * SignUp.jsx
 * ==========
 * Sign up in four steps:
 *   1. How will you use Webafix? expert, client, list a property, find a stay
 *   2. What for: an expert's categories and services, the kind of expert a
 *      client needs, or a Stays & Spaces category
 *   3. Share your location (required); town and county are filled in from it
 *   4. Account details; experts can also attach their CV, which is uploaded
 *      once the account exists and fills in their profile sections
 * Afterwards each kind of user lands where they can get going: experts on
 * their dashboard, clients on Services, listers on the listing form and
 * stay seekers on Stays & Spaces near them.
 */

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserPlus, Mail, Lock, User, Phone, Wrench, Search, Home as HomeIcon, BedDouble,
  ArrowLeft, ArrowRight, Navigation, Loader2, CheckCircle, MapPin, AlertCircle, FileText, X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import ServicePicker from '../components/ServicePicker';
import { EMPTY_GROUP, servicesError } from '../utils/serviceGroups';
import { LISTING_GROUPS } from '../utils/listingCategories';
import { getLivePosition, reverseGeocode } from '../utils/geo';
import { CV_ACCEPT, cvFileError } from '../utils/cv';

const INTENTS = [
  { id: 'expert', icon: Wrench, title: "I'm an expert", text: 'Offer my services and get hired' },
  { id: 'client', icon: Search, title: 'I need an expert', text: 'Find someone near me for a job' },
  { id: 'lister', icon: HomeIcon, title: 'I want to list a property', text: 'Stays, rentals, business or entertainment spaces' },
  { id: 'stay_seeker', icon: BedDouble, title: "I'm looking for a stay or space", text: 'Find places near me' },
];

const STEPS = ['You are', 'Details', 'Location', 'Account'];

const inputClass = 'w-full p-3 border-2 border-green-300 rounded-lg focus:border-red-500 focus:outline-none';

const SignUp = () => {
  const { register, getTechnicianProfile } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [intent, setIntent] = useState('');
  const [services, setServices] = useState([{ ...EMPTY_GROUP }]);
  const [mainCategory, setMainCategory] = useState('');
  const [listingCategory, setListingCategory] = useState('');
  const [location, setLocation] = useState(null); // { lat, lng, formattedAddress }
  const [address, setAddress] = useState({ city: '', state: '' });
  const [locating, setLocating] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState('');
  const [catalogTry, setCatalogTry] = useState(0); // bumped by "Try again"
  const [cvFile, setCvFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(''); // '' | 'account' | 'cv'

  // Experts and clients pick from the service catalog
  useEffect(() => {
    if (catalog || (intent !== 'expert' && intent !== 'client')) return;
    setCatalogError('');
    api
      .get('/service-catalog/complete')
      .then((r) => setCatalog(r.data?.data || {}))
      .catch(() => setCatalogError('Could not load categories. Check your connection and try again.'));
  }, [intent, catalog, catalogTry]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const pickCv = (e) => {
    const file = e.target.files?.[0] || null;
    e.target.value = '';
    const problem = cvFileError(file);
    setError(problem);
    if (!problem) setCvFile(file);
  };

  const shareLocation = async () => {
    setLocating(true);
    setError('');
    try {
      const pos = await getLivePosition({ timeout: 20000 });
      const place = await reverseGeocode(pos);
      setLocation({ lat: pos.lat, lng: pos.lng, formattedAddress: place.formattedAddress });
      setAddress((prev) => ({ city: place.city || prev.city, state: place.state || prev.state }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLocating(false);
    }
  };

  // Problem that stops the current step, or ''
  const stepError = () => {
    if (step === 0 && !intent) return 'Choose how you will use Webafix.';
    if (step === 1) {
      if (intent === 'expert') return servicesError(services);
      if (intent === 'client' && !mainCategory) return 'Pick the kind of expert you need.';
      if ((intent === 'lister' || intent === 'stay_seeker') && !listingCategory) return 'Pick a category.';
    }
    if (step === 2) {
      if (!location) return 'Please share your location to continue.';
      if (!address.city.trim() || !address.state.trim()) return 'Enter your town and county.';
    }
    return '';
  };

  const next = () => {
    const problem = stepError();
    if (problem) {
      setError(problem);
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const back = () => {
    setError('');
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < STEPS.length - 1) {
      next();
      return;
    }
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    const { confirmPassword: _confirm, ...account } = formData;
    const payload = {
      ...account,
      signupIntent: intent,
      location,
      address,
      ...(intent === 'expert' && { services: services.filter((g) => g.mainCategory) }),
      ...(intent === 'client' && { mainCategory }),
      ...((intent === 'lister' || intent === 'stay_seeker') && { listingCategory }),
    };

    setLoading('account');
    const result = await register(payload);

    if (!result.success) {
      setLoading('');
      setError(result.error);
      return;
    }

    // The account exists now; a CV that fails to upload can be added from the dashboard
    if (intent === 'expert' && cvFile) {
      setLoading('cv');
      try {
        const body = new FormData();
        body.append('cv', cvFile);
        await api.post('/technician/profile/cv', body);
        await getTechnicianProfile();
      } catch (err) {
        console.error('CV upload after sign up failed:', err);
        window.alert(
          `Your account is ready, but your CV could not be uploaded (${err.response?.data?.message || 'connection problem'}). ` +
          'You can upload it from Education & Certifications on your dashboard.'
        );
      }
    }
    setLoading('');

    if (intent === 'expert') navigate('/technician-dashboard');
    else if (intent === 'client') navigate(`/services?category=${encodeURIComponent(mainCategory)}`);
    else if (intent === 'lister') navigate(`/stays/new?category=${listingCategory}`);
    else navigate(`/stays?category=${listingCategory}&near=1`);
  };

  const pickIntent = (id) => {
    setIntent(id);
    setError('');
    setStep(1);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className={`w-full space-y-6 bg-white p-6 sm:p-10 rounded-2xl shadow-xl ${intent === 'expert' && step === 1 ? 'max-w-2xl' : 'max-w-md'}`}>
        <div>
          <h2 className="text-3xl font-bold text-center text-green-700">Create Account</h2>
          <p className="mt-2 text-center text-gray-600">Join Webafix today</p>
        </div>

        {/* Progress */}
        <ol className="flex items-center gap-2">
          {STEPS.map((label, i) => (
            <li key={label} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= step ? 'bg-green-600' : 'bg-gray-200'}`} />
              <p className={`mt-1 text-[11px] text-center ${i === step ? 'text-green-700 font-semibold' : 'text-gray-400'}`}>{label}</p>
            </li>
          ))}
        </ol>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* ── Step 1: who are you ─────────────────────── */}
          {step === 0 && (
            <div className="space-y-3">
              <p className="font-semibold text-gray-800">How will you use Webafix?</p>
              {INTENTS.map(({ id, icon: Icon, title, text }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => pickIntent(id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-colors ${
                    intent === id ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-green-400 hover:bg-green-50'
                  }`}
                >
                  <span className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </span>
                  <span>
                    <span className="block font-semibold text-gray-900">{title}</span>
                    <span className="block text-sm text-gray-500">{text}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* ── Step 2: details ─────────────────────────── */}
          {step === 1 && (intent === 'expert' || intent === 'client') && !catalog && (
            <div className="py-8 text-center text-gray-500">
              {catalogError ? (
                <>
                  <p className="text-red-600">{catalogError}</p>
                  <button
                    type="button"
                    onClick={() => setCatalogTry((n) => n + 1)}
                    className="mt-3 text-sm font-semibold text-green-700 underline"
                  >
                    Try again
                  </button>
                </>
              ) : (
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-green-600" />
              )}
            </div>
          )}

          {step === 1 && intent === 'expert' && catalog && (
            <div className="space-y-3">
              <div>
                <p className="font-semibold text-gray-800">What services do you offer?</p>
                <p className="text-sm text-gray-500">
                  Pick your main category, then the service categories and services you do. You can add another category too.
                  Your expert profile goes live once our team approves it.
                </p>
              </div>
              <ServicePicker catalog={catalog} value={services} onChange={setServices} />
            </div>
          )}

          {step === 1 && intent === 'client' && catalog && (
            <div className="space-y-3">
              <p className="font-semibold text-gray-800">What kind of expert are you looking for?</p>
              <div className="flex flex-wrap gap-2">
                {Object.keys(catalog).sort().map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMainCategory(m)}
                    className={`px-3 py-2 rounded-full text-sm font-medium border-2 ${
                      mainCategory === m ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-700 hover:border-green-400'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (intent === 'lister' || intent === 'stay_seeker') && (
            <div className="space-y-4">
              <p className="font-semibold text-gray-800">
                {intent === 'lister' ? 'What would you like to list?' : 'What are you looking for?'}
              </p>
              {LISTING_GROUPS.map((g) => (
                <div key={g.id}>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{g.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {g.categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setListingCategory(c.id)}
                        className={`px-3 py-2 rounded-full text-sm font-medium border-2 ${
                          listingCategory === c.id ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-700 hover:border-green-400'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Step 3: location ────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold text-gray-800">Share your location <span className="text-red-500">*</span></p>
                <p className="text-sm text-gray-500">
                  {intent === 'expert'
                    ? 'Clients only see experts near them, so share it from where you usually work.'
                    : 'We use it to show you what is near you. You can change it later on your profile.'}
                </p>
              </div>
              <div className={`p-4 rounded-lg border ${location ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                {location && (
                  <p className="text-sm text-green-800 flex items-start gap-2 mb-3">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>Location captured{location.formattedAddress ? `: ${location.formattedAddress}` : ''}</span>
                  </p>
                )}
                <button
                  type="button"
                  onClick={shareLocation}
                  disabled={locating}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
                >
                  {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                  {locating ? 'Getting location…' : location ? 'Update my location' : 'Use my current location'}
                </button>
              </div>
              {location && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-600" /> Town
                    </label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className={inputClass}
                      placeholder="e.g. Nakuru"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">County</label>
                    <input
                      type="text"
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className={inputClass}
                      placeholder="e.g. Nakuru"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 4: account ─────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-green-600" />
                    First Name
                  </label>
                  <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} required className={inputClass} placeholder="John" />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-green-600" />
                    Last Name
                  </label>
                  <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} required className={inputClass} placeholder="Doe" />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-green-600" />
                  Email
                </label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClass} placeholder="you@example.com" />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  Phone
                </label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required className={inputClass} placeholder="0712 345 678" />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-green-600" />
                  Password
                </label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength="6" className={inputClass} placeholder="••••••••" />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-green-600" />
                  Confirm Password
                </label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className={inputClass} placeholder="••••••••" />
              </div>

              {intent === 'expert' && (
                <div>
                  <label htmlFor="cv" className="block text-gray-700 font-semibold mb-1 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-600" />
                    Your CV <span className="font-normal text-gray-400">(optional)</span>
                  </label>
                  <p className="text-sm text-gray-500 mb-2">
                    We'll fill in your experience, education and skills from it, and show it on your profile. PDF or Word, up to 5 MB.
                  </p>
                  {cvFile ? (
                    <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-green-300 bg-green-50">
                      <FileText className="w-5 h-5 text-green-700 flex-shrink-0" />
                      <span className="flex-1 min-w-0 truncate text-sm text-gray-800">{cvFile.name}</span>
                      <button type="button" onClick={() => setCvFile(null)} aria-label="Remove CV"
                        className="p-1 rounded text-gray-500 hover:text-red-600 hover:bg-white">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <input id="cv" type="file" accept={CV_ACCEPT} onChange={pickCv}
                      className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-green-100 file:text-green-800 file:font-semibold hover:file:bg-green-200" />
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Navigation ──────────────────────────────── */}
          {step > 0 && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={back}
                className="px-5 py-3 rounded-lg font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors inline-flex items-center justify-center gap-2"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!!loading}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                  {loading === 'account' ? 'Creating Account...' : loading === 'cv' ? 'Reading your CV...' : 'Sign Up'}
                </button>
              )}
            </div>
          )}

          <p className="text-center text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-red-600 hover:text-red-700 font-semibold">
              Login here
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
