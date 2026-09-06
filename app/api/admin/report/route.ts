import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { getOverview, Period, periodDays } from '@/lib/admin/analytics';
import { modelMetadata } from '@/lib/admin/model';
import { formatArea, formatCurrency, formatDate, formatInteger, formatNumber, formatPercentage, formatPricePerSquareMeter } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const W = 595; const H = 842; const M = 48; const CONTENT = W - M * 2;
const navy = rgb(0.055, 0.09, 0.17); const blue = rgb(0.10, 0.29, 0.82); const paleBlue = rgb(0.93, 0.96, 1);
const slate = rgb(0.34, 0.39, 0.47); const light = rgb(0.94, 0.95, 0.97); const white = rgb(1, 1, 1);
const disclaimer = "Les estimations MaisonDeLUX sont produites par un modele statistique entraine sur des prix d'annonces immobilieres. Elles constituent une aide a l'evaluation et ne remplacent ni une expertise immobiliere, ni un avis juridique ou financier.";
const ascii = (value: unknown) => String(value ?? '').replace(/m²/g, 'm2').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[–—]/g, '-').replace(/[\u00A0\u202F]/g, ' ').replace(/[^\x20-\x7E]/g, '');

function wrap(value: unknown, font: PDFFont, size: number, width: number) {
  const words = ascii(value).split(/\s+/).filter(Boolean); const lines: string[] = []; let line = '';
  for (const word of words) { const next = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= width) line = next;
    else { if (line) lines.push(line); line = word; }
  }
  if (line) lines.push(line); return lines.length ? lines : [''];
}

function drawWrapped(page: PDFPage, value: unknown, x: number, y: number, width: number, font: PDFFont, size = 10, color = slate, lineHeight = 14) {
  const lines = wrap(value, font, size, width); lines.forEach((line, index) => page.drawText(line, { x, y: y - index * lineHeight, size, font, color }));
  return y - lines.length * lineHeight;
}

function sectionTitle(page: PDFPage, title: string, y: number, bold: PDFFont) {
  page.drawRectangle({ x: M, y: y - 3, width: 4, height: 19, color: blue });
  page.drawText(ascii(title), { x: M + 13, y, size: 15, font: bold, color: navy }); return y - 30;
}

function emptyState(page: PDFPage, y: number, regular: PDFFont, bold: PDFFont, message = 'Aucune donnee disponible sur cette periode') {
  page.drawRectangle({ x: M, y: y - 74, width: CONTENT, height: 74, color: light, borderColor: rgb(.87,.89,.92), borderWidth: .6 });
  page.drawText(message, { x: M + 18, y: y - 31, size: 10, font: bold, color: slate });
  page.drawText('Les visuels seront alimentes apres les premieres estimations.', { x: M + 18, y: y - 49, size: 8.5, font: regular, color: rgb(.48,.52,.59) });
}

function barChart(page: PDFPage, rows: any[], x: number, y: number, width: number, height: number, label: (row: any) => string,
  value: (row: any) => number, regular: PDFFont) {
  const visible = rows.slice(0, 7); const max = Math.max(1, ...visible.map(value)); const rowHeight = height / Math.max(visible.length, 1);
  visible.forEach((row, index) => { const py = y + height - (index + 1) * rowHeight + 4; const labelWidth = 94;
    page.drawText(ascii(label(row)).slice(0, 18), { x, y: py + 2, size: 7.5, font: regular, color: slate });
    page.drawRectangle({ x: x + labelWidth, y: py, width: width - labelWidth, height: 8, color: light });
    page.drawRectangle({ x: x + labelWidth, y: py, width: (width - labelWidth) * value(row) / max, height: 8, color: blue });
    page.drawText(formatInteger(value(row)), { x: x + width - 25, y: py + 12, size: 6.8, font: regular, color: slate });
  });
}

export async function GET(request: NextRequest) {
  try {
    const candidate = request.nextUrl.searchParams.get('period') as Period; const period = candidate in periodDays ? candidate : '30d';
    const data: any = await getOverview(period); const k = data.kpis || {};
    const pdf = await PDFDocument.create(); const regular = await pdf.embedFont(StandardFonts.Helvetica); const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const pages: PDFPage[] = []; const addPage = () => { const page = pdf.addPage([W, H]); pages.push(page); return page; };

    // Page 1 - executive valuation overview.
    let page = addPage();
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: white });
    page.drawRectangle({ x: 0, y: 654, width: W, height: 188, color: navy });
    page.drawRectangle({ x: M, y: 777, width: 42, height: 5, color: blue });
    page.drawText('MAISONDELUX', { x: M, y: 746, size: 12, font: bold, color: rgb(.45,.66,1) });
    page.drawText('Rapport analytique', { x: M, y: 704, size: 30, font: bold, color: white });
    page.drawText('Pilotage des estimations immobilieres', { x: M, y: 678, size: 13, font: regular, color: rgb(.76,.82,.91) });
    page.drawText(`Periode : ${ascii(period)}  |  Genere le ${ascii(formatDate(new Date()))}`, { x: M, y: 632, size: 9, font: regular, color: slate });
    let y = sectionTitle(page, 'Synthese executive', 592, bold);
    y = drawWrapped(page, data.configured
      ? `Ce rapport consolide ${formatInteger(k.total)} estimations anonymes. Il presente les volumes, la couverture territoriale, les niveaux de prix et le profil des biens observes.`
      : "Le stockage analytique n'est pas configure. Les indicateurs seront disponibles des que la collecte sera active.", M, y, CONTENT, regular, 10.5, slate, 16) - 18;
    y = sectionTitle(page, 'Valorisation et indicateurs cles', y, bold);
    const cards = [
      ['Estimations', formatInteger(k.total)], ['Prix moyen', formatCurrency(k.avg_price)], ['Prix median', formatCurrency(k.median_price)],
      ['Surface moyenne', formatArea(k.avg_surface)], ['Villes couvertes', formatInteger(k.cities)], ['Activite 30 jours', formatInteger(k.thirty)],
    ];
    cards.forEach(([label, value], index) => { const col = index % 3; const row = Math.floor(index / 3); const cw = (CONTENT - 20) / 3;
      const x = M + col * (cw + 10); const cy = y - row * 76;
      page.drawRectangle({ x, y: cy - 58, width: cw, height: 58, color: col === 1 ? paleBlue : light, borderColor: rgb(.87,.89,.92), borderWidth: .5 });
      page.drawText(label.toUpperCase(), { x: x + 12, y: cy - 19, size: 7, font: bold, color: slate });
      page.drawText(ascii(value), { x: x + 12, y: cy - 42, size: value.length > 17 ? 11 : 14, font: bold, color: navy });
    });
    y -= 166; y = sectionTitle(page, 'Profil moyen des biens', y, bold);
    const profile = data.profile || {}; const profileItems = [
      ['Surface', formatArea(k.avg_surface)], ['Chambres', formatNumber(profile.bedrooms)], ['Salles de bain', formatNumber(profile.bathrooms)],
      ['Parking', formatPercentage((profile.parking || 0) * 100)], ['Balcon', formatPercentage((profile.balcony || 0) * 100)], ['Meuble', formatPercentage((profile.furnished || 0) * 100)],
    ];
    profileItems.forEach(([label, value], index) => { const x = M + (index % 3) * 166; const py = y - Math.floor(index / 3) * 28;
      page.drawText(label, { x, y: py, size: 8, font: regular, color: slate }); page.drawText(ascii(value), { x: x + 70, y: py, size: 9, font: bold, color: navy });
    });

    // Page 2 - market insights and data visuals.
    page = addPage(); y = 766; y = sectionTitle(page, 'Activite et couverture territoriale', y, bold);
    if (!data.activity?.length) { emptyState(page, y, regular, bold); y -= 100; }
    else {
      const activity = data.activity.slice(-14); const max = Math.max(1, ...activity.map((row: any) => Number(row.count))); const chartY = y - 120;
      page.drawLine({ start: { x: M, y: chartY }, end: { x: W - M, y: chartY }, thickness: .7, color: rgb(.82,.85,.89) });
      activity.forEach((row: any, index: number) => { const bw = CONTENT / activity.length - 3; const h = 92 * Number(row.count) / max;
        page.drawRectangle({ x: M + index * CONTENT / activity.length + 1, y: chartY, width: Math.max(2, bw), height: h, color: blue });
      }); y = chartY - 34;
    }
    y = sectionTitle(page, 'Estimations par region', y, bold);
    if (!data.regions?.length) { emptyState(page, y, regular, bold); y -= 100; }
    else { barChart(page, data.regions, M, y - 124, CONTENT, 118, (row) => row.name, (row) => Number(row.count), regular); y -= 154; }
    y = sectionTitle(page, 'Distribution des valeurs estimees', y, bold);
    if (!data.prices?.length) { emptyState(page, y, regular, bold); y -= 100; }
    else { barChart(page, data.prices, M, y - 112, CONTENT, 106, (row) => row.bucket, (row) => Number(row.count), regular); y -= 142; }
    y = sectionTitle(page, 'Comparaison des villes', y, bold);
    if (!data.cities?.length) emptyState(page, y, regular, bold);
    else {
      page.drawRectangle({ x: M, y: y - 23, width: CONTENT, height: 23, color: navy });
      [['Ville', M + 10], ['Volume', 350], ['Part', 450]].forEach(([label, x]) => page.drawText(label as string, { x: x as number, y: y - 15, size: 8, font: bold, color: white }));
      data.cities.slice(0, 7).forEach((row: any, index: number) => { const py = y - 45 - index * 22;
        if (index % 2 === 0) page.drawRectangle({ x: M, y: py - 5, width: CONTENT, height: 22, color: light });
        page.drawText(ascii(row.name).slice(0, 38), { x: M + 10, y: py, size: 8, font: regular, color: navy });
        page.drawText(formatInteger(row.count), { x: 350, y: py, size: 8, font: regular, color: navy });
        page.drawText(ascii(formatPercentage(row.percentage)), { x: 450, y: py, size: 8, font: regular, color: navy });
      });
    }

    // Page 3 - model, method and governance.
    page = addPage(); y = 766; y = sectionTitle(page, 'Methodologie et modele', y, bold);
    y = drawWrapped(page, `Les indicateurs synthetisent les estimations reussies pour la periode selectionnee. Les prix moyens et medians sont exprimes en dirhams marocains. Le prix au metre carre neutralise partiellement les ecarts de surface et n'est affiche par ville qu'a partir de trois observations.`, M, y, CONTENT, regular, 10, slate, 15) - 22;
    const metrics: any = modelMetadata.test_metrics;
    const modelRows = [
      ['Modele', `${modelMetadata.model_name} - version v1`], ['Jeu de test', `${formatInteger(modelMetadata.test_rows)} observations`],
      ['R2', formatNumber(metrics.R2, 'fr', 2)], ['MAE', formatCurrency(metrics.MAE)], ['RMSE', formatCurrency(metrics.RMSE)],
      ['Erreur mediane', formatCurrency(metrics.MedianAE)], ['MdAPE', formatPercentage(metrics.MdAPE_pct)],
    ];
    y = sectionTitle(page, 'Referentiel de performance', y, bold);
    modelRows.forEach(([label, value], index) => { const py = y - index * 30;
      page.drawLine({ start: { x: M, y: py - 9 }, end: { x: W - M, y: py - 9 }, thickness: .4, color: rgb(.87,.89,.92) });
      page.drawText(label, { x: M, y: py, size: 9, font: regular, color: slate }); page.drawText(ascii(value), { x: 245, y: py, size: 9, font: bold, color: navy });
    }); y -= modelRows.length * 30 + 28;
    y = sectionTitle(page, 'Lecture des prix au m2', y, bold);
    if (!data.ppm?.length) { emptyState(page, y, regular, bold, 'Volume insuffisant pour une comparaison robuste'); y -= 100; }
    else { data.ppm.slice(0, 6).forEach((row: any, index: number) => { const py = y - index * 24;
      page.drawText(ascii(row.name).slice(0, 28), { x: M, y: py, size: 8.5, font: regular, color: navy });
      page.drawText(ascii(formatPricePerSquareMeter(row.value)), { x: 270, y: py, size: 8.5, font: bold, color: blue });
      page.drawText(`${formatInteger(row.count)} observations`, { x: 420, y: py, size: 7.5, font: regular, color: slate });
    }); y -= Math.min(data.ppm.length, 6) * 24 + 22; }
    y = sectionTitle(page, 'Avertissement', y, bold);
    page.drawRectangle({ x: M, y: y - 92, width: CONTENT, height: 92, color: paleBlue, borderColor: rgb(.75,.82,.94), borderWidth: .7 });
    drawWrapped(page, disclaimer, M + 16, y - 24, CONTENT - 32, regular, 9, navy, 14);

    const generated = ascii(formatDate(new Date(), 'fr', true));
    pages.forEach((current, index) => {
      current.drawLine({ start: { x: M, y: 40 }, end: { x: W - M, y: 40 }, thickness: .5, color: rgb(.84,.86,.9) });
      current.drawText('MaisonDeLUX - Rapport analytique confidentiel', { x: M, y: 23, size: 7.5, font: regular, color: slate });
      const pageLabel = `${index + 1} / ${pages.length}`; current.drawText(pageLabel, { x: W - M - bold.widthOfTextAtSize(pageLabel, 7.5), y: 23, size: 7.5, font: bold, color: navy });
      if (index > 0) current.drawText(`Genere le ${generated}`, { x: 365, y: 23, size: 7, font: regular, color: slate });
    });
    pdf.setTitle('Rapport analytique MaisonDeLUX'); pdf.setAuthor('MaisonDeLUX'); pdf.setSubject('Analyse des estimations immobilieres');
    const bytes = await pdf.save(); const filename = `MaisonDeLUX_Rapport_${new Date().toISOString().slice(0,10)}.pdf`;
    return new NextResponse(bytes as BodyInit, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"` } });
  } catch (error) { console.error('PDF report:', error); return NextResponse.json({ error: 'Rapport indisponible.' }, { status: 500 }); }
}
