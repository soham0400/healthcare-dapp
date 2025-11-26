import React, { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, AlertCircle, Wallet, TrendingUp, XCircle } from 'lucide-react';
import { ethers } from 'ethers';
import { useWeb3 } from '../../context/Web3Context';
import { BACKEND_URL } from '../../config/constants';
import Alert from '../../components/common/Alert';

const InsuranceDashboard = () => {
  const { account, contract } = useWeb3();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [balance, setBalance] = useState('0');

  useEffect(() => { if (account) { fetchClaims(); fetchBalance(); } }, [account]);

  // --- Logic Remains Identical ---
  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/claims/${account}`);
      if (res.ok) setClaims(await res.json());
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const fetchBalance = async () => {
    if (!contract) return;
    try {
      const bal = await contract.insuranceBalances(account);
      setBalance(ethers.formatEther(bal));
    } catch (error) { console.error(error); }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!contract) { setAlert({ type: 'error', message: 'Contract not initialized' }); return; }
    if (!depositAmount) { setAlert({ type: 'error', message: 'Invalid amount' }); return; }
    setDepositing(true); setAlert(null);
    try {
      const tx = await contract.depositInsurance({ value: ethers.parseEther(depositAmount) });
      setAlert({ type: 'success', message: `Tx sent: ${tx.hash.slice(0, 8)}...` });
      await tx.wait();
      setAlert({ type: 'success', message: 'Deposit successful!' });
      setDepositAmount(''); await fetchBalance();
    } catch (error) { setAlert({ type: 'error', message: error.message }); } finally { setDepositing(false); }
  };

  const handleApproveClaim = async (claimId, claimAmount) => {
    if (!contract) return;
    if (ethers.parseEther(balance) < BigInt(claimAmount)) { setAlert({ type: 'error', message: 'Insufficient balance' }); return; }
    setLoading(true); setAlert(null);
    try {
      const tx = await contract.approveClaim(claimId);
      setAlert({ type: 'success', message: `Tx sent: ${tx.hash.slice(0, 8)}...` });
      await tx.wait();
      setAlert({ type: 'success', message: 'Claim approved & paid!' });
      await fetchClaims(); await fetchBalance();
    } catch (error) { setAlert({ type: 'error', message: error.message }); } finally { setLoading(false); }
  };

  const handleRejectClaim = async (claimId) => {
    if (!contract) return;
    setLoading(true); setAlert(null);
    try {
      const tx = await contract.rejectClaim(claimId);
      await tx.wait();
      setAlert({ type: 'success', message: 'Claim rejected' });
      await fetchClaims();
    } catch (error) { setAlert({ type: 'error', message: error.message }); } finally { setLoading(false); }
  };
  // --- End Logic ---

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Insurance Claims Portal</h2>
          <p className="text-slate-500 text-sm">Manage liquidity pool and process hospital claims.</p>
        </div>
      </div>
      
      {alert && <Alert {...alert} onClose={() => setAlert(null)} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col: Financials */}
        <div className="space-y-6">
          {/* Balance Card */}
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Wallet className="w-32 h-32" />
            </div>
            <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Available Liquidity</p>
            <p className="text-4xl font-bold mt-1 mb-6">{parseFloat(balance).toFixed(4)} ETH</p>
            
            <form onSubmit={handleDeposit} className="relative z-10">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Amount (ETH)"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-slate-800 border-slate-700 text-white rounded-lg focus:ring-emerald-500 text-sm"
                />
                <button
                  type="submit"
                  disabled={depositing}
                  className="bg-emerald-500 text-slate-900 px-4 py-2 rounded-lg hover:bg-emerald-400 font-bold text-sm transition whitespace-nowrap"
                >
                  {depositing ? '...' : 'Deposit'}
                </button>
              </div>
            </form>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
               <div className="flex items-center gap-2 mb-1">
                 <CheckCircle className="w-4 h-4 text-emerald-500" />
                 <span className="text-xs font-bold text-slate-500 uppercase">Approved</span>
               </div>
               <p className="text-2xl font-bold text-slate-800">{claims.filter(c => c.paid).length}</p>
             </div>
             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
               <div className="flex items-center gap-2 mb-1">
                 <AlertCircle className="w-4 h-4 text-amber-500" />
                 <span className="text-xs font-bold text-slate-500 uppercase">Pending</span>
               </div>
               <p className="text-2xl font-bold text-slate-800">{claims.filter(c => !c.paid && !c.rejected).length}</p>
             </div>
          </div>
        </div>

        {/* Right Col: Claims List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[500px]">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800">Claims Queue</h3>
              <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-600 font-mono">Total: {claims.length}</span>
            </div>

            <div className="p-6 space-y-4">
              {loading ? <div className="text-center text-slate-400 py-10">Loading claims...</div> : 
               claims.length === 0 ? <div className="text-center text-slate-400 py-10">No claims found.</div> : 
               claims.filter(c => !c.paid && !c.rejected).map((claim, idx) => {
                 const claimAmount = ethers.formatEther(claim.amount || "0");
                 const canAfford = parseFloat(balance) >= parseFloat(claimAmount);

                 return (
                   <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-indigo-200 transition-all relative overflow-hidden">
                     {!canAfford && <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>}
                     <div className="flex justify-between items-start">
                       <div>
                         <div className="flex items-center gap-2 mb-2">
                           <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded text-xs font-bold uppercase border border-amber-100">Pending Review</span>
                           <span className="text-xs text-slate-400 font-mono">#{claim.claimId}</span>
                         </div>
                         <p className="font-medium text-slate-900 text-lg">{claimAmount} ETH</p>
                         <div className="text-sm text-slate-500 mt-1 space-y-0.5">
                           <p>Hospital: <span className="font-mono text-xs bg-slate-50 px-1 rounded">{claim.hospital?.slice(0,10)}...</span></p>
                           <p>Patient: <span className="font-mono text-xs bg-slate-50 px-1 rounded">{claim.patient?.slice(0,10)}...</span></p>
                         </div>
                         {!canAfford && (
                           <div className="mt-3 flex items-center gap-2 text-xs text-rose-600 font-medium bg-rose-50 px-2 py-1 rounded w-fit">
                             <AlertCircle className="w-3 h-3" /> Insufficient Pool Balance
                           </div>
                         )}
                       </div>
                       <div className="flex flex-col gap-2">
                         <button
                           onClick={() => handleApproveClaim(claim.claimId, claim.amount)}
                           disabled={loading || !canAfford}
                           className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-sm font-medium transition shadow-sm w-32"
                         >
                           <CheckCircle className="w-4 h-4" /> Approve
                         </button>
                         <button
                           onClick={() => handleRejectClaim(claim.claimId)}
                           disabled={loading}
                           className="flex items-center justify-center gap-2 bg-white border border-rose-200 text-rose-600 px-4 py-2 rounded-lg hover:bg-rose-50 disabled:opacity-50 text-sm font-medium transition w-32"
                         >
                           <XCircle className="w-4 h-4" /> Reject
                         </button>
                       </div>
                     </div>
                   </div>
                 );
               })
              }
              
              {/* History Header */}
              {claims.some(c => c.paid || c.rejected) && (
                <div className="pt-8 pb-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Processed History</p>
                </div>
              )}

              {claims.filter(c => c.paid || c.rejected).map((claim, idx) => (
                <div key={`hist-${idx}`} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-100 opacity-75">
                  <div>
                    <span className="text-sm font-medium text-slate-700">Claim #{claim.claimId}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-sm text-slate-500">{ethers.formatEther(claim.amount || "0")} ETH</span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${claim.paid ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                    {claim.paid ? 'PAID' : 'REJECTED'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InsuranceDashboard;