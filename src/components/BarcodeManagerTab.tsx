import React, { useState } from 'react';
import { Barcode, Printer, CheckSquare, Square, CheckCircle, Sparkles } from 'lucide-react';
import { BarcodeLabel } from '../types';

interface BarcodeManagerTabProps {
  barcodes: BarcodeLabel[];
  onTogglePrinted: (id: string) => void;
  onBulkMarkPrinted: (ids: string[]) => void;
  searchTerm: string;
}

export const BarcodeManagerTab: React.FC<BarcodeManagerTabProps> = ({
  barcodes,
  onTogglePrinted,
  onBulkMarkPrinted,
  searchTerm,
}) => {
  const [filterMode, setFilterMode] = useState<'unprinted' | 'all'>('unprinted');
  const [selectedBarcodeIds, setSelectedBarcodeIds] = useState<string[]>([]);

  const filteredBarcodes = barcodes.filter(bc => {
    const matchesSearch = 
      bc.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bc.serialOrBarcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bc.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bc.grnBatch.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterMode === 'all' || !bc.isPrinted;
    return matchesSearch && matchesFilter;
  });

  const handleSelectAll = () => {
    if (selectedBarcodeIds.length === filteredBarcodes.length) {
      setSelectedBarcodeIds([]);
    } else {
      setSelectedBarcodeIds(filteredBarcodes.map(b => b.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedBarcodeIds.includes(id)) {
      setSelectedBarcodeIds(selectedBarcodeIds.filter(i => i !== id));
    } else {
      setSelectedBarcodeIds([...selectedBarcodeIds, id]);
    }
  };

  const handlePrintSelected = () => {
    if (selectedBarcodeIds.length === 0) {
      alert('Please select at least one barcode label to print.');
      return;
    }
    window.print();
    // Automatically mark selected as printed
    onBulkMarkPrinted(selectedBarcodeIds);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Top filter and actions */}
      <div className="flex items-center justify-between flex-wrap gap-4 print:hidden">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterMode('unprinted')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterMode === 'unprinted'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Unprinted Labels ({barcodes.filter(b => !b.isPrinted).length})
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterMode === 'all'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            All Labels ({barcodes.length})
          </button>
        </div>

        <div className="flex items-center space-x-3">
          {selectedBarcodeIds.length > 0 && (
            <button
              onClick={handlePrintSelected}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-purple-600/25 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Selected ({selectedBarcodeIds.length}) & Mark Printed</span>
            </button>
          )}
        </div>
      </div>

      {/* Printable Barcode Grid Layout */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl print:border-none print:bg-white print:p-0">
        {filteredBarcodes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 print:grid-cols-3 print:gap-2">
            {filteredBarcodes.map(bc => {
              const isSelected = selectedBarcodeIds.includes(bc.id);
              return (
                <div
                  key={bc.id}
                  onClick={() => handleToggleSelect(bc.id)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all flex flex-col justify-between print:border-black print:bg-white print:text-black ${
                    isSelected
                      ? 'bg-purple-950/30 border-purple-500 shadow-md shadow-purple-900/20'
                      : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2 print:hidden">
                    <div>
                      <span className="text-[10px] font-mono text-purple-400 font-semibold">{bc.sku}</span>
                      <h4 className="font-bold text-sm text-white line-clamp-1">{bc.productName}</h4>
                    </div>
                    <div className="text-zinc-400">
                      {isSelected ? <CheckSquare className="w-4 h-4 text-purple-400" /> : <Square className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Sticker Visual */}
                  <div className="bg-white text-zinc-900 p-3 rounded-lg border border-zinc-300 text-center my-2">
                    <div className="text-[10px] font-bold text-zinc-600 uppercase mb-0.5 print:text-[8px]">WOWTEK (PVT) LTD</div>
                    <div className="font-mono text-lg tracking-[0.2em] font-bold text-black my-1">
                      ||| | |||| || ||| ||
                    </div>
                    <div className="font-mono text-xs font-bold text-purple-700">{bc.serialOrBarcode}</div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-2 print:text-zinc-600">
                    <span className="font-mono">Batch: {bc.grnBatch}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePrinted(bc.id);
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                        bc.isPrinted 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {bc.isPrinted ? '✓ Printed' : 'Pending Print'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 text-zinc-500">
            <Barcode className="w-12 h-12 mx-auto mb-3 text-zinc-700" />
            <p className="text-sm font-medium">No barcode labels found</p>
            <p className="text-xs text-zinc-600 mt-1">Create a GRN stock batch to generate item barcode labels automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
};
