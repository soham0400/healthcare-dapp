import React, { useState, useEffect } from 'react';
import { FileText, Pill, Calendar, Shield, Upload, X, Plus } from 'lucide-react';
import { useWeb3 } from '../../context/Web3Context';
import { BACKEND_URL } from '../../config/constants';
import Alert from '../../components/common/Alert';

const PatientDashboard = () => {
  const { account, contract } = useWeb3();
  const [records, setRecords] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  
  const [doctorAddress, setDoctorAddress] = useState('');
  const [grantingAccess, setGrantingAccess] = useState(false);
  const [showBookAppointment, setShowBookAppointment] = useState(false);
  const [bookingAppointment, setBookingAppointment] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    doctorAddress: '', date: '', time: '', reason: '', medicalRecordFiles: []
  });
  const [showUploadRecord, setShowUploadRecord] = useState(false);
  const [uploadingRecord, setUploadingRecord] = useState(false);
  const [recordFile, setRecordFile] = useState(null);

  useEffect(() => { if (account) fetchData(); }, [account]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rec, pre, app] = await Promise.all([
        fetch(`${BACKEND_URL}/api/records/${account}`).then(r => r.ok ? r.json() : []),
        fetch(`${BACKEND_URL}/api/prescriptions/${account}`).then(r => r.ok ? r.json() : []),
        fetch(`${BACKEND_URL}/api/appointments/${account}`).then(r => r.ok ? r.json() : [])
      ]);
      setRecords(rec); setPrescriptions(pre); setAppointments(app);
    } catch (error) { console.error("Error fetching data:", error); } finally { setLoading(false); }
  };

  const handleGrantAccess = async (e) => {
    e.preventDefault();
    if (!doctorAddress) { setAlert({ type: 'error', message: 'Please enter doctor address' }); return; }
    if (!contract) { setAlert({ type: 'error', message: 'Contract not initialized' }); return; }
    setGrantingAccess(true); setAlert(null);
    try {
      const tx = await contract.grantAccess(doctorAddress);
      setAlert({ type: 'success', message: `Transaction sent: ${tx.hash.slice(0, 10)}...` });
      await tx.wait();
      setAlert({ type: 'success', message: 'Access granted! The doctor can now add prescriptions.' });
      setDoctorAddress('');
    } catch (error) {
      setAlert({ type: 'error', message: error.message || 'Failed to grant access' });
    } finally { setGrantingAccess(false); }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!contract) { setAlert({ type: 'error', message: 'Contract not initialized' }); return; }
    setBookingAppointment(true); setAlert(null);
    try {
      let uploadedRecordHashes = [];
      if (appointmentForm.medicalRecordFiles.length > 0) {
        setAlert({ type: 'success', message: 'Uploading medical records...' });
        for (const file of appointmentForm.medicalRecordFiles) {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('patient', account);
          const uploadRes = await fetch(`${BACKEND_URL}/api/records/upload`, { method: 'POST', body: formData });
          if (uploadRes.ok) {
            const { ipfsHash } = await uploadRes.json();
            uploadedRecordHashes.push(ipfsHash);
          }
        }
      }
      for (const ipfsHash of uploadedRecordHashes) {
        const recordTx = await contract.addMedicalRecord(account, ipfsHash);
        await recordTx.wait();
      }
      const dateTimeString = `${appointmentForm.date}T${appointmentForm.time}`;
      const appointmentTime = Math.floor(new Date(dateTimeString).getTime() / 1000);
      const tx = await contract.bookAppointment(appointmentForm.doctorAddress, appointmentTime);
      setAlert({ type: 'success', message: `Transaction sent: ${tx.hash.slice(0, 10)}...` });
      await tx.wait();
      setAlert({ type: 'success', message: 'Appointment booked successfully!' });
      setAppointmentForm({ doctorAddress: '', date: '', time: '', reason: '', medicalRecordFiles: [] });
      setShowBookAppointment(false);
      setTimeout(() => fetchData(), 2000);
    } catch (error) {
      setAlert({ type: 'error', message: error.message || 'Failed to book appointment' });
    } finally { setBookingAppointment(false); }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!contract) { setAlert({ type: 'error', message: 'Contract not initialized' }); return; }
    if (!confirm('Cancel this appointment?')) return;
    setLoading(true); setAlert(null);
    try {
      const tx = await contract.cancelAppointment(appointmentId);
      await tx.wait();
      setAlert({ type: 'success', message: 'Appointment cancelled successfully!' });
      setTimeout(() => fetchData(), 2000);
    } catch (error) {
      setAlert({ type: 'error', message: error.message || 'Failed to cancel appointment' });
    } finally { setLoading(false); }
  };

  const handleUploadMedicalRecord = async (e) => {
    e.preventDefault();
    if (!recordFile || !contract) { setAlert({ type: 'error', message: 'Please select a file' }); return; }
    setUploadingRecord(true); setAlert(null);
    try {
      const formData = new FormData();
      formData.append('file', recordFile);
      formData.append('patient', account);
      const uploadRes = await fetch(`${BACKEND_URL}/api/records/upload`, { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error('Failed to upload file');
      const { ipfsHash } = await uploadRes.json();
      setAlert({ type: 'success', message: 'File uploaded! Adding to blockchain...' });
      const tx = await contract.addMedicalRecord(account, ipfsHash);
      await tx.wait();
      setAlert({ type: 'success', message: 'Medical record added successfully!' });
      setRecordFile(null); setShowUploadRecord(false);
      setTimeout(() => fetchData(), 2000);
    } catch (error) {
      setAlert({ type: 'error', message: error.message || 'Failed to upload record' });
    } finally { setUploadingRecord(false); }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAppointmentForm({...appointmentForm, medicalRecordFiles: files});
  };

  const ActionButton = ({ onClick, active, label, icon: Icon }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active 
        ? 'bg-slate-100 text-slate-900 ring-2 ring-indigo-500 ring-offset-1' 
        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md'
      }`}
    >
      {active ? <X className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
      {active ? 'Close' : label}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Patient Portal</h2>
        <div className="flex gap-3">
          <ActionButton 
            onClick={() => setShowBookAppointment(!showBookAppointment)} 
            active={showBookAppointment} 
            label="Book Appointment" 
            icon={Calendar} 
          />
          <ActionButton 
            onClick={() => setShowUploadRecord(!showUploadRecord)} 
            active={showUploadRecord} 
            label="Upload Record" 
            icon={Upload} 
          />
        </div>
      </div>
      
      {alert && <Alert {...alert} onClose={() => setAlert(null)} />}

      {/* Forms Area */}
      {(showBookAppointment || showUploadRecord) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          {showBookAppointment && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
               <h3 className="text-lg font-semibold mb-4 text-slate-800 flex items-center gap-2"><Calendar className="w-5 h-5 text-indigo-600" /> New Appointment</h3>
               <form onSubmit={handleBookAppointment} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Doctor Address (0x...)"
                    value={appointmentForm.doctorAddress}
                    onChange={(e) => setAppointmentForm({...appointmentForm, doctorAddress: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="date" value={appointmentForm.date} onChange={(e) => setAppointmentForm({...appointmentForm, date: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-indigo-500" required />
                    <input type="time" value={appointmentForm.time} onChange={(e) => setAppointmentForm({...appointmentForm, time: e.target.value})} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-indigo-500" required />
                  </div>
                  <textarea
                    value={appointmentForm.reason}
                    onChange={(e) => setAppointmentForm({...appointmentForm, reason: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-indigo-500"
                    rows="2"
                    placeholder="Reason for visit..."
                  />
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                    <label className="text-xs font-medium text-slate-500 uppercase block mb-2">Attach Records (Optional)</label>
                    <input type="file" onChange={handleFileSelect} multiple className="block w-full text-sm text-slate-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:bg-white file:text-indigo-600 hover:file:bg-indigo-50" />
                  </div>
                  <button type="submit" disabled={bookingAppointment} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 font-medium transition-all shadow-sm">
                    {bookingAppointment ? 'Processing...' : 'Confirm Booking'}
                  </button>
               </form>
            </div>
          )}

          {showUploadRecord && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit">
               <h3 className="text-lg font-semibold mb-4 text-slate-800 flex items-center gap-2"><Upload className="w-5 h-5 text-blue-600" /> Upload Medical Record</h3>
               <form onSubmit={handleUploadMedicalRecord} className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors bg-slate-50">
                     <input type="file" onChange={(e) => setRecordFile(e.target.files[0])} className="w-full" required />
                  </div>
                  <button type="submit" disabled={uploadingRecord} className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 font-medium transition-all shadow-sm">
                    {uploadingRecord ? 'Uploading to IPFS...' : 'Secure Upload'}
                  </button>
               </form>
            </div>
          )}
        </div>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats & Access */}
        <div className="space-y-6">
          {/* Stats Mini-Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
               <div className="flex items-center gap-2 mb-2">
                 <FileText className="w-4 h-4 text-indigo-500" />
                 <p className="text-xs font-semibold text-slate-500 uppercase">Records</p>
               </div>
               <p className="text-2xl font-bold text-slate-900">{records.length}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
               <div className="flex items-center gap-2 mb-2">
                 <Pill className="w-4 h-4 text-emerald-500" />
                 <p className="text-xs font-semibold text-slate-500 uppercase">Meds</p>
               </div>
               <p className="text-2xl font-bold text-slate-900">{prescriptions.length}</p>
            </div>
          </div>

          {/* Access Control */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-md p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h3 className="font-semibold">Doctor Access</h3>
            </div>
            <p className="text-slate-300 text-sm mb-4">Authorize a doctor to add prescriptions to your file.</p>
            <form onSubmit={handleGrantAccess} className="space-y-3">
              <input
                type="text"
                placeholder="Doctor Wallet Address"
                value={doctorAddress}
                onChange={(e) => setDoctorAddress(e.target.value)}
                disabled={grantingAccess}
                className="w-full px-3 py-2 rounded-lg bg-slate-700 border-slate-600 text-white placeholder-slate-400 text-sm font-mono focus:ring-1 focus:ring-emerald-400 outline-none"
              />
              <button
                type="submit"
                disabled={grantingAccess}
                className="w-full bg-emerald-500 text-slate-900 py-2 rounded-lg hover:bg-emerald-400 font-semibold text-sm transition"
              >
                {grantingAccess ? 'Authorizing...' : 'Grant Permission'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Lists */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Appointments List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-semibold text-slate-800">Appointments</h3>
            </div>
            <div className="p-0">
              {appointments.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No appointments scheduled.</div>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-6 py-3 font-medium">Doctor</th>
                      <th className="px-6 py-3 font-medium">Date</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                      <th className="px-6 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appointments.map((appt, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-slate-600">{appt.doctor?.slice(0, 6)}...</td>
                        <td className="px-6 py-4">{new Date(appt.when * 1000).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                           <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                             appt.approved ? 'bg-emerald-100 text-emerald-800' : 
                             appt.cancelled ? 'bg-rose-100 text-rose-800' : 
                             'bg-amber-100 text-amber-800'
                           }`}>
                             {appt.approved ? 'Approved' : appt.cancelled ? 'Cancelled' : 'Pending'}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           {!appt.approved && !appt.cancelled && (
                             <button onClick={() => handleCancelAppointment(appt.appointmentId)} className="text-rose-600 hover:text-rose-800 font-medium text-xs">Cancel</button>
                           )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Medical Records List */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
             <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Medical Records</h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{records.length} Files</span>
             </div>
             <div className="p-4 grid grid-cols-1 gap-3">
                {records.length === 0 ? <p className="text-slate-500 text-sm">No records found.</p> : records.map((record, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-indigo-200 transition-colors">
                     <div className="flex items-center gap-3">
                        <div className="bg-white p-2 rounded border border-slate-200"><FileText className="w-4 h-4 text-slate-400" /></div>
                        <div>
                          <p className="text-sm font-medium text-slate-700">Record #{idx + 1}</p>
                          <p className="text-xs text-slate-400">{new Date(record.timestamp * 1000).toLocaleDateString()}</p>
                        </div>
                     </div>
                     <a href={`https://gateway.pinata.cloud/ipfs/${record.ipfsHash}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium px-3 py-1 rounded hover:bg-indigo-50">View</a>
                  </div>
                ))}
             </div>
          </div>

          {/* Prescriptions List (New Added Section) */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200">
             <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Prescriptions</h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{prescriptions.length} items</span>
             </div>
             <div className="p-4 grid grid-cols-1 gap-3">
                {prescriptions.length === 0 ? (
                  <p className="text-slate-500 text-sm">No prescriptions found.</p>
                ) : (
                  prescriptions.map((presc, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-emerald-200 transition-colors">
                       <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded border border-slate-200">
                              <Pill className="w-4 h-4 text-emerald-500" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-700">Prescription #{idx + 1}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                               <p className="text-xs text-slate-400" title={`Doctor: ${presc.doctor}`}>
                                  {new Date(presc.timestamp * 1000).toLocaleDateString()}
                               </p>
                               <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                 presc.filled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                               }`}>
                                 {presc.filled ? 'Filled' : 'Pending'}
                               </span>
                            </div>
                          </div>
                       </div>
                       <a href={`https://gateway.pinata.cloud/ipfs/${presc.ipfsHash}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium px-3 py-1 rounded hover:bg-indigo-50">View</a>
                    </div>
                  ))
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;