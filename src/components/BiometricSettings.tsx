import React, { useState, useEffect } from 'react';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

interface RegisteredDevice {
  id: string;
  credential_id: string;
  device_name: string;
  device_type: string;
  created_at: string;
  last_used_at: string | null;
}

export default function BiometricSettings() {
  const [registeredDevices, setRegisteredDevices] = useState<RegisteredDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [deviceName, setDeviceName] = useState('');

  const {
    isSupported,
    availableMethods,
    hasRegisteredCredentials,
    isRegistering,
    registerBiometric,
    removeCredential,
    getRegisteredDevices,
    loadUserCredentials,
  } = useBiometricAuth();

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const devices = await getRegisteredDevices();
      setRegisteredDevices(devices);
    } catch (error) {
      console.error('Error loading devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterDevice = async () => {
    if (!deviceName.trim()) {
      alert('Please enter a device name');
      return;
    }

    const result = await registerBiometric(deviceName.trim());

    if (result.success) {
      setDeviceName('');
      setShowAddDevice(false);
      await loadDevices();
      alert('Device registered successfully!');
    } else {
      alert(result.error || 'Registration failed');
    }
  };

  const handleRemoveDevice = async (credentialId: string, deviceName: string) => {
    if (!confirm(`Remove ${deviceName}? This cannot be undone.`)) {
      return;
    }

    const success = await removeCredential(credentialId);

    if (success) {
      await loadDevices();
      await loadUserCredentials();
      alert('Device removed successfully');
    } else {
      alert('Failed to remove device');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'platform':
        return (
          <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
      case 'cross-platform':
        return (
          <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        );
      default:
        return (
          <svg className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Biometric Authentication</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.866-.833-2.636 0L4.178 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Biometric authentication not supported
              </h3>
              <p className="mt-2 text-sm text-yellow-700">
                Your device or browser doesn't support biometric authentication features like Face ID, Touch ID, or Windows Hello.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Biometric Authentication</h2>
          <p className="text-sm text-gray-500">
            Secure your account with biometric authentication
          </p>
        </div>
        
        {/* Available Methods Badge */}
        <div className="flex flex-wrap gap-2">
          {availableMethods.includes('platform') && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Platform Auth
            </span>
          )}
          {availableMethods.includes('cross-platform') && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Security Keys
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Registered Devices */}
          {registeredDevices.length > 0 ? (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Registered Devices</h3>
              <div className="space-y-3">
                {registeredDevices.map((device) => (
                  <div key={device.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getDeviceIcon(device.device_type)}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {device.device_name}
                        </p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Added: {formatDate(device.created_at)}</span>
                          {device.last_used_at && (
                            <span>Last used: {formatDate(device.last_used_at)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveDevice(device.credential_id, device.device_name)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 mb-6">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No devices registered</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add your first device to enable biometric authentication
              </p>
            </div>
          )}

          {/* Add New Device */}
          {!showAddDevice ? (
            <button
              onClick={() => setShowAddDevice(true)}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add New Device
            </button>
          ) : (
            <div className="border border-gray-300 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Add New Device</h3>
              
              <div className="mb-4">
                <label htmlFor="deviceName" className="block text-sm font-medium text-gray-700">
                  Device Name
                </label>
                <input
                  type="text"
                  id="deviceName"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  placeholder="My iPhone, Work Laptop, etc."
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Choose a name to help you identify this device
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleRegisterDevice}
                  disabled={isRegistering || !deviceName.trim()}
                  className="flex-1 bg-indigo-600 text-white py-2 px-4 text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300"
                >
                  {isRegistering ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Registering...
                    </div>
                  ) : (
                    'Register Device'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowAddDevice(false);
                    setDeviceName('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Information */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex">
              <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  About biometric authentication
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Use Face ID, Touch ID, or Windows Hello for secure login</li>
                    <li>Confirm payments without entering passwords</li>
                    <li>Your biometric data never leaves your device</li>
                    <li>You can register multiple devices</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}