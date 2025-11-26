import React, { useState } from 'react';
import { Pill, CheckCircle, AlertCircle, Search, FileText, ArrowRight } from 'lucide-react';
import { useWeb3 } from '../../context/Web3Context';
import { BACKEND_URL } from '../../config/constants';
import Alert from '../../components/common/Alert';

const PharmacyDashboard = () => {
  const { contract } = useWeb3();
  const [patientAddress, setPatientAddress] = useState('');
  const [prescriptionIndex, setPrescriptionIndex] = useState('');
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // View prescriptions
  const [viewPatientAddress, setViewPatientAddress] = useState('');
  const [prescriptions, setPrescriptions] = useState([]);
  const [viewing, setViewing] = useState(false);

  // --- Logic Remains Identical ---
  const handleViewPrescriptions = async (e) => {
    e.preventDefault();
    if (!viewPatientAddress) { setAlert({ type: 'error', message: 'Please enter patient address' }); return; }
    setViewing(true); setAlert(null); setPrescriptions([]);
    try {
      const response = await fetch(`${BACKEND_URL}/api/prescriptions/${viewPatientAddress}`);
      if (response.ok) {
        const data = await response.json();
        setPrescriptions(data);
        if (data.length === 0) setAlert({ type: 'error', message: 'No prescriptions found for this patient' });
      } else throw new Error('Failed to fetch');
    } catch (error) { setAlert({ type: 'error', message: error.message }); } finally { setViewing(false); }
  };

  const validatePrescription = async (patAddr, index) => {
      const count = await contract.getPrescriptionCount(patAddr);
      if (index >= Number(count)) throw new Error('Invalid index');
      const [ipfsHash, doctor, timestamp, filled] = await contract.getPrescription(patAddr, index);
      if (filled) throw new Error('Prescription already filled');
      return { valid: true, ipfsHash, doctor, timestamp, filled };
  };

  const handleFillPrescription = async (e) => {
    e.preventDefault();
    if (!contract || !patientAddress || prescriptionIndex === '') { setAlert({ type: 'error', message: 'Check inputs' }); return; }
    setLoading(true); setAlert(null);
    try {
      const indexNum = Number(prescriptionIndex);
      await validatePrescription(patientAddress, indexNum);
      const tx = await contract.fillPrescription(patientAddress, indexNum);
      setAlert({ type: 'success', message: `Transaction sent: ${tx.hash.slice(0, 10)}...` });
      await tx.wait();
      setAlert({ type: 'success', message: 'Prescription filled successfully!' });
      setPatientAddress(''); setPrescriptionIndex('');
      if (viewPatientAddress === patientAddress) { setTimeout(() => handleViewPrescriptions({ preventDefault: () => {} }), 2000); }
    } catch (error) { setAlert({ type: 'error', message: error.message || 'Failed to fill' }); } finally { setLoading(false); }
  };

  const quickFillPrescription = async (patAddr, index) => {
    if (!contract) return;
    setLoading(true); setAlert(null);
    try {
      await validatePrescription(patAddr, index);
      const tx = await contract.fillPrescription(patAddr, index);
      setAlert({ type: 'success', message: `Transaction sent: ${tx.hash.slice(0, 10)}...` });
      await tx.wait();
      setAlert({ type: 'success', message: 'Filled successfully!' });
      setTimeout(() => handleViewPrescriptions({ preventDefault: () => {} }), 2000);
    } catch (error) { setAlert({ type: 'error', message: error.message || 'Failed' }); } finally { setLoading(false); }
  };
  // --- End Logic ---

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Pharmacy Dispenser</h2>
        <p className="text-slate-500 text-sm">Lookup patient prescriptions and record fulfillment on the blockchain.</p>
      </div>
      
      {alert && <Alert {...alert} onClose={() => setAlert(null)} />}

      {/* Primary Action: Lookup */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50/50 border-b border-slate-100 p-6">
           <form onSubmit={handleViewPrescriptions} className="max-w-2xl mx-auto">
             <label className="block text-sm font-medium text-slate-700 mb-2">Find Patient Prescriptions</label>
             <div className="flex gap-3">
               <div className="relative flex-1">
                 <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                 <input
                   type="text"
                   placeholder="Enter Patient Wallet Address (0x...)"
                   value={viewPatientAddress}
                   onChange={(e) => setViewPatientAddress(e.target.value)}
                   disabled={viewing}
                   className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm shadow-sm"
                 />
               </div>
               <button
                 type="submit"
                 disabled={viewing}
                 className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 font-semibold transition shadow-sm"
               >
                 {viewing ? 'Searching...' : 'Search'}
               </button>
             </div>
           </form>
        </div>

        {/* Results Area */}
        {prescriptions.length > 0 && (
          <div className="p-6 bg-slate-50 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-700">Prescriptions Found ({prescriptions.length})</h3>
              <span className="text-xs text-slate-400 font-mono">Wallet: {viewPatientAddress.slice(0,8)}...</span>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {prescriptions.map((presc, idx) => (
                <div key={idx} className={`relative border rounded-xl p-5 transition-all ${presc.filled ? 'bg-slate-100 border-slate-200 opacity-75' : 'bg-white border-indigo-100 shadow-sm hover:shadow-md'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-full ${presc.filled ? 'bg-slate-200' : 'bg-indigo-50'}`}>
                        {presc.filled ? <CheckCircle className="w-6 h-6 text-slate-400" /> : <Pill className="w-6 h-6 text-indigo-600" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-bold text-slate-800">Prescription #{idx}</h4>
                          {presc.filled ? (
                            <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full font-bold">FILLED</span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-bold animate-pulse">ACTIVE</span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500">Doctor: <span className="font-mono text-xs bg-slate-100 px-1 rounded">{presc.doctor?.slice(0,10)}...</span></p>
                        <p className="text-sm text-slate-500 mb-3">Date: {new Date(presc.timestamp * 1000).toLocaleDateString()}</p>
                        
                        <a
                          href={`https://gateway.pinata.cloud/ipfs/${presc.ipfsHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline"
                        >
                          <FileText className="w-4 h-4" /> View Document
                        </a>
                      </div>
                    </div>

                    {!presc.filled && (
                      <button
                        onClick={() => quickFillPrescription(viewPatientAddress, idx)}
                        disabled={loading}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 disabled:bg-slate-300 font-semibold shadow-sm hover:shadow transition-all"
                      >
                        <span>Dispense</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Manual Override Section (De-emphasized) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 opacity-90">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold text-slate-800">Manual Entry</h3>
        </div>
        <p className="text-sm text-slate-500 mb-4">Use this only if you already know the exact prescription index.</p>
        
        <form onSubmit={handleFillPrescription} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-medium text-slate-600 uppercase mb-1">Patient Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={patientAddress}
              onChange={(e) => setPatientAddress(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 text-sm font-mono"
            />
          </div>
          <div className="w-full sm:w-32">
            <label className="block text-xs font-medium text-slate-600 uppercase mb-1">Index ID</label>
            <input
              type="number"
              placeholder="0"
              value={prescriptionIndex}
              onChange={(e) => setPrescriptionIndex(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-slate-800 text-white px-6 py-2 rounded-lg hover:bg-slate-900 font-medium text-sm"
          >
            {loading ? 'Processing...' : 'Manual Fill'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PharmacyDashboard;