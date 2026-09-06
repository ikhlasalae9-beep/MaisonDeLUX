import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { getOverview, Period, periodDays } from '@/lib/admin/analytics';
import { modelMetadata } from '@/lib/admin/model';
export const dynamic = 'force-dynamic';

const disclaimer = "Les estimations produites par MaisonDeLUX sont issues d’un modèle prédictif basé sur des données d’annonces immobilières. Elles constituent une aide à l’évaluation et ne remplacent pas une expertise immobilière professionnelle.";
const clean = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[–—]/g, '-').replace(/[^\x20-\x7E]/g, '');
const fmt = (value: unknown) => Number(value || 0).toLocaleString('fr-FR', { maximumFractionDigits: 1 });

export async function GET(request: NextRequest) {
  try {
    const candidate = request.nextUrl.searchParams.get('period') as Period;
    const period = candidate in periodDays ? candidate : '30d';
    const data: any = await getOverview(period);
    const pdf = await PDFDocument.create(); const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold); const navy = rgb(.059,.09,.165); const blue = rgb(.114,.306,.847);
    let page = pdf.addPage([595,842]); let y=780;
    const text=(value:string,size=10,color=navy,font=regular,x=52)=>{page.drawText(clean(value),{x,y,size,font,color,maxWidth:490});y-=size+8};
    const newPage=()=>{page=pdf.addPage([595,842]);y=790}; const guard=(space=70)=>{if(y<space)newPage()};
    page.drawRectangle({x:0,y:812,width:595,height:30,color:navy}); page.drawRectangle({x:52,y:758,width:48,height:5,color:blue});
    text('MAISONDELUX',13,blue,bold); text('Rapport analytique MaisonDeLUX',24,navy,bold); text(`Generation : ${new Date().toLocaleDateString('fr-FR')}  |  Periode : ${period}`,10,rgb(.4,.45,.55)); y-=18;
    text('Synthese executive',15,navy,bold); text(data.configured ? `Le rapport consolide ${fmt(data.kpis?.total)} estimations anonymes enregistrees sur la periode selectionnee.` : "Le stockage analytique n'est pas configure. Aucun indicateur de production n'est presente.",10); y-=12;
    text('Indicateurs cles',15,navy,bold);
    const k=data.kpis||{}; for(const [label,value] of [['Total des estimations',fmt(k.total)],['Estimations aujourd hui',fmt(k.today)],['Prix estime moyen',`${fmt(k.avg_price)} MAD`],['Prix median',`${fmt(k.median_price)} MAD`],['Surface moyenne',`${fmt(k.avg_surface)} m2`],['Villes utilisees',fmt(k.cities)]]){guard();text(`${label} : ${value}`,11,navy,bold)}
    y-=12; guard(180); text('Territoires les plus actifs',15,navy,bold); for(const row of (data.regions||[]).slice(0,8)){text(`${row.name}  -  ${row.count} estimations`,10)}
    guard(180); text('Villes les plus estimees',15,navy,bold); for(const row of (data.cities||[]).slice(0,8)){text(`${row.name}  -  ${row.count} (${fmt(row.percentage)} %)`,10)}
    guard(240); text('Performance du modele - jeu de test',15,navy,bold); text(`${modelMetadata.model_name} / v1 - metriques historiques, distinctes des usages live.`,10); const m:any=modelMetadata.test_metrics;
    for(const [label,value] of [['R2',fmt(m.R2)],['MAE',`${fmt(m.MAE)} MAD`],['RMSE',`${fmt(m.RMSE)} MAD`],['MedianAE',`${fmt(m.MedianAE)} MAD`],['MdAPE',`${fmt(m.MdAPE_pct)} %`],['Dans +/- 10%',`${fmt(m.Within_10_pct)} %`],['Dans +/- 20%',`${fmt(m.Within_20_pct)} %`],['Dans +/- 30%',`${fmt(m.Within_30_pct)} %`]])text(`${label} : ${value}`,10);
    guard(200); text("Observations d'amelioration",15,navy,bold); text("Prioriser l'enrichissement des quartiers non repertories et surveiller la concentration geographique des usages. Ces constats decrivent la couverture des donnees, pas une baisse mesuree de precision live.",10); y-=16;
    guard(150); text('Note methodologique',14,navy,bold); text(disclaimer,9,rgb(.35,.4,.48));
    for(const p of pdf.getPages()){p.drawLine({start:{x:52,y:38},end:{x:543,y:38},thickness:.5,color:rgb(.85,.87,.9)});p.drawText('MaisonDeLUX - Analyse interne',{x:52,y:22,size:8,font:regular,color:rgb(.45,.5,.58)});}
    const bytes=await pdf.save(); const filename=`MaisonDeLUX_Rapport_${new Date().toISOString().slice(0,10)}.pdf`;
    return new NextResponse(bytes as BodyInit,{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${filename}"`}});
  } catch(error){console.error('PDF report:',error);return NextResponse.json({error:'Rapport indisponible.'},{status:500})}
}
