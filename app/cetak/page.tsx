'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Printer, ChevronLeft, Loader2, Trophy, Shield, Info, Filter, Download } from 'lucide-react';
import Link from 'next/link';
import { useRef } from 'react';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwc5-z0n860AsBB77KLHyYCxUNarnqcsH2GuAe5EiodL6DL44hS_de13x-N1W7hOqGvIA/exec";

// --- PRINT GRAPHIC BRACKET COMPONENTS ---

const PrintAthleteLeft = ({ athlete }: { athlete: any }) => (
  <div className="w-[60mm] relative flex flex-col justify-end h-[56px] shrink-0 border-box pb-[32px]">
    {/* Line at y=50% = 28px from top = midpoint of the 56px box, syncs with junction's 25%/75% */}
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
      <line x1="0" y1="50" x2="100" y2="50" stroke="black" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
    <div className="relative z-10 pl-2">
      <div className="text-[12px] font-black uppercase truncate leading-none text-black" style={{ color: athlete?.nama?.startsWith('Pemenang') ? '#9ca3af' : undefined }}>{athlete?.nama || "TBD"}</div>
      <div className="text-[9px] text-gray-700 uppercase truncate leading-none mt-0.5">{athlete?.klub !== "-" ? athlete?.klub : ""}</div>
    </div>
  </div>
);

const PrintAthleteRight = ({ athlete }: { athlete: any }) => (
  <div className="w-[60mm] relative flex flex-col justify-end h-[56px] shrink-0 border-box pb-[32px]">
    {/* Line at y=50% = 28px from top = midpoint of the 56px box, syncs with junction's 25%/75% */}
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
      <line x1="0" y1="50" x2="100" y2="50" stroke="black" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
    <div className="relative z-10 pr-2 text-right">
      <div className="text-[12px] font-black uppercase truncate leading-none text-black" style={{ color: athlete?.nama?.startsWith('Pemenang') ? '#9ca3af' : undefined }}>{athlete?.nama || "TBD"}</div>
      <div className="text-[9px] text-gray-700 uppercase truncate leading-none mt-0.5">{athlete?.klub !== "-" ? athlete?.klub : ""}</div>
    </div>
  </div>
);

const PrintTreeLeft = ({ matchId, matchMap, childrenMap }: any) => {
  const match = matchMap.get(matchId);
  if (!match) return null;
  const children = childrenMap.get(matchId) || [];

  return (
    <div className="flex items-stretch" style={{ boxSizing: 'border-box' }}>
      {/* 1. Inputs (Children) */}
      <div className="flex flex-col justify-center shrink-0 border-box">
        {children.length > 0 ? (
          <div className="flex flex-col justify-center">
            <PrintTreeLeft matchId={children[0]} matchMap={matchMap} childrenMap={childrenMap} />
            <PrintTreeLeft matchId={children[1]} matchMap={matchMap} childrenMap={childrenMap} />
          </div>
        ) : (
          <div className="grid grid-rows-2 h-[112px]">
            <PrintAthleteLeft athlete={match.blue} />
            <PrintAthleteLeft athlete={match.red} />
          </div>
        )}
      </div>

      {/* 2. Junction Fork */}
      <div className="w-[15mm] relative shrink-0 flex items-stretch border-box">
        {/* Fork: top arm at y=25, bottom arm at y=75, vertical bar connects them, output exits right at y=50 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 0 25 L 50 25 L 50 75 L 0 75 M 50 50 L 100 50" stroke="black" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-0.5 text-[10px] font-black z-[50] text-black border border-black">
          {match.noPartai}
        </div>
      </div>
    </div>
  );
};

const PrintTreeRight = ({ matchId, matchMap, childrenMap }: any) => {
  const match = matchMap.get(matchId);
  if (!match) return null;
  const children = childrenMap.get(matchId) || [];

  return (
    <div className="flex items-stretch" style={{ boxSizing: 'border-box' }}>
      {/* 1. Junction Fork */}
      <div className="w-[15mm] relative shrink-0 flex items-stretch border-box">
        {/* Fork: top arm at y=25, bottom arm at y=75, vertical bar connects them, output exits left at y=50 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M 100 25 L 50 25 L 50 75 L 100 75 M 50 50 L 0 50" stroke="black" strokeWidth="1.5" fill="none" vectorEffect="non-scaling-stroke" />
        </svg>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-0.5 text-[10px] font-black z-[50] text-black border border-black">
          {match.noPartai}
        </div>
      </div>

      {/* 2. Inputs (Children) */}
      <div className="flex flex-col justify-center shrink-0 border-box">
        {children.length > 0 ? (
          <div className="flex flex-col justify-center">
            <PrintTreeRight matchId={children[0]} matchMap={matchMap} childrenMap={childrenMap} />
            <PrintTreeRight matchId={children[1]} matchMap={matchMap} childrenMap={childrenMap} />
          </div>
        ) : (
          <div className="grid grid-rows-2 h-[112px]">
            <PrintAthleteRight athlete={match.blue} />
            <PrintAthleteRight athlete={match.red} />
          </div>
        )}
      </div>
    </div>
  );
};

const PrintGraphicBracket = ({ groupName, matches }: { groupName: string, matches: any[] }) => {
  // 1. Sort matches sequentially by their No. Partai number
  const sortedMatches = [...matches].sort((a, b) => {
    const numA = parseInt((a.noPartai || "").replace(/[^\d]/g, '')) || 0;
    const numB = parseInt((b.noPartai || "").replace(/[^\d]/g, '')) || 0;
    return numA - numB;
  });

  const matchMap = new Map();
  sortedMatches.forEach(m => matchMap.set((m.noPartai || "").toString().trim(), m));

  // 2. Mathematically reconstruct the bracket hierarchy (Bottom-Up Binary Tree)
  const S = sortedMatches.length + 1;
  const numR1 = S / 2;

  const childrenMap = new Map();
  let currentRound = sortedMatches.slice(0, numR1);
  let nextIdx = numR1;

  while (currentRound.length > 1 && nextIdx < sortedMatches.length) {
    const nextRound = [];
    for (let i = 0; i < currentRound.length; i += 2) {
      const parent = sortedMatches[nextIdx];
      const leftChild = currentRound[i];
      const rightChild = currentRound[i + 1];

      if (!parent) break;

      const parentId = (parent.noPartai || "").toString().trim();
      const leftId = (leftChild?.noPartai || "").toString().trim();
      const rightId = (rightChild?.noPartai || "").toString().trim();

      childrenMap.set(parentId, [leftId, rightId]);
      nextRound.push(parent);
      nextIdx++;
    }
    currentRound = nextRound;
  }

  // Root is the last match
  const rootMatch = sortedMatches[sortedMatches.length - 1];
  if (!rootMatch) return null;

  const [catName, gen, klst] = groupName.split('|').map((s: string) => s.trim());

  let athleteSet = new Set();
  matches.forEach(m => {
    if (m.blue?.nama && !m.blue.nama.toUpperCase().startsWith("PEMENANG ") && m.blue.nama.toUpperCase() !== "BYE") {
      athleteSet.add(m.blue.nama + m.blue.klub);
    }
    if (m.red?.nama && !m.red.nama.toUpperCase().startsWith("PEMENANG ") && m.red.nama.toUpperCase() !== "BYE") {
      athleteSet.add(m.red.nama + m.red.klub);
    }
  });
  const totalCompetitors = athleteSet.size;

  return (
    <div className="category-container w-full min-h-[210mm] bg-white p-[10mm] flex flex-col justify-between relative overflow-hidden" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
      <div>
        {/* HEADER PRINT */}
        <div className="w-full flex justify-between items-start mb-4 border-b-[3px] border-black pb-4 shrink-0">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <div className="bg-black text-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest italic">Official</div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-black leading-none">
                {catName} <span className="mx-2 text-gray-300">|</span> {gen} <span className="mx-2 text-gray-300">|</span> {klst}
              </h1>
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">Taekwondo Tournament Bracket System</p>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="bg-black text-white px-5 py-2 mb-1">
              <p className="text-lg font-black uppercase tracking-tighter italic leading-none">PRABU TKD</p>
            </div>
            <div className="flex gap-4 mt-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-black">Total: {totalCompetitors} Athletes</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* THE TREE */}
        <div className="flex justify-center items-center w-full relative overflow-visible py-8">
          <div className="flex items-center justify-center scale-[1.0] origin-center w-full">
            {/* LEFT TREE */}
            <div className="flex-1 flex justify-end">
              {childrenMap.get((rootMatch.noPartai || "").toString().trim())?.[0] ? (
                <PrintTreeLeft matchId={childrenMap.get((rootMatch.noPartai || "").toString().trim())[0]} matchMap={matchMap} childrenMap={childrenMap} />
              ) : (
                <div className="flex items-center"><PrintAthleteLeft athlete={rootMatch.blue} /></div>
              )}
            </div>

            {/* CENTER FINAL */}
            <div className="flex-none z-10 relative flex items-center mx-1 min-w-[30mm] border-box">
              <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="-10" y1="50" x2="110" y2="50" stroke="black" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="relative bg-white px-4 py-2 text-[12px] font-black z-[50] text-black mx-auto border-2 border-black">
                {rootMatch.noPartai}
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.2em] text-black whitespace-nowrap bg-white px-2">FINAL</div>
              </div>
            </div>

            {/* RIGHT TREE */}
            <div className="flex-1 flex justify-start">
              {childrenMap.get((rootMatch.noPartai || "").toString().trim())?.[1] ? (
                <PrintTreeRight matchId={childrenMap.get((rootMatch.noPartai || "").toString().trim())[1]} matchMap={matchMap} childrenMap={childrenMap} />
              ) : (
                <div className="flex items-center"><PrintAthleteRight athlete={rootMatch.red} /></div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div>
        {/* WINNER TABLE */}
        <div className="w-full shrink-0 mt-4 pt-4 flex justify-center border-t border-gray-100">
          <table className="border-collapse border-[2px] border-black w-[550px] bg-white shadow-sm">
            <tbody>
              {['JUARA 1', 'JUARA 2', 'JUARA 3 BERSAMA', 'JUARA 3 BERSAMA'].map((place, idx) => (
                <tr key={idx} className="border-b-[1.5pt] border-black last:border-b-0">
                  <td className="border-r-[1.5pt] border-black bg-gray-50 py-2 px-4 w-40 text-[10px] font-black text-black uppercase tracking-widest whitespace-nowrap">
                    {place}
                  </td>
                  <td className="py-2 px-3 w-full bg-white italic text-[11px] font-bold text-gray-400">................................................................................................</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER WATERMARK */}
        <div className="w-full text-right mt-4 opacity-20 text-[8px] font-bold uppercase tracking-[0.5em] text-black italic">
          Generated by Prabu TMS Digital Engine
        </div>
      </div>
    </div>
  );
};

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Semua Kategori");

  const handleDownloadPDF = async () => {
    if (exporting) return;
    setExporting(true);

    try {
      const container = document.getElementById('bracket-to-print');
      const pages = container
        ? Array.from(container.querySelectorAll<HTMLElement>('.bracket-page-print'))
        : [];

      if (pages.length === 0) {
        alert('Tidak ada data bagan untuk dicetak.');
        setExporting(false);
        return;
      }

      // --- Build Hidden Iframe for High-Precision Printing ---
      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:297mm;height:210mm;border:none;visibility:hidden;';
      document.body.appendChild(iframe);

      const iframeWin = iframe.contentWindow!;
      const iframeDoc = iframe.contentDocument || iframeWin.document;

      // Import parent styles (Tailwind, etc.)
      const parentLinks = Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
        .map(el => el.outerHTML).join('\n');
      const parentStyles = Array.from(document.head.querySelectorAll('style'))
        .map(el => el.outerHTML).join('\n');

      // Generate HTML for each page using display: block as requested
      const bodyHTML = pages.map((page, idx) => {
        const clone = page.cloneNode(true) as HTMLElement;
        // Reset container style for iframe
        clone.style.cssText = 'width: 277mm; min-height: 190mm; background: #fff; margin: 0; padding: 0; break-inside: avoid;';

        return `
          <section style="
            display: block; 
            width: 100%; 
            min-height: 100vh;
            margin: 0; 
            padding: 0; 
            background: #ffffff;
            page-break-after: always;
            break-after: page;
          ">
            ${clone.outerHTML}
          </section>
        `;
      }).join('\n');

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          ${parentLinks}
          ${parentStyles}
          <style>
            @page { 
              size: A4 landscape; 
              margin: 0; 
            }
            html, body { 
              margin: 0; 
              padding: 0; 
              background: #ffffff; 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important;
            }
            * { 
              box-sizing: border-box !important; 
            }
            section {
              display: block !important;
              width: 100%;
              height: 100vh;
              page-break-after: always !important;
              break-after: page !important;
              overflow: hidden;
            }
          </style>
        </head>
        <body>
          ${bodyHTML}
        </body>
        </html>
      `);
      iframeDoc.close();

      // Give a moment for internal styles/fonts to resolve
      await new Promise<void>(resolve => {
        if (iframeDoc.readyState === 'complete') {
          setTimeout(resolve, 800);
        } else {
          iframeWin.onload = () => setTimeout(resolve, 800);
        }
      });

      iframeWin.focus();
      iframeWin.print();

      // Cleanup
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 5000);

    } catch (error) {
      console.error('Print Error:', error);
      alert(`Gagal membuka dialog cetak: ${error instanceof Error ? error.message : 'Terjadi kesalahan.'}`);
    } finally {
      setExporting(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Helper: fetch with 15s timeout
      const fetchWithTimeout = (url: string, ms = 15000) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), ms);
        return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
      };

      const response = await fetchWithTimeout(`${SCRIPT_URL}?sheet=Bagan_Tanding&t=${new Date().getTime()}`);

      if (!response.ok) {
        throw new Error(`HTTP Error! Status: ${response.status}`);
      }

      const result = await response.json();
      const rawData = Array.isArray(result) ? result : (result.data || result["Bagan_Tanding"] || []);
      setData(rawData);
    } catch (error) {
      console.error("Fetch Error:", error);
      // Fallback to empty array to avoid crash
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!data) return null;

  const groupedData = useMemo(() => {
    const categoryOrder = ["PRA CADET", "CADET", "JUNIOR", "SENIOR"];

    const getCatRank = (cat: string) => {
      const c = (cat || "").toString().toUpperCase();
      if (c.includes("PRA CADET")) return 1;
      if (c.includes("CADET")) return 2;
      if (c.includes("JUNIOR")) return 3;
      if (c.includes("SENIOR")) return 4;
      return 99;
    };

    const getGenRank = (gen: string) => {
      const g = (gen || "").toString().toUpperCase();
      if (g.includes("FEMALE") || g.includes("PUTRI") || g.includes("PI")) return 1;
      return 2;
    };

    const getWeightValue = (w: string) => {
      const match = (w || "").toString().match(/\d+/);
      return match ? parseInt(match[0]) : 999;
    };

    const groups: Record<string, any[]> = {};
    data.forEach(m => {
      const cat = (m.kategori || m.Kategori || "-").toString().toUpperCase();
      const gen = (m.gender || m.Gender || "-").toString().toUpperCase();
      const klst = (m["kelas tanding"] || m["Kelas Tanding"] || m.kelastanding || "-").toString().toUpperCase();

      if (selectedCategory !== "Semua Kategori" && !cat.includes(selectedCategory.toUpperCase())) return;

      const key = `${cat}|${gen}|${klst}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(m);
    });

    const finalizedGroups = Object.entries(groups).map(([key, rawMatches]) => {
      const formattedMatches = rawMatches.map(m => {
        const a1 = m["Nama Atlet 1"] || m["nama atlet 1"] || m.atlet1 || "???";
        const a2 = m["Nama Atlet 2"] || m["nama atlet 2"] || m.atlet2 || "BYE";
        const c1 = m["Club 1"] || m["club 1"] || m.club1 || "-";
        const c2 = m["Club 2"] || m["club 2"] || m.club2 || "-";
        const nr = m["No. Partai"] || m["no. partai"] || m.noPartai || m.no_partai;
        const [cat, gen, klst] = key.split('|');

        return {
          noPartai: nr,
          blue: {
            nama: a1.toString().toUpperCase(),
            klub: c1.toString().toUpperCase(),
            isBye: a1.toString().toUpperCase() === "BYE"
          },
          red: {
            nama: a2.toString().toUpperCase(),
            klub: c2.toString().toUpperCase(),
            isBye: a2.toString().toUpperCase() === "BYE"
          },
          kategori: cat, gender: gen, kelas: klst
        };
      });

      return { key, matches: formattedMatches };
    }).filter(g => g.matches.length > 0);

    return finalizedGroups.sort((a, b) => {
      const [catA, genA, kelasA] = a.key.split('|');
      const [catB, genB, kelasB] = b.key.split('|');

      const rA = getCatRank(catA);
      const rB = getCatRank(catB);
      if (rA !== rB) return rA - rB;

      const gA = getGenRank(genA);
      const gB = getGenRank(genB);
      if (gA !== gB) return gA - gB;

      return getWeightValue(kelasA) - getWeightValue(kelasB);
    });
  }, [data, selectedCategory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0e12] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <Loader2 className="text-[#8f5fe8] animate-spin" size={64} />
          <Trophy className="absolute inset-0 m-auto text-white/20" size={24} />
        </div>
        <div className="text-center">
          <p className="text-white font-black uppercase tracking-[0.3em] text-sm mb-1">Menyiapkan Dokumen</p>
          <p className="text-[#6c7293] text-[10px] font-bold uppercase tracking-widest">Sinkronisasi Data Bracket Real-time...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0e12] text-white selection:bg-[#8f5fe8]/30">
      <header className="bg-[#191c24]/80 backdrop-blur-xl border-b border-[#2c2e33] p-4 sticky top-0 z-[100] print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-6">
            <Link href="/generate" className="group flex items-center gap-2 text-[#6c7293] hover:text-white transition-all">
              <div className="p-2 group-hover:bg-white/10 rounded-full transition-colors">
                <ChevronLeft size={24} />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-black uppercase italic tracking-tighter leading-none">Cetak Bagan</h1>
                <p className="text-[9px] font-bold uppercase tracking-widest opacity-50">Official Tournament Printer</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4 flex-1 justify-end">
            <div className="relative flex-1 max-w-[250px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8f5fe8]" size={14} />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-black border border-[#2c2e33] text-white text-[10px] font-bold uppercase tracking-widest py-3 pl-10 pr-4 rounded-sm focus:border-[#8f5fe8] outline-none transition-all cursor-pointer appearance-none"
              >
                <option value="Semua Kategori">Semua Kategori</option>
                <option value="PRA CADET">PRA CADET</option>
                <option value="CADET">CADET</option>
                <option value="JUNIOR">JUNIOR</option>
                <option value="SENIOR">SENIOR</option>
              </select>
            </div>

            <button
              onClick={handleDownloadPDF}
              disabled={exporting}
              className="group flex items-center gap-3 bg-[#8f5fe8] text-white px-8 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-[#7a4cd1] transition-all shadow-[0_8px_30px_rgb(143,95,232,0.3)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed print:hidden"
            >
              {exporting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Printer size={16} className="group-hover:translate-y-0.5 transition-transform" />
                  Cetak Bagan (PDF)
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 no-print">
        {groupedData.length === 0 ? (
          <div className="bg-[#191c24] border border-[#2c2e33] p-24 text-center rounded-sm flex flex-col items-center">
            <div className="p-6 bg-black rounded-full mb-6 border border-[#2c2e33]">
              <Shield className="text-[#6c7293]" size={64} />
            </div>
            <h3 className="text-xl font-black uppercase tracking-widest text-white mb-2">Data Bagan Tidak Ditemukan</h3>
            <p className="text-[#6c7293] text-sm max-w-md mx-auto">Pastikan Anda telah melakukan "Generate" dan "Simpan ke Database" di halaman sebelumnya sebelum mencetak.</p>
            <Link href="/generate" className="mt-8 text-[#8f5fe8] font-black uppercase text-xs hover:underline tracking-widest">Ke Halaman Generate →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-16">
            {groupedData.map((group, idx) => (
              <div key={idx} className="relative group overflow-x-auto custom-scrollbar">
                <div className="absolute -top-6 left-0 flex items-center gap-2">
                  <span className="bg-[#8f5fe8] text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Halaman {idx + 1}</span>
                  <span className="text-[#6c7293] text-[9px] font-bold uppercase tracking-widest">{group.key}</span>
                </div>
                <div className="bracket-page-view bg-white text-black shadow-2xl rounded-sm transition-transform duration-500 group-hover:scale-[1.01] w-full max-w-[297mm] mx-auto border border-gray-200">
                  <PrintGraphicBracket groupName={group.key} matches={group.matches} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* HIDDEN PRINT SECTION (For High-Precision Printing) */}
      <div id="bracket-to-print" className="fixed -left-[9999px] top-0">
        {groupedData.map((group, gIdx) => (
          <div key={gIdx} className="bracket-page-print">
            <PrintGraphicBracket groupName={group.key} matches={group.matches} />
          </div>
        ))}
      </div>
      <style jsx global>{`
        :root {
          --bracket-stroke: 1.5pt;
        }

        @media print {
          .no-print { display: none !important; }
          
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            image-rendering: -webkit-optimize-contrast !important;
            shape-rendering: crispEdges !important;
          }

          @page {
            size: A4 landscape;
            margin: 0;
          }

          .bracket-page {
            width: 297mm !important;
            height: 210mm !important;
            page-break-after: always !important;
            break-after: page !important;
            display: flex !important;
            flex-direction: column !important;
            background: white !important;
            padding: 12mm 15mm !important;
            margin: 0 auto !important;
            box-sizing: border-box !important;
            position: relative !important;
            overflow: hidden !important;
          }

          * {
            box-sizing: border-box !important;
          }

          .border-black {
            border-color: black !important;
          }
          
          .bg-black { background-color: black !important; }
          .bg-gray-50 { background-color: #f9fafb !important; }
        }
        
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #191c24; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2c2e33; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #8f5fe8; }
      `}</style>
    </div>
  );
}
