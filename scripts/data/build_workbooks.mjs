import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const projectRoot = "C:/Users/ouaha/OneDrive/Desktop/MaisonDeLUX";
const outputDir = path.join(projectRoot, "reports/data_quality");
const previewDir = path.join(outputDir, "workbook-previews");
await fs.mkdir(previewDir, { recursive: true });

const columnLetters = (count) => {
  const letters = [];
  for (let n = 1; n <= count; n++) {
    let value = n;
    let label = "";
    while (value) {
      value -= 1;
      label = String.fromCharCode(65 + (value % 26)) + label;
      value = Math.floor(value / 26);
    }
    letters.push(label);
  }
  return letters;
};

async function addCsvSheet(workbook, csvPath, sheetName) {
  const csvText = (await fs.readFile(csvPath, "utf8")).replace(/^\uFEFF/, "");
  const imported = await Workbook.fromCSV(csvText, { sheetName });
  const source = imported.worksheets.getItem(sheetName);
  const values = source.getUsedRange(true).values;
  const sheet = workbook.worksheets.add(sheetName);
  if (values.length && values[0].length) {
    sheet.getRangeByIndexes(0, 0, values.length, values[0].length).values = values;
  }
  return sheet;
}

function styleSheet(sheet, tableName, isListingSheet = false) {
  const used = sheet.getUsedRange(true);
  const values = used.values;
  const rowCount = values.length;
  const colCount = values[0]?.length ?? 0;
  if (!rowCount || !colCount) return;
  sheet.showGridLines = false;
  sheet.freezePanes.freezeRows(1);
  const header = sheet.getRangeByIndexes(0, 0, 1, colCount);
  header.format = {
    fill: "#17324D",
    font: { bold: true, color: "#FFFFFF", size: 10 },
    rowHeight: 25,
    verticalAlignment: "center",
    wrapText: true,
    borders: { preset: "outside", style: "thin", color: "#17324D" },
  };
  const letters = columnLetters(colCount);
  const headers = values[0].map((value) => String(value ?? ""));
  for (let col = 0; col < colCount; col++) {
    const name = headers[col];
    let width = 14;
    if (["listing_id", "url", "validation_reasons", "title_raw", "location_raw", "details_raw", "source_record_path"].includes(name)) width = name === "listing_id" ? 38 : name === "url" ? 44 : 28;
    if (["city", "neighborhood", "property_type", "transaction_type", "validation_status", "deduplication_status"].includes(name)) width = 20;
    if (name === "region") width = 30;
    if (name === "metric") width = 40;
    if (name === "value") width = 16;
    if (["latitude", "longitude", "surface_m2", "bedrooms", "bathrooms", "price_mad", "price_per_m2", "value", "raw_rows", "valid_rows", "rejected_rows", "cities", "neighborhoods"].includes(name)) width = 15;
    sheet.getRange(`${letters[col]}:${letters[col]}`).format.columnWidth = width;
  }
  if (isListingSheet && rowCount > 1) {
    const priceIndex = headers.indexOf("price_mad");
    const ppmIndex = headers.indexOf("price_per_m2");
    const surfaceIndex = headers.indexOf("surface_m2");
    const dateIndexes = [headers.indexOf("publication_date"), headers.indexOf("scraped_at")].filter((index) => index >= 0);
    if (priceIndex >= 0) sheet.getRange(`${letters[priceIndex]}2:${letters[priceIndex]}${rowCount}`).format.numberFormat = "#,##0\" MAD\"";
    if (ppmIndex >= 0) sheet.getRange(`${letters[ppmIndex]}2:${letters[ppmIndex]}${rowCount}`).format.numberFormat = "#,##0\" MAD/m²\"";
    if (surfaceIndex >= 0) sheet.getRange(`${letters[surfaceIndex]}2:${letters[surfaceIndex]}${rowCount}`).format.numberFormat = "#,##0.0";
    for (const index of dateIndexes) sheet.getRange(`${letters[index]}2:${letters[index]}${rowCount}`).format.numberFormat = "yyyy-mm-dd hh:mm";
    const statusIndex = headers.indexOf("validation_status");
    if (statusIndex >= 0) {
      const statusRange = sheet.getRange(`${letters[statusIndex]}2:${letters[statusIndex]}${rowCount}`);
      statusRange.conditionalFormats.add("containsText", { text: "valid", format: { fill: "#DCFCE7", font: { color: "#166534" } } });
      statusRange.conditionalFormats.add("containsText", { text: "warning", format: { fill: "#FEF3C7", font: { color: "#92400E" } } });
      statusRange.conditionalFormats.add("containsText", { text: "rejected", format: { fill: "#FEE2E2", font: { color: "#991B1B" } } });
    }
  }
  if (!isListingSheet) {
    const table = sheet.tables.add(`A1:${letters[colCount - 1]}${rowCount}`, true, tableName);
    table.style = "TableStyleMedium2";
    table.showBandedRows = true;
    table.showFilterButton = true;
  }
}

async function buildWorkbook(kind) {
  const rawCsv = path.join(projectRoot, "data/raw/maisondelux_raw.csv");
  const cleanCsv = path.join(projectRoot, "data/processed/maisondelux_clean.csv");
  const rejectedCsv = path.join(projectRoot, "data/processed/maisondelux_rejected.csv");
  const allCsv = kind === "raw" ? rawCsv : cleanCsv;
  const allText = (await fs.readFile(allCsv, "utf8")).replace(/^\uFEFF/, "");
  const workbook = await Workbook.fromCSV(allText, { sheetName: "all_rows" });
  await addCsvSheet(workbook, cleanCsv, "valid_rows");
  await addCsvSheet(workbook, rejectedCsv, "rejected_rows");
  await addCsvSheet(workbook, path.join(projectRoot, "data/interim/excel/source_summary.csv"), "source_summary");
  await addCsvSheet(workbook, path.join(projectRoot, "data/interim/excel/city_summary.csv"), "city_summary");
  await addCsvSheet(workbook, path.join(projectRoot, "data/interim/excel/quality_summary.csv"), "quality_summary");
  await addCsvSheet(workbook, path.join(projectRoot, "data/interim/excel/scraping_errors.csv"), "scraping_errors");

  const sheetNames = ["all_rows", "valid_rows", "rejected_rows", "source_summary", "city_summary", "quality_summary", "scraping_errors"];
  for (const [index, sheetName] of sheetNames.entries()) {
    styleSheet(workbook.worksheets.getItem(sheetName), `${kind}_${index + 1}_${sheetName}`.replace(/[^A-Za-z0-9_]/g, "_"), index < 3);
  }

  const allSheet = workbook.worksheets.getItem("all_rows");
  const allRowCount = allSheet.getUsedRange(true).values.length;
  const quality = workbook.worksheets.getItem("quality_summary");
  quality.getRange("D1:E1").values = [["Live control", "Formula"]];
  quality.getRange("D2:D5").values = [["Rows on all_rows"], ["Valid statuses"], ["Warnings"], ["Rejected"]];
  quality.getRange("E2:E5").formulas = [[
    `=COUNTA('all_rows'!A2:A${allRowCount})`,
  ], [
    `=COUNTIF('all_rows'!X2:X${allRowCount},\"valid\")`,
  ], [
    `=COUNTIF('all_rows'!X2:X${allRowCount},\"warning\")`,
  ], [
    `=COUNTIF('all_rows'!X2:X${allRowCount},\"rejected\")`,
  ]];
  quality.getRange("D1:E1").format = { fill: "#0F766E", font: { bold: true, color: "#FFFFFF" } };
  quality.getRange("D:E").format.columnWidth = 20;

  for (const sheetName of sheetNames) {
    const sheet = workbook.worksheets.getItem(sheetName);
    const used = sheet.getUsedRange(true).values;
    const maxRows = Math.min(used.length, 28);
    const maxCols = Math.min(used[0]?.length ?? 1, 10);
    const end = columnLetters(maxCols)[maxCols - 1];
    const preview = await workbook.render({ sheetName, range: `A1:${end}${maxRows}`, scale: 1, format: "png" });
    await fs.writeFile(path.join(previewDir, `${kind}_${sheetName}.png`), new Uint8Array(await preview.arrayBuffer()));
  }

  const check = await workbook.inspect({ kind: "table", sheetId: "quality_summary", range: "A1:E20", include: "values,formulas", tableMaxRows: 20, tableMaxCols: 8, maxChars: 5000 });
  console.log(`${kind} quality inspection\n${check.ndjson}`);
  const errors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 100 }, summary: `${kind} formula error scan`, maxChars: 3000 });
  console.log(`${kind} formula scan\n${errors.ndjson}`);

  const exported = await SpreadsheetFile.exportXlsx(workbook);
  const outputPath = kind === "raw" ? path.join(projectRoot, "data/raw/maisondelux_raw.xlsx") : path.join(projectRoot, "data/processed/maisondelux_clean.xlsx");
  const canonicalPath = kind === "raw" ? path.join(projectRoot, "data/raw/maisondelux_raw.xlsx") : path.join(projectRoot, "data/processed/maisondelux_clean.xlsx");
  await exported.save(outputPath);
  if (outputPath !== canonicalPath) await exported.save(canonicalPath);
  return { outputPath, canonicalPath, sheets: sheetNames, rows: allRowCount - 1 };
}

const requestedKind = process.argv[2];
if (!["raw", "clean"].includes(requestedKind)) throw new Error("Pass raw or clean");
const results = [await buildWorkbook(requestedKind)];
console.log(JSON.stringify(results));
