import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Activity, Lock, Eye, CheckCircle } from 'lucide-react';
import { useAdminSecurity, useMFA } from '@/hooks/useAdminSecurity';

export default function SecurityDashboard() {
  const [activeTab, setActiveTab] = useState<'alerts' | 'audit' | 'mfa'>('alerts');
  const { getSecurityAlerts, getAuditLogs, resolveAlert, loading } = useAdminSecurity();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    if (activeTab === 'alerts') {
      const data = await getSecurityAlerts(true);
      setAlerts(data);
    } else if (activeTab === 'audit') {
      const data = await getAuditLogs({ limit: 100 });
      setAuditLogs(data);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveAlert(alertId);
      loadData();
    } catch (err) {
      console.error('Failed to resolve alert:', err);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-sage-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Security Dashboard</h2>
            <p className="text-sm text-gray-600">Monitor and manage admin security</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'alerts'
                ? 'border-sage-500 text-sage-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Security Alerts
              {alerts.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs font-semibold">
                  {alerts.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'audit'
                ? 'border-sage-500 text-sage-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Audit Log
            </div>
          </button>
          <button
            onClick={() => setActiveTab('mfa')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'mfa'
                ? 'border-sage-500 text-sage-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              MFA Settings
            </div>
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage-400 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === 'alerts' && (
              <div className="divide-y divide-gray-200">
                {alerts.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p>No active security alerts</p>
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div key={alert.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(alert.severity)}`}>
                              {alert.severity.toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(alert.created_at).toLocaleString()}
                            </span>
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {alert.alert_type.replace(/_/g, ' ').toUpperCase()}
                          </h3>
                          <div className="text-sm text-gray-600">
                            {JSON.stringify(alert.details, null, 2)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleResolveAlert(alert.id)}
                          className="ml-4 px-4 py-2 bg-sage-600 text-white rounded-md hover:bg-sage-700 text-sm"
                        >
                          Resolve
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Timestamp
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admin User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Resource
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No audit logs found
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.admin_users?.profiles?.email || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.action}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.resource_type}
                            {log.resource_id && (
                              <span className="text-xs text-gray-400 ml-1">
                                ({log.resource_id.slice(0, 8)}...)
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              log.status === 'success' 
                                ? 'bg-green-100 text-green-800'
                                : log.status === 'failed'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'mfa' && (
              <div className="p-6">
                <MFASettings />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MFASettings() {
  const { enrollMFA, verifyMFA, getMFAFactors, loading, error } = useMFA();
  const [mfaFactors, setMfaFactors] = useState<any>(null);
  const [enrollmentData, setEnrollmentData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'check' | 'enroll' | 'verify'>('check');

  useEffect(() => {
    loadMFAStatus();
  }, []);

  const loadMFAStatus = async () => {
    const factors = await getMFAFactors();
    setMfaFactors(factors);
    if (factors && factors.totp && factors.totp.length > 0) {
      setStep('check');
    }
  };

  const handleEnroll = async () => {
    try {
      const data = await enrollMFA();
      setEnrollmentData(data);
      setStep('verify');
    } catch (err) {
      console.error('Failed to enroll in MFA:', err);
    }
  };

  const handleVerify = async () => {
    if (!enrollmentData || !verificationCode) return;

    try {
      await verifyMFA(enrollmentData.id, verificationCode);
      setStep('check');
      loadMFAStatus();
    } catch (err) {
      console.error('Failed to verify MFA:', err);
    }
  };

  const isMFAEnabled = mfaFactors?.totp && mfaFactors.totp.length > 0;

  return (
    <div className="max-w-2xl">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Multi-Factor Authentication (MFA)
      </h3>

      {step === 'check' && (
        <div className="space-y-4">
          {isMFAEnabled ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">MFA is enabled</p>
                  <p className="text-sm text-green-700">Your account is protected with two-factor authentication</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-900">MFA is not enabled</p>
                  <p className="text-sm text-yellow-700">Enable MFA to add an extra layer of security to your account</p>
                </div>
              </div>
              <button
                onClick={handleEnroll}
                disabled={loading}
                className="px-4 py-2 bg-sage-600 text-white rounded-md hover:bg-sage-700 disabled:opacity-50"
              >
                {loading ? 'Setting up...' : 'Enable MFA'}
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'enroll' && enrollmentData && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Step 1: Scan QR Code</h4>
            <p className="text-sm text-blue-700 mb-4">
              Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
            </p>
            <div className="bg-white p-4 rounded-lg inline-block">
              <img src={enrollmentData.totp.qr_code} alt="MFA QR Code" className="w-48 h-48" />
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Or enter this code manually: <code className="bg-white px-2 py-1 rounded">{enrollmentData.totp.secret}</code>
            </p>
          </div>
          <button
            onClick={() => setStep('verify')}
            className="px-4 py-2 bg-sage-600 text-white rounded-md hover:bg-sage-700"
          >
            Continue to Verification
          </button>
        </div>
      )}

      {step === 'verify' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Step 2: Verify Code</h4>
            <p className="text-sm text-blue-700 mb-4">
              Enter the 6-digit code from your authenticator app
            </p>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-sage-500 focus:border-transparent text-center text-2xl tracking-widest"
              maxLength={6}
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleVerify}
              disabled={loading || verificationCode.length !== 6}
              className="flex-1 px-4 py-2 bg-sage-600 text-white rounded-md hover:bg-sage-700 disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify and Enable MFA'}
            </button>
            <button
              onClick={() => setStep('enroll')}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
