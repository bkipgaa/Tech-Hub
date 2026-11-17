/**
 * ProductsEditor.jsx
 * ==================
 * The products a business sells, edited in the listing form: name, price
 * (optional, "ask for price" when empty), unit, short description, a photo and
 * whether it's in stock. Photos upload to /listings/photos like listing photos.
 */

import React, { useRef, useState } from 'react';
import { Plus, Trash2, ImagePlus, Loader2, Package } from 'lucide-react';
import api from '../../services/api';
import { cldImage } from '../../utils/media';

const MAX_PRODUCTS = 60; // matches backend/models/Listing.js

const EMPTY_PRODUCT = { name: '', price: '', unit: '', description: '', photo: null, inStock: true };

const input =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none';

const ProductRow = ({ product, onChange, onRemove, onError }) => {
  const fileInput = useRef(null);
  const [uploading, setUploading] = useState(false);
  const set = (key) => (e) => onChange({ ...product, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append('photo', file);
      const r = await api.post('/listings/photos', body);
      if (r.data?.data?.url) onChange({ ...product, photo: r.data.data });
    } catch (err) {
      onError(err.response?.data?.message || `Could not upload ${file.name}.`);
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 flex gap-3">
      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-gray-100 border border-dashed border-gray-300 flex-shrink-0 overflow-hidden flex items-center justify-center text-gray-400 hover:border-green-500 hover:text-green-700"
        aria-label={product.photo ? 'Change photo' : 'Add photo'}
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 animate-spin text-green-600" />
        ) : product.photo?.url ? (
          <img src={cldImage(product.photo.url, 200)} alt="" className="w-full h-full object-cover" />
        ) : (
          <ImagePlus className="w-5 h-5" />
        )}
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => upload(e.target.files?.[0])}
      />

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex gap-2">
          <input value={product.name} onChange={set('name')} maxLength={80} placeholder="Product, e.g. Bamburi cement 50 kg" className={input} />
          <button type="button" onClick={onRemove} aria-label="Remove product" className="p-2 text-gray-400 hover:text-red-600 flex-shrink-0">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" min="0" value={product.price ?? ''} onChange={set('price')} placeholder="Price (KES)" className={input} />
          <input value={product.unit} onChange={set('unit')} maxLength={30} placeholder="Unit, e.g. per bag" className={input} />
        </div>
        <input value={product.description} onChange={set('description')} maxLength={300} placeholder="Short description (optional)" className={input} />
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input type="checkbox" checked={product.inStock !== false} onChange={set('inStock')} className="rounded text-green-600 focus:ring-green-500" />
          In stock
        </label>
      </div>
    </div>
  );
};

const ProductsEditor = ({ value, onChange, onError }) => {
  const products = value || [];
  const setAt = (i, p) => onChange(products.map((x, j) => (j === i ? p : x)));
  const removeAt = (i) => onChange(products.filter((_, j) => j !== i));

  return (
    <div className="space-y-3">
      {products.length === 0 && (
        <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg text-gray-500 text-sm">
          <Package className="w-8 h-8 mx-auto text-gray-300 mb-2" />
          Add what you sell so customers can pick items and order from you.
        </div>
      )}
      {products.map((p, i) => (
        <ProductRow key={p._id || p.key} product={p} onChange={(next) => setAt(i, next)} onRemove={() => removeAt(i)} onError={onError} />
      ))}
      {products.length < MAX_PRODUCTS && (
        <button
          type="button"
          onClick={() => onChange([...products, { ...EMPTY_PRODUCT, key: `new-${Date.now()}` }])}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed border-green-300 text-green-700 rounded-lg text-sm font-semibold hover:bg-green-50"
        >
          <Plus className="w-4 h-4" /> Add a product
        </button>
      )}
    </div>
  );
};

export default ProductsEditor;
