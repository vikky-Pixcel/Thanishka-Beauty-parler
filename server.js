const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');
// Tiny .env loader so the site has no runtime package dependency.
const envFile = path.join(__dirname, '.env');
if (fs.existsSync(envFile)) { for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g,''); } }

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const APPOINTMENTS_FILE = path.join(DATA_DIR, 'appointments.json');
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon'
};
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, {recursive:true});
if (!fs.existsSync(APPOINTMENTS_FILE)) fs.writeFileSync(APPOINTMENTS_FILE, '[]');

function send(res, status, body, type='text/plain; charset=utf-8', headers={}) {
  res.writeHead(status, {'Content-Type': type, ...headers});
  res.end(body);
}
function json(res, status, data) { send(res, status, JSON.stringify(data), 'application/json; charset=utf-8', {'Cache-Control':'no-store'}); }
function parseBody(req) { return new Promise((resolve,reject)=>{ let b=''; req.on('data',c=>{b+=c; if(b.length>1e6) req.destroy();}); req.on('end',()=>{try{resolve(JSON.parse(b||'{}'))}catch(e){reject(e)}}); req.on('error',reject); }); }
function googleGet(url, headers={}) { return new Promise((resolve,reject)=>{ https.get(url,{headers},r=>{let d='';r.on('data',c=>d+=c);r.on('end',()=>{if(r.statusCode>=200&&r.statusCode<300){try{resolve(JSON.parse(d))}catch(e){reject(e)}}else reject(new Error(`Google API ${r.statusCode}: ${d}`));});}).on('error',reject); }); }

async function handleReviews(res) {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!key || !placeId) return json(res, 503, {ok:false, configured:false, message:'Google Places API is not configured. Add GOOGLE_MAPS_API_KEY and GOOGLE_PLACE_ID to .env.'});
  try {
    const fields = 'id,displayName,rating,userRatingCount,reviews,regularOpeningHours,formattedAddress,nationalPhoneNumber,googleMapsUri,websiteUri';
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=en`;
    const data = await googleGet(url, {'X-Goog-Api-Key': key, 'X-Goog-FieldMask': fields});
    const reviews = (data.reviews || []).map(r => ({
      rating: r.rating || 0,
      text: r.text?.text || '',
      author: r.authorAttribution?.displayName || 'Google reviewer',
      authorUri: r.authorAttribution?.uri || '',
      photoUri: r.authorAttribution?.photoUri || '',
      relativeTime: r.relativePublishTimeDescription || '',
      googleMapsUri: data.googleMapsUri || ''
    }));
    json(res,200,{ok:true,configured:true,place:{id:data.id,name:data.displayName?.text||'Thanishka Beauty Parlour',rating:data.rating||null,userRatingCount:data.userRatingCount||0,address:data.formattedAddress||'',phone:data.nationalPhoneNumber||'',mapsUri:data.googleMapsUri||'',websiteUri:data.websiteUri||'',hours:data.regularOpeningHours?.weekdayDescriptions||[]},reviews});
  } catch (e) { json(res,502,{ok:false,configured:true,message:e.message}); }
}

async function handleAppointment(req,res) {
  try {
    const data = await parseBody(req);
    const required = ['name','phone','service','date','time'];
    const missing = required.filter(k=>!String(data[k]||'').trim());
    if (missing.length) return json(res,400,{ok:false,message:`Missing: ${missing.join(', ')}`});
    const item = {id:Date.now().toString(36)+Math.random().toString(36).slice(2,8),name:String(data.name).trim(),phone:String(data.phone).trim(),email:String(data.email||'').trim(),service:String(data.service).trim(),date:String(data.date).trim(),time:String(data.time).trim(),message:String(data.message||'').trim(),status:'Pending',createdAt:new Date().toISOString()};
    const current = JSON.parse(fs.readFileSync(APPOINTMENTS_FILE,'utf8')||'[]'); current.push(item); fs.writeFileSync(APPOINTMENTS_FILE, JSON.stringify(current,null,2));
    json(res,201,{ok:true,appointment:{id:item.id,status:item.status}});
  } catch(e) { json(res,400,{ok:false,message:'Could not save appointment request.'}); }
}

function serveStatic(req,res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath='/index.html';
  const base = urlPath.startsWith('/assets/') ? ROOT : ROOT + '/public';
  const rel = urlPath.startsWith('/assets/') ? urlPath.slice(1) : urlPath.slice(1);
  const file = path.join(base, rel);
  if (!file.startsWith(ROOT)) return send(res,403,'Forbidden');
  fs.stat(file,(err,st)=>{ if(err||!st.isFile()) return send(res,404,'Not found'); const ext=path.extname(file).toLowerCase(); res.writeHead(200,{'Content-Type':MIME[ext]||'application/octet-stream','Cache-Control': ext.match(/\.(png|jpg|jpeg|webp|svg)$/)?'public,max-age=31536000,immutable':'no-cache'}); fs.createReadStream(file).pipe(res); });
}

const server = http.createServer(async (req,res)=>{
  try {
    if(req.method==='GET' && req.url.startsWith('/api/google-reviews')) return handleReviews(res);
    if(req.method==='POST' && req.url==='/api/appointments') return handleAppointment(req,res);
    if(req.method==='GET' && req.url==='/api/health') return json(res,200,{ok:true});
    serveStatic(req,res);
  } catch(e) { json(res,500,{ok:false,message:'Server error'}); }
});
server.listen(PORT,()=>console.log(`Thanishka website running at http://localhost:${PORT}`));
