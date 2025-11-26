import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { ROLES, ROLE_NAMES, BACKEND_URL } from '../config/constants';
import Alert from '../components/common/Alert';
import { Activity, ShieldCheck, User, Building, Stethoscope, Pill } from 'lucide-react';

const Registration = () => {
  const { contract, account, connectWallet, refreshUserRole, chainId, userRole } = useWeb3();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    specialization: '',
    experience: '',
    registrationNumber: '',
    hospitalName: '',
    hospitalAddress: '',
    licenseNumber: '',
    companyName: '',
    policyInfo: ''
  });
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (account && userRole !== ROLES.NONE) {
      const dashboardPath = getDashboardPath(userRole);
      navigate(dashboardPath, { replace: true });
    }
  }, [userRole, account, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!contract) {
      setAlert({ type: 'error', message: 'Contract not initialized. Please reconnect your wallet.' });
      return;
    }
    setLoading(true);
    setAlert(null);

    try {
      const tx = await contract.registerRole(selectedRole);
      setAlert({ type: 'success', message: `Transaction sent: ${tx.hash.slice(0, 10)}...` });
      await tx.wait();
      setAlert({ type: 'success', message: 'Blockchain registration confirmed!' });

      const response = await fetch(`${BACKEND_URL}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: account,
          role: ROLE_NAMES[selectedRole].toLowerCase(),
          ...formData
        })
      });

      if (!response.ok) throw new Error(`Backend registration failed: ${response.status}`);

      setAlert({ type: 'success', message: 'Registration complete! Redirecting...' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      await refreshUserRole();
      const dashboardPath = getDashboardPath(selectedRole);
      setTimeout(() => {
        navigate(dashboardPath, { replace: true });
      }, 1000);

    } catch (error) {
      console.error("Registration Error:", error);
      let errorMessage = "Registration failed. ";
      if (error.reason) errorMessage += error.reason;
      else if (error.message) errorMessage += error.message;
      setAlert({ type: 'error', message: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const getDashboardPath = (role) => {
    const paths = {
      [ROLES.PATIENT]: '/patient',
      [ROLES.DOCTOR]: '/doctor',
      [ROLES.HOSPITAL]: '/hospital',
      [ROLES.PHARMACY]: '/pharmacy',
      [ROLES.INSURANCE]: '/insurance'
    };
    return paths[role] || '/';
  };

  // UI Components for Icons
  const RoleIcon = ({ roleId }) => {
    switch(roleId) {
      case 1: return <User className="w-5 h-5" />;
      case 2: return <Stethoscope className="w-5 h-5" />;
      case 3: return <Building className="w-5 h-5" />;
      case 4: return <Pill className="w-5 h-5" />;
      case 5: return <ShieldCheck className="w-5 h-5" />;
      default: return <User className="w-5 h-5" />;
    }
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center border border-slate-100">
          <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Activity className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-3">HealthChain</h1>
          <p className="text-slate-500 mb-8">Secure Decentralized Healthcare Platform</p>
          
          <button
            onClick={connectWallet}
            className="w-full bg-indigo-600 text-white px-6 py-3.5 rounded-xl hover:bg-indigo-700 transition-all transform hover:scale-[1.02] font-semibold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
          >
            <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-5 h-5" />
            Connect Wallet
          </button>
          
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-3">System Requirements</p>
            <div className="flex justify-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">✅ MetaMask</span>
              <span className="flex items-center gap-1">✅ Localhost</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-indigo-600 px-8 py-6 text-white">
            <h2 className="text-2xl font-bold">Complete Registration</h2>
            <p className="text-indigo-100 mt-1 text-sm">
              Join the network securely. Connected: <span className="font-mono bg-indigo-700 px-2 py-0.5 rounded text-xs">{account.slice(0,6)}...{account.slice(-4)}</span>
            </p>
          </div>
          
          <div className="p-8">
            {alert && <Alert {...alert} onClose={() => setAlert(null)} />}

            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Your Role</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {[
                    { id: 1, label: 'Patient' },
                    { id: 2, label: 'Doctor' },
                    { id: 3, label: 'Hospital' },
                    { id: 4, label: 'Pharmacy' },
                    { id: 5, label: 'Insurer' }
                  ].map((role) => (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setSelectedRole(role.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                        selectedRole === role.id
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-600'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <RoleIcon roleId={role.id} />
                      <span className="text-xs font-medium mt-1">{role.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              {/* Dynamic Fields based on Role */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 space-y-4">
                {selectedRole === ROLES.PATIENT && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                      <input
                        type="number"
                        value={formData.age}
                        onChange={(e) => setFormData({...formData, age: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      >
                        <option value="">Select...</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                )}

                {selectedRole === ROLES.DOCTOR && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Specialization</label>
                      <input
                        type="text"
                        value={formData.specialization}
                        onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Experience (Yrs)</label>
                        <input
                          type="number"
                          value={formData.experience}
                          onChange={(e) => setFormData({...formData, experience: e.target.value})}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Medical Reg. No.</label>
                        <input
                          type="text"
                          value={formData.registrationNumber}
                          onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                {selectedRole === ROLES.HOSPITAL && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Hospital Name</label>
                      <input
                        type="text"
                        value={formData.hospitalName}
                        onChange={(e) => setFormData({...formData, hospitalName: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                      <textarea
                        value={formData.hospitalAddress}
                        onChange={(e) => setFormData({...formData, hospitalAddress: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500"
                        rows="2"
                      />
                    </div>
                  </>
                )}

                {selectedRole === ROLES.PHARMACY && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Pharmacy License Number</label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({...formData, licenseNumber: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500"
                    />
                  </div>
                )}

                {selectedRole === ROLES.INSURANCE && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Policy Details</label>
                      <textarea
                        value={formData.policyInfo}
                        onChange={(e) => setFormData({...formData, policyInfo: e.target.value})}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500"
                        rows="2"
                      />
                    </div>
                  </>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3.5 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 font-semibold disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing Registration...</span>
                  </>
                ) : (
                  'Complete Registration'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Registration;