import assert from 'node:assert/strict';
import test from 'node:test';
import { securityDatabase, userA, userB } from './database';
test('real PostgreSQL RLS isolates identity, events, passports, properties and roles', async () => {
  const db = await securityDatabase();
  try {
    await db.query("INSERT INTO estimation_events(event_key,city_id,model_version_id,input_features,estimated_price_mad,user_id) VALUES('a',1,1,'{}',10,$1),('b',1,1,'{}',20,$2),('anonymous',1,1,'{}',30,null)", [userA,userB]);
    await db.query("INSERT INTO saved_properties(user_id,city_id,label,input_features) VALUES($1,1,'A','{}'),($2,1,'B','{}')", [userA,userB]);
    await db.exec("INSERT INTO estimation_passports(estimation_event_id,prediction) SELECT id,'{}' FROM estimation_events");
    await db.exec(`SET ROLE authenticated; SET request.jwt.claim.sub='${userA}';`);
    assert.equal((await db.query('SELECT * FROM profiles')).rows.length, 1);
    assert.deepEqual((await db.query('SELECT role FROM user_roles')).rows, [{ role: 'user' }]);
    assert.deepEqual((await db.query('SELECT event_key FROM estimation_events')).rows, [{ event_key: 'a' }]);
    assert.equal((await db.query('SELECT * FROM estimation_passports')).rows.length, 1);
    assert.deepEqual((await db.query('SELECT label FROM saved_properties')).rows, [{ label: 'A' }]);
    assert.equal((await db.query("DELETE FROM saved_properties WHERE label='B' RETURNING id")).rows.length, 0);
    await assert.rejects(db.query("UPDATE user_roles SET role='admin'"));
    await assert.rejects(db.query('INSERT INTO user_roles(user_id,role) VALUES($1,\'admin\')', [userB]));
    await assert.rejects(db.query('SELECT * FROM guest_trials'));
    await assert.rejects(db.query('SELECT * FROM security_audit_logs'));
    await assert.rejects(db.query("INSERT INTO saved_properties(user_id,city_id,label,input_features) VALUES($1,1,'stolen','{}')", [userB]));
    await assert.rejects(db.query('UPDATE profiles SET user_id=$1', [userB]));
    await db.exec("UPDATE profiles SET display_name='Allowed',preferred_locale='ar'");
    await db.exec('RESET ROLE; SET ROLE anon;');
    await assert.rejects(db.query('SELECT * FROM estimation_events'));
  } finally { await db.close(); }
});
