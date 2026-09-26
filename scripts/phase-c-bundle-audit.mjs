// Read-only local check. Never print secret values or matching source content.
import fs from 'node:fs';
import path from 'node:path';
import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.cwd());
const names=Object.keys(process.env).filter(name=>!name.startsWith('NEXT_PUBLIC_')&&/(?:SECRET|PASSWORD|SERVICE_ROLE|POSTGRES_URL|POSTGRES_PRISMA_URL|POSTGRES_URL_NON_POOLING)/.test(name));
const candidates=names.flatMap(name=>{
  const value=process.env[name];
  if(!value||value.length<12)return [];
  const values=[value];
  if(name.includes('URL')){try{const password=decodeURIComponent(new URL(value).password);if(password.length>=12)values.push(password);}catch{}}
  return values.map(value=>({name,value}));
});
function files(root){return fs.readdirSync(root,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(root,entry.name)):[path.join(root,entry.name)]);}
const leaks=new Set();let count=0;
for(const file of files('.next/static').filter(file=>/\.(js|map)$/.test(file))){
  count++;const source=fs.readFileSync(file,'utf8');
  for(const {name,value} of candidates)if(source.includes(value)||source.includes(JSON.stringify(value).slice(1,-1)))leaks.add(name);
}
if(!count)throw new Error('No browser bundles: run npm run build first.');
console.log(JSON.stringify({browserFiles:count,configuredPrivateVariablesChecked:new Set(candidates.map(item=>item.name)).size,leakedVariableNames:[...leaks]}));
if(leaks.size)process.exitCode=1;
