"""Reproduce the audited notebook cleaning and assert exact equality to supplied clean data. No model loading or dataset mutation."""
import pandas as pd, numpy as np, json
from pathlib import Path
folder=Path('ml/notebooks/rabat')
raw=pd.read_csv(folder/'mubawab_properties (2).csv'); supplied=pd.read_csv(folder/'mubawab_clean.csv')
funnel={'raw':len(raw)}
df=raw[['type','area','rooms','bedrooms','bathrooms','property_state','quartier','price']].copy()
def split(q):
 if pd.isna(q):return np.nan,np.nan
 q=' '.join(str(q).split())
 return tuple(v.strip() for v in q.split(' à ',1)) if ' à ' in q else (q.strip(),q.strip())
df[['Localisation','city']]=df.quartier.apply(lambda q:pd.Series(split(q)));df.drop(columns=['quartier'],inplace=True)
age_map={"Moins d'un an":.5,'1-5 ans':3,'5-10 ans':7.5,'10-20 ans':15,'20-30 ans':25,'30-50 ans':40,'50-70 ans':60,'70-100 ans':85,'Plus de 100 ans':110}
df['Age']=df.property_state.map(age_map);df.rename(columns={'property_state':'Current_state','type':'Type','area':'Area','rooms':'Rooms','bedrooms':'Bedrooms','bathrooms':'Bathrooms','price':'Price'},inplace=True)
df=df[['Type','Localisation','Area','Rooms','Bedrooms','Bathrooms','Current_state','Age','city','Price']]
df=df[df.Price.between(100000,60000000)&df.Area.between(15,3000)]
for c in ['Rooms','Bedrooms','Bathrooms']:df=df[df[c].isna()|df[c].between(0,20)]
funnel['after_bounds']=len(df)
df=df.dropna(subset=['Type','Area','Rooms','Bedrooms','Bathrooms','city','Price']).copy();funnel['essential_complete']=len(df)
median=float(df.Age.median()); df.Current_state=df.Current_state.fillna('Inconnu'); df.Age=df.Age.fillna(median);df.Localisation=df.Localisation.fillna(df.city)
df=df.drop_duplicates();funnel['deduplicated']=len(df)
df['ppm2']=df.Price/df.Area;bounds=df.groupby('Type').ppm2.quantile([.25,.75]).unstack();iqr=bounds[.75]-bounds[.25];low=bounds[.25]-.5*iqr;high=bounds[.75]+.5*iqr
df=df[df.ppm2.between(df.Type.map(low),df.Type.map(high))].drop(columns=['ppm2']);funnel['after_ppm2_iqr']=len(df)
try:pd.testing.assert_frame_equal(df.reset_index(drop=True),supplied,check_dtype=False);matched=True;difference=None
except AssertionError as ex:matched=False;difference=str(ex)[:1400]

import hashlib
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
assert matched, difference
rows=[{'id':str(raw.loc[i,'id']),'neighborhood':r.Localisation,'propertyType':r.Type,'price':float(r.Price),'area':float(r.Area)} for i,r in df.iterrows()]
assert len(set(r['id'] for r in rows))==len(rows)
result={'schemaVersion':1,'city':'Rabat','sources':[{'path':str(folder/f).replace('\\','/'),'sha256':sha(folder/f)} for f in ['mubawab_properties (2).csv','mubawab_clean.csv']], 'sourceRows':len(raw),'cleanRows':len(supplied),'funnel':funnel,'scope':'Reproduced cleaned modelling cohort; source-labelled Rabat, not a geographically exhaustive census. No collection/publication dates or transaction status supplied. Original neighborhood labels retained, including unresolved peripheral labels.','rows':rows}
Path('server-data/rabat-market.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps({'funnel':funnel,'types':supplied.Type.value_counts().to_dict(),'neighborhoods':supplied.Localisation.nunique(),'medianPrice':supplied.Price.median(),'medianM2':(supplied.Price/supplied.Area).median(),'meanArea':supplied.Area.mean()}))
