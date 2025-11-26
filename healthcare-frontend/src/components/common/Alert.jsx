import React from 'react';
import { AlertCircle, CheckCircle, X } from 'lucide-react';

const Alert = ({ type, message, onClose }) => {
  const bgColor = type === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  const textColor = type === 'success' ? 'text-green-800' : 'text-red-800';
  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className={`${bgColor} border ${textColor} px-4 py-3 rounded relative mb-4 flex items-center`}>
      <Icon className="w-5 h-5 mr-2" />
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} className="absolute top-0 right-0 px-4 py-3">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;