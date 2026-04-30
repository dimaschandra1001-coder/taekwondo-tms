'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, 
  Table as TableIcon, 
  ShieldCheck, 
  Zap,
  Loader2,
  Users,
  Trophy,
  Activity,
  CheckCircle2,
  GitMerge,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwc5-z0n860AsBB77KLHyYCxUNarnqcsH2GuAe5EiodL6DL44hS_de13x-N1W7hOqGvIA/exec";

// --- MAIN PAGE COMPONENT ---

export default function Page() {
  const [pesertaData, setPesertaData] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Helper: fetch with 15s timeout to prevent permanent loading
      const fetchWithTimeout = (url: string, ms = 15000) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), ms);
        return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timer));
      };

      // 1. Fetch Peserta (Source of truth for "Sudah" vs "Belum")
      const resPeserta = await fetchWithTimeout(`${SCRIPT_URL}?sheet=Peserta&t=${new Date().getTime()}`);
      const resultPeserta = await resPeserta.json();
      const rawData = Array.isArray(resultPeserta) ? resultPeserta : (resultPeserta.data || resultPeserta.Peserta || []);
      setPesertaData(rawData);
      
      // 2. Fetch Bagan_Tanding (primary source for full bracket tree)
      try {
        const resBagan = await fetchWithTimeout(`${SCRIPT_URL}?sheet=Bagan_Tanding&t=${new Date().getTime()}`);
        const resultBagan = await resBagan.json();
        const rawBagan = Array.isArray(resultBagan) ? resultBagan : (resultBagan.data || resultBagan.Bagan_Tanding || []);
        
        if (rawBagan.length > 0) {
          const loadedMatches = rawBagan.map((row: any) => ({
            // doGet() lowercases ALL headers, so keys come as "no. partai", "nama atlet 1", etc.
            noPartai: row["no. partai"] || row["No. Partai"] || row.no_partai || row["No_Partai"] || "",
            court: (row["arena"] || row["Arena"] || "").replace("LAPANGAN ", "").replace("lapangan ", "").trim(),
            kategori: row["kategori"] || row["Kategori"] || "",
            gender: row["gender"] || row["Gender"] || "",
            kelas: row["kelas tanding"] || row["Kelas Tanding"] || row.kelas_tanding || "",
            blue: {
              nama: row["nama atlet 1"] || row["Nama Atlet 1"] || row.nama_atlet_1 || "",
              klub: row["club 1"] || row["Club 1"] || row.club_1 || "-"
            },
            red: {
              nama: row["nama atlet 2"] || row["Nama Atlet 2"] || row.nama_atlet_2 || "",
              klub: row["club 2"] || row["Club 2"] || row.club_2 || "-",
              isBye: (row["nama atlet 2"] || row["Nama Atlet 2"] || row.nama_atlet_2 || "").toUpperCase() === "BYE"
            },
            isExisting: true
          })).filter((m: any) => m.noPartai !== "");
          
          setMatches(loadedMatches);
          console.log(`[FETCH] Loaded ${loadedMatches.length} matches from Bagan_Tanding`);
        } else {
          // FALLBACK: Bagan_Tanding is empty, reconstruct from Peserta (Status Bagan = Sudah)
          console.warn("[FETCH] Bagan_Tanding empty, reconstructing from Peserta...");
          const existingMatchMap: Record<string, any> = {};
          rawData.forEach((p: any) => {
            const status = (p["status bagan"] || p.status_bagan || p["Status Bagan"] || "").toString().toUpperCase();
            if (status === "SUDAH") {
              const nr = p["no. partai"] || p.no_partai || p["No. Partai"] || p["No_Partai"] || "";
              if (!nr) return;
              if (!existingMatchMap[nr]) {
                existingMatchMap[nr] = {
                  noPartai: nr,
                  blue: null, red: null,
                  court: nr.startsWith('B') ? 'B' : 'A',
                  kategori: p.kategori || "",
                  kelas: p["kelas tanding"] || p.kelastanding || "",
                  gender: p.gender || "",
                  isExisting: true
                };
              }
              if (!existingMatchMap[nr].blue) existingMatchMap[nr].blue = { nama: p["nama atlet"] || p.nama || "", klub: p.klub || p.club || "-" };
              else existingMatchMap[nr].red = { nama: p["nama atlet"] || p.nama || "", klub: p.klub || p.club || "-" };
            }
          });
          const reconstructed = Object.values(existingMatchMap).map((m: any) => {
            if (!m.red) m.red = { nama: "BYE", klub: "-", isBye: true };
            return m;
          }).sort((a: any, b: any) => a.noPartai.localeCompare(b.noPartai));
          setMatches(reconstructed);
          console.log(`[FETCH] Reconstructed ${reconstructed.length} matches from Peserta fallback`);
        }
      } catch (err) {
        console.warn("[FETCH] Bagan_Tanding fetch failed.", err);
        setMatches([]);
      }

    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!pesertaData) return null;

  const totalParticipants = pesertaData.length;
  const totalUniqueClubs = useMemo(() => {
    if (!pesertaData || pesertaData.length === 0) return 0;
    return new Set(pesertaData.map(p => (p.klub || p.club || p.Klub || "").toString().trim().toLowerCase()).filter(Boolean)).size;
  }, [pesertaData]);

  const groupedMatches = useMemo(() => {
    const groups: Record<string, any[]> = {};
    matches.forEach(m => {
      const key = `${m.kategori} | ${m.gender} | ${m.kelas}`.toUpperCase();
      if(!groups[key]) groups[key] = [];
      groups[key].push(m);
    });
    return groups;
  }, [matches]);

  const handleGenerateBracket = async () => {
    if (generating) return;
    setGenerating(true);

    try {
      setGenerating(true);
      
      // 1. FRESH FETCH: Get latest athletes AND latest matches from server
      const [resPeserta, resMatches] = await Promise.all([
        fetch(`${SCRIPT_URL}?sheet=Peserta&t=${new Date().getTime()}`),
        fetch(`${SCRIPT_URL}?sheet=Bagan_Tanding&t=${new Date().getTime()}`)
      ]);
      
      const resultPeserta = await resPeserta.json();
      const resultMatches = await resMatches.json();

      const rawPeserta = Array.isArray(resultPeserta) ? resultPeserta : (resultPeserta.data || resultPeserta.Peserta || []);
      const rawMatches = Array.isArray(resultMatches) ? resultMatches : (resultMatches.data || resultMatches.Bagan_Tanding || []);

      const newPeserta = rawPeserta.filter((p: any) => {
        const nama = (p["nama atlet"] || p["nama"] || p["Nama Atlet"] || p["Nama"] || "").toString().trim().toUpperCase();
        return nama && nama !== "BYE" && nama !== "-" && !nama.startsWith("PEMENANG");
      });

      // Map raw matches to our internal format
      const currentMatches = rawMatches.map((m: any) => ({
        noPartai: m["no. partai"] || m["No. Partai"],
        court: (m.arena || m.Arena || "").replace("LAPANGAN ", ""),
        kategori: m.kategori || m.Kategori,
        gender: m.gender || m.Gender,
        kelas: m["kelas tanding"] || m["Kelas Tanding"],
        blue: { nama: m["nama atlet 1"] || m["Nama Atlet 1"], klub: m["club 1"] || m["Club 1"] },
        red: { nama: m["nama atlet 2"] || m["Nama Atlet 2"], klub: m["club 2"] || m["Club 2"], isBye: (m["nama atlet 2"] || "").toUpperCase() === "BYE" },
        isExisting: true
      }));

      // Helpers
      const gName = (p: any): string => p ? (p["nama atlet"] || p["nama"] || p["Nama Atlet"] || p["Nama"] || "").toString().trim().toUpperCase() : "";
      const gKlub = (p: any): string => p ? (p["klub"] || p["club"] || p["Klub"] || p["Club"] || "-").toString().trim().toUpperCase() : "-";
      const gKey = (p: any): string => {
        const cat  = (p.kategori || p["kategori"] || "-").toString().trim().toUpperCase();
        const gen  = (p.gender || p["gender"] || "-").toString().trim().toUpperCase();
        const klst = (p["kelas tanding"] || p.kelastanding || p["Kelas Tanding"] || "-").toString().trim().toUpperCase();
        return `${cat}|${gen}|${klst}`;
      };

      const athletesByCategory: Record<string, any[]> = {};
      const newcomersByCategory: Record<string, any[]> = {};
      
      newPeserta.forEach((p: any) => {
        const key = gKey(p);
        if (!athletesByCategory[key]) athletesByCategory[key] = [];
        athletesByCategory[key].push(p);

        const status = (p["status bagan"] || p.status_bagan || p["Status Bagan"] || "").toString().toUpperCase();
        if (status !== "SUDAH") {
          if (!newcomersByCategory[key]) newcomersByCategory[key] = [];
          newcomersByCategory[key].push(p);
        }
      });

      const BYE_ATHLETE = { nama: "BYE", klub: "-", isBye: true };
      let finalizedMatches = [...currentMatches];
      let matchFilledCount = 0;
      let categoriesReshuffled = 0;

      // Determine starting match numbers for A and B
      let maxNumA = 0; let maxNumB = 0;
      finalizedMatches.forEach(m => {
        const numPart = parseInt(m.noPartai?.replace(/[^\d]/g, '') || "0");
        if (m.noPartai?.startsWith("A")) maxNumA = Math.max(maxNumA, numPart);
        if (m.noPartai?.startsWith("B")) maxNumB = Math.max(maxNumB, numPart);
      });

      Object.keys(athletesByCategory).forEach(groupKey => {
        const allInCat = athletesByCategory[groupKey];
        const newcomers = newcomersByCategory[groupKey] || [];
        const parts = groupKey.split('|');
        const catName = parts[0];
        const gen     = parts[1];
        const klst    = parts[2];

        // Required Power-of-Two bracket size (STRICT LOGIC for N=9 -> S=16)
        // Required Power-of-Two bracket size (STRICT LOGIC for N=9 -> S=16)
        const N = allInCat.length;
        const requiredS = Math.pow(2, Math.ceil(Math.log2(Math.max(N, 2))));
        
        console.log(`[DEBUG] Category: ${groupKey} | N: ${N} | S: ${requiredS}`);

        // Find existing matches for this category
        const existingForCat = finalizedMatches.filter(m => 
          (m.kategori || "").toString().trim().toUpperCase() === catName &&
          (m.gender || "").toString().trim().toUpperCase() === gen &&
          (m.kelas || "").toString().trim().toUpperCase() === klst
        );

        // Calculate current bracket size from match count
        const existingS = existingForCat.length > 0 ? Math.pow(2, Math.ceil(Math.log2(existingForCat.length + 1))) : 0;

        let canFillAll = false;
        
        // Logic: ONLY try to fill BYE if:
        // 1. A bracket already exists
        // 2. Its size (S) is already enough for the new count N
        // 3. We actually have newcomers to add
        if (existingS === requiredS && newcomers.length > 0) {
          const numR1 = requiredS / 2;
          const actualR1 = existingForCat.slice(0, numR1);
          let availableSlots: { matchNo: string, side: 'blue' | 'red' }[] = [];
          
          actualR1.forEach(m => {
            if (m.blue?.nama?.toUpperCase() === "BYE") availableSlots.push({ matchNo: m.noPartai, side: 'blue' });
            if (m.red?.nama?.toUpperCase() === "BYE") availableSlots.push({ matchNo: m.noPartai, side: 'red' });
          });

          if (availableSlots.length >= newcomers.length) {
            newcomers.forEach((newbie, idx) => {
              const slot = availableSlots[idx];
              const target = finalizedMatches.find(m => m.noPartai === slot.matchNo);
              if (target) {
                target[slot.side] = { nama: gName(newbie), klub: gKlub(newbie), isBye: false, _raw: newbie };
                target.isExisting = false;
                matchFilledCount++;
              }
            });
            canFillAll = true;
          }
        }

        // Trigger full re-generate if:
        // - No bracket exists yet
        // - OR bracket size is too small (Upscale needed)
        // - OR we have newcomers but couldn't fill them into BYE slots
        const needsUpscale = existingForCat.length > 0 && existingS < requiredS;
        const needsInitial = existingForCat.length === 0;
        const hasNewcomersButNoBYE = newcomers.length > 0 && !canFillAll;

        if (needsInitial || needsUpscale || hasNewcomersButNoBYE) {
          categoriesReshuffled++;
          // REMOVE OLD MATCHES
          finalizedMatches = finalizedMatches.filter(m => 
            !((m.kategori || "").toString().trim().toUpperCase() === catName &&
              (m.gender || "").toString().trim().toUpperCase() === gen &&
              (m.kelas || "").toString().trim().toUpperCase() === klst)
          );

          const isPraCadet = catName.includes("PRA CADET");
          const arenaPrefix = isPraCadet ? "A" : "B";
          let currentNum = arenaPrefix === "A" ? maxNumA : maxNumB;

          const shuffled = [...allInCat].sort(() => Math.random() - 0.5);
          const targetBye = requiredS - N;

          let pool = shuffled.map(a => ({ nama: gName(a), klub: gKlub(a), isBye: false, _raw: a }));
          let prevRound: any[] = [];
          
          while (pool.length > targetBye) {
            const b = pool.shift();
            const r = pool.shift();
            currentNum++;
            const mObj = {
              noPartai: `${arenaPrefix}${String(currentNum).padStart(3, '0')}`,
              blue: b, red: r, court: arenaPrefix, kategori: catName, kelas: klst, gender: gen, isExisting: false, isBye: false
            };
            finalizedMatches.push(mObj);
            prevRound.push(mObj);
          }
          while (pool.length > 0) {
            const b = pool.shift();
            currentNum++;
            const mObj = {
              noPartai: `${arenaPrefix}${String(currentNum).padStart(3, '0')}`,
              blue: b, red: { ...BYE_ATHLETE }, court: arenaPrefix, kategori: catName, kelas: klst, gender: gen, isExisting: false, isBye: true
            };
            finalizedMatches.push(mObj);
            prevRound.push(mObj);
          }

          while (prevRound.length > 1) {
            const nextRound = [];
            for (let i = 0; i < prevRound.length; i += 2) {
              const m1 = prevRound[i];
              const m2 = prevRound[i + 1];
              currentNum++;
              const bName = m1.isBye ? m1.blue.nama : `Pemenang ${m1.noPartai}`;
              const rName = m2.isBye ? m2.blue.nama : `Pemenang ${m2.noPartai}`;
              const mObj = {
                noPartai: `${arenaPrefix}${String(currentNum).padStart(3, '0')}`,
                blue: { nama: bName, klub: m1.isBye ? m1.blue.klub : "-" },
                red:  { nama: rName, klub: m2.isBye ? m2.blue.klub : "-" },
                court: arenaPrefix, kategori: catName, kelas: klst, gender: gen, isExisting: false, isBye: false
              };
              finalizedMatches.push(mObj);
              nextRound.push(mObj);
            }
            prevRound = nextRound;
          }
          if (arenaPrefix === "A") maxNumA = currentNum;
          else maxNumB = currentNum;
        }
      });

      // --- GLOBAL TOURNAMENT SORTING & RE-INDEXING PASS ---
      
      // Helper: Priority for Categories
      const getCatPriority = (cat: string) => {
        const c = cat.toUpperCase();
        if (c.includes("PRA CADET")) return 1;
        if (c.includes("CADET")) return 2;
        if (c.includes("JUNIOR")) return 3;
        if (c.includes("SENIOR")) return 4;
        return 99;
      };

      // Helper: Priority for Gender
      const getGenPriority = (gen: string) => {
        const g = gen.toUpperCase();
        if (g.includes("FEMALE") || g.includes("PUTRI") || g.includes("PI")) return 1;
        return 2; // Male/Putra
      };

      // Helper: Numeric Weight for Sorting
      const getWeightValue = (kls: string) => {
        const match = kls.match(/\d+/);
        return match ? parseInt(match[0]) : 999;
      };

      // 1. Group matches by Arena
      const arenaMatches: Record<string, any[]> = {};
      finalizedMatches.forEach(m => {
        if (!arenaMatches[m.court]) arenaMatches[m.court] = [];
        arenaMatches[m.court].push(m);
      });

      const oldToNewMap: Record<string, string> = {};
      const fullyReindexed: any[] = [];

      Object.keys(arenaMatches).sort().forEach(arena => {
        const matchesInArena = arenaMatches[arena];
        
        // 2. SORT matches in this arena based on Official Standards
        matchesInArena.sort((a, b) => {
          // A. Priority by Category
          const pCatA = getCatPriority(a.kategori || "");
          const pCatB = getCatPriority(b.kategori || "");
          if (pCatA !== pCatB) return pCatA - pCatB;

          // B. Priority by Gender
          const pGenA = getGenPriority(a.gender || "");
          const pGenB = getGenPriority(b.gender || "");
          if (pGenA !== pGenB) return pGenA - pGenB;

          // C. Priority by Weight
          const pWgtA = getWeightValue(a.kelas || "");
          const pWgtB = getWeightValue(b.kelas || "");
          if (pWgtA !== pWgtB) return pWgtA - pWgtB;

          // D. Preserve internal bracket order (partai number is a good proxy for round)
          // Since they were generated in order, we can trust the current index or original ID string
          return 0; 
        });
        
        // 3. Assign New IDs (A001, A002...)
        matchesInArena.forEach((m, idx) => {
          const oldId = m.noPartai;
          const newId = `${arena}${String(idx + 1).padStart(3, '0')}`;
          oldToNewMap[oldId] = newId;
          m.noPartai = newId;
          m.isExisting = false;
        });
        
        fullyReindexed.push(...matchesInArena);
      });

      // 4. Update "Pemenang X" references to point to new IDs
      fullyReindexed.forEach(m => {
        ["blue", "red"].forEach(side => {
          const sideObj = (m as any)[side];
          if (sideObj && sideObj.nama && sideObj.nama.startsWith("Pemenang ")) {
            const oldRef = sideObj.nama.replace("Pemenang ", "").trim();
            if (oldToNewMap[oldRef]) {
              sideObj.nama = `Pemenang ${oldToNewMap[oldRef]}`;
            }
          }
        });
      });

      setMatches(fullyReindexed);
      let finalMsg = "✅ Penomoran Standar Turnamen Selesai!";
      if (matchFilledCount > 0) finalMsg += `\n- ${matchFilledCount} peserta dimasukkan ke slot BYE.`;
      if (categoriesReshuffled > 0) finalMsg += `\n- ${categoriesReshuffled} kategori di-generate ulang.`;
      finalMsg += "\n\n⚠️ Urutan: Pra-Cadet -> Senior | Putri -> Putra | Ringan -> Berat.";
      finalMsg += "\n⚠️ Klik 'SIMPAN KE DATABASE' sekarang!";
      alert(finalMsg);

    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveToDatabase = async () => {
    if (matches.length === 0 || saving) return;
    setSaving(true);
    
    try {
        const newMatches = matches.filter(m => !m.isExisting);
        if (newMatches.length === 0) {
            alert("Tidak ada jadwal baru untuk disimpan.");
            setSaving(false); return;
        }

        // Helper: extract name & club from athlete object regardless of key format
        // doGet() lowercases all headers, so "Nama Atlet" → "nama atlet", "Klub" → "klub", etc.
        const getName = (p: any): string => {
            if (!p) return "";
            return p["nama atlet"] || p["nama"] || p["Nama Atlet"] || p["Nama"] || p.nama || "";
        };
        const getKlub = (p: any): string => {
            if (!p) return "-";
            return p["klub"] || p["club"] || p["Klub"] || p["Club"] || p.klub || p.club || "-";
        };

        // 1. Build Peserta Payload (only first-round real athletes)
        const pesertaUpdates: any[] = [];
        newMatches.forEach(match => {
            const blueNama = getName(match.blue);
            const redNama  = getName(match.red);

            const isBlueReal = blueNama && !blueNama.toLowerCase().startsWith("pemenang") && blueNama.toUpperCase() !== "BYE";
            const isRedReal  = redNama  && !redNama.toLowerCase().startsWith("pemenang")  && redNama.toUpperCase()  !== "BYE" && !match.red?.isBye;

            if (isBlueReal) {
                pesertaUpdates.push({
                    "Nama": blueNama,
                    "Lapangan": `LAPANGAN ${match.court}`,
                    "No. Partai": match.noPartai,
                    "Status Bagan": "Sudah"
                });
            }
            if (isRedReal) {
                pesertaUpdates.push({
                    "Nama": redNama,
                    "Lapangan": `LAPANGAN ${match.court}`,
                    "No. Partai": match.noPartai,
                    "Status Bagan": "Sudah"
                });
            }
        });

        console.log(`[SAVE] Peserta payload (${pesertaUpdates.length} rows):`, JSON.stringify(pesertaUpdates, null, 2));

        if (pesertaUpdates.length === 0) {
            throw new Error("Tidak ada data atlet yang valid. Pastikan nama atlet terisi di sheet Peserta.");
        }

        // 2. Build Bagan Tanding Payload (ALL matches, overwrite mode)
        const baganTandingUpdates = matches.map(match => {
          const b1 = getName(match.blue);
          const b2 = match.red?.isBye ? "BYE" : getName(match.red);
          const c1 = getKlub(match.blue);
          const c2 = match.red?.isBye ? "-" : getKlub(match.red);

          return {
            "No. Partai": match.noPartai,
            "Arena": `LAPANGAN ${match.court}`,
            "Kategori": match.kategori,
            "Gender": match.gender,
            "Kelas Tanding": match.kelas,
            "Nama Atlet 1": b1,
            "Nama Atlet 2": b2,
            "Club 1": c1,
            "Club 2": c2
          };
        });

        console.log(`[SAVE] Bagan_Tanding payload (${baganTandingUpdates.length} rows):`, JSON.stringify(baganTandingUpdates.slice(0, 3), null, 2));

        // 3. STEP 1: Update Peserta sheet FIRST
        console.log("[SAVE] Step 1: Writing to Peserta sheet...");
        const res1 = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'batchUpdatePartai', sheet: 'Peserta', updates: pesertaUpdates })
        });
        const d1 = await res1.json();
        console.log("[SAVE] Peserta response:", d1);
        if (d1.status !== 'success') {
            throw new Error(`Sheet Peserta gagal diupdate: ${d1.error || JSON.stringify(d1)}`);
        }

        // 4. STEP 2: Overwrite Bagan_Tanding sheet ONLY after Peserta succeeds
        console.log("[SAVE] Step 2: Writing to Bagan_Tanding sheet...");
        const res2 = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'batchUpdatePartai', sheet: 'Bagan_Tanding', mode: 'overwrite', cleanup: true, updates: baganTandingUpdates })
        });
        const d2 = await res2.json();
        console.log("[SAVE] Bagan_Tanding response:", d2);
        if (d2.status !== 'success') {
            throw new Error(`Sheet Bagan_Tanding gagal diupdate: ${d2.error || JSON.stringify(d2)}`);
        }

        // 5. SUCCESS: Both sheets confirmed. Keep local state & mark all as saved.
        setSuccess(true);
        setTimeout(() => setSuccess(false), 5000);
        // Mark all as existing WITHOUT re-fetching (avoids double-loading).
        // User can click Refresh to re-sync manually.
        setMatches(prev => prev.map(m => ({...m, isExisting: true})));

    } catch (error: any) {
        console.error("[SAVE] Save failed:", error);
        alert(`❌ Gagal menyimpan ke database:\n\n${error.message}\n\nCek Console (F12) untuk detail.`);
    } finally {
        setSaving(false);
    }
  };

  const handleResetData = async () => {
    if (!confirm("⚠️ PERINGATAN! Ini akan MENGHAPUS SEMUA JADWAL di Bagan_Tanding dan mereset status peserta menjadi 'Belum'. Lanjutkan?")) return;
    setSaving(true);
    try {
      const res = await fetch(SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({ action: 'reset_all' })
      });
      const data = await res.json();
      if (data.status === 'success') {
        alert("✅ Database berhasil di-reset!");
        setMatches([]);
        fetchData();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      alert("❌ Gagal reset database: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-10 pb-32">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#191c24] p-8 rounded-sm border border-[#2c2e33] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#0090e7] opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        
        <div className="relative z-10">
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Graphic Bracket Engine</h1>
          <p className="text-[#6c7293] text-sm mt-2 max-w-xl font-medium">Sistem kecerdasan buatan untuk mengolah data atlet menjadi Graphic Bracket eliminasi tunggal secara sentral. Mendukung official BYE otomatis.</p>
          <div className="mt-4 flex gap-4">
             <Link href="/cetak" className="text-[#ffab00] text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:underline">
               <Printer size={12} /> Buka Halaman Cetak →
             </Link>
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <button onClick={fetchData} disabled={loading} className="p-4 bg-black border border-[#2c2e33] rounded-sm text-[#6c7293] hover:text-white hover:border-[#00d25b] transition-all disabled:opacity-50 group">
            <RefreshCw size={20} className={loading ? "animate-spin text-[#00d25b]" : "group-hover:text-[#00d25b] transition-colors"} />
          </button>
          <button onClick={handleResetData} disabled={saving || loading} className="flex items-center gap-2 bg-[#fc424a] text-white px-6 py-4 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-[#d6343c] transition-all disabled:opacity-20 shadow-[0_0_20px_rgba(252,66,74,0.2)]">
            Reset Data
          </button>
          <button onClick={handleGenerateBracket} disabled={generating || loading} className="flex items-center gap-3 bg-[#0090e7] text-white px-8 py-4 rounded-sm text-xs font-black uppercase tracking-widest hover:bg-[#0070b5] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(0,144,231,0.3)]">
            {generating ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />} Generate Full Bracket
          </button>
          <button onClick={handleSaveToDatabase} disabled={saving || loading || matches.filter(m => !m.isExisting).length === 0} className="flex items-center gap-3 bg-[#00d25b] text-white px-8 py-4 rounded-sm text-xs font-black uppercase tracking-widest hover:bg-[#00b34d] transition-all disabled:opacity-20 shadow-[0_0_20px_rgba(0,210,91,0.2)]">
            {saving ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />} Simpan ke Database
          </button>
        </div>
      </div>

      {/* INFORMATION WIDGETS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#191c24] p-8 rounded-sm border border-[#2c2e33] shadow-sm">
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-bold text-white">{loading ? "..." : totalParticipants}</p><p className="text-[10px] font-bold text-[#6c7293] uppercase tracking-widest mt-1">Peserta Terdaftar</p></div>
            <div className="p-3 rounded-md bg-black border border-[#2c2e33] text-[#00d25b]"><Users size={22} /></div>
          </div>
        </div>

        <div className="bg-[#191c24] p-8 rounded-sm border border-[#2c2e33] shadow-sm">
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-bold text-white">{loading ? "..." : totalUniqueClubs}</p><p className="text-[10px] font-bold text-[#6c7293] uppercase tracking-widest mt-1">Total Kontingen</p></div>
            <div className="p-3 rounded-md bg-black border border-[#2c2e33] text-[#ffab00]"><Trophy size={22} /></div>
          </div>
        </div>

        <div className="bg-[#191c24] p-8 rounded-sm border border-[#2c2e33] shadow-sm">
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-bold text-white">{matches.length}</p><p className="text-[10px] font-bold text-[#6c7293] uppercase tracking-widest mt-1">Total Pertandingan</p></div>
            <div className="p-3 rounded-md bg-black border border-[#2c2e33] text-[#0090e7]"><Activity size={22} /></div>
          </div>
        </div>
        
        <div className="bg-[#191c24] p-8 rounded-sm border border-[#2c2e33] shadow-sm">
          <div className="flex items-center justify-between">
            <div><p className="text-2xl font-bold text-white">{Object.keys(groupedMatches).length}</p><p className="text-[10px] font-bold text-[#6c7293] uppercase tracking-widest mt-1">Total Kategori</p></div>
            <div className="p-3 rounded-md bg-black border border-[#2c2e33] text-[#8f5fe8]"><GitMerge size={22} /></div>
          </div>
        </div>
      </div>

      {/* LIVE MATCH BOARD TABLE */}
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-8">
            <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-[#2c2e33]"></div>
            <div className="flex items-center gap-3">
               <div className="p-2 bg-[#191c24] border border-[#2c2e33] text-[#0090e7] rounded-md shadow-lg"><TableIcon size={16} /></div>
               <h4 className="text-lg font-black text-white uppercase tracking-tighter italic">Match Information Board (Live)</h4>
            </div>
            <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-[#2c2e33]"></div>
        </div>

        {matches.length === 0 ? (
          <div className="bg-[#191c24] border border-[#2c2e33] rounded-sm p-24 text-center">
            <TableIcon size={48} className="text-[#2c2e33] mx-auto mb-6" />
            <p className="text-[#6c7293] uppercase font-black tracking-widest italic">Belum ada jadwal pertandingan.</p>
            <p className="text-sm text-[#6c7293] mt-2">Klik 'Generate Full Bracket' untuk membuat papan informasi.</p>
          </div>
        ) : (
          <div className="bg-[#191c24] border border-[#2c2e33] rounded-sm shadow-2xl overflow-hidden relative">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-black text-[#6c7293] border-b-2 border-[#2c2e33] text-[10px] uppercase tracking-widest font-black sticky top-0 z-20">
                    <th className="px-8 py-5">No. Partai</th>
                    <th className="px-8 py-5">Kategori / Kelas</th>
                    <th className="px-8 py-5 text-center">Sudut Biru</th>
                    <th className="px-8 py-5 text-center">VS</th>
                    <th className="px-8 py-5 text-center">Sudut Merah</th>
                    <th className="px-8 py-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2c2e33]/50">
                  {matches.map((m: any, i: number) => {
                    const bName = m.blue?.nama || "TBD";
                    const rName = m.red?.nama || "TBD";
                    const isBye = m.red?.isBye || bName === "BYE" || rName === "BYE";
                    
                    return (
                      <tr key={i} className={`hover:bg-black/40 transition-colors group ${isBye ? 'opacity-60' : ''}`}>
                        <td className="px-8 py-4">
                          <div className="flex flex-col">
                            <span className="font-black text-white text-base tracking-tighter">{m.noPartai}</span>
                            <span className="text-[9px] text-[#0090e7] font-bold uppercase tracking-widest mt-1">Lapangan {m.court}</span>
                          </div>
                        </td>
                        <td className="px-8 py-4">
                           <div className="flex flex-col">
                              <span className="text-white font-bold text-sm uppercase">{m.kategori}</span>
                              <span className="text-[10px] text-[#6c7293] font-bold uppercase tracking-widest mt-1">{m.gender} - {m.kelas}</span>
                           </div>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-[#0090e7] uppercase" style={{color: bName.startsWith('Pemenang') ? '#6c7293' : '#0090e7'}}>{bName}</span>
                            <span className="text-[10px] text-white/60 font-bold uppercase mt-1">{m.blue?.klub || "-"}</span>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <div className="w-8 h-8 rounded-full bg-black border border-[#2c2e33] flex items-center justify-center mx-auto shadow-inner">
                            <span className="text-[10px] font-black text-[#ffab00] italic">VS</span>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-[#fc424a] uppercase" style={{color: rName.startsWith('Pemenang') ? '#6c7293' : '#fc424a'}}>{rName}</span>
                            <span className="text-[10px] text-white/60 font-bold uppercase mt-1">{m.red?.klub || "-"}</span>
                          </div>
                        </td>
                        <td className="px-8 py-4 text-right">
                          {m.isExisting ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black border border-[#00d25b]/30 text-[#00d25b] rounded-full text-[9px] font-black uppercase tracking-widest">
                              <CheckCircle2 size={10} /> Saved
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ffab00]/10 border border-[#ffab00]/30 text-[#ffab00] rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                              <Zap size={10} /> Draft
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="fixed bottom-10 right-10 z-[100] bg-[#191c24] border border-[#00d25b] p-6 rounded-sm shadow-[0_0_30px_rgba(0,210,91,0.2)] flex items-center gap-4">
            <div className="bg-[#00d25b] p-2 rounded-full text-white"><ShieldCheck size={20} /></div>
            <div>
              <p className="text-white font-black uppercase tracking-widest text-[10px]">Database Synced</p>
              <p className="text-[#6c7293] text-[9px] font-bold">Matches successfully saved to Google Sheets.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
