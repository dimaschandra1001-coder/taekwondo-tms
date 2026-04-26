'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Trophy, 
  Activity, 
  RefreshCw,
  Table as TableIcon,
  ListFilter
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwc5-z0n860AsBB77KLHyYCxUNarnqcsH2GuAe5EiodL6DL44hS_de13x-N1W7hOqGvIA/exec";

export default function Page() {
  const [pesertaData, setPesertaData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`${SCRIPT_URL}?sheet=Peserta&t=${new Date().getTime()}`);
      const result = await response.json();
      const rawData = Array.isArray(result) ? result : (result.data || result.Peserta || []);
      setPesertaData([...rawData].reverse());
    } catch (error) {
      console.error("Dashboard Sync Error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalUniqueClubs = useMemo(() => {
    if (!pesertaData || pesertaData.length === 0) return 0;
    return new Set(
      pesertaData.map(p => (p.klub || p.club || p.Klub || p.Club || "").toString().trim().toLowerCase()).filter(Boolean)
    ).size;
  }, [pesertaData]);

  // TECHNICAL FIX: DYNAMIC LAPANGAN COUNTING
  const courtCount = useMemo(() => {
    if (!pesertaData || pesertaData.length === 0) return 0;
    return [...new Set(pesertaData.map(p => (p.lapangan || p.Lapangan || "").toString().trim()).filter(Boolean))].length;
  }, [pesertaData]);

  // RINGKASAN KATEGORI CALCULATIONS
  const countPra89 = pesertaData.filter(p => (p.kategori || "").toUpperCase().includes("8-9")).length;
  const countPra1011 = pesertaData.filter(p => (p.kategori || "").toUpperCase().includes("10-11")).length;
  const countCadet = pesertaData.filter(p => (p.kategori || "").toUpperCase().includes("CADET") && !(p.kategori || "").toUpperCase().includes("PRA")).length;
  const countJunior = pesertaData.filter(p => (p.kategori || "").toUpperCase().includes("JUNIOR")).length;

  const totalParticipants = pesertaData.length;

  if (!pesertaData) return null;

  return (
    <div className="space-y-8">
      
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight italic">Dashboard Bagan</h2>
          <p className="text-[#6c7293] text-xs font-bold uppercase tracking-widest mt-1">Manage Bagan Turnamen Taekwondo</p>
        </div>
        <div className="flex gap-3">
          <Link href="/peserta" className="bg-[#00d25b] text-white px-6 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-[#00b34d] transition-all flex items-center gap-2">
            <Users size={14} />
            Input Peserta
          </Link>
          <Link href="/generate" className="bg-[#8f5fe8] text-white px-6 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-[#7a4cd1] transition-all flex items-center gap-2">
            <Activity size={14} />
            Generate
          </Link>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Peserta Card */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-[#191c24] p-8 rounded-sm border border-[#2c2e33] shadow-sm group hover:border-[#00d25b] transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">{loading ? "..." : totalParticipants.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-[#6c7293] uppercase tracking-widest mt-1">Total Peserta</p>
            </div>
            <div className="p-3 rounded-md bg-black border border-[#2c2e33] text-[#00d25b]"><Users size={22} /></div>
          </div>
          <div className="mt-4 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#00d25b]" /><span className="text-[10px] text-[#6c7293] uppercase font-bold tracking-tighter">Live Status</span></div>
        </motion.div>

        {/* Total Club Card */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#191c24] p-8 rounded-sm border border-[#2c2e33] shadow-sm group hover:border-[#ffab00] transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">{loading ? "..." : totalUniqueClubs.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-[#6c7293] uppercase tracking-widest mt-1">Total Club</p>
            </div>
            <div className="p-3 rounded-md bg-black border border-[#2c2e33] text-[#ffab00]"><Trophy size={22} /></div>
          </div>
          <div className="mt-4 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#ffab00]" /><span className="text-[10px] text-[#6c7293] uppercase font-bold tracking-tighter">Live Status</span></div>
        </motion.div>

        {/* Ringkasan Kategori Card */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#191c24] p-6 rounded-sm border border-[#2c2e33] shadow-sm group hover:border-[#fc424a] transition-all">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black text-[#6c7293] uppercase tracking-widest">Ringkasan Kategori</p>
            <ListFilter size={14} className="text-[#fc424a]" />
          </div>
          <div className="space-y-1.5">
            {[
              { label: 'PRA CADET 8-9', count: countPra89 },
              { label: 'PRA CADET 10-11', count: countPra1011 },
              { label: 'CADET', count: countCadet },
              { label: 'JUNIOR', count: countJunior }
            ].map((cat, i) => (
              <div key={i} className="flex justify-between items-center border-b border-[#2c2e33]/50 pb-1 last:border-0 leading-tight">
                <span className="text-xs font-bold text-[#6c7293] uppercase tracking-tighter">{cat.label}</span>
                <span className="text-xs font-black text-white italic">{cat.count} <span className="text-[9px] text-[#6c7293] not-italic">Peserta</span></span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Lapangan Card */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#191c24] p-8 rounded-sm border border-[#2c2e33] shadow-sm group hover:border-[#0090e7] transition-all">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-white">{loading ? "..." : courtCount.toLocaleString()}</p>
              <p className="text-[10px] font-bold text-[#6c7293] uppercase tracking-widest mt-1">Lapangan</p>
            </div>
            <div className="p-3 rounded-md bg-black border border-[#2c2e33] text-[#0090e7]"><Activity size={22} /></div>
          </div>
          <div className="mt-4 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-[#0090e7]" /><span className="text-[10px] text-[#6c7293] uppercase font-bold tracking-tighter">Live Status</span></div>
        </motion.div>

      </div>

      {/* RECENT ATHLETES TABLE */}
      <div className="bg-[#191c24] border border-[#2c2e33] rounded-sm overflow-hidden shadow-xl">
        <div className="p-6 border-b border-[#2c2e33] flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black border border-[#2c2e33] text-[#0090e7] rounded-md"><TableIcon size={16} /></div>
            <h4 className="text-sm font-bold text-white uppercase tracking-tight italic">Table Peserta</h4>
          </div>
          <button onClick={fetchData} disabled={refreshing} className="flex items-center gap-2 bg-[#191c24] border border-[#2c2e33] text-[#6c7293] px-4 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">
            <RefreshCw size={14} className={refreshing ? "animate-spin text-[#00d25b]" : ""} />
            Refresh
          </button>
        </div>
        
        <div className="max-h-[500px] overflow-y-auto overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="sticky top-0 z-10 bg-[#191c24]">
              <tr className="bg-black text-[#6c7293] border-b border-[#2c2e33]">
                <th className="px-6 py-5 font-black uppercase tracking-widest">Nama Atlet</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest">Klub</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest">Gender</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest">Kategori</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest text-center">Umur</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest text-center">Kelas Tanding</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest text-center">Sistem Scoring</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest text-center">Status Bagan</th>
                <th className="px-6 py-5 font-black uppercase tracking-widest text-right">Lapangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2c2e33]">
              {loading ? (
                <tr><td colSpan={9} className="px-8 py-20 text-center text-[#6c7293] uppercase font-black tracking-widest italic animate-pulse">Syncing Cloud Database...</td></tr>
              ) : pesertaData.length === 0 ? (
                <tr><td colSpan={9} className="px-8 py-20 text-center text-[#6c7293] uppercase font-black tracking-widest italic">Belum ada data atlet terdaftar.</td></tr>
              ) : (
                pesertaData.map((atlet, i) => {
                  const hasBagan = (atlet.status_bagan || atlet["status bagan"] || "").toLowerCase() === "sudah" || (atlet.no_partai || atlet.noPartai || "") !== "";
                  return (
                    <tr key={i} className="hover:bg-black/30 transition-colors group">
                      <td className="px-6 py-4 font-bold text-white group-hover:text-[#00d25b] transition-colors">{atlet["nama atlet"] || atlet.nama}</td>
                      <td style={{ color: '#FFFFFF', opacity: 1 }} className="px-6 py-4">{atlet.klub || atlet.club || atlet.Klub || atlet.Club || ""}</td>
                      <td style={{ color: '#FFFFFF', opacity: 1 }} className="px-6 py-4 uppercase text-[10px]">{atlet.gender}</td>
                      <td style={{ color: '#FFFFFF', opacity: 1 }} className="px-6 py-4 text-[10px] font-bold uppercase">{atlet.kategori}</td>
                      <td style={{ color: '#FFFFFF', opacity: 1 }} className="px-6 py-4 text-center">{atlet.umur}</td>
                      <td style={{ color: '#FFFFFF', opacity: 1 }} className="px-6 py-4 text-center">
                        {atlet["kelas tanding"] || atlet.kelastanding}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-[2px] text-[10px] font-black uppercase tracking-tighter ${(atlet["sistem scoring"] || atlet.scoring) === 'DSS' ? 'bg-[#0090e7]/10 text-[#0090e7]' : 'bg-[#00d25b]/10 text-[#00d25b]'}`}>
                          {atlet["sistem scoring"] || atlet.scoring}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {hasBagan ? (
                          <span style={{ color: '#00d25b' }} className="text-[10px] font-black uppercase italic">Sudah</span>
                        ) : (
                          <span style={{ color: '#fc424a' }} className="text-[10px] font-black uppercase italic">Belum</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-white font-bold">{atlet.lapangan}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-[10px] text-[#6c7293] font-black uppercase tracking-[0.6em] opacity-30 italic">
          Corona Modern Vertical &bull; Automated Dashboard &bull; 2026
        </p>
      </div>

    </div>
  );
}
