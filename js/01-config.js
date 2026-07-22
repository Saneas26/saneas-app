// SANEAS · js/01-config.js · Supabase, versión de la app y flags de plan
// ====== CONFIG ======
const APP_VERSION = 'Saneas26 v1.3';   // v1.3 = diario de comidas (biblioteca + buscador); v1.2 = inicio narrativo
const SUPABASE_URL = 'https://uisrxztowgdpkxeuznfh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_8ybOGHnn9rsMDf57mx-Igw_AVvWK30D';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const SANEAMIGO_BADGE = 'https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/8pyKPaxFUSTzXE3Nvb27/pub/pwzgsPkZR23ml2h0ysC3.png';
const esEmbajador = () => Number((CLIENTE&&CLIENTE.descuento_invitados)||0) > 0;
const esPlanPC = () => /completo|premium/i.test((CLIENTE&&CLIENTE.plan)||'');
(function(){ const e=document.getElementById('appVersion'); if(e) e.textContent=APP_VERSION; })();

