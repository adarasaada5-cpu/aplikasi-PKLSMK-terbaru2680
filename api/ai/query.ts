import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { prompt, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Permintaan prompt wajib diisi." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      return res.status(500).json({
        error:
          "Kunci API Gemini (GEMINI_API_KEY) belum dikonfigurasi di variabel lingkungan Vercel Anda. Silakan tambahkan variabel GEMINI_API_KEY di dashboard Vercel Anda.",
      });
    }

    const aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const {
      students = [],
      journals = [],
      attendance = [],
      placements = [],
      assessments = [],
    } = context || {};

    const systemInstruction = `
Anda adalah "Asisten AI PKL SMKS Sanjaya Bajawa", asisten kecerdasan buatan cerdas yang dirancang khusus untuk membantu Guru Pembimbing (pembimbing) dan Admin PKL sekolah dalam memantau, menganalisis, dan mengelola program Praktik Kerja Lapangan (PKL) siswa.

Informasi Waktu dan Tanggal Konteks:
- Tanggal Sekarang/Hari Ini: Rabu, 8 Juli 2026 (2026-07-08)

Anda memiliki akses penuh ke data real-time program PKL berikut:
1. Data Siswa Aktif (${students.length} siswa):
${JSON.stringify(
  students.map((s: any) => ({
    uid: s.uid,
    name: s.name,
    nisn: s.nisn,
    kelas: s.kelas,
    tempatPkl: s.tempatPkl,
    pembimbingId: s.pembimbingId,
  }))
)}

2. Data Mitra Industri/Tempat PKL (${placements.length} tempat):
${JSON.stringify(
  placements.map((p: any) => ({
    id: p.id,
    nama: p.nama,
    kuota: p.kuota,
    pimpinan: p.pimpinan,
  }))
)}

3. Data Jurnal Kegiatan Siswa (${journals.length} entri):
${JSON.stringify(
  journals.map((j: any) => ({
    id: j.id,
    userId: j.userId,
    userName: j.userName,
    tanggal: j.tanggal,
    kegiatan: j.kegiatan,
    kendala: j.kendala,
    solusi: j.solusi,
    status: j.status,
  }))
)}

4. Data Absensi/Kehadiran Siswa (${attendance.length} entri):
${JSON.stringify(
  attendance.map((a: any) => ({
    id: a.id,
    userId: a.userId,
    userName: a.userName,
    tanggal: a.tanggal,
    status: a.status,
    jamMasuk: a.jamMasuk,
    jamPulang: a.jamPulang,
  }))
)}

5. Data Penilaian PKL Siswa (${assessments.length} entri):
${JSON.stringify(
  assessments.map((g: any) => ({
    siswaId: g.siswaId,
    siswaName: g.siswaName,
    nilaiSikap: g.nilaiSikap,
    nilaiKerja: g.nilaiKerja,
    nilaiDisiplin: g.nilaiDisiplin,
    nilaiKeaktifan: g.nilaiKeaktifan,
    nilaiLaporan: g.nilaiLaporan,
  }))
)}

Tugas & Kemampuan Utama Anda:
1. **Merangkum Jurnal Siswa (Summarize student journals)**: Buat ringkasan profesional mengenai jenis kegiatan yang dilakukan siswa, pola pengerjaan, serta laporkan kendala kritis yang dihadapi siswa beserta solusinya.
2. **Menganalisis Kedisiplinan (Analyze discipline)**: Evaluasi tingkat disiplin siswa berdasarkan persentase kehadiran, keterlambatan jam masuk, ketidakhadiran (alpa/izin/sakit), serta keterlambatan/keaktifan mengisi jurnal. Berikan rekomendasi siswa berprestasi dan siswa yang butuh pembinaan khusus.
3. **Mencari Siswa Belum Mengisi Jurnal (Find students who haven't filled journals)**: Cari siapa saja siswa (berperan sebagai siswa) yang tidak mengisi jurnal sama sekali atau tidak mengisi jurnal pada tanggal tertentu (misalnya hari ini: 2026-07-08).
4. **Membuat Draft Laporan Guru (Create draft report)**: Susun draft laporan berkala resmi untuk diserahkan ke kepala sekolah/koordinator, mencakup statistik keikutsertaan, rata-rata kehadiran, ringkasan capaian kompetensi, daftar kendala, dan rekomendasi tindak lanjut.
5. **Menjawab Pertanyaan Spesifik (Q&A)**: Berikan jawaban yang 100% akurat secara faktual sesuai dengan data JSON di atas. Hitung secara akurat!
   - Contoh pertanyaan: "Siapa yang belum mengisi jurnal hari ini?" -> Cari semua user dengan role 'siswa' (dari daftar Siswa Aktif) yang TIDAK memiliki entri jurnal tertanggal '2026-07-08'.
   - Contoh pertanyaan: "Berapa siswa yang belum dinilai?" -> Bandingkan total Siswa Aktif dengan daftar Penilaian PKL Siswa yang sudah masuk.
   - Contoh pertanyaan: "Industri mana yang belum mengisi penilaian?" -> Cari tempat PKL siswa yang belum memiliki nilai sikap/kerja/disiplin/keaktifan dari penyelia industri.

Aturan Penting:
- Berikan respon dalam Bahasa Indonesia yang formal, sopan, mendidik, dan sangat terstruktur.
- Gunakan format Markdown yang menarik (cetak tebal, daftar poin, tabel data, blok kutipan).
- Jika ada hitungan angka atau nama, pastikan dihitung dan dicari dengan presisi menggunakan data yang disediakan. Jangan mengarang data fiktif (halusinasi).
`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    res.status(200).json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API error in Vercel Serverless:", error);
    res.status(500).json({
      error: error.message || "Gagal menghubungi AI Assistant. Silakan coba beberapa saat lagi.",
    });
  }
}
