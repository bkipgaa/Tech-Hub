// src/components/TokenDisplay.jsx
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Copy, Check, Eye, EyeOff, X } from 'lucide-react';

const TokenDisplay = ({ onClose }) => {
  const { token, showToken, toggleTokenDisplay } = useAuth();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!token) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-white rounded-lg shadow-2xl border-2 border-green-500 z-50">
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-green-700">🔑 Authentication Token</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-red-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="bg-gray-100 p-3 rounded-lg mb-3">
          <p className="text-xs font-mono break-all">
            {showToken ? token : '••••••••••••••••••••••••••••••••'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={toggleTokenDisplay}
            className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showToken ? 'Hide' : 'Show'}
          </button>
          
          <button
            onClick={handleCopy}
            className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Token expires in 30 days
        </p>
      </div>
    </div>
  );
};

export default TokenDisplay;