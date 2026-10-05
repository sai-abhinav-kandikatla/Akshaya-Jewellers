// ==============================================================================
// CSV Export Utility
// Uses Blob + URL.createObjectURL with UTF-8 BOM for Excel compatibility
// ==============================================================================

interface ExportColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => string | number | null | undefined);
}

/**
 * Export data to CSV and trigger download
 */
export function exportToCSV(
  param1: string | Record<string, any>[],
  param2?: string | Record<string, any>[],
  param3?: ExportColumn<any>[]
): void {
  let filename: string;
  let data: Record<string, any>[];
  const columns: ExportColumn<any>[] | undefined = param3;

  if (typeof param1 === 'string' && Array.isArray(param2)) {
    filename = param1;
    data = param2;
  } else if (Array.isArray(param1) && typeof param2 === 'string') {
    data = param1;
    filename = param2;
  } else {
    return;
  }

  if (!data || data.length === 0) return;

  const escapeCell = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  let headerRow = '';
  let rows: string[] = [];

  if (columns && columns.length > 0) {
    headerRow = columns.map((col) => escapeCell(col.header)).join(',');
    rows = data.map((item) =>
      columns!
        .map((col) => {
          const value = typeof col.accessor === 'function'
            ? col.accessor(item)
            : (item as any)[col.accessor as string];
          return escapeCell(value);
        })
        .join(',')
    );
  } else {
    const keys = Object.keys(data[0]);
    headerRow = keys.map((k) => escapeCell(k)).join(',');
    rows = data.map((item) => keys.map((k) => escapeCell((item as any)[k])).join(','));
  }

  // UTF-8 BOM for Excel compatibility (especially for ₹ symbol)
  const csvContent = '\uFEFF' + [headerRow, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
