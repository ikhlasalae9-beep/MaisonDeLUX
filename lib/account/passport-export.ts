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
  estimatedValue:number;pricePerM2:number|null;date:string;isoDate:string;
  market:null|{neighborhood:string;listingCount:number;medianPerM2:number};
  comparables:Array<{neighborhood:string;propertyType:string;area:number;rooms?:number;bedrooms?:number;price:number;sameNeighborhood:boolean;areaDifference:number}>;
};

const COLORS={navy:'#101b2d',blue:'#1e3a8a',lightBlue:'#dbeafe',ink:'#1c1917',muted:'#57534e',soft:'#f5f5f4',border:'#dedbd7',white:'#ffffff'};
const CARD={width:1080,height:1350};
const A4={width:1240,height:1754};
const CARD_MARGIN=70;
const PAGE_MARGIN_X=112;
const PAGE_MARGIN_TOP=100;
const PAGE_MARGIN_BOTTOM=100;
const PAGE_LEFT=PAGE_MARGIN_X;
const PAGE_RIGHT=A4.width-PAGE_MARGIN_X;
const PAGE_CONTENT_WIDTH=PAGE_RIGHT-PAGE_LEFT;
const PANEL_INNER_PADDING=42;

export function createPassportExportData(source:PassportExportSource,locale:string):PassportExportData{
  const ar=locale==='ar',input=source.input_features,price=Number(source.estimated_price_mad),area=Number(input.area),context=source.context||{},prediction=source.prediction||{};
  const rawMarket=context.market_context||prediction.market_context;
  const market=rawMarket?.benchmark_eligible?{neighborhood:String(rawMarket.neighborhood||input.neighborhood),listingCount:Number(rawMarket.listing_count)||0,medianPerM2:Number(rawMarket.median_listing_price_per_m2)||0}:null;
  const rawComparables=Array.isArray(context.comparables)?context.comparables:Array.isArray(prediction.comparables)?prediction.comparables:[];
  const date=new Date(source.created_at),validDate=!Number.isNaN(date.getTime());
  return {locale,rtl:ar,city:ar?'الدار البيضاء':'Casablanca',neighborhood:String(input.neighborhood||''),propertyType:propertyTypeLabel(input.property_type,locale),area,
    rooms:finite(input.rooms),bedrooms:finite(input.bedrooms),bathrooms:finite(input.bathrooms),floor:finite(input.floor),condition:input.current_state?conditionLabel(input.current_state,locale):undefined,age:input.age?ageLabel(input.age,locale):undefined,
    estimatedValue:Number.isFinite(price)?price:0,pricePerM2:area>0&&Number.isFinite(price)?price/area:null,date:formatDate(source.created_at,locale),isoDate:validDate?date.toISOString().slice(0,10):'date',market,
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
  const cardRight=CARD.width-CARD_MARGIN,contentWidth=cardRight-CARD_MARGIN,x=data.rtl?cardRight:CARD_MARGIN,align=data.rtl?'right':'left',dir=data.rtl?'rtl':'ltr';
  ctx.globalAlpha=.55;ctx.fillStyle=COLORS.blue;ctx.beginPath();ctx.arc(950,100,230,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;containImage(ctx,logo,CARD_MARGIN,62,495,124);
  if(data.rtl){
    text(ctx,'جواز عقاري',x,390,40,COLORS.white,700,align,dir,contentWidth);line(ctx,CARD_MARGIN,460,cardRight,460,'rgba(255,255,255,.18)');
    text(ctx,data.city,x,550,41,'rgba(255,255,255,.82)',650,align,dir,contentWidth);text(ctx,data.neighborhood,x,610,36,COLORS.white,700,align,'ltr',contentWidth);
    text(ctx,data.propertyType,x,695,36,'rgba(255,255,255,.78)',600,align,dir,contentWidth);text(ctx,formatArea(data.area,data.locale),x,750,31,'rgba(255,255,255,.67)',500,align,'ltr',contentWidth);
    text(ctx,mad(data.estimatedValue,data.locale),x,900,64,COLORS.white,800,align,'ltr',contentWidth);if(data.pricePerM2!==null)text(ctx,`${formatInteger(data.pricePerM2,data.locale)} MAD/m²`,x,970,33,COLORS.lightBlue,700,align,'ltr',contentWidth);
    line(ctx,CARD_MARGIN,1045,cardRight,1045,'rgba(255,255,255,.18)');text(ctx,'تقدير إرشادي',x,1140,34,'rgba(255,255,255,.8)',600,align,dir,contentWidth);arabicCardDate(ctx,data,x,1204,32,'rgba(255,255,255,.64)',500,contentWidth);text(ctx,'maison-delux.com',x,1280,24,'rgba(255,255,255,.5)',500,align,'ltr',contentWidth);
  }else{
    text(ctx,'PASSEPORT IMMOBILIER',x,360,36,COLORS.white,700,align,dir,contentWidth);line(ctx,CARD_MARGIN,430,cardRight,430,'rgba(255,255,255,.18)');
    text(ctx,data.city,x,520,38,'rgba(255,255,255,.82)',650,align,dir,contentWidth);text(ctx,data.neighborhood,x,580,36,COLORS.white,700,align,'ltr',contentWidth);
    text(ctx,data.propertyType,x,665,33,'rgba(255,255,255,.78)',600,align,dir,contentWidth);text(ctx,formatArea(data.area,data.locale),x,720,31,'rgba(255,255,255,.67)',500,align,'ltr',contentWidth);
    text(ctx,mad(data.estimatedValue,data.locale),x,870,64,COLORS.white,800,align,'ltr',contentWidth);if(data.pricePerM2!==null)text(ctx,`${formatInteger(data.pricePerM2,data.locale)} MAD/m²`,x,940,33,COLORS.lightBlue,700,align,'ltr',contentWidth);
    line(ctx,CARD_MARGIN,1015,cardRight,1015,'rgba(255,255,255,.18)');text(ctx,'Estimation indicative',x,1110,31,'rgba(255,255,255,.8)',600,align,dir,contentWidth);text(ctx,data.date,x,1172,29,'rgba(255,255,255,.64)',500,align,dir,contentWidth);text(ctx,'maison-delux.com',x,1260,24,'rgba(255,255,255,.5)',500,align,'ltr',contentWidth);
  }
  return canvas;
}

export function renderPdfPages(data:PassportExportData,whiteLogo:HTMLImageElement,primaryLogo:HTMLImageElement){
  return [renderPdfPageOne(data,whiteLogo),renderPdfPageTwo(data,primaryLogo)];
}

function renderPdfPageOne(data:PassportExportData,logo:HTMLImageElement){
  const canvas=createCanvas(A4.width,A4.height),ctx=canvas.getContext('2d')!;quality(ctx);ctx.fillStyle=COLORS.white;ctx.fillRect(0,0,A4.width,A4.height);ctx.fillStyle=COLORS.navy;ctx.fillRect(0,0,A4.width,270);containImage(ctx,logo,PAGE_LEFT,PAGE_MARGIN_TOP-28,400,100);
  const x=data.rtl?PAGE_RIGHT:PAGE_LEFT,align=data.rtl?'right':'left',dir=data.rtl?'rtl':'ltr';text(ctx,data.rtl?'جواز عقاري MaisonDeLUX':'PASSEPORT IMMOBILIER MAISONDELUX',x,220,29,'rgba(255,255,255,.78)',700,align,dir,PAGE_CONTENT_WIDTH);
  text(ctx,data.city,x,360,30,COLORS.muted,600,align,dir,PAGE_CONTENT_WIDTH);text(ctx,data.neighborhood,x,416,44,COLORS.ink,800,align,'ltr',PAGE_CONTENT_WIDTH);text(ctx,data.propertyType,x,474,32,COLORS.muted,600,align,dir,PAGE_CONTENT_WIDTH);text(ctx,data.date,x,522,25,COLORS.muted,500,align,dir,PAGE_CONTENT_WIDTH);
  const panelTop=580,panelHeight=310,panelLeft=PAGE_LEFT,panelRight=PAGE_RIGHT,panelX=data.rtl?panelRight-PANEL_INNER_PADDING:panelLeft+PANEL_INNER_PADDING,panelTextWidth=PAGE_CONTENT_WIDTH-PANEL_INNER_PADDING*2;
  rounded(ctx,panelLeft,panelTop,PAGE_CONTENT_WIDTH,panelHeight,24,COLORS.navy);text(ctx,data.rtl?'تقدير إرشادي':'ESTIMATION INDICATIVE',panelX,665,26,'rgba(255,255,255,.7)',700,align,dir,panelTextWidth);text(ctx,mad(data.estimatedValue,data.locale),panelX,774,62,COLORS.white,800,align,'ltr',panelTextWidth);if(data.pricePerM2!==null)text(ctx,`${formatInteger(data.pricePerM2,data.locale)} MAD/m²`,panelX,835,29,COLORS.lightBlue,700,align,'ltr',panelTextWidth);
  text(ctx,data.rtl?'خصائص العقار':'CARACTÉRISTIQUES DU BIEN',x,985,27,COLORS.blue,800,align,dir,PAGE_CONTENT_WIDTH);const fields=characteristics(data),cellGap=48,cellW=(PAGE_CONTENT_WIDTH-cellGap)/2,cellStep=104,startY=1030;
  fields.forEach((field,index)=>{const column=index%2,row=Math.floor(index/2),left=PAGE_LEFT+column*(cellW+cellGap),top=startY+row*cellStep;rounded(ctx,left,top,cellW,88,14,COLORS.soft);const fieldX=data.rtl?left+cellW-28:left+28;text(ctx,field[0],fieldX,top+34,20,COLORS.muted,600,data.rtl?'right':'left',dir,cellW-56);text(ctx,field[1],fieldX,top+68,24,COLORS.ink,700,data.rtl?'right':'left',field[2]||dir,cellW-56);});
  const disclaimer=data.rtl?'هذا التقدير قيمة إحصائية إرشادية ينتجها نموذج MaisonDeLUX. لا يمثل خبرة رسمية أو سعراً نهائياً أو سعر معاملة.':'Cette estimation est une valeur statistique indicative produite par le modèle MaisonDeLUX. Elle ne constitue ni une expertise officielle, ni un prix définitif, ni un prix de transaction.';
  line(ctx,PAGE_LEFT,1490,PAGE_RIGHT,1490,COLORS.border);wrap(ctx,disclaimer,x,1535,PAGE_CONTENT_WIDTH,25,36,COLORS.muted,500,align,dir);pdfFooter(ctx,data,1);return canvas;
}

function renderPdfPageTwo(data:PassportExportData,logo:HTMLImageElement){
  const canvas=createCanvas(A4.width,A4.height),ctx=canvas.getContext('2d')!;quality(ctx);ctx.fillStyle=COLORS.white;ctx.fillRect(0,0,A4.width,A4.height);containImage(ctx,logo,PAGE_LEFT,PAGE_MARGIN_TOP-30,360,85);
  const x=data.rtl?PAGE_RIGHT:PAGE_LEFT,align=data.rtl?'right':'left',dir=data.rtl?'rtl':'ltr';text(ctx,data.rtl?'الأدلة والشفافية':'CONTEXTE ET TRANSPARENCE',x,205,31,COLORS.blue,800,align,dir,PAGE_CONTENT_WIDTH);let y=292;
  if(data.market){text(ctx,data.rtl?'سياق السوق':'CONTEXTE DU MARCHÉ',x,y,27,COLORS.ink,800,align,dir,PAGE_CONTENT_WIDTH);y+=58;text(ctx,data.rtl?data.market.neighborhood:`Quartier · ${data.market.neighborhood}`,x,y,27,COLORS.ink,700,align,'ltr',PAGE_CONTENT_WIDTH);y+=48;text(ctx,`${formatInteger(data.market.medianPerM2,data.locale)} MAD/m²`,x,y,32,COLORS.blue,800,align,'ltr',PAGE_CONTENT_WIDTH);y+=42;text(ctx,`${formatInteger(data.market.listingCount,data.locale)} ${data.rtl?'إعلاناً محللاً':'annonces analysées'}`,x,y,23,COLORS.muted,600,align,dir,PAGE_CONTENT_WIDTH);y+=58;wrap(ctx,data.rtl?'أسعار معروضة في الإعلانات وليست أسعار معاملات. هذه البيانات لا تؤثر في تقدير النموذج.':"Prix affichés dans les annonces, et non prix de transaction. Ces données n'influencent pas l'estimation du modèle.",x,y,PAGE_CONTENT_WIDTH,23,34,COLORS.muted,500,align,dir);y+=112;line(ctx,PAGE_LEFT,y,PAGE_RIGHT,y,COLORS.border);y+=68;}
  if(data.comparables.length){text(ctx,data.rtl?'إعلانات عقارية مشابهة':'ANNONCES COMPARABLES',x,y,27,COLORS.ink,800,align,dir,PAGE_CONTENT_WIDTH);y+=50;for(const item of data.comparables){rounded(ctx,PAGE_LEFT,y,PAGE_CONTENT_WIDTH,140,14,COLORS.soft);const itemX=data.rtl?PAGE_RIGHT-32:PAGE_LEFT+32,cardTextWidth=PAGE_CONTENT_WIDTH-64;text(ctx,item.neighborhood,itemX,y+42,25,COLORS.ink,700,data.rtl?'right':'left','ltr',cardTextWidth);text(ctx,`${item.propertyType} · ${formatArea(item.area,data.locale)}`,itemX,y+82,22,COLORS.muted,600,data.rtl?'right':'left',dir,cardTextWidth);text(ctx,mad(item.price,data.locale),itemX,y+120,27,COLORS.blue,800,data.rtl?'right':'left','ltr',cardTextWidth);y+=160;}y+=38;line(ctx,PAGE_LEFT,y,PAGE_RIGHT,y,COLORS.border);y+=68;}
  text(ctx,data.rtl?'شفافية النموذج':'TRANSPARENCE DU MODÈLE',x,y,27,COLORS.ink,800,align,dir,PAGE_CONTENT_WIDTH);y+=52;wrap(ctx,data.rtl?'تقدير إرشادي ناتج عن نموذج عقاري مخصص لمدينة الدار البيضاء. يتم عرض سياق الإعلانات بشكل منفصل ولا يؤثر مباشرة على القيمة التقديرية المعروضة.':'Estimation indicative produite par un modèle immobilier spécifique à Casablanca. Le contexte des annonces est présenté séparément et n’influence pas directement l’estimation affichée.',x,y,PAGE_CONTENT_WIDTH,24,35,COLORS.muted,500,align,dir);pdfFooter(ctx,data,2);return canvas;
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
function arabicCardDate(ctx:CanvasRenderingContext2D,data:PassportExportData,right:number,y:number,size:number,color:string,weight:number,maxWidth:number){
  const date=new Date(`${data.isoDate}T12:00:00Z`);if(Number.isNaN(date.getTime())){text(ctx,data.date,right,y,size,color,weight,'right','rtl',maxWidth);return;}
  const parts=new Intl.DateTimeFormat('ar-MA',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).formatToParts(date),value=(type:Intl.DateTimeFormatPartTypes)=>parts.find(part=>part.type===type)?.value||'';
  const tokens=[value('day'),value('month'),value('year')],gap=size*.32;ctx.save();ctx.fillStyle=color;ctx.font=`${weight} ${size}px "IBM Plex Sans Arabic", "Plus Jakarta Sans", Arial, sans-serif`;ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.direction='ltr';const widths=tokens.map(token=>ctx.measureText(token).width),total=Math.min(widths.reduce((sum,width)=>sum+width,0)+gap*2,maxWidth);let cursor=right-total;tokens.forEach((token,index)=>{ctx.fillText(token,cursor,y);cursor+=widths[index]+gap;});ctx.restore();
}
function text(ctx:CanvasRenderingContext2D,value:string,x:number,y:number,size:number,color:string,weight:number,align:CanvasTextAlign,direction:CanvasDirection,maxWidth?:number){ctx.save();ctx.fillStyle=color;ctx.font=`${weight} ${size}px ${direction==='rtl'?'"IBM Plex Sans Arabic", ':''}"Plus Jakarta Sans", Arial, sans-serif`;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.direction=direction;if(maxWidth)ctx.fillText(value,x,y,maxWidth);else ctx.fillText(value,x,y);ctx.restore();}
function wrap(ctx:CanvasRenderingContext2D,value:string,x:number,y:number,maxWidth:number,size:number,lineHeight:number,color:string,weight:number,align:CanvasTextAlign,direction:CanvasDirection){ctx.save();ctx.fillStyle=color;ctx.font=`${weight} ${size}px ${direction==='rtl'?'"IBM Plex Sans Arabic", ':''}"Plus Jakarta Sans", Arial, sans-serif`;ctx.textAlign=align;ctx.direction=direction;const words=value.split(/\s+/),lines:string[]=[];let current='';for(const word of words){const test=current?`${current} ${word}`:word;if(ctx.measureText(test).width>maxWidth&&current){lines.push(current);current=word;}else current=test;}if(current)lines.push(current);lines.forEach((item,index)=>ctx.fillText(item,x,y+index*lineHeight));ctx.restore();return lines.length;}
function pdfFooter(ctx:CanvasRenderingContext2D,data:PassportExportData,page:number){const y=A4.height-PAGE_MARGIN_BOTTOM-8,siteX=data.rtl?PAGE_RIGHT:PAGE_LEFT,pageX=data.rtl?PAGE_LEFT:PAGE_RIGHT;text(ctx,'MaisonDeLUX · maison-delux.com',siteX,y,19,COLORS.muted,500,data.rtl?'right':'left','ltr',PAGE_CONTENT_WIDTH);text(ctx,`${page} / 2`,pageX,y,18,COLORS.muted,500,data.rtl?'left':'right','ltr',120);}
function line(ctx:CanvasRenderingContext2D,x1:number,y1:number,x2:number,y2:number,color:string){ctx.strokeStyle=color;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
function rounded(ctx:CanvasRenderingContext2D,x:number,y:number,width:number,height:number,radius:number,color:string){ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(x+radius,y);ctx.arcTo(x+width,y,x+width,y+height,radius);ctx.arcTo(x+width,y+height,x,y+height,radius);ctx.arcTo(x,y+height,x,y,radius);ctx.arcTo(x,y,x+width,y,radius);ctx.closePath();ctx.fill();}
function canvasPngBlob(canvas:HTMLCanvasElement){return new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('EXPORT_FAILED')),'image/png'));}
function download(blob:Blob,name:string){const url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download=name;document.body.appendChild(anchor);anchor.click();anchor.remove();window.setTimeout(()=>URL.revokeObjectURL(url),0);}
