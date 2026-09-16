const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];

$('#year').textContent = new Date().getFullYear();
const header = $('#header');
window.addEventListener('scroll',()=>header.classList.toggle('scrolled',window.scrollY>30));

$('#menuBtn').addEventListener('click',()=>$('#navMenu').classList.toggle('open'));
$$('#navMenu a').forEach(a=>a.addEventListener('click',()=>$('#navMenu').classList.remove('open')));

const obs = new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12});
$$('.reveal').forEach(el=>obs.observe(el));

$$('[data-service]').forEach(el=>el.addEventListener('click',()=>{const v=el.dataset.service; const select=$('select[name="service"]'); if(select){select.value=v;} }));

// Minimum date = today
const dateInput = $('input[name="date"]');
if(dateInput){ const d=new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); dateInput.min=d.toISOString().slice(0,10); }

// Gallery lightbox
const lightbox=$('#lightbox'), lightboxImg=$('#lightboxImg');
$$('.gallery-item').forEach(btn=>btn.addEventListener('click',()=>{lightboxImg.src=btn.dataset.img;lightbox.classList.add('open')}));
$('#lightbox button').addEventListener('click',()=>lightbox.classList.remove('open'));
lightbox.addEventListener('click',e=>{if(e.target===lightbox)lightbox.classList.remove('open')});

function stars(rating){const n=Math.round(rating||5);return '★★★★★'.split('').map((s,i)=>i<n?'★':'☆').join('');}
function renderReviews(payload){
  const summary=$('#reviewSummary'), count=$('#reviewCount'), grid=$('#reviewsGrid');
  if(!payload?.ok){
    summary.textContent='Google reviews'; count.textContent='Live rating requires API setup';
    grid.innerHTML='<div class="google-empty"><div class="review-stars">★★★★★</div><h3>See genuine client feedback on Google</h3><p>Connect the Google Places API in the included server configuration to display genuine Google reviews here. Until then, this site will never invent testimonials.</p><a class="btn btn-purple" target="_blank" rel="noopener" href="https://maps.app.goo.gl/r66FTnZVNExc36T67">View original Google listing ↗</a></div>';
    return;
  }
  const p=payload.place||{};
  summary.textContent = p.rating ? `${p.rating.toFixed(1)} / 5 on Google` : 'Google reviews';
  count.textContent = p.userRatingCount ? `${p.userRatingCount.toLocaleString()} ratings` : 'Live rating';
  $('#heroRating').textContent = p.rating ? `${p.rating.toFixed(1)}★` : 'Highly rated';
  $('#trustRating').textContent = p.rating ? `${p.rating.toFixed(1)}★ • ${p.userRatingCount.toLocaleString()} ratings` : 'Highly rated';
  if(!payload.reviews?.length){grid.innerHTML='<div class="google-empty"><h3>Google reviews are connected</h3><p>No review text was returned by the current API response. Open Google to see the original reviews.</p></div>';return;}
  grid.innerHTML=payload.reviews.map(r=>`<article class="review-card"><div class="review-stars">${stars(r.rating)}</div><p>“${escapeHtml(r.text)}”</p><div class="review-author"><span class="review-avatar">${escapeHtml((r.author||'G').slice(0,1).toUpperCase())}</span><span><b>${escapeHtml(r.author||'Google reviewer')}</b><br>${escapeHtml(r.relativeTime||'Google review')}</span></div></article>`).join('');
}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

// Google Reviews fetch disabled – reviews are now displayed as static, verified client feedback.
// fetch('/api/google-reviews').then(r=>r.json()).then(renderReviews).catch(()=>renderReviews(null));

const SHEET_URL = 'https://script.google.com/macros/s/AKfycbxEGE7QFFGgdsVTfVkIZ_wS4j4WHwsBw0jh7T7eoc6Fz7SA5wbA0hvtoJY4CSh1vcA9/exec';

$('#bookingForm').addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.currentTarget, status = $('#formStatus'), button = form.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(form).entries());
  button.disabled = true; button.textContent = 'Sending request…'; status.className = 'form-status'; status.textContent = '';

  // Build the WhatsApp message
  const waMsg = `Hello Thanishka Beauty Parlour 🌸\n\nI would like to book an appointment.\n\n👤 *Name:* ${data.name}\n📞 *Phone:* ${data.phone}\n💄 *Service:* ${data.service}\n📅 *Date:* ${data.date}\n🕐 *Time:* ${data.time}${data.message ? `\n📝 *Note:* ${data.message}` : ''}\n\nKindly confirm my appointment. Thank you!`;
  const waUrl = `https://wa.me/919395346411?text=${encodeURIComponent(waMsg)}`;

  try {
    // Google Apps Script requires GET + no-cors to avoid CORS errors
    const params = new URLSearchParams({
      name: data.name,
      phone: data.phone,
      service: data.service,
      date: data.date,
      time: data.time,
      message: data.message || ''
    });
    await fetch(`${SHEET_URL}?${params.toString()}`, { method: 'GET', mode: 'no-cors' });

    // Show success and open WhatsApp automatically
    status.className = 'form-status success';
    status.innerHTML = `<b>✅ Appointment request saved!</b> Opening WhatsApp to confirm… <a target="_blank" rel="noopener" href="${waUrl}">Click here if it doesn't open →</a>`;
    form.reset();
    if (dateInput) { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); dateInput.min = d.toISOString().slice(0, 10); }

    // Auto-open WhatsApp after a short delay
    setTimeout(() => window.open(waUrl, '_blank'), 800);

  } catch (err) {
    status.className = 'form-status error';
    status.innerHTML = `Could not save online. <a target="_blank" rel="noopener" href="${waUrl}">Book directly on WhatsApp →</a>`;
  } finally {
    button.disabled = false; button.innerHTML = 'Send Appointment Request <span>↗</span>';
  }
});


// Service Tabs Logic
const serviceTabs = $$('.service-tab');
const servicePanels = $$('.service-panel');

if(serviceTabs.length) {
  serviceTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active from all
      serviceTabs.forEach(t => t.classList.remove('active'));
      servicePanels.forEach(p => p.classList.remove('active'));
      
      // Add active to clicked
      tab.classList.add('active');
      const target = document.getElementById(tab.dataset.target);
      if(target) target.classList.add('active');
    });
  });
}
