import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDrawData } from '../context/DrawDataContext';
import { NumberBall } from './NumberBall';
import { computeAttributes } from '../lib/lotteryRules';
import { 
  PlusCircle, 
  Upload, 
  Camera, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Trash2, 
  Save, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';

interface DigitizedRow {
  suggestedDrawId: string;
  result: number;
  confidence: number;
  rawText: string;
}

export const AddResultView: React.FC = () => {
  const { role, isAnalyst, isAdmin } = useAuth();
  const { 
    drawsReversed, 
    addDrawResult, 
    bulkImportDraws, 
    totalCount 
  } = useDrawData();

  const [activeMode, setActiveMode] = useState<'manual' | 'bulk' | 'digitizer'>('manual');

  // --- MANUAL ENTRY STATE ---
  const latestId = drawsReversed.length > 0 ? drawsReversed[0].drawId : '11234150';
  const nextSuggestedId = !isNaN(Number(latestId)) ? String(Number(latestId) + 1) : `DRAW-${Date.now()}`;

  const [manualDrawId, setManualDrawId] = useState<string>(nextSuggestedId);
  const [manualResult, setManualResult] = useState<number>(4);
  const [manualNotes, setManualNotes] = useState<string>('');
  const [manualSource, setManualSource] = useState<string>('VIP Manual Input');
  const [manualSubmitting, setManualSubmitting] = useState<boolean>(false);
  const [manualMessage, setManualMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- BULK PASTE STATE ---
  const [bulkText, setBulkText] = useState<string>('');
  const [bulkPreview, setBulkPreview] = useState<{ drawId: string; result: number; status: 'valid' | 'duplicate' | 'invalid' }[]>([]);
  const [bulkImporting, setBulkImporting] = useState<boolean>(false);
  const [bulkResultMsg, setBulkResultMsg] = useState<string | null>(null);

  // --- DIGITIZER STATE ---
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [digitizing, setDigitizing] = useState<boolean>(false);
  const [digitizedRows, setDigitizedRows] = useState<DigitizedRow[]>([]);
  const [digitizerError, setDigitizerError] = useState<string | null>(null);
  const [digitizerSaving, setDigitizerSaving] = useState<boolean>(false);
  const [digitizerSuccessMsg, setDigitizerSuccessMsg] = useState<string | null>(null);

  const manualAttrs = computeAttributes(manualResult);

  // Handle Manual Submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAnalyst) {
      setManualMessage({ type: 'error', text: 'VIEWER role cannot modify data. Sign in as Admin or Analyst.' });
      return;
    }

    setManualSubmitting(true);
    setManualMessage(null);

    const res = await addDrawResult({
      drawId: manualDrawId,
      result: manualResult,
      notes: manualNotes,
      source: manualSource,
    });

    setManualSubmitting(false);

    if (res.success) {
      setManualMessage({ type: 'success', text: `Successfully saved Draw #${manualDrawId} with Result ${manualResult}!` });
      // Advance to next ID
      if (!isNaN(Number(manualDrawId))) {
        setManualDrawId(String(Number(manualDrawId) + 1));
      } else {
        setManualDrawId(`DRAW-${Date.now()}`);
      }
      setManualNotes('');
    } else {
      setManualMessage({ type: 'error', text: res.error || 'Failed to add draw result' });
    }
  };

  // Parse Bulk Text
  const handleParseBulkText = () => {
    if (!bulkText.trim()) {
      setBulkPreview([]);
      return;
    }

    const lines = bulkText.split(/[\r\n]+/);
    const existingIds = new Set(drawsReversed.map((d) => d.drawId));
    const parsedList: { drawId: string; result: number; status: 'valid' | 'duplicate' | 'invalid' }[] = [];

    let autoCounter = drawsReversed.length > 0 && !isNaN(Number(drawsReversed[0].drawId))
      ? Number(drawsReversed[0].drawId) + 1
      : 10000000;

    // Check if it is a continuous space-separated number sequence (e.g. 4 9 2 3 3 2 7 0 9 5)
    if (lines.length === 1 && lines[0].includes(' ') && !lines[0].includes(',')) {
      const tokens = lines[0].trim().split(/\s+/);
      tokens.forEach((tok) => {
        const num = Number(tok);
        const drawId = String(autoCounter++);
        if (!isNaN(num) && num >= 0 && num <= 9) {
          parsedList.push({
            drawId,
            result: num,
            status: existingIds.has(drawId) ? 'duplicate' : 'valid',
          });
        }
      });
    } else {
      // Line by line parsing
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        // Comma, tab or space separated: "11234151, 4" or "11234151 4"
        const parts = trimmed.split(/[,;\t\s]+/);
        if (parts.length >= 2) {
          const id = parts[0].trim();
          const num = Number(parts[1].trim());

          if (isNaN(num) || num < 0 || num > 9 || !id) {
            parsedList.push({ drawId: id || 'UNKNOWN', result: -1, status: 'invalid' });
          } else if (existingIds.has(id)) {
            parsedList.push({ drawId: id, result: num, status: 'duplicate' });
          } else {
            parsedList.push({ drawId: id, result: num, status: 'valid' });
          }
        } else if (parts.length === 1) {
          // Single number line
          const num = Number(parts[0].trim());
          const drawId = String(autoCounter++);
          if (!isNaN(num) && num >= 0 && num <= 9) {
            parsedList.push({
              drawId,
              result: num,
              status: existingIds.has(drawId) ? 'duplicate' : 'valid',
            });
          }
        }
      });
    }

    setBulkPreview(parsedList);
    setBulkResultMsg(null);
  };

  // Execute Bulk Import
  const handleExecuteBulkImport = async () => {
    const validItems = bulkPreview
      .filter((p) => p.status === 'valid')
      .map((p) => ({ drawId: p.drawId, result: p.result, source: 'Bulk Import' }));

    if (validItems.length === 0) {
      setBulkResultMsg('No valid non-duplicate entries to import.');
      return;
    }

    setBulkImporting(true);
    try {
      const res = await bulkImportDraws(validItems);
      setBulkResultMsg(`Successfully imported ${res.imported} draws! (${res.duplicates} duplicates skipped, ${res.invalid} invalid ignored).`);
      setBulkPreview([]);
      setBulkText('');
    } catch (e: any) {
      setBulkResultMsg(`Import error: ${e.message}`);
    } finally {
      setBulkImporting(false);
    }
  };

  // Handle Image Upload for OCR Digitizer
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDigitizerError(null);
    setDigitizerSuccessMsg(null);
    setDigitizedRows([]);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Run Gemini Vision OCR
  const handleRunDigitizer = async () => {
    if (!selectedImage) return;
    setDigitizing(true);
    setDigitizerError(null);
    setDigitizerSuccessMsg(null);

    try {
      const res = await fetch('/api/gemini/digitize-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data: selectedImage,
          mimeType: selectedImage.startsWith('data:image/png') ? 'image/png' : 'image/jpeg',
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.entries)) {
        if (data.entries.length === 0) {
          setDigitizerError('No legible lottery numbers were detected. Please ensure image is well-lit and clear.');
        } else {
          setDigitizedRows(data.entries);
        }
      } else {
        setDigitizerError(data.error || 'Failed to extract values from image.');
      }
    } catch (e: any) {
      setDigitizerError(e.message || 'Connection error to OCR server.');
    } finally {
      setDigitizing(false);
    }
  };

  // Save Digitized Rows
  const handleSaveDigitizedRows = async () => {
    if (digitizedRows.length === 0) return;
    setDigitizerSaving(true);
    setDigitizerError(null);

    try {
      const items = digitizedRows.map((r, i) => ({
        drawId: r.suggestedDrawId || `DRAW-OCR-${Date.now()}-${i + 1}`,
        result: r.result,
        source: 'Gemini OCR Digitizer',
        notes: `Extracted from handwritten record (Confidence: ${r.confidence}%)`,
      }));

      const res = await bulkImportDraws(items);
      setDigitizerSuccessMsg(`Successfully committed ${res.imported} digitized records into Firebase!`);
      setDigitizedRows([]);
      setSelectedImage(null);
    } catch (e: any) {
      setDigitizerError(e.message || 'Failed to save digitized rows.');
    } finally {
      setDigitizerSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Mode Navigation Bar */}
      <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl glass-panel border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveMode('manual')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMode === 'manual'
              ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Manual Entry</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('bulk')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMode === 'bulk'
              ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Bulk Paste</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('digitizer')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeMode === 'digitizer'
              ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>OCR Digitizer</span>
        </button>
      </div>

      {/* MODE 1: MANUAL QUICK ENTRY */}
      {activeMode === 'manual' && (
        <div className="glass-panel rounded-2xl p-5 border border-pink-500/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white font-['Chakra_Petch']">
                RECORD OFFICIAL DRAW RESULT
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically determines Big/Small, Color, and Odd/Even with real-time Firebase sync.
              </p>
            </div>
            <div className="text-xs font-mono text-cyan-400">
              Total Database: {totalCount} Draws
            </div>
          </div>

          {manualMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-mono mb-4 flex items-center gap-2 ${
                manualMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
              }`}
            >
              {manualMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{manualMessage.text}</span>
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-5">
            {/* Draw ID Input */}
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5">
                Draw ID / Period Number
              </label>
              <input
                type="text"
                required
                value={manualDrawId}
                onChange={(e) => setManualDrawId(e.target.value)}
                placeholder="e.g. 11234151"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-pink-500 transition-colors"
              />
            </div>

            {/* Number Keypad 0-9 */}
            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-2">
                Select Result Number (0–9)
              </label>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <NumberBall
                      number={i}
                      size="lg"
                      showLabel
                      selected={manualResult === i}
                      onClick={() => setManualResult(i)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Live Calculated Attributes Preview Card */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[11px] font-mono text-slate-400 uppercase">
                System Auto-Calculated Classification:
              </span>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-mono">SIZE</div>
                  <div className={`text-sm font-bold mt-0.5 ${manualAttrs.bigSmall === 'Big' ? 'text-amber-400' : 'text-cyan-400'}`}>
                    {manualAttrs.bigSmall} ({manualResult >= 5 ? '5-9' : '0-4'})
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-mono">COLOR</div>
                  <div className={`text-sm font-bold mt-0.5 ${
                    manualAttrs.color.includes('Red') ? 'text-rose-400' :
                    manualAttrs.color.includes('Green') ? 'text-emerald-400' : 'text-purple-400'
                  }`}>
                    {manualAttrs.color}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
                  <div className="text-[10px] text-slate-400 font-mono">PARITY</div>
                  <div className="text-sm font-bold text-slate-200 mt-0.5">
                    {manualAttrs.oddEven}
                  </div>
                </div>
              </div>
            </div>

            {/* Source & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                  Source Tag
                </label>
                <input
                  type="text"
                  value={manualSource}
                  onChange={(e) => setManualSource(e.target.value)}
                  placeholder="e.g. WinGo 1-Min Official"
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-1">
                  Optional Notes
                </label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="e.g. Verified official sequence"
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={manualSubmitting || !isAnalyst}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-pink-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {manualSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Synchronizing to Firebase...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Commit Draw #{manualDrawId} (Result: {manualResult})</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* MODE 2: BULK IMPORT */}
      {activeMode === 'bulk' && (
        <div className="glass-panel rounded-2xl p-5 border border-pink-500/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-white font-['Chakra_Petch']">
                BULK HISTORICAL DATA INGESTION
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Paste draw lines (e.g. &quot;11234151, 4&quot;) or a continuous stream of numbers (e.g. &quot;4 9 2 3 3 2 7 0 9 5&quot;).
              </p>
            </div>
          </div>

          {bulkResultMsg && (
            <div className="p-3 rounded-xl text-xs font-mono mb-4 bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              {bulkResultMsg}
            </div>
          )}

          <div className="space-y-4">
            <textarea
              rows={5}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Paste data here...&#10;Example:&#10;11234151, 4&#10;11234152, 7&#10;11234153, 2&#10;OR&#10;4 9 2 3 3 2 7 0 9 5 4 4 7 2"
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-pink-500"
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleParseBulkText}
                className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold transition-colors cursor-pointer"
              >
                Validate & Preview
              </button>

              {bulkPreview.length > 0 && (
                <button
                  type="button"
                  onClick={handleExecuteBulkImport}
                  disabled={bulkImporting || !isAnalyst}
                  className="py-2 px-4 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-mono font-bold shadow-md shadow-pink-600/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {bulkImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Commit {bulkPreview.filter((p) => p.status === 'valid').length} Valid Draws</span>
                </button>
              )}
            </div>

            {/* Bulk Preview Table */}
            {bulkPreview.length > 0 && (
              <div className="mt-4 border border-slate-800 rounded-xl overflow-hidden">
                <div className="p-3 bg-slate-900/80 border-b border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
                  <span>PREVIEW ({bulkPreview.length} items parsed)</span>
                  <div className="flex gap-3 text-[11px]">
                    <span className="text-emerald-400 font-bold">
                      {bulkPreview.filter((p) => p.status === 'valid').length} Valid
                    </span>
                    <span className="text-amber-400">
                      {bulkPreview.filter((p) => p.status === 'duplicate').length} Duplicate
                    </span>
                    <span className="text-rose-400">
                      {bulkPreview.filter((p) => p.status === 'invalid').length} Invalid
                    </span>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Draw ID</th>
                        <th className="p-2.5">Number</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {bulkPreview.slice(0, 50).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50">
                          <td className="p-2.5 text-slate-200">{row.drawId}</td>
                          <td className="p-2.5">
                            {row.result >= 0 ? (
                              <NumberBall number={row.result} size="xs" />
                            ) : (
                              <span className="text-rose-400 font-bold">Invalid</span>
                            )}
                          </td>
                          <td className="p-2.5">
                            {row.status === 'valid' && (
                              <span className="text-emerald-400">Ready to write</span>
                            )}
                            {row.status === 'duplicate' && (
                              <span className="text-amber-400">Duplicate (skipped)</span>
                            )}
                            {row.status === 'invalid' && (
                              <span className="text-rose-400">Invalid format</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODE 3: OLD DATA DIGITIZER (GEMINI OCR) */}
      {activeMode === 'digitizer' && (
        <div className="glass-panel rounded-2xl p-5 border border-purple-500/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-base sm:text-lg font-black text-white font-['Chakra_Petch']">
                  GEMINI VISION OLD DATA DIGITIZER
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload a photo of your handwritten notebook or lottery screenshots to digitize historical records.
              </p>
            </div>
          </div>

          {digitizerError && (
            <div className="p-3 rounded-xl text-xs font-mono mb-4 bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{digitizerError}</span>
            </div>
          )}

          {digitizerSuccessMsg && (
            <div className="p-3 rounded-xl text-xs font-mono mb-4 bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{digitizerSuccessMsg}</span>
            </div>
          )}

          {/* Upload Area */}
          <div className="p-6 rounded-2xl border-2 border-dashed border-slate-700 hover:border-pink-500/50 bg-slate-900/40 text-center transition-colors">
            <input
              type="file"
              id="digitizer-upload"
              accept="image/*"
              onChange={handleImageFileChange}
              className="hidden"
            />
            <label htmlFor="digitizer-upload" className="cursor-pointer flex flex-col items-center">
              <Camera className="w-10 h-10 text-purple-400 mb-2" />
              <span className="text-sm font-semibold text-white">
                Upload Handwritten Notebook or Screenshot
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Supports JPG, PNG (like your handwritten 10/9, 2/4 notes)
              </span>
            </label>
          </div>

          {/* Image Preview & Extract Action */}
          {selectedImage && (
            <div className="mt-4 p-4 rounded-xl bg-slate-900/70 border border-slate-800">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={selectedImage}
                    alt="Uploaded lottery data"
                    className="w-20 h-20 object-cover rounded-lg border border-slate-700"
                  />
                  <div>
                    <div className="text-xs font-bold text-white font-mono">Image Ready for Processing</div>
                    <div className="text-[11px] text-slate-400">Gemini 3.8 Flash Vision OCR</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRunDigitizer}
                  disabled={digitizing}
                  className="py-2.5 px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-mono shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {digitizing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Reading Handwritten Numbers...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Extract Lottery Numbers</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Extracted Editable Table */}
          {digitizedRows.length > 0 && (
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Detected {digitizedRows.length} Historical Records</span>
                </span>

                <button
                  type="button"
                  onClick={handleSaveDigitizedRows}
                  disabled={digitizerSaving || !isAnalyst}
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {digitizerSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Confirm & Save All to Firebase</span>
                </button>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-2.5">Suggested ID</th>
                      <th className="p-2.5">Detected Result</th>
                      <th className="p-2.5">Confidence</th>
                      <th className="p-2.5">Raw Text</th>
                      <th className="p-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                    {digitizedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-850">
                        <td className="p-2.5">
                          <input
                            type="text"
                            value={row.suggestedDrawId}
                            onChange={(e) => {
                              const updated = [...digitizedRows];
                              updated[idx].suggestedDrawId = e.target.value;
                              setDigitizedRows(updated);
                            }}
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs w-32 font-mono"
                          />
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-2">
                            <NumberBall number={row.result} size="xs" />
                            <select
                              value={row.result}
                              onChange={(e) => {
                                const updated = [...digitizedRows];
                                updated[idx].result = Number(e.target.value);
                                setDigitizedRows(updated);
                              }}
                              className="bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-slate-200 text-xs font-mono"
                            >
                              {Array.from({ length: 10 }, (_, n) => (
                                <option key={n} value={n}>{n}</option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td className="p-2.5 text-cyan-400">{row.confidence}%</td>
                        <td className="p-2.5 text-slate-400">{row.rawText}</td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setDigitizedRows(digitizedRows.filter((_, i) => i !== idx));
                            }}
                            className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
