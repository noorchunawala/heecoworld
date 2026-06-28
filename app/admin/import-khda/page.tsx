"use client";

import { useState } from "react";

export default function ImportKhdaPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const uploadFile = async () => {
    if (!file) {
      alert("Please select Excel file.");
      return;
    }

    setImporting(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/admin/import-spea", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    setResult(data);
    setImporting(false);
  };

  return (
    <main className="min-h-screen bg-[#F8F1E7] px-4 py-16">
      <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 shadow-xl">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#B58A34]">
          Admin Import
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-[#071B33]">
          Import KHDA Dubai Schools
        </h1>

        <p className="mt-3 text-sm text-slate-600">
          Upload KHDA Excel file to import Dubai school listings.
        </p>

        <div className="mt-8 rounded-2xl border border-dashed border-[#D6B46A] bg-[#FFFBF3] p-6">
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />

          <button
            onClick={uploadFile}
            disabled={importing}
            className="mt-6 rounded-full bg-[#071B33] px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {importing ? "Importing..." : "Start Import"}
          </button>
        </div>

        {result && (
          <div className="mt-8 rounded-2xl bg-[#FAF7F0] p-5">
            <pre className="whitespace-pre-wrap text-sm text-[#071B33]">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}