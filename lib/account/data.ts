import 'server-only';
import { authClient, currentUser } from '@/lib/auth/server';
import { query } from '@/lib/admin/db';
import { PublicError } from '@/lib/security/http';
export async function accountIdentity() {
  const user=await currentUser();
  if (!user) throw new PublicError('AUTH_REQUIRED',401);
  return {user,client:authClient()};
}
export async function accountLists(page: number) {
  const {user,client}=await accountIdentity(), start=(page-1)*20;
  const [events,properties,profile]=await Promise.all([
    client.from('estimation_events').select('id,created_at,city_id,model_version_id,input_features,estimated_price_mad',{count:'exact'}).eq('user_id',user.id).eq('is_test',false).order('created_at',{ascending:false}).order('id',{ascending:false}).range(start,start+19),
    client.from('saved_properties').select('id,label,city_id,input_features,created_at',{count:'exact'}).eq('user_id',user.id).order('created_at',{ascending:false}).order('id').range(start,start+19),
    client.from('profiles').select('display_name,preferred_locale').eq('user_id',user.id).single(),
  ]);
  if (events.error || properties.error || profile.error) throw new Error('ACCOUNT_DATA_UNAVAILABLE');
  const cityIds=Array.from(new Set([...(events.data||[]),...(properties.data||[])].map(item=>item.city_id)));
  const modelIds=Array.from(new Set((events.data||[]).map(item=>item.model_version_id)));
  const cities=cityIds.length ? (await query('SELECT id,name,slug FROM public.cities WHERE id=ANY($1::bigint[])',[cityIds])).rows : [];
  const models=modelIds.length ? (await query('SELECT id,version FROM public.model_versions WHERE id=ANY($1::bigint[])',[modelIds])).rows : [];
  const city=(id:unknown)=>cities.find(item=>String(item.id)===String(id));
  return { profile:profile.data, email:user.email, events:(events.data||[]).map(item=>({...item,id:String(item.id),city:city(item.city_id),model_version:models.find(model=>String(model.id)===String(item.model_version_id))?.version})),
    properties:(properties.data||[]).map(item=>({...item,city:city(item.city_id)})),eventCount:events.count||0,propertyCount:properties.count||0,page };
}
