import { useSessionTimeout } from '@/hooks/useAdminSecurity';
import { Clock, AlertTriangle } from 'lucide-react';

interface SessionTimeoutWarningProps {
  timeoutMinutes?: number;
}

export default function SessionTimeoutWarning({ timeoutMinutes = 30 }: SessionTimeoutWarningProps) {
  const { showWarning, timeRemaining, extendSession } = useSessionTimeout(timeoutMinutes);

  if (!showWarning) return null;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-yellow-100 rounded-full p-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Session Expiring Soon</h3>
            <p className="text-sm text-gray-600">Your session will expire due to inactivity</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-3xl font-bold text-gray-900">
            <Clock className="w-8 h-8 text-sage-600" />
            <span>
              {minutes}:{seconds.toString().padStart(2, '0')}
            </span>
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">
            Time remaining until automatic logout
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={extendSession}
            className="w-full px-4 py-3 bg-sage-600 text-white rounded-md hover:bg-sage-700 font-medium"
          >
            Continue Session
          </button>
          <button
            onClick={() => {
              window.location.href = '/auth/login';
            }}
            className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
          >
            Logout Now
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          For security reasons, admin sessions expire after {timeoutMinutes} minutes of inactivity
        </p>
      </div>
    </div>
  );
}
