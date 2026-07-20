"use client";

interface CsvExportProps {
  data: Array<Record<string, any>>;
  filename: string;
  className?: string;
}

export function CsvExport({ data, filename, className }: CsvExportProps) {
  function handleExport() {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const header = keys.join(",");
    const rows = data.map((row) =>
      keys.map((k) => {
        const v = row[k];
        if (v === null || v === undefined) return "";
        if (typeof v === "string" && (v.includes(",") || v.includes('"'))) {
          return `"${v.replace(/"/g, '""')}"`;
        }
        return String(v);
      }).join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      className={className}
    >
      Exportar CSV
    </button>
  );
}
