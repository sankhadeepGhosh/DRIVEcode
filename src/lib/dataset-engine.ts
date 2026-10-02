/**
 * Large Dataset Processing and Local Analysis Engine
 * Handles chunking, schema inspection, statistical profiling, and querying
 * without overloading the LLM context or freezing the UI thread.
 */

export interface DatasetColumnInfo {
  name: string;
  type: 'numeric' | 'string' | 'date' | 'boolean';
  missingCount: number;
  missingPercentage: number;
  distinctCount: number;
  min?: number | string;
  max?: number | string;
  mean?: number;
  median?: number;
}

export interface DatasetProfile {
  filename: string;
  format: string;
  fileSizeBytes: number;
  rowCount: number;
  columnCount: number;
  columns: DatasetColumnInfo[];
  previewRows: Record<string, any>[];
  summaryText: string;
}

export class DatasetEngine {
  /**
   * Determine whether a file represents tabular data suitable for dataset profiling
   */
  static isDataset(filename: string, mimeType: string): boolean {
    const fn = filename.toLowerCase();
    return (
      fn.endsWith('.csv') ||
      fn.endsWith('.tsv') ||
      fn.endsWith('.json') ||
      fn.endsWith('.jsonl') ||
      mimeType === 'text/csv' ||
      mimeType === 'application/json' ||
      mimeType === 'text/tab-separated-values'
    );
  }

  /**
   * Parse and compute verified statistical summaries locally
   */
  static async profileDataset(file: File): Promise<DatasetProfile> {
    const text = await this.readFileSample(file, 2 * 1024 * 1024); // read up to 2MB sample for profiling
    const isTsv = file.name.endsWith('.tsv');
    const isJson = file.name.endsWith('.json');

    if (isJson) {
      return this.profileJson(file.name, file.size, text);
    }

    return this.profileDelimited(file.name, file.size, text, isTsv ? '\t' : ',');
  }

  private static readFileSample(file: File, maxBytes: number): Promise<string> {
    return new Promise((resolve) => {
      const slice = file.slice(0, maxBytes);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve('');
      reader.readAsText(slice);
    });
  }

  private static profileDelimited(
    filename: string,
    fileSize: number,
    rawText: string,
    delimiter: string
  ): DatasetProfile {
    const lines = rawText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) {
      return this.emptyProfile(filename, fileSize, 'CSV');
    }

    const headers = this.parseLine(lines[0], delimiter);
    const sampleLines = lines.slice(1, 1000); // sample up to 1000 rows
    const totalLinesEstimated = Math.round((fileSize / (rawText.length || 1)) * lines.length);

    const columns: DatasetColumnInfo[] = headers.map((colName, colIdx) => {
      const values: string[] = [];
      let numericCount = 0;
      let missingCount = 0;
      const numList: number[] = [];

      for (const line of sampleLines) {
        const parts = this.parseLine(line, delimiter);
        const val = parts[colIdx]?.trim();
        if (val === undefined || val === '' || val === 'null' || val === 'NaN' || val === 'NA') {
          missingCount++;
        } else {
          values.push(val);
          const num = Number(val);
          if (!isNaN(num) && val.length > 0) {
            numericCount++;
            numList.push(num);
          }
        }
      }

      const isNumeric = numList.length > values.length * 0.7 && values.length > 0;
      const distinct = new Set(values).size;

      const colInfo: DatasetColumnInfo = {
        name: colName,
        type: isNumeric ? 'numeric' : 'string',
        missingCount,
        missingPercentage: sampleLines.length > 0 ? (missingCount / sampleLines.length) * 100 : 0,
        distinctCount: distinct,
      };

      if (isNumeric && numList.length > 0) {
        numList.sort((a, b) => a - b);
        colInfo.min = numList[0];
        colInfo.max = numList[numList.length - 1];
        const sum = numList.reduce((acc, c) => acc + c, 0);
        colInfo.mean = Math.round((sum / numList.length) * 100) / 100;
        const mid = Math.floor(numList.length / 2);
        colInfo.median =
          numList.length % 2 !== 0 ? numList[mid] : (numList[mid - 1] + numList[mid]) / 2;
      }

      return colInfo;
    });

    const previewRows = sampleLines.slice(0, 5).map((line) => {
      const parts = this.parseLine(line, delimiter);
      const row: Record<string, any> = {};
      headers.forEach((h, idx) => {
        row[h] = parts[idx] ?? '';
      });
      return row;
    });

    const summaryText = this.formatSummary(filename, fileSize, totalLinesEstimated, columns);

    return {
      filename,
      format: delimiter === '\t' ? 'TSV' : 'CSV',
      fileSizeBytes: fileSize,
      rowCount: Math.max(totalLinesEstimated, sampleLines.length),
      columnCount: headers.length,
      columns,
      previewRows,
      summaryText,
    };
  }

  private static parseLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === delimiter && !inQuotes) {
        result.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur);
    return result;
  }

  private static profileJson(filename: string, fileSize: number, rawText: string): DatasetProfile {
    try {
      const parsed = JSON.parse(rawText);
      const list = Array.isArray(parsed) ? parsed : [parsed];
      const headers = Object.keys(list[0] || {});
      const columns: DatasetColumnInfo[] = headers.map((h) => ({
        name: h,
        type: typeof list[0][h] === 'number' ? 'numeric' : 'string',
        missingCount: 0,
        missingPercentage: 0,
        distinctCount: new Set(list.map((r) => r[h])).size,
      }));

      return {
        filename,
        format: 'JSON',
        fileSizeBytes: fileSize,
        rowCount: list.length,
        columnCount: headers.length,
        columns,
        previewRows: list.slice(0, 5),
        summaryText: this.formatSummary(filename, fileSize, list.length, columns),
      };
    } catch {
      return this.emptyProfile(filename, fileSize, 'JSON');
    }
  }

  private static emptyProfile(filename: string, fileSize: number, format: string): DatasetProfile {
    return {
      filename,
      format,
      fileSizeBytes: fileSize,
      rowCount: 0,
      columnCount: 0,
      columns: [],
      previewRows: [],
      summaryText: `File ${filename} (${(fileSize / 1024).toFixed(1)} KB) appears empty.`,
    };
  }

  private static formatSummary(
    filename: string,
    fileSize: number,
    rows: number,
    cols: DatasetColumnInfo[]
  ): string {
    const mb = (fileSize / (1024 * 1024)).toFixed(2);
    let out = `DATASET METADATA:\n`;
    out += `File: ${filename} (~${mb} MB)\n`;
    out += `Estimated Rows: ${rows.toLocaleString()} | Columns: ${cols.length}\n\n`;
    out += `COLUMNS & TYPES:\n`;
    cols.forEach((c) => {
      out += `- ${c.name} (${c.type}): ${c.distinctCount} unique values`;
      if (c.type === 'numeric' && c.mean !== undefined) {
        out += ` [Min: ${c.min}, Max: ${c.max}, Mean: ${c.mean}, Median: ${c.median}]`;
      }
      if (c.missingPercentage > 0) {
        out += ` (Missing: ${c.missingPercentage.toFixed(1)}%)`;
      }
      out += `\n`;
    });
    return out;
  }
}
