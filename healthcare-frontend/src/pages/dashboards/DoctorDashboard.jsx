import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, FileText, Upload, Search } from 'lucide-react';
import { useWeb3 } from '../../context/Web3Context';
import { BACKEND_URL } from '../../config/constants';
import Alert from '../../components/common/Alert';

const DoctorDashboard = () => {
  const { account, contract } = useWeb3();
  const [appointments, setAppointments] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [patientAddress, setPatientAddress] = useState('');
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewingRecords, setViewingRecords] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);

  useEffect(() => {
    if (account) fetchAppointments();
  }, [account]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/appointments/${account}`);
      if (res.ok) {
        const data = await res.json();
        const sorted = data.sort((a, b) => {
          if (!a.approved && !a.cancelled && (b.approved || b.cancelled)) return -1;
          if ((a.approved || a.cancelled) && !b.approved && !b.cancelled) return 1;
          return b.when - a.when;
        });
        setAppointments(sorted);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  // ... [Keep all fetchPatientRecords, handleApproveAppointment, handleRejectAppointment, handleUploadPrescription logic exactly as is] ...
  const fetchPatientRecords = async (patientAddr) => {
    setViewingRecords(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/records/${patientAddr}`);
      if (res.ok) {
        const data = await res.json();
        setPatientRecords(data);
        setSelectedPatient(patientAddr);
      } else {
        setAlert({ type: 'error', message: 'Failed to fetch patient records' });
      }
    } catch (error) {
      console.error("Error fetching patient records:", error);
      setAlert({ type: 'error', message: 'Error loading patient records' });
    } finally {
      setViewingRecords(false);
    }
  };

  const handleApproveAppointment = async (appointmentId) => {
    if (!contract) { setAlert({ type: 'error', message: 'Contract not initialized' }); return; }
    setLoading(true); setAlert(null);
    try {
      const tx = await contract.approveAppointment(appointmentId);
      setAlert({ type: 'success', message: `Transaction sent: ${tx.hash.slice(0, 10)}...` });
      await tx.wait();
      setAlert({ type: 'success', message: 'Appointment approved successfully!' });
      setTimeout(() => fetchAppointments(), 2000);
    } catch (error) {
      setAlert({ type: 'error', message: error.message || 'Failed to approve appointment' });
    } finally { setLoading(false); }
  };

  const handleRejectAppointment = async (appointmentId) => {
    if (!contract) { setAlert({ type: 'error', message: 'Contract not initialized' }); return; }
    if (!confirm('Are you sure you want to reject this appointment?')) return;
    setLoading(true); setAlert(null);
    try {
      const tx = await contract.cancelAppointment(appointmentId);
      await tx.wait();
      setAlert({ type: 'success', message: 'Appointment rejected successfully!' });
      setTimeout(() => fetchAppointments(), 2000);
    } catch (error) {
      setAlert({ type: 'error', message: error.message || 'Failed to reject appointment' });
    } finally { setLoading(false); }
  };

  const handleUploadPrescription = async (e) => {
    e.preventDefault();
    if (!selectedFile || !patientAddress || !contract) {
      setAlert({ type: 'error', message: 'Please select file and enter patient address' });
      return;
    }
    setLoading(true); setAlert(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('patient', patientAddress);
      formData.append('doctor', account);

      const uploadResponse = await fetch(`${BACKEND_URL}/api/prescriptions/upload`, { method: 'POST', body: formData });
      if (!uploadResponse.ok) throw new Error('File upload to Pinata failed');
      const { ipfsHash } = await uploadResponse.json();
      
      const tx = await contract.addPrescription(patientAddress, ipfsHash);
      setAlert({ type: 'success', message: `Blockchain transaction sent: ${tx.hash.slice(0, 10)}...` });
      await tx.wait();
      setAlert({ type: 'success', message: 'Prescription uploaded successfully!' });
      
      setSelectedFile(null); setPatientAddress('');
      const fileInput = document.getElementById('prescription-file');
      if (fileInput) fileInput.value = '';
    } catch (error) {
      let errorMessage = "Failed to upload prescription. ";
      if (error.reason) errorMessage += error.reason;
      else if (error.message) errorMessage += error.message;
      setAlert({ type: 'error', message: errorMessage });
    } finally { setLoading(false); }
  };
  // ... [End logic block] ...

  const pendingAppointments = appointments.filter(a => !a.approved && !a.cancelled);
  const approvedAppointments = appointments.filter(a => a.approved);
  const cancelledAppointments = appointments.filter(a => a.cancelled);

  const StatCard = ({ title, count, icon: Icon, colorClass, bgClass }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
          <p className={`text-3xl font-bold ${colorClass}`}>{count}</p>
        </div>
        <div className={`p-3 rounded-full ${bgClass}`}>
          <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Doctor Dashboard</h2>
          <p className="text-slate-500 text-sm">Manage appointments and patient prescriptions</p>
        </div>
        <div className="px-4 py-1 bg-slate-100 rounded-full text-xs font-mono text-slate-500">
          {account}
        </div>
      </div>
      
      {alert && <Alert {...alert} onClose={() => setAlert(null)} />}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Appointments" count={appointments.length} icon={Calendar} colorClass="text-indigo-600" bgClass="bg-indigo-50" />
        <StatCard title="Pending" count={pendingAppointments.length} icon={Clock} colorClass="text-amber-500" bgClass="bg-amber-50" />
        <StatCard title="Approved" count={approvedAppointments.length} icon={CheckCircle} colorClass="text-emerald-600" bgClass="bg-emerald-50" />
        <StatCard title="Cancelled" count={cancelledAppointments.length} icon={XCircle} colorClass="text-rose-500" bgClass="bg-rose-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Column: Appointments */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Pending Appointments Section */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Pending Actions
              </h3>
              {pendingAppointments.length > 0 && (
                <span className="bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
                  {pendingAppointments.length} Waiting
                </span>
              )}
            </div>
            
            <div className="p-6">
              {loading && pendingAppointments.length === 0 ? (
                <div className="text-center py-8 text-slate-400">Loading...</div>
              ) : pendingAppointments.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <CheckCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-500">All caught up! No pending appointments.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingAppointments.map((appt, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-lg p-5 hover:border-indigo-200 transition-colors bg-white shadow-sm">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-slate-400">ID: #{appt.appointmentId}</span>
                            <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs font-medium border border-amber-100">
                              Pending Review
                            </span>
                          </div>
                          <p className="font-medium text-slate-900">
                            Patient: <span className="font-mono text-slate-600 text-sm">{appt.patient?.slice(0, 10)}...{appt.patient?.slice(-4)}</span>
                          </p>
                          <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(appt.when * 1000).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveAppointment(appt.appointmentId)}
                            disabled={loading}
                            className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-medium transition shadow-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectAppointment(appt.appointmentId)}
                            disabled={loading}
                            className="bg-white text-rose-600 border border-rose-200 px-3 py-1.5 rounded-lg hover:bg-rose-50 disabled:opacity-50 text-sm font-medium transition"
                          >
                            Reject
                          </button>
                        </div>
                      </div>

                      {/* View Records Section within Pending Card */}
                      <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                         <div className="flex justify-between items-center mb-2">
                           <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Medical History</span>
                           <button
                            onClick={() => fetchPatientRecords(appt.patient)}
                            disabled={viewingRecords}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-medium flex items-center gap-1"
                          >
                            <Search className="w-3 h-3" /> View Records
                          </button>
                         </div>
                         
                         {selectedPatient === appt.patient && patientRecords.length > 0 ? (
                            <div className="space-y-2 mt-2">
                              {patientRecords.map((record, ridx) => (
                                <div key={ridx} className="flex justify-between items-center p-2 bg-white rounded border border-slate-200 text-sm">
                                  <span className="text-slate-600">Record #{ridx + 1} <span className="text-slate-400 text-xs ml-2">{new Date(record.timestamp * 1000).toLocaleDateString()}</span></span>
                                  <a
                                    href={`https://gateway.pinata.cloud/ipfs/${record.ipfsHash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:underline text-xs"
                                  >
                                    View File
                                  </a>
                                </div>
                              ))}
                            </div>
                         ) : selectedPatient === appt.patient ? (
                           <p className="text-xs text-slate-400 italic">No records found.</p>
                         ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Approved Appointments History */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-semibold text-slate-800">Upcoming Appointments</h3>
            </div>
            <div className="p-6">
              {approvedAppointments.length === 0 ? (
                <p className="text-slate-500 text-center text-sm">No upcoming approved appointments</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {approvedAppointments.map((appt, idx) => (
                    <div key={idx} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                      <div>
                         <div className="flex items-center gap-2">
                            <span className="font-medium text-slate-800 text-sm">ID #{appt.appointmentId}</span>
                            <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">Confirmed</span>
                         </div>
                         <p className="text-xs text-slate-500 mt-0.5">
                           {new Date(appt.when * 1000).toLocaleString()}
                         </p>
                      </div>
                      <button
                        onClick={() => fetchPatientRecords(appt.patient)}
                        className="text-slate-400 hover:text-indigo-600 transition"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Prescription Upload */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              Upload Prescription
            </h3>
            <form onSubmit={handleUploadPrescription} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Patient Wallet Address
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={patientAddress}
                  onChange={(e) => setPatientAddress(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm bg-slate-50 focus:bg-white transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Prescription File
                </label>
                <div className="relative">
                  <input
                    id="prescription-file"
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    disabled={loading}
                    className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-xs file:font-semibold
                      file:bg-indigo-50 file:text-indigo-700
                      hover:file:bg-indigo-100
                      cursor-pointer"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium shadow-sm transition-all hover:shadow-md mt-2"
              >
                {loading ? 'Uploading...' : 'Submit Prescription'}
              </button>
            </form>
            
            <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Quick Guide</h4>
              <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Verify patient address before uploading.</li>
                <li>Files are stored permanently on IPFS.</li>
                <li>Patients must grant access first.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;