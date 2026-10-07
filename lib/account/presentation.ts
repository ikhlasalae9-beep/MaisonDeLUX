export function propertyTypeLabel(value:unknown,locale:string){
  const raw=String(value||'');
  if(locale!=='ar')return raw;
  const labels:Record<string,string>={appartement:'شقة',appartements:'شقة',villa:'فيلا',villas:'فيلا'};
  return labels[raw.toLocaleLowerCase('fr')]||raw;
}

export function conditionLabel(value:unknown,locale:string){
  const raw=String(value||'');
  if(locale!=='ar')return raw;
  const labels:Record<string,string>={'bon état':'حالة جيدة','nouveau':'جديد','neuf':'جديد','à rénover':'يحتاج إلى تجديد'};
  return labels[raw.toLocaleLowerCase('fr')]||raw;
}

export function ageLabel(value:unknown,locale:string){
  const raw=String(value||'');
  if(locale!=='ar')return raw;
  const labels:Record<string,string>={'0-5 ans':'من 0 إلى 5 سنوات','+10 ans':'أكثر من 10 سنوات',"moins d'un an":'أقل من سنة','1-5 ans':'من سنة إلى 5 سنوات','5-10 ans':'من 5 إلى 10 سنوات','10-20 ans':'من 10 إلى 20 سنة','20-30 ans':'من 20 إلى 30 سنة','30-50 ans':'من 30 إلى 50 سنة','50-70 ans':'من 50 إلى 70 سنة'};
  return labels[raw.toLocaleLowerCase('fr')]||raw;
}

export function cityLabel(value: unknown, locale: string) {
  const city = String(value || '');
  return locale === 'ar' ? ({ Casablanca: 'الدار البيضاء', Marrakech: 'مراكش' } as Record<string,string>)[city] || city : city;
}
