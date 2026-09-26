'use client';
import { useEffect,useState } from 'react';
import { formatDate,formatInteger } from '@/lib/utils';
export function UsersSecurity(){
  const [data,setData]=useState<any>(null),[failed,setFailed]=useState(false);
  useEffect(()=>{void fetch('/api/admin/users-security',{cache:'no-store'}).then(response=>{if(!response.ok)throw new Error();return response.json();}).then(setData).catch(()=>setFailed(true));},[]);
  if(failed)return <p role="alert">Données de sécurité indisponibles. Vérifiez la configuration Phase C.</p>;
  if(!data)return <p role="status">Chargement…</p>;
  return <section><h2 className="text-2xl font-bold">Utilisateurs & Sécurité</h2><div className="mt-6 grid gap-4 sm:grid-cols-3">{[['Utilisateurs inscrits',data.total],['Découvertes utilisées',data.trials.consumed],['Passeports réclamés',data.trials.claimed]].map(([title,count])=><div key={title} className="rounded-2xl border border-border-medium p-5"><p className="text-sm">{title}</p><p className="mt-3 text-3xl font-bold">{formatInteger(count)}</p></div>)}</div><div className="mt-6 grid gap-6 lg:grid-cols-2"><div><h3 className="font-bold">Répartition des rôles</h3>{data.roles.map((role:any)=><p key={role.role} className="mt-2 text-sm">{role.role} · {formatInteger(role.count)}</p>)}<h3 className="mt-6 font-bold">Inscriptions récentes</h3>{data.signups.map((item:any,index:number)=><p key={index} className="mt-2 text-sm">{formatDate(item.created_at,'fr',true)}</p>)}</div><div><h3 className="font-bold">Événements de sécurité récents</h3>{data.events.length?data.events.map((event:any,index:number)=><p key={index} className="mt-3 text-sm">{event.event_type} · {formatDate(event.created_at,'fr',true)}</p>):<p className="mt-3 text-sm">Aucun événement enregistré.</p>}</div></div></section>;
}
