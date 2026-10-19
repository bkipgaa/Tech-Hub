/**
 * JobEvidence.jsx
 * ===============
 * Proof of finished work on a booking.
 *
 * - Everyone on the booking sees the photos / live link.
 * - The technician (canEdit) takes photos with the device camera — not from the
 *   gallery — and the live GPS location is captured at the moment of the shot.
 *   Digital jobs can give a live link instead.
 * - The "Mark work completed" button only works once there is proof.
 *
 * Camera capture uses getUserMedia into a <canvas>. Browsers without it (or
 * where the camera is blocked) fall back to <input capture="environment">,
 * which opens the camera on phones; that path is recorded as lower trust.
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Camera, MapPin, Loader2, AlertCircle, CheckSquare, Link as LinkIcon, X, RefreshCw, Check, ExternalLink,
} from 'lucide-react';
import api from '../../services/api';
import { cldImage } from '../../utils/media';
import { getLivePosition, mapsLink } from '../../utils/geo';

const errorMessage = (err, fallback) => err.response?.data?.message || err.message || fallback;

const formatTime = (d) =>
  d ? new Date(d).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

// ─── Camera modal ─────────────────────────────────────────────
const CameraCapture = ({ onClose, onCaptured }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [cameraState, setCameraState] = useState('starting'); // starting | ready | unavailable
  const [cameraError, setCameraError] = useState('');
  const [position, setPosition] = useState(null);
  const [locating, setLocating] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [shot, setShot] = useState(null); // { blob, url, capturedAt, gps, captureMethod }
  const [capturing, setCapturing] = useState(false);

  const locate = async () => {
    setLocating(true);
    setLocationError('');
    try {
      setPosition(await getLivePosition());
    } catch (err) {
      setLocationError(err.message);
    } finally {
      setLocating(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startCamera = async () => {
    setCameraState('starting');
    setCameraError('');
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('unavailable');
      setCameraError('This browser cannot open the camera directly.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraState('ready');
    } catch (err) {
      setCameraState('unavailable');
      setCameraError(err.name === 'NotAllowedError'
        ? 'Camera permission was denied. Allow camera access for this site and try again.'
        : 'The camera could not be opened.');
    }
  };

  useEffect(() => {
    locate();
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => () => { if (shot?.url) URL.revokeObjectURL(shot.url); }, [shot]);

  // GPS at the moment of the shot; the reading taken while the camera opened is
  // used only if a fresh one fails and it is under two minutes old
  const liveGpsForShot = async () => {
    try {
      return await getLivePosition({ timeout: 15000 });
    } catch (err) {
      if (position && Date.now() - position.at < 2 * 60 * 1000) return position;
      throw err;
    }
  };

  const takePhoto = async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    setCapturing(true);
    setLocationError('');
    const capturedAt = Date.now();
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    try {
      const [blob, gps] = await Promise.all([
        new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88)),
        liveGpsForShot(),
      ]);
      setPosition(gps);
      setShot({ blob, url: URL.createObjectURL(blob), capturedAt, gps, captureMethod: 'camera' });
    } catch (err) {
      setLocationError(err.message);
    } finally {
      setCapturing(false);
    }
  };

  const handleFallbackFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setCapturing(true);
    setLocationError('');
    const capturedAt = Date.now();
    try {
      const gps = await liveGpsForShot();
      setPosition(gps);
      setShot({ blob: file, url: URL.createObjectURL(file), capturedAt, gps, captureMethod: 'capture_input' });
    } catch (err) {
      setLocationError(err.message);
    } finally {
      setCapturing(false);
    }
  };

  const close = () => {
    stopCamera();
    onClose();
  };

  const usePhoto = () => {
    stopCamera();
    onCaptured(shot);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full h-full sm:h-auto sm:max-w-lg sm:rounded-xl overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Photo of the finished work</h2>
          <button onClick={close} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Close camera">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 flex-1">
          {/* Location status */}
          <div className={`text-sm rounded-lg p-2.5 flex items-start gap-2 ${
            position ? 'bg-green-50 text-green-800' : locationError ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-600'
          }`}>
            {locating ? <Loader2 className="w-4 h-4 animate-spin mt-0.5" /> : <MapPin className="w-4 h-4 mt-0.5" />}
            <div className="flex-1">
              {locating && 'Getting your live location…'}
              {!locating && position && !locationError && `Location ready (accurate to about ${position.accuracy} m).`}
              {!locating && locationError && locationError}
            </div>
            {!locating && (locationError || !position) && (
              <button onClick={locate} className="text-xs underline whitespace-nowrap">Try again</button>
            )}
          </div>

          {/* Camera / preview (the video stays mounted so Retake can reuse the stream) */}
          {shot && <img src={shot.url} alt="Captured work" className="w-full rounded-lg bg-black" />}
          <div className={`relative bg-black rounded-lg overflow-hidden aspect-[4/3] ${shot ? 'hidden' : ''}`}>
              <video
                ref={videoRef}
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraState === 'ready' ? '' : 'hidden'}`}
              />
              {cameraState === 'starting' && (
                <div className="absolute inset-0 flex items-center justify-center text-white text-sm gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Opening camera…
                </div>
              )}
              {cameraState === 'unavailable' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white text-sm p-4 gap-3">
                  <AlertCircle className="w-6 h-6" />
                  <p>{cameraError}</p>
                  <button onClick={startCamera} className="underline text-xs">Try the camera again</button>
                </div>
              )}
          </div>

          <p className="text-xs text-gray-500">
            Take the photo now, at the job. Gallery photos are not accepted, and your location is saved with the photo
            so it can be checked against the job address.
          </p>

          {/* Fallback: phone camera via file input */}
          {cameraState === 'unavailable' && !shot && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFallbackFile}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={capturing}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Camera className="w-4 h-4" /> Open phone camera instead
              </button>
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 flex gap-3">
          {shot ? (
            <>
              <button
                onClick={() => {
                  setShot(null);
                  if (!streamRef.current && shot.captureMethod === 'camera') startCamera();
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Retake
              </button>
              <button
                onClick={usePhoto}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Use photo
              </button>
            </>
          ) : (
            <button
              onClick={takePhoto}
              disabled={cameraState !== 'ready' || capturing}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {capturing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
              {capturing ? 'Saving location…' : 'Take photo & capture location'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Evidence card ────────────────────────────────────────────
const JobEvidence = ({ booking, canEdit, canComplete, onUpdated }) => {
  const evidence = booking.completionEvidence || {};
  const photos = evidence.photos || [];
  const rules = booking.evidenceRules || {};
  const maxPhotos = rules.maxPhotos || 6;

  const [cameraOpen, setCameraOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [linkInput, setLinkInput] = useState(evidence.link?.url || '');
  const [savingLink, setSavingLink] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [error, setError] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [viewer, setViewer] = useState(null);

  const hasProof = photos.length > 0 || (rules.linkAllowed && !!evidence.link?.url);

  const uploadShot = async (shot) => {
    setCameraOpen(false);
    setUploading(true);
    setError('');
    setWarnings([]);
    try {
      const form = new FormData();
      form.append('photo', shot.blob, `evidence-${shot.capturedAt}.jpg`);
      form.append('capturedAt', String(shot.capturedAt));
      form.append('captureMethod', shot.captureMethod);
      form.append('lat', String(shot.gps.lat));
      form.append('lng', String(shot.gps.lng));
      form.append('accuracy', String(shot.gps.accuracy));
      form.append('gpsAt', String(shot.gps.at));
      // No Content-Type here: axios adds the multipart boundary itself (see services/api.js)
      const res = await api.post(`/bookings/${booking._id}/evidence/photo`, form);
      setWarnings(res.data.warnings || []);
      await onUpdated();
    } catch (err) {
      setError(errorMessage(err, 'Failed to upload the photo.'));
    } finally {
      setUploading(false);
    }
  };

  const saveLink = async () => {
    setSavingLink(true);
    setError('');
    setWarnings([]);
    try {
      const res = await api.post(`/bookings/${booking._id}/evidence/link`, { url: linkInput.trim() });
      setWarnings(res.data.warnings || []);
      await onUpdated();
    } catch (err) {
      setError(errorMessage(err, 'Failed to save the link.'));
    } finally {
      setSavingLink(false);
    }
  };

  const completeWork = async () => {
    setCompleting(true);
    setError('');
    try {
      await api.post(`/bookings/${booking._id}/complete-work`);
      setConfirmComplete(false);
      await onUpdated();
    } catch (err) {
      setError(errorMessage(err, 'Failed to mark the work completed.'));
    } finally {
      setCompleting(false);
    }
  };

  if (!canEdit && photos.length === 0 && !evidence.link?.url) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
        <Camera className="w-5 h-5 text-green-600" />
        Proof of finished work
      </h2>
      {canEdit && (
        <p className="text-sm text-gray-500 mb-4">
          {rules.linkAllowed
            ? 'Take at least one photo of the finished work with your camera, or add a live link to the website or app.'
            : 'Take at least one photo of the finished work with your camera, at the job. Your live location is saved with each photo.'}
        </p>
      )}

      {evidence.reviewStatus === 'admin_rejected' && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          Our team rejected this proof of work.{evidence.reviewNote ? ` Reason: ${evidence.reviewNote}` : ''}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}
      {canEdit && warnings.map((w) => (
        <div key={w} className="mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {w}
        </div>
      ))}

      {/* Photos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {photos.map((photo) => (
            <button
              key={photo._id || photo.url}
              type="button"
              onClick={() => setViewer(photo)}
              className="text-left group"
            >
              <img
                src={cldImage(photo.url, 400)}
                alt="Finished work"
                className="w-full aspect-square object-cover rounded-lg border border-gray-200 group-hover:opacity-90"
                loading="lazy"
              />
              <p className="text-xs text-gray-500 mt-1">{formatTime(photo.capturedAt || photo.receivedAt)}</p>
              {Number.isFinite(photo.distanceFromJobM) && (
                <p className="text-xs text-gray-400">{photo.distanceFromJobM} m from pinned job location</p>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Link */}
      {evidence.link?.url && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
          <p className="text-gray-500 text-xs mb-0.5">Live link</p>
          <a
            href={evidence.link.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-green-700 hover:underline break-all inline-flex items-center gap-1"
          >
            {evidence.link.url} <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
          </a>
          {evidence.link.reachable === false && (
            <p className="text-xs text-yellow-700 mt-1">We could not open this link when it was added.</p>
          )}
        </div>
      )}

      {canEdit && (
        <div className="space-y-3">
          <button
            onClick={() => setCameraOpen(true)}
            disabled={uploading || photos.length >= maxPhotos}
            className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {uploading ? 'Uploading photo…' : photos.length ? 'Take another photo' : 'Take photo of finished work'}
          </button>
          {photos.length >= maxPhotos && (
            <p className="text-xs text-gray-500 text-center">You have added the maximum of {maxPhotos} photos.</p>
          )}

          {rules.linkAllowed && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Live link (website or app)</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="https://"
                  className="flex-1 min-w-0 p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  onClick={saveLink}
                  disabled={savingLink || !linkInput.trim() || linkInput.trim() === evidence.link?.url}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
                >
                  {savingLink ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
                  Save
                </button>
              </div>
            </div>
          )}

          {canComplete && (
            confirmComplete ? (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <p className="text-sm text-blue-800">
                  Mark the work as completed? The client will be asked to check your proof and confirm.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmComplete(false)}
                    disabled={completing}
                    className="flex-1 px-3 py-2 border border-gray-300 bg-white rounded-lg text-sm font-medium hover:bg-gray-50"
                  >
                    Not yet
                  </button>
                  <button
                    onClick={completeWork}
                    disabled={completing}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {completing && <Loader2 className="w-4 h-4 animate-spin" />}
                    Yes, completed
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmComplete(true)}
                disabled={!hasProof || uploading}
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                title={hasProof ? '' : 'Add proof first'}
              >
                <CheckSquare className="w-4 h-4" />
                Mark work completed
              </button>
            )
          )}
          {canComplete && !hasProof && (
            <p className="text-xs text-gray-500 text-center">Add proof of the finished work to continue.</p>
          )}
        </div>
      )}

      {cameraOpen && <CameraCapture onClose={() => setCameraOpen(false)} onCaptured={uploadShot} />}

      {/* Full-size viewer */}
      {viewer && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4" onClick={() => setViewer(null)}>
          <img src={cldImage(viewer.url, 1600)} alt="Finished work" className="max-w-full max-h-[80vh] rounded-lg" />
          <div className="text-white text-sm mt-3 text-center space-y-1" onClick={(e) => e.stopPropagation()}>
            <p>Taken {formatTime(viewer.capturedAt || viewer.receivedAt)}</p>
            {viewer.gps?.lat !== undefined && (
              <a href={mapsLink(viewer.gps)} target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">
                <MapPin className="w-4 h-4" /> Where it was taken
              </a>
            )}
          </div>
          <button className="absolute top-4 right-4 text-white p-2" aria-label="Close" onClick={() => setViewer(null)}>
            <X className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
};

export default JobEvidence;
