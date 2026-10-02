import React from 'react';
import { ArrowLeftRight, Plus, CheckCircle2, Clock } from 'lucide-react';
import { StockTransfer, Outlet, ProductItem } from '../types';

interface TransfersTabProps {
  transfers: StockTransfer[];
  outlets: Outlet[];
  onUpdateTransferStatus: (id: string, status: StockTransfer['status']) => void;
  onOpenAddTransfer: () => void;
}

export const TransfersTab: React.FC<TransfersTabProps> = ({
  transfers,
  outlets,
  onUpdateTransferStatus,
  onOpenAddTransfer,
}) => {
  const getOutletName = (id: string) => outlets.find(o => o.id === id)?.name || 'Outlet';

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Multi-Outlet Stock Transfers</h3>
          <p className="text-xs text-zinc-400">Transfer inventory between Battaramulla, Pannipitiya, and Kaduwela</p>
        </div>
        <button
          onClick={onOpenAddTransfer}
          className="flex items-center space-x-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg shadow-purple-600/25 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Stock Transfer</span>
        </button>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900/80 text-zinc-400 text-xs uppercase font-semibold border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4">Transfer # / Date</th>
              <th className="px-6 py-4">Source Outlet</th>
              <th className="px-6 py-4">Target Outlet</th>
              <th className="px-6 py-4">Product & Qty</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {transfers.length > 0 ? (
              transfers.map(trf => (
                <tr key={trf.id} className="hover:bg-zinc-900/60 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-mono font-bold text-white">{trf.transferNumber}</div>
                    <div className="text-xs text-zinc-500">{new Date(trf.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4 text-zinc-300 font-medium">{getOutletName(trf.sourceOutletId)}</td>
                  <td className="px-6 py-4 text-zinc-300 font-medium">{getOutletName(trf.targetOutletId)}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{trf.productName}</div>
                    <div className="text-xs text-purple-400">Qty: {trf.quantity} units</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      trf.status === 'Received'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : trf.status === 'Approved'
                        ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}>
                      {trf.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {trf.status === 'Pending' && (
                      <button
                        onClick={() => onUpdateTransferStatus(trf.id, 'Approved')}
                        className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    {trf.status === 'Approved' && (
                      <button
                        onClick={() => onUpdateTransferStatus(trf.id, 'Received')}
                        className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Confirm Received
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="text-center py-16 text-zinc-500">
                  <ArrowLeftRight className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                  <p className="text-sm font-medium">No stock transfers recorded</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
