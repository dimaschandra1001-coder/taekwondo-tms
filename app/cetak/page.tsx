'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Printer, ChevronLeft, Loader2, Trophy, Shield, Info, Filter } from 'lucide-react';
import Link from 'next/link';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzIUOsZAioE_cPROrHs1LmYB83pIjyeorbK8SfDLgUQXYsU-jYjdf2HNKJOjOCucl_q7Q/exec";

// --- PRINT GRAPHIC BRACKET COMPONENTS ---

const PrintAthleteLeft = ({ athlete }: { athlete: any }) => (
  <div className="w-[55mm] relative flex flex-col justify-end h-[56px] shrink-0 border-box pb-[32px]">
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 100 56" preserveAspectRatio="none" shapeRendering="crispEdges">
      <line x1="0" y1="28" x2="100.5" y2="28" stroke="black" strokeWidth="1.5pt" vectorEffect="non-scaling-stroke" />
    </svg>
    <div className="relative z-10 pl-2">
      <div className="text-[12px] font-black uppercase truncate leading-none" style={{color: athlete?.nama?.startsWith('Pemenang') ? '#9ca3af' : '#000'}}>{athlete?.nama || "TBD"}</div>
      <div className="text-[9px] text-gray-700 uppercase truncate leading-none mt-0.5">{athlete?.klub !== "-" ? athlete?.klub : ""}</div>
    </div>
  </div>
);

const PrintAthleteRight = ({ athlete }: { athlete: any }) => (
  <div className="w-[55mm] relative flex flex-col justify-end h-[56px] shrink-0 border-box pb-[32px]">
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 100 56" preserveAspectRatio="none" shapeRendering="crispEdges">
      <line x1="-0.5" y1="28" x2="100" y2="28" stroke="black" strokeWidth="1.5pt" vectorEffect="non-scaling-stroke" />
    </svg>
    <div className="relative z-10 pr-2 text-right">
      <div className="text-[12px] font-black uppercase truncate leading-none" style={{color: athlete?.nama?.startsWith('Pemenang') ? '#9ca3af' : '#000'}}>{athlete?.nama || "TBD"}</div>
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
      
      {/* 2. Junction Fork - SVG PIXEL PERFECT */}
      <div className="w-[12mm] relative shrink-0 flex items-stretch border-box">
         <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0" preserveAspectRatio="none" viewBox="0 0 100 100" shapeRendering="crispEdges">
            {/* Centered fork for staggered look */}
            <path d="M -0.5,25 H 50 V 75 H -0.5 M 50,50 H 100.5" stroke="black" strokeWidth="1.5pt" fill="none" vectorEffect="non-scaling-stroke" strokeLinecap="square" />
         </svg>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-0.5 text-[10px] font-black z-[50] text-black" style={{ border: '1.5pt solid black', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
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
      {/* 1. Junction Fork - SVG PIXEL PERFECT */}
      <div className="w-[12mm] relative shrink-0 flex items-stretch border-box">
         <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0" preserveAspectRatio="none" viewBox="0 0 100 100" shapeRendering="crispEdges">
            {/* Centered fork for staggered look */}
            <path d="M 100.5,25 H 50 V 75 H 100.5 M 50,50 H -0.5" stroke="black" strokeWidth="1.5pt" fill="none" vectorEffect="non-scaling-stroke" strokeLinecap="square" />
         </svg>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-0.5 text-[10px] font-black z-[50] text-black" style={{ border: '1.5pt solid black', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
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
    <div className="bracket-page w-full min-h-[210mm] bg-white p-12 flex flex-col relative print:p-0">
      
      {/* HEADER PRINT */}
      <div className="w-full flex justify-between items-start mb-8 border-b-[3px] border-black pb-4 shrink-0">
        <div className="flex-1">
          <h1 className="text-2xl font-black uppercase tracking-widest text-black">
            {catName} <span className="mx-2 text-gray-400">|</span> {gen} <span className="mx-2 text-gray-400">|</span> {klst}
          </h1>
          <p className="text-sm font-bold text-gray-600 mt-2 uppercase tracking-widest">Official Bracket</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="bg-black text-white px-6 py-2 mb-2">
            <p className="text-xl font-black uppercase tracking-tighter italic leading-none">PRABU TKD</p>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-widest mt-1 text-black">Total: {totalCompetitors} Athletes</p>
          <p className="text-[8px] font-bold uppercase tracking-widest text-gray-500 mt-1">{new Date().toISOString().split('T')[0]}</p>
        </div>
      </div>
      
      {/* THE TREE */}
      <div className="flex-1 flex justify-center items-center w-full relative min-h-0 overflow-visible">
         {/* LEFT TREE */}
         <div className="flex-1 flex justify-end">
           {childrenMap.get((rootMatch.noPartai || "").toString().trim())?.[0] ? (
             <PrintTreeLeft matchId={childrenMap.get((rootMatch.noPartai || "").toString().trim())[0]} matchMap={matchMap} childrenMap={childrenMap} />
           ) : (
             <div className="flex items-center"><PrintAthleteLeft athlete={rootMatch.blue} /></div>
           )}
         </div>
         
         {/* CENTER FINAL */}
         <div className="flex-none z-10 relative flex items-center mx-1 h-full min-w-[30mm] border-box">
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100" shapeRendering="crispEdges">
              <line x1="-5" y1="50" x2="105" y2="50" stroke="black" strokeWidth="1.5pt" vectorEffect="non-scaling-stroke" />
            </svg>
            <div className="relative bg-white px-4 py-2 text-[12px] font-black z-[50] text-black mx-auto" style={{ border: '1.5pt solid black', WebkitPrintColorAdjust: 'exact', colorAdjust: 'exact' }}>
              {rootMatch.noPartai}
              <div className="absolute -top-7 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-widest text-black whitespace-nowrap">FINAL</div>
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

      {/* WINNER TABLE */}
      <div className="w-full shrink-0 mt-auto pt-8 flex justify-center">
        <table className="border-collapse border-[2px] border-black w-[600px] bg-white">
          <tbody>
            {['1ST PLACE', '2ND PLACE', '3RD PLACE', '3RD PLACE'].map((place, idx) => (
              <tr key={idx} className="border-b-[2px] border-black last:border-b-0">
                <td className="border-r-[2px] border-black bg-[#f3f4f6] py-2.5 px-4 w-44 text-[11px] font-black text-center text-black uppercase whitespace-nowrap">
                  {place}
                </td>
                <td className="py-2.5 px-3 w-full bg-white"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function Page() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Semua Kategori");

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${SCRIPT_URL}?sheet=Bagan_Tanding&t=${new Date().getTime()}`);
      const result = await response.json();
      const rawData = Array.isArray(result) ? result : (result.data || result["Bagan_Tanding"] || []);
      setData(rawData);
    } catch (error) {
      console.error("Fetch Error:", error);
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
      <header className="bg-[#191c24]/80 backdrop-blur-xl border-b border-[#2c2e33] p-4 sticky top-0 z-[100] no-print">
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
              onClick={() => window.print()}
              className="group flex items-center gap-3 bg-[#8f5fe8] text-white px-8 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-[#7a4cd1] transition-all shadow-[0_8px_30px_rgb(143,95,232,0.3)] active:scale-95"
            >
              <Printer size={16} className="group-hover:rotate-12 transition-transform" /> 
              Print PDF
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
                <div className="bg-white text-black shadow-2xl rounded-sm transition-transform duration-500 group-hover:scale-[1.01] w-full max-w-[297mm] mx-auto border border-gray-200">
                     <PrintGraphicBracket groupName={group.key} matches={group.matches} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* PRINT SECTION */}
      <div className="print-only-container hidden print:block">
        {groupedData.map((group, gIdx) => (
          <PrintGraphicBracket key={gIdx} groupName={group.key} matches={group.matches} />
        ))}
      </div>
      <style jsx global>{`
        :root {
          --bracket-stroke: 1.5pt;
        }

        .bracket-page {
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
            width: 277mm !important;
            height: 190mm !important;
            page-break-after: always !important;
            break-after: page !important;
            display: flex !important;
            flex-direction: column !important;
            background: white !important;
            padding: 10mm !important;
            margin: 0 auto !important;
            box-sizing: border-box !important;
            position: relative !important;
            transition: none !important;
          }

          * {
            box-sizing: border-box !important;
            transition: none !important;
          }

          .border-black, .border-[var(--bracket-stroke)], .border-b-[var(--bracket-stroke)], .border-y-[var(--bracket-stroke)], .border-r-[var(--bracket-stroke)], .border-l-[var(--bracket-stroke)], .border-b-[3pt] {
            border-width: var(--bracket-stroke) !important;
            border-color: black !important;
            border-style: solid !important;
          }

          .bg-black { background-color: black !important; }
        }
        
        /* Smooth Custom Scrollbar for Dashboard View */
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #191c24; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2c2e33; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #8f5fe8; }
      `}</style>
    </div>
  );
}
