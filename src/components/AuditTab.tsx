import React from 'react';
import { ShieldCheck, Clock, User } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditTabProps {
  auditLogs: AuditLog[];
}

export const AuditTab: React.FC<AuditTabProps> = ({ auditLogs }) => {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">Security & Operation Audit Logs</h3>
        <p className="text-xs text-zinc-400">Immutable trail of order processing, stock adjustments, and administrative actions</p>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-900/80 text-zinc-400 text-xs uppercase font-semibold border-b border-zinc-800">
            <tr>
              <th className="px-6 py-4">Timestamp</th>
              <th className="px-6 py-4">Action</th>
              <th className="px-6 py-4">Details</th>
              <th className="px-6 py-4">User / Actor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {auditLogs.length > 0 ? (
              auditLogs.map(log => (
                <tr key={log.id} className="hover:bg-zinc-900/60 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-zinc-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded border border-purple-500/20">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-200 text-xs">{log.details}</td>
                  <td className="px-6 py-4 text-zinc-400 text-xs flex items-center gap-1.5 pt-5">
                    <User className="w-3.5 h-3.5 text-zinc-500" />
                    {log.user}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-center py-16 text-zinc-500">
                  <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
                  <p className="text-sm font-medium">No audit logs recorded yet</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
