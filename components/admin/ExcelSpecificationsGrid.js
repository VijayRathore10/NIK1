'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ClipboardPaste, Sparkles, Trash2, CheckCircle2, AlertCircle, X } from 'lucide-react';

const MAX_ROWS = 30;

export default function ExcelSpecificationsGrid({ specifications = [], onChange }) {
  // Initialize fixed 30 rows
  const [rows, setRows] = useState(() => {
    const initial = [];
    for (let i = 0; i < MAX_ROWS; i++) {
      const existing = specifications && specifications[i];
      initial.push({
        id: i,
        label: existing?.label || '',
        value: existing?.value || '',
      });
    }
    return initial;
  });

  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [notification, setNotification] = useState('');
  const notifTimeout = useRef(null);

  // Sync when prop changes
  useEffect(() => {
    setRows(() => {
      const next = [];
      for (let i = 0; i < MAX_ROWS; i++) {
        const existing = specifications && specifications[i];
        next.push({
          id: i,
          label: existing?.label || '',
          value: existing?.value || '',
        });
      }
      return next;
    });
  }, [specifications]);

  const showToast = (msg) => {
    setNotification(msg);
    if (notifTimeout.current) clearTimeout(notifTimeout.current);
    notifTimeout.current = setTimeout(() => setNotification(''), 4000);
  };

  const emitChange = (newRows) => {
    // Clean: filter out completely blank rows, max 30 rows
    const cleaned = newRows
      .filter((r) => (r.label && r.label.trim()) || (r.value && r.value.trim()))
      .slice(0, MAX_ROWS)
      .map((r) => ({
        label: (r.label || '').trim(),
        value: (r.value || '').trim(),
      }));
    onChange(cleaned);
  };

  const handleCellChange = (index, field, val) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: val };
    setRows(updated);
    emitChange(updated);
  };

  const parseExcelText = (text) => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const items = [];
    for (let i = 0; i < lines.length && items.length < MAX_ROWS; i++) {
      const line = lines[i];
      let col1 = '';
      let col2 = '';

      if (line.includes('\t')) {
        const parts = line.split('\t');
        col1 = parts[0]?.trim() || '';
        col2 = parts.slice(1).join('\t').trim() || '';
      } else if (line.includes(':')) {
        const parts = line.split(':');
        col1 = parts[0]?.trim() || '';
        col2 = parts.slice(1).join(':').trim() || '';
      } else if (line.includes(',')) {
        const parts = line.split(',');
        col1 = parts[0]?.trim() || '';
        col2 = parts.slice(1).join(',').trim() || '';
      } else {
        col1 = line;
        col2 = '';
      }

      items.push({ col1, col2 });
    }
    return items;
  };

  // Direct paste into any cell
  const handleCellPaste = (e, startIndex) => {
    const clipboardText = e.clipboardData?.getData('text/plain') || '';

    if (clipboardText.includes('\t') || clipboardText.includes('\n')) {
      e.preventDefault();
      const parsed = parseExcelText(clipboardText);
      if (parsed.length === 0) return;

      const updated = [...rows];
      parsed.forEach((item, offset) => {
        const target = startIndex + offset;
        if (target < MAX_ROWS) {
          updated[target] = {
            ...updated[target],
            label: item.col1,
            value: item.col2,
          };
        }
      });

      setRows(updated);
      emitChange(updated);
      showToast(`✓ Pasted ${parsed.length} rows directly from Excel!`);
    }
  };

  // Quick Paste Modal Apply
  const applyPasteModal = () => {
    if (!pasteText.trim()) return;
    const parsed = parseExcelText(pasteText);
    if (parsed.length === 0) return;

    const updated = [];
    for (let i = 0; i < MAX_ROWS; i++) {
      const item = parsed[i];
      updated.push({
        id: i,
        label: item ? item.col1 : '',
        value: item ? item.col2 : '',
      });
    }

    setRows(updated);
    emitChange(updated);
    setShowPasteModal(false);
    setPasteText('');
    showToast(`✓ Successfully applied ${parsed.length} rows from Excel!`);
  };

  const clearAll = () => {
    if (window.confirm('Clear all 30 specification rows?')) {
      const cleared = [];
      for (let i = 0; i < MAX_ROWS; i++) {
        cleared.push({ id: i, label: '', value: '' });
      }
      setRows(cleared);
      emitChange(cleared);
      showToast('All rows cleared. Empty rows will not appear on the website.');
    }
  };

  const fillTemplate = () => {
    const template = [
      { col1: 'Make / Model', col2: '' },
      { col1: 'Year of Manufacture', col2: '2023' },
      { col1: 'Condition / Odometer', col2: 'Inspected / Certified' },
      { col1: 'Engine Type', col2: 'Turbocharged Diesel' },
      { col1: 'Max Power', col2: '160 HP' },
      { col1: 'Transmission', col2: 'Manual, 6-Speed' },
      { col1: 'Drive Configuration', col2: '4x2 Rigid' },
      { col1: 'Gross Vehicle Weight (GVW)', col2: '16,000 kg' },
      { col1: 'Payload Capacity', col2: '10 Tonne' },
      { col1: 'Fuel Tank Capacity', col2: '200 Litres' },
      { col1: 'Braking System', col2: 'Dual Circuit Air S-Cam' },
      { col1: 'Wheelbase', col2: '4,200 mm' },
      { col1: 'Tyre Size & Condition', col2: '10.00 R20 (85%+ Tread)' },
      { col1: 'Cabin Configuration', col2: 'Day Cab' },
      { col1: 'Air Conditioning', col2: 'Factory Fitted' },
      { col1: 'Emission Standard', col2: 'Euro III / Euro IV' },
      { col1: 'Export Readiness', col2: 'Pre-Shipment Inspection Done' },
      { col1: 'Shipping Option', col2: 'Ro-Ro / 40ft High Cube Container' },
    ];

    const updated = [...rows];
    template.forEach((item, i) => {
      if (i < MAX_ROWS) {
        updated[i] = {
          id: i,
          label: item.col1,
          value: updated[i]?.value || item.col2,
        };
      }
    });

    setRows(updated);
    emitChange(updated);
    showToast('Loaded standard commercial vehicle specification template!');
  };

  const activeCount = rows.filter(
    (r) => (r.label && r.label.trim()) || (r.value && r.value.trim())
  ).length;

  return (
    <div className="bg-slate-900/60 border border-slate-700/80 rounded-xl p-4 sm:p-5 text-slate-100">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-700/70">
        <div>
          <div className="flex items-center gap-2.5">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              2-Column Detailed Specifications (Max 30 Rows)
            </h4>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                activeCount > 0
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              {activeCount} of {MAX_ROWS} Rows Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Copy 2 columns from Excel and press <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300 font-mono">Ctrl+V</code> directly inside any cell.
            <span className="text-amber-400/90 font-medium ml-1">Empty rows will not be shown on the live web page.</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowPasteModal(true)}
            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>Paste from Excel</span>
          </button>

          <button
            type="button"
            onClick={fillTemplate}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
            title="Pre-fills standard vehicle labels"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Template</span>
          </button>

          <button
            type="button"
            onClick={clearAll}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification('')}
            className="text-emerald-300 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Quick Paste Modal / Drawer */}
      {showPasteModal && (
        <div className="mb-4 p-4 rounded-xl bg-slate-800/90 border border-amber-500/60 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <ClipboardPaste className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Paste Excel / Google Sheets Columns
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowPasteModal(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-2">
            Select 2 columns in your spreadsheet (Col 1 = Specification Label, Col 2 = Value), copy (<code className="text-amber-300">Ctrl+C</code>), and paste below:
          </p>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={5}
            placeholder={`Engine Type\tCummins 5.8L Turbo Diesel\nTransmission\tManual, 6-Speed\nFuel Type\tDiesel\nPayload\t10 Tonne`}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
          />
          <div className="flex items-center justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={() => setShowPasteModal(false)}
              className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs text-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={applyPasteModal}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              Apply to 30 Rows
            </button>
          </div>
        </div>
      )}

      {/* 30-Row Table Grid */}
      <div className="max-h-[500px] overflow-y-auto rounded-lg border border-slate-700/80 bg-slate-950/60">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-800/90 text-slate-300 border-b border-slate-700 sticky top-0 z-10 backdrop-blur-sm">
              <th className="py-2 px-2.5 w-12 text-center text-slate-400 font-mono font-bold">#</th>
              <th className="py-2 px-3 w-[45%] font-bold uppercase tracking-wider text-slate-200">
                Column 1: Specification Label
              </th>
              <th className="py-2 px-3 w-[50%] font-bold uppercase tracking-wider text-slate-200">
                Column 2: Value / Details
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {rows.map((row, idx) => {
              const hasData = Boolean(
                (row.label && row.label.trim()) || (row.value && row.value.trim())
              );

              return (
                <tr
                  key={row.id}
                  className={`transition-colors ${
                    hasData ? 'bg-slate-900/40 hover:bg-slate-800/40' : 'bg-transparent hover:bg-slate-900/20'
                  }`}
                >
                  <td className="py-1.5 px-2 text-center font-mono font-bold text-slate-500 border-r border-slate-800/80 select-none">
                    {hasData ? (
                      <span className="text-amber-400">{idx + 1}</span>
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </td>
                  <td className="py-1 px-2 border-r border-slate-800/80">
                    <input
                      type="text"
                      value={row.label || ''}
                      placeholder={idx === 0 ? 'e.g. Make / Model' : `Row ${idx + 1} Label`}
                      onChange={(e) => handleCellChange(idx, 'label', e.target.value)}
                      onPaste={(e) => handleCellPaste(e, idx)}
                      className={`w-full px-2.5 py-1.5 rounded bg-slate-900/80 border text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 ${
                        hasData ? 'border-slate-700 font-medium' : 'border-slate-800/60'
                      }`}
                    />
                  </td>
                  <td className="py-1 px-2">
                    <input
                      type="text"
                      value={row.value || ''}
                      placeholder={idx === 0 ? 'e.g. Tata Prima 4028.S' : `Row ${idx + 1} Value`}
                      onChange={(e) => handleCellChange(idx, 'value', e.target.value)}
                      onPaste={(e) => handleCellPaste(e, idx)}
                      className={`w-full px-2.5 py-1.5 rounded bg-slate-900/80 border text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 ${
                        hasData ? 'border-slate-700' : 'border-slate-800/60'
                      }`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-400 gap-1.5">
        <span>
          💡 <strong>Tip:</strong> Press <code className="bg-slate-800 px-1 py-0.5 rounded text-amber-300">Ctrl+V</code> inside any cell to paste spreadsheet data starting from that row.
        </span>
        <span className="italic text-slate-500">
          {MAX_ROWS - activeCount} empty row{MAX_ROWS - activeCount === 1 ? '' : 's'} will be automatically omitted on the web page.
        </span>
      </div>
    </div>
  );
}
