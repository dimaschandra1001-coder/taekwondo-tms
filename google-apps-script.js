/**
 * GOOGLE APPS SCRIPT - VERSION 23.5 (DUAL-SHEET SYNC FIX + RESET DATA)
 * Database: PRABU TKD
 * Perbaikan: Menambahkan fitur action reset_all untuk membersihkan database
 */

const SS_ID = '1blhfFfpgeNuS-9i25tlavQUhjyfO-R4Ic2l6HIwO-bA';
const SHEET_PESERTA = 'Peserta';

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SS_ID);
    const sheetName = e.parameter.sheet || SHEET_PESERTA;
    const sheet = ss.getSheetByName(sheetName);
    
    if (!sheet) throw new Error("Sheet tidak ditemukan: " + sheetName);
    
    const values = sheet.getDataRange().getDisplayValues(); 
    const headers = values[0];
    const rows = values.slice(1);
    
    const result = rows.map(row => {
      let obj = {};
      headers.forEach((h, i) => { 
        obj[h.toString().toLowerCase().trim()] = row[i]; 
      });
      return obj;
    });
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const contents = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.openById(SS_ID);
    
    if (contents.sheet === 'Bagan_Tanding') {
      const baganSheet = ss.getSheetByName('Bagan_Tanding');
      return handleBaganTanding(baganSheet, contents);
    }

    const sheet = ss.getSheetByName(SHEET_PESERTA);

    if (contents.action === 'batchUpdatePartai') {
      return batchUpdatePartai(sheet, contents.updates);
    }

    // ----- FITUR BARU: TOMBOL RESET DATA -----
    if (contents.action === 'reset_all') {
      const baganSheet = ss.getSheetByName('Bagan_Tanding');
      const pesertaSheet = ss.getSheetByName(SHEET_PESERTA);
      
      // Bersihkan Bagan_Tanding (Row 2 ke bawah)
      const lastBaganRow = baganSheet.getLastRow();
      if (lastBaganRow > 1) baganSheet.getRange(2, 1, lastBaganRow - 1, 9).clearContent();
      
      // Update Peserta: Status Bagan -> Belum, Lapangan -> Kosong, No Partai -> Kosong
      const pData = pesertaSheet.getDataRange().getValues();
      const headers = pData[0];
      const statusIdx = headers.findIndex(h => h.toString().toLowerCase().trim().includes("status bagan"));
      const partaiIdx = headers.findIndex(h => h.toString().toLowerCase().trim() === "no. partai" || h.toString().toLowerCase().trim() === "no_partai");
      const lapIdx = headers.findIndex(h => h.toString().toLowerCase().trim() === "lapangan");
      
      const numRows = pData.length - 1;
      if (numRows > 0) {
        if (statusIdx !== -1) {
          const statuses = pData.slice(1).map(() => ["Belum"]);
          pesertaSheet.getRange(2, statusIdx + 1, numRows, 1).setValues(statuses);
        }
        if (partaiIdx !== -1) {
          const partais = pData.slice(1).map(() => [""]);
          pesertaSheet.getRange(2, partaiIdx + 1, numRows, 1).setValues(partais);
        }
        if (lapIdx !== -1) {
          const laps = pData.slice(1).map(() => [""]);
          pesertaSheet.getRange(2, lapIdx + 1, numRows, 1).setValues(laps);
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    // -----------------------------------------

    if (contents.action === 'addPeserta' || !contents.action) {
      return handleAddPeserta(sheet, contents);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: false, error: "Action tidak dikenali" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleBaganTanding(sheet, contents) {
  try {
    if (contents.cleanup || contents.mode === 'overwrite') {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, 1, lastRow - 1, 9).clearContent();
      }
    }
    
    if (contents.updates && contents.updates.length > 0) {
      const rows = contents.updates.map(m => [
        m["No. Partai"] || "",
        m["Arena"] || "",
        m["Kategori"] || "",
        m["Gender"] || "",
        m["Kelas Tanding"] || "",
        m["Nama Atlet 1"] || "",
        m["Nama Atlet 2"] || "",
        m["Club 1"] || "",
        m["Club 2"] || ""
      ]);
      sheet.getRange(2, 1, rows.length, 9).setValues(rows);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'success', success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function batchUpdatePartai(sheet, updates) {
  try {
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    const headers = values[0];
    
    const nameIdx = headers.findIndex(h => {
      const txt = h.toString().toLowerCase().trim();
      return txt === "nama" || txt.includes("nama atlet") || txt.includes("nama lengkap");
    });

    if (nameIdx === -1) {
      throw new Error("Kolom Nama tidak ditemukan!");
    }

    // STRICT: J=10 (No. Partai), K=11 (Status Bagan). Tidak menyentuh L.
    const colI = 9;
    const colJ = 10;
    const colK = 11;

    if (!sheet.getRange(1, colI).getValue()) sheet.getRange(1, colI).setValue("Lapangan");
    if (!sheet.getRange(1, colJ).getValue()) sheet.getRange(1, colJ).setValue("No. Partai");
    if (!sheet.getRange(1, colK).getValue()) sheet.getRange(1, colK).setValue("Status Bagan");

    const updateMap = {};
    updates.forEach(function(u) {
      const key = (u.Nama || u.nama || "").toString().toLowerCase().trim();
      if (key) {
        updateMap[key] = {
          lapangan: u.Lapangan || u.lapangan || "",
          partai: u["No. Partai"] || u.no_partai || u.noPartai || "",
          status: u["Status Bagan"] || u.status_bagan || "Sudah"
        };
      }
    });

    let updatedCount = 0;
    for (let i = 1; i < values.length; i++) {
      const rowName = values[i][nameIdx] ? values[i][nameIdx].toString().toLowerCase().trim() : "";
      const updateData = updateMap[rowName];
      
      if (updateData) {
        if (updateData.lapangan) sheet.getRange(i + 1, colI).setValue(updateData.lapangan);
        sheet.getRange(i + 1, colJ).setValue(updateData.partai);
        sheet.getRange(i + 1, colK).setValue(updateData.status);
        updatedCount++;
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'success', 
      success: true,
      updated: updatedCount
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleAddPeserta(sheet, contents) {
  const names = sheet.getRange("B1:B" + sheet.getMaxRows()).getValues();
  let lastRow = 0;
  for (let i = names.length - 1; i >= 0; i--) {
    if (names[i][0] !== "") { lastRow = i + 1; break; }
  }

  sheet.getRange(lastRow + 1, 1, 1, 9).setValues([[
    new Date().toLocaleString(), 
    contents.nama || '', 
    contents.club || contents.klub || '', 
    contents.gender || '', 
    contents.kategori || '', 
    contents.umur || '', 
    contents.kelasTanding || contents.kelastanding || '', 
    contents.scoring || '', 
    contents.lapangan || ''
  ]]);

  return ContentService.createTextOutput(JSON.stringify({ status: 'success', success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
