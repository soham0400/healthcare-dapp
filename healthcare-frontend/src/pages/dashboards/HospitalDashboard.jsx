import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, Users, UserPlus, Calendar, Clock, Activity, Shield, Plus, X } from 'lucide-react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../context/Web3Context';
import { BACKEND_URL } from '../../config/constants';
import Alert from '../../components/common/Alert';

const HospitalDashboard = () => {
  const { account, contract } = useWeb3();
  const [claims, setClaims] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  
  const [showCreateClaim, setShowCreateClaim] = useState(false);
  const [claimForm, setClaimForm] = useState({ patientAddress: '', amount: '', insurerAddress: '' });
  const [creatingClaim, setCreatingClaim] = useState(false);
  const [doctorAddress, setDoctorAddress] = useState('');
  const [addingDoctor, setAddingDoctor] = useState(false);
  const [assignForm, setAssignForm] = useState({ patientAddress: '', doctorAddress: '' });
  const [assigningDoctor, setAssigningDoctor] = useState(false);
  const [filterDoctor, setFilterDoctor] = useState('all');
  const [doctorList, setDoctorList] = useState([]);

  useEffect(() => { if (account) { fetchClaims(); fetchAppointments(); } }, [account]);
  useEffect(() => {
    if (appointments.length > 0) {
      const uniqueDoctors = [...new Set(appointments.map(a => a.doctor))];
      setDoctorList(uniqueDoctors);
    }
  }, [appointments]);

  // --- Keep Logic Identical ---
  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/claims/${account}`);
      if (res.ok) setClaims(await res.json());
    } catch (error) { console.error("Error fetching claims:", error); } finally { setLoading(false); }
  };

  const fetchAppointments = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/appointments/all`);
      if (res.ok) {
        const data = await res.json();
        setAppointments(data.sort((a, b) => b.when - a.when));
      }
    } catch (error) { console.error("Error fetching appointments:", error); }
  };

  const handleCreateClaim = async (e) => {
    e.preventDefault();
    if (!contract) { setAlert({ type: 'error', message: 'Contract not initialized' }); return; }
    setCreatingClaim(true); setAlert(null);
    try {
      const tx = await contract.createClaim(claimForm.patientAddress, ethers.parseEther(claimForm.amount), claimForm.insurerAddress);
      setAlert({ type: 'success', message: `Transaction sent: ${tx.hash.slice(0, 10)}...` });
      await tx.wait();
      setAlert({ type: 'success', message: 'Claim created successfully!' });
      setClaimForm({ patientAddress: '', amount: '', insurerAddress: '' }); setShowCreateClaim(false);
      await fetchClaims();
    } catch (error) { setAlert({ type: 'error', message: error.message || 'Failed' }); } finally { setCreatingClaim(false); }
  };

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    if (!contract) { setAlert({ type: 'error', message: 'Contract not initialized' }); return; }
    setAddingDoctor(true); setAlert(null);
    try {
      const tx = await contract.addDoctorToHospital(doctorAddress);
      await tx.wait();
      setAlert({ type: 'success', message: 'Doctor added successfully!' });
      setDoctorAddress('');
    } catch (error) { setAlert({ type: 'error', message: error.message }); } finally { setAddingDoctor(false); }
  };

  const handleAssignDoctor = async (e) => {
    e.preventDefault();
    if (!contract) { setAlert({ type: 'error', message: 'Contract not initialized' }); return; }
    setAssigningDoctor(true); setAlert(null);
    try {
      const tx = await contract.assignDoctor(assignForm.patientAddress, assignForm.doctorAddress);
      await tx.wait();
      setAlert({ type: 'success', message: 'Doctor assigned successfully!' });
      setAssignForm({ patientAddress: '', doctorAddress: '' });
    } catch (error) { setAlert({ type: 'error', message: error.message }); } finally { setAssigningDoctor(false); }
  };
  // --- End Logic ---

  const filteredAppointments = filterDoctor === 'all' ? appointments : appointments.filter(a => a.doctor.toLowerCase() === filterDoctor.toLowerCase());
  const pendingApps = filteredAppointments.filter(a => !a.approved && !a.cancelled);

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">{title}</p>
          <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Hospital Administration</h2>
        <p className="text-slate-500 text-sm">Manage doctors, patient assignments, and insurance claims.</p>
      </div>

      {alert && <Alert {...alert} onClose={() => setAlert(null)} />}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Claims" value={claims.length} icon={DollarSign} color="text-blue-600" />
        <StatCard title="Paid Claims" value={claims.filter(c => c.paid).length} icon={CheckCircle} color="text-emerald-600" />
        <StatCard title="Total Appointments" value={appointments.length} icon={Calendar} color="text-indigo-600" />
        <StatCard title="Pending Actions" value={pendingApps.length} icon={Clock} color="text-amber-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Clinical Operations */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Appointments Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" /> Appointments
              </h3>
              {doctorList.length > 0 && (
                <select
                  value={filterDoctor}
                  onChange={(e) => setFilterDoctor(e.target.value)}
                  className="text-sm border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">All Doctors</option>
                  {doctorList.map((d, i) => <option key={i} value={d}>{d.slice(0,6)}...</option>)}
                </select>
              )}
            </div>
            
            <div className="max-h-[400px] overflow-y-auto">
              {filteredAppointments.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No appointments found.</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 font-medium">Details</th>
                      <th className="px-6 py-3 font-medium">Doctor</th>
                      <th className="px-6 py-3 font-medium">Date</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAppointments.map((appt, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-xs text-slate-600">ID: {appt.appointmentId}</span>
                          <div className="text-xs text-slate-500">Pt: {appt.patient?.slice(0,6)}...</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-600">{appt.doctor?.slice(0,6)}...</td>
                        <td className="px-6 py-4">{new Date(appt.when * 1000).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            appt.approved ? 'bg-emerald-100 text-emerald-800' : 
                            appt.cancelled ? 'bg-rose-100 text-rose-800' : 
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {appt.approved ? 'Approved' : appt.cancelled ? 'Cancelled' : 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Insurance Claims Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" /> Insurance Claims
              </h3>
              <button
                onClick={() => setShowCreateClaim(!showCreateClaim)}
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1 transition-colors"
              >
                {showCreateClaim ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {showCreateClaim ? 'Cancel' : 'New Claim'}
              </button>
            </div>

            {showCreateClaim && (
              <div className="p-6 bg-blue-50 border-b border-blue-100 animate-fade-in">
                <form onSubmit={handleCreateClaim} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-xs font-medium text-blue-800 mb-1">Patient Address</label>
                    <input type="text" placeholder="0x..." value={claimForm.patientAddress} onChange={(e) => setClaimForm({...claimForm, patientAddress: e.target.value})} className="w-full px-3 py-2 text-sm border-blue-200 rounded-lg focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-800 mb-1">Amount (ETH)</label>
                    <input type="text" placeholder="0.5" value={claimForm.amount} onChange={(e) => setClaimForm({...claimForm, amount: e.target.value})} className="w-full px-3 py-2 text-sm border-blue-200 rounded-lg focus:ring-blue-500" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-800 mb-1">Insurer Address</label>
                    <input type="text" placeholder="0x..." value={claimForm.insurerAddress} onChange={(e) => setClaimForm({...claimForm, insurerAddress: e.target.value})} className="w-full px-3 py-2 text-sm border-blue-200 rounded-lg focus:ring-blue-500" required />
                  </div>
                  <button type="submit" disabled={creatingClaim} className="md:col-span-3 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium text-sm mt-2 w-full">
                    {creatingClaim ? 'Submitting...' : 'Submit Claim Request'}
                  </button>
                </form>
              </div>
            )}

            <div className="p-6">
               {claims.length === 0 ? <p className="text-slate-500 text-center text-sm">No claims history.</p> : (
                 <div className="space-y-3">
                   {claims.map((claim, idx) => (
                     <div key={idx} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg bg-slate-50 hover:bg-white hover:border-blue-200 transition-all">
                       <div>
                         <div className="flex items-center gap-2">
                           <span className="font-semibold text-slate-700">Claim #{claim.claimId}</span>
                           <span className="text-xs text-slate-500 font-mono">Patient: {claim.patient?.slice(0,6)}...</span>
                         </div>
                         <div className="text-lg font-bold text-slate-900 mt-1">{ethers.formatEther(claim.amount || "0")} ETH</div>
                       </div>
                       <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                         claim.paid ? 'bg-emerald-100 text-emerald-700' : 
                         claim.rejected ? 'bg-rose-100 text-rose-700' : 
                         'bg-amber-100 text-amber-700'
                       }`}>
                         {claim.paid ? 'Paid' : claim.rejected ? 'Rejected' : 'Pending'}
                       </span>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Right Column: Admin Tools */}
        <div className="space-y-6">
          
          {/* Add Doctor Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" /> Staffing
            </h3>
            <form onSubmit={handleAddDoctor} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Add New Doctor</label>
                <input
                  type="text"
                  placeholder="Wallet Address (0x...)"
                  value={doctorAddress}
                  onChange={(e) => setDoctorAddress(e.target.value)}
                  disabled={addingDoctor}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                />
              </div>
              <button type="submit" disabled={addingDoctor} className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-medium text-sm">
                {addingDoctor ? 'Processing...' : 'Authorize Doctor'}
              </button>
            </form>
          </div>

          {/* Assign Patient Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> Patient Assignment
            </h3>
            <form onSubmit={handleAssignDoctor} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Patient Address</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={assignForm.patientAddress}
                  onChange={(e) => setAssignForm({...assignForm, patientAddress: e.target.value})}
                  disabled={assigningDoctor}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase mb-1">Doctor Address</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={assignForm.doctorAddress}
                  onChange={(e) => setAssignForm({...assignForm, doctorAddress: e.target.value})}
                  disabled={assigningDoctor}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                />
              </div>
              <button type="submit" disabled={assigningDoctor} className="w-full bg-slate-800 text-white py-2 rounded-lg hover:bg-slate-900 font-medium text-sm">
                {assigningDoctor ? 'Assigning...' : 'Assign Patient'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;