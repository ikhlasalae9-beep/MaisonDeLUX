import { ageLabel,conditionLabel,propertyTypeLabel } from '@/lib/account/presentation';
import { formatArea,formatDate,formatInteger } from '@/lib/utils';

export type PassportExportSource={
  created_at:string;
  estimated_price_mad:number|string;
  model_version?:string;
  input_features:{neighborhood:string;property_type:string;area:number;rooms?:number;bedrooms?:number;bathrooms?:number;floor?:number;current_state?:string|null;age?:string|null};
  prediction?:Record<string,any>|null;
  context?:Record<string,any>|null;
};

export type PassportExportData={
  locale:string;rtl:boolean;city:string;neighborhood:string;propertyType:string;area:number;rooms?:number;bedrooms?:number;bathrooms?:number;floor?:number;condition?:string;age?:string;
  estimatedValue:number;pricePerM2:number|null;date:string;isoDate:string;modelVersion:string;
  market:null|{neighborhood:string;listingCount:number;medianPerM2:number};
  comparables:Array<{neighborhood:string;propertyType:string;area:number;rooms?:number;bedrooms?:number;price:number;sameNeighborhood:boolean;areaDifference:number}>;
};

const COLORS={navy:'#101b2d',blue:'#1e3a8a',lightBlue:'#dbeafe',ink:'#1c1917',muted:'#57534e',soft:'#f5f5f4',border:'#dedbd7',white:'#ffffff'};
const CARD={width:1080,height:1350};
const A4={width:1240,height:1754};

export function createPassportExportData(source:PassportExportSource,locale:string):PassportExportData{
  const ar=locale==='ar',input=source.input_features,price=Number(source.estimated_price_mad),area=Number(input.area),context=source.context||{},prediction=source.prediction||{};
  const rawMarket=context.market_context||prediction.market_context;
  const market=rawMarket?.benchmark_eligible?{neighborhood:String(rawMarket.neighborhood||input.neighborhood),listingCount:Number(rawMarket.listing_count)||0,medianPerM2:Number(rawMarket.median_listing_price_per_m2)||0}:null;
  const rawComparables=Array.isArray(context.comparables)?context.comparables:Array.isArray(prediction.comparables)?prediction.comparables:[];
  const date=new Date(source.created_at),validDate=!Number.isNaN(date.getTime());
  return {locale,rtl:ar,city:ar?'الدار البيضاء':'Casablanca',neighborhood:String(input.neighborhood||''),propertyType:propertyTypeLabel(input.property_type,locale),area,
    rooms:finite(input.rooms),bedrooms:finite(input.bedrooms),bathrooms:finite(input.bathrooms),floor:finite(input.floor),condition:input.current_state?conditionLabel(input.current_state,locale):undefined,age:input.age?ageLabel(input.age,locale):undefined,
    estimatedValue:Number.isFinite(price)?price:0,pricePerM2:area>0&&Number.isFinite(price)?price/area:null,date:formatDate(source.created_at,locale),isoDate:validDate?date.toISOString().slice(0,10):'date',modelVersion:String(source.model_version||prediction.model_version||'—'),market,
    comparables:rawComparables.slice(0,3).map((item:any)=>({neighborhood:String(item.neighborhood||''),propertyType:propertyTypeLabel(item.property_type,locale),area:Number(item.area)||0,rooms:finite(item.rooms),bedrooms:finite(item.bedrooms),price:Number(item.listing_price_mad)||0,sameNeighborhood:item.same_neighborhood===true,areaDifference:Number(item.area_difference_m2)||0}))};
}

export function safeFilenameSegment(value:string){
  const cleaned=value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Za-z0-9\u0600-\u06FF]+/g,'-').replace(/^-+|-+$/g,'').slice(0,64);
  return cleaned||'Passeport';
}

export function passportExportFilename(kind:'Passeport'|'Carte',data:PassportExportData,extension:'pdf'|'png'){
  return `MaisonDeLUX-${kind}-${safeFilenameSegment(data.city)}-${safeFilenameSegment(data.neighborhood)}-${data.isoDate}.${extension}`;
}

export async function downloadPassportPng(source:PassportExportSource,locale:string){
  const data=createPassportExportData(source,locale),logo=await prepare('/brand/logo/maisondelux-logo-white.png'),canvas=renderCard(data,logo),blob=await canvasPngBlob(canvas);
  download(blob,passportExportFilename('Carte',data,'png'));
}

export async function downloadPassportPdf(source:PassportExportSource,locale:string){
  const data=createPassportExportData(source,locale),[whiteLogo,primaryLogo]=await Promise.all([prepare('/brand/logo/maisondelux-logo-white.png'),prepare('/brand/logo/maisondelux-logo-primary.png')]);
  const canvases=renderPdfPages(data,whiteLogo,primaryLogo),{PDFDocument}=await import('pdf-lib'),documentPdf=await PDFDocument.create();
  for(const canvas of canvases){const png=await canvasPngBlob(canvas),image=await documentPdf.embedPng(await png.arrayBuffer()),page=documentPdf.addPage([595.28,841.89]);page.drawImage(image,{x:0,y:0,width:595.28,height:841.89});}
  const bytes=await documentPdf.save({useObjectStreams:true});
  const pdfBuffer=new ArrayBuffer(bytes.byteLength);new Uint8Array(pdfBuffer).set(bytes);
  download(new Blob([pdfBuffer],{type:'application/pdf'}),passportExportFilename('Passeport',data,'pdf'));
}

export function renderCard(data:PassportExportData,logo:HTMLImageElement){
  const canvas=createCanvas(CARD.width,CARD.height),ctx=canvas.getContext('2d')!;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.fillStyle=COLORS.navy;ctx.fillRect(0,0,CARD.width,CARD.height);
  ctx.globalAlpha=.55;ctx.fillStyle=COLORS.blue;ctx.beginPath();ctx.arc(930,130,300,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;containImage(ctx,logo,70,65,440,110);
  const x=data.rtl?1010:70,align=data.rtl?'right':'left',dir=data.rtl?'rtl':'ltr';
  text(ctx,data.rtl?'جواز عقاري':'PASSEPORT IMMOBILIER',x,285,32,COLORS.white,700,align,dir);line(ctx,70,365,1010,365,'rgba(255,255,255,.18)');
  text(ctx,data.city,x,465,34,'rgba(255,255,255,.78)',600,align,dir);text(ctx,data.neighborhood,x,520,34,COLORS.white,700,align,'ltr');
  text(ctx,data.propertyType,x,600,30,'rgba(255,255,255,.76)',600,align,dir);text(ctx,formatArea(data.area,data.locale),x,650,28,'rgba(255,255,255,.62)',500,align,'ltr');
  text(ctx,mad(data.estimatedValue,data.locale),x,800,64,COLORS.white,800,align,'ltr');if(data.pricePerM2!==null)text(ctx,`${formatInteger(data.pricePerM2,data.locale)} MAD/m²`,x,865,30,COLORS.lightBlue,700,align,'ltr');
  line(ctx,70,955,1010,955,'rgba(255,255,255,.18)');text(ctx,data.rtl?'تقدير إرشادي':'Estimation indicative',x,1050,28,'rgba(255,255,255,.76)',600,align,dir);text(ctx,data.date,x,1105,26,'rgba(255,255,255,.58)',500,align,dir);text(ctx,'maison-delux.com',x,1240,22,'rgba(255,255,255,.42)',500,align,'ltr');
  return canvas;
}

export function renderPdfPages(data:PassportExportData,whiteLogo:HTMLImageElement,primaryLogo:HTMLImageElement){
  return [renderPdfPageOne(data,whiteLogo),renderPdfPageTwo(data,primaryLogo)];
}

function renderPdfPageOne(data:PassportExportData,logo:HTMLImageElement){
  const canvas=createCanvas(A4.width,A4.height),ctx=canvas.getContext('2d')!;quality(ctx);ctx.fillStyle=COLORS.white;ctx.fillRect(0,0,A4.width,A4.height);ctx.fillStyle=COLORS.navy;ctx.fillRect(0,0,A4.width,245);containImage(ctx,logo,80,55,430,105);
  const x=data.rtl?1160:80,align=data.rtl?'right':'left',dir=data.rtl?'rtl':'ltr';text(ctx,data.rtl?'جواز عقاري MaisonDeLUX':'PASSEPORT IMMOBILIER MAISONDELUX',x,190,27,'rgba(255,255,255,.74)',700,align,dir);
  text(ctx,data.city,x,335,28,COLORS.muted,600,align,dir);text(ctx,data.neighborhood,x,385,42,COLORS.ink,800,align,'ltr');text(ctx,data.propertyType,x,440,30,COLORS.muted,600,align,dir);text(ctx,data.date,x,490,23,COLORS.muted,500,align,dir);
  rounded(ctx,80,560,1080,300,24,COLORS.navy);text(ctx,data.rtl?'تقدير إرشادي':'ESTIMATION INDICATIVE',x,640,24,'rgba(255,255,255,.65)',700,align,dir);text(ctx,mad(data.estimatedValue,data.locale),x,750,62,COLORS.white,800,align,'ltr');if(data.pricePerM2!==null)text(ctx,`${formatInteger(data.pricePerM2,data.locale)} MAD/m²`,x,810,27,COLORS.lightBlue,700,align,'ltr');
  text(ctx,data.rtl?'خصائص العقار':'CARACTÉRISTIQUES DU BIEN',x,950,25,COLORS.blue,800,align,dir);const fields=characteristics(data),cellW=510,cellH=105,startY=990;
  fields.forEach((field,index)=>{const column=index%2,row=Math.floor(index/2),left=80+column*(cellW+60),top=startY+row*cellH;rounded(ctx,left,top,cellW,82,14,COLORS.soft);const fieldX=data.rtl?left+cellW-24:left+24;text(ctx,field[0],fieldX,top+31,18,COLORS.muted,600,data.rtl?'right':'left',dir);text(ctx,field[1],fieldX,top+62,23,COLORS.ink,700,data.rtl?'right':'left',field[2]||dir);});
  const disclaimer=data.rtl?'هذا التقدير قيمة إحصائية إرشادية ينتجها نموذج MaisonDeLUX. لا يمثل خبرة رسمية أو سعراً نهائياً أو سعر معاملة.':'Cette estimation est une valeur statistique indicative produite par le modèle MaisonDeLUX. Elle ne constitue ni une expertise officielle, ni un prix définitif, ni un prix de transaction.';
  line(ctx,80,1585,1160,1585,COLORS.border);wrap(ctx,disclaimer,x,1630,1080,23,34,COLORS.muted,500,data.rtl?'right':'left',dir);text(ctx,'MaisonDeLUX · maison-delux.com',x,1715,18,COLORS.muted,500,align,'ltr');return canvas;
}

function renderPdfPageTwo(data:PassportExportData,logo:HTMLImageElement){
  const canvas=createCanvas(A4.width,A4.height),ctx=canvas.getContext('2d')!;quality(ctx);ctx.fillStyle=COLORS.white;ctx.fillRect(0,0,A4.width,A4.height);containImage(ctx,logo,80,45,360,85);
  const x=data.rtl?1160:80,align=data.rtl?'right':'left',dir=data.rtl?'rtl':'ltr';text(ctx,data.rtl?'الأدلة والشفافية':'CONTEXTE ET TRANSPARENCE',x,175,29,COLORS.blue,800,align,dir);let y=245;
  if(data.market){text(ctx,data.rtl?'سياق السوق':'CONTEXTE DU MARCHÉ',x,y,25,COLORS.ink,800,align,dir);y+=55;text(ctx,data.rtl?data.market.neighborhood:`Quartier · ${data.market.neighborhood}`,x,y,26,COLORS.ink,700,align,data.rtl?'ltr':'ltr');y+=45;text(ctx,`${formatInteger(data.market.medianPerM2,data.locale)} MAD/m²`,x,y,31,COLORS.blue,800,align,'ltr');y+=38;text(ctx,`${formatInteger(data.market.listingCount,data.locale)} ${data.rtl?'إعلاناً محللاً':'annonces analysées'}`,x,y,21,COLORS.muted,600,align,dir);y+=55;wrap(ctx,data.rtl?'أسعار معروضة في الإعلانات وليست أسعار معاملات. هذه البيانات لا تؤثر في تقدير النموذج.':"Prix affichés dans les annonces, et non prix de transaction. Ces données n'influencent pas l'estimation du modèle.",x,y,1080,21,31,COLORS.muted,500,align,dir);y+=105;line(ctx,80,y,1160,y,COLORS.border);y+=65;}
  if(data.comparables.length){text(ctx,data.rtl?'إعلانات عقارية مشابهة':'ANNONCES COMPARABLES',x,y,25,COLORS.ink,800,align,dir);y+=45;for(const item of data.comparables){rounded(ctx,80,y,1080,128,14,COLORS.soft);const itemX=data.rtl?1128:112;text(ctx,item.neighborhood,itemX,y+37,23,COLORS.ink,700,data.rtl?'right':'left','ltr');text(ctx,`${item.propertyType} · ${formatArea(item.area,data.locale)}`,itemX,y+72,20,COLORS.muted,600,data.rtl?'right':'left',dir);text(ctx,mad(item.price,data.locale),itemX,y+107,24,COLORS.blue,800,data.rtl?'right':'left','ltr');y+=148;}y+=35;line(ctx,80,y,1160,y,COLORS.border);y+=65;}
  text(ctx,data.rtl?'شفافية النموذج':'TRANSPARENCE DU MODÈLE',x,y,25,COLORS.ink,800,align,dir);y+=48;wrap(ctx,data.rtl?'تقدير إرشادي صادر عن نموذج خاص بمدينة الدار البيضاء. سياق الإعلانات منفصل عن حساب النموذج.':'Estimation indicative produite par un modèle spécifique à Casablanca. Le contexte des annonces est distinct du calcul du modèle.',x,y,1080,22,33,COLORS.muted,500,align,dir);y+=90;text(ctx,`${data.rtl?'إصدار النموذج':'Version du modèle'} · ${data.modelVersion}`,x,y,20,COLORS.muted,600,align,'ltr');text(ctx,'MaisonDeLUX · maison-delux.com',x,1705,18,COLORS.muted,500,align,'ltr');return canvas;
}

function characteristics(data:PassportExportData):Array<[label:string,value:string,direction?:'ltr'|'rtl']>{
  const ar=data.rtl,values:Array<[label:string,value:string,direction?:'ltr'|'rtl']>=[[ar?'المساحة':'Surface',formatArea(data.area,data.locale),'ltr']];
  if(data.rooms!==undefined)values.push([ar?'الغرف':'Pièces',formatInteger(data.rooms,data.locale),'ltr']);if(data.bedrooms!==undefined)values.push([ar?'غرف النوم':'Chambres',formatInteger(data.bedrooms,data.locale),'ltr']);if(data.bathrooms!==undefined)values.push([ar?'الحمامات':'Salles de bain',formatInteger(data.bathrooms,data.locale),'ltr']);if(data.floor!==undefined)values.push([ar?'الطابق':'Étage',formatInteger(data.floor,data.locale),'ltr']);if(data.condition)values.push([ar?'الحالة':'État',data.condition,ar?'rtl':'ltr']);if(data.age)values.push([ar?'العمر':'Âge',data.age,ar?'rtl':'ltr']);return values;
}

function finite(value:unknown){const number=Number(value);return value==null||value===''||!Number.isFinite(number)?undefined:number;}
function mad(value:number,locale:string){return `${formatInteger(value,locale)} MAD`;}
function createCanvas(width:number,height:number){const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;return canvas;}
function quality(ctx:CanvasRenderingContext2D){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';}
async function prepare(path:string){await document.fonts.ready;const image=new Image();image.decoding='async';image.src=path;await image.decode();return image;}
function containImage(ctx:CanvasRenderingContext2D,image:HTMLImageElement,x:number,y:number,width:number,height:number){const scale=Math.min(width/image.naturalWidth,height/image.naturalHeight),w=image.naturalWidth*scale,h=image.naturalHeight*scale;ctx.drawImage(image,x,y+(height-h)/2,w,h);}
function text(ctx:CanvasRenderingContext2D,value:string,x:number,y:number,size:number,color:string,weight:number,align:CanvasTextAlign,direction:CanvasDirection){ctx.save();ctx.fillStyle=color;ctx.font=`${weight} ${size}px ${direction==='rtl'?'"IBM Plex Sans Arabic", ':''}"Plus Jakarta Sans", Arial, sans-serif`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.direction=direction;ctx.fillText(value,x,y);ctx.restore();}
function wrap(ctx:CanvasRenderingContext2D,value:string,x:number,y:number,maxWidth:number,size:number,lineHeight:number,color:string,weight:number,align:CanvasTextAlign,direction:CanvasDirection){ctx.save();ctx.fillStyle=color;ctx.font=`${weight} ${size}px ${direction==='rtl'?'"IBM Plex Sans Arabic", ':''}"Plus Jakarta Sans", Arial, sans-serif`;ctx.textAlign=align;ctx.direction=direction;const words=value.split(/\s+/),lines:string[]=[];let current='';for(const word of words){const test=current?`${current} ${word}`:word;if(ctx.measureText(test).width>maxWidth&&current){lines.push(current);current=word;}else current=test;}if(current)lines.push(current);lines.forEach((item,index)=>ctx.fillText(item,x,y+index*lineHeight));ctx.restore();return lines.length;}
function line(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string){ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function rounded(ctx:CanvasRenderingContext2D,x:number,y:number,width:number,height:number,radius:number,color:string){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x+radius,y);ctx.arcTo(x+width,y,x+width,y+height,radius);ctx.arcTo(x+width,y+height,x,y+height,radius);ctx.arcTo(x,y+height,x,y,radius);ctx.arcTo(x,y,x+width,y,radius);ctx.closePath();ctx.fill();}
function canvasPngBlob(canvas:HTMLCanvasElement){return new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('EXPORT_FAILED')),'image/png'));}
function download(blob:Blob,name:string){const url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download=name;document.body.appendChild(anchor);anchor.click();anchor.remove();window.setTimeout(()=>URL.revokeObjectURL(url),0);}
