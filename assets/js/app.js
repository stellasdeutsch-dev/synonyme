(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const SAY = '<svg><use href="#i-say"/></svg>';
const sayBtn = (t, cls = 'say') => `<button class="${cls}" data-say="${esc(t)}" aria-label="Послушать: ${esc(t)}">${SAY}</button>`;
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- toast ---------- */
const toastEl = $('#toast'); let toastT;
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), 2600); }

/* ---------- speech ---------- */
let deVoice = null;
function pickVoice() {
  if (!('speechSynthesis' in window)) return;
  const v = speechSynthesis.getVoices().filter(v => /^de/i.test(v.lang));
  deVoice = v.find(v => /Anna|Helena|Google/i.test(v.name)) || v[0] || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
let playingBtn = null;
function speak(text, btn) {
  if (!('speechSynthesis' in window)) { toast('Браузер не умеет озвучивать. На платформе — живая озвучка.'); return; }
  speechSynthesis.cancel();
  if (playingBtn) playingBtn.classList.remove('playing');
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE'; u.rate = .88; if (deVoice) u.voice = deVoice;
  if (btn) { btn.classList.add('playing'); playingBtn = btn; }
  u.onend = u.onerror = () => { if (btn) btn.classList.remove('playing'); };
  speechSynthesis.speak(u);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-say],[data-say-from]');
  if (!b) return;
  e.stopPropagation();
  const t = b.dataset.say || ($('#' + b.dataset.sayFrom)?.textContent || '');
  speak(t.trim(), b);
});

/* ---------- header, progress, menu ---------- */
const hdr = $('#hdr'), prog = $('#progress'), sticky = $('#sticky');
let lastY = 0;
function onScroll() {
  const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
  prog.style.transform = `scaleX(${h > 0 ? y / h : 0})`;
  hdr.classList.toggle('scrolled', y > 10);
  if (!document.body.classList.contains('menu-open')) hdr.classList.toggle('hide', y > lastY && y > 400);
  lastY = y;
  const pr = $('#pricing').getBoundingClientRect();
  sticky.classList.toggle('show', y > innerHeight * 1.1 && (pr.top > innerHeight || pr.bottom < 0));
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();
const burger = $('#burger');
burger.addEventListener('click', () => {
  const o = document.body.classList.toggle('menu-open');
  burger.setAttribute('aria-expanded', o);
});
$$('#sheet a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', false); }));

/* ---------- reveal ---------- */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
function observeReveal(root = document) { $$('.rv:not(.in), #neighbors, #flow', root).forEach(el => io.observe(el)); }

/* ---------- counters ---------- */
const cio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  const el = e.target, to = +el.dataset.count, t0 = performance.now(), d = reduce ? 1 : 1600;
  const fmt = n => n >= 1000 ? n.toLocaleString('ru-RU') : n;
  (function tick(t) { const p = Math.min(1, (t - t0) / d), k = 1 - Math.pow(1 - p, 4); el.textContent = fmt(Math.round(to * k)); if (p < 1) requestAnimationFrame(tick); })(t0);
  cio.unobserve(el);
}), { threshold: .6 });
$$('[data-count]').forEach(el => cio.observe(el));

/* ---------- hero swap ---------- */
const SWAP = [
  { w: 'gut', r: 1, d: 'нейтрально — подходит везде' },
  { w: 'super', r: 0, d: 'разговорно — с друзьями' },
  { w: 'geil', r: 0, d: 'сленг — только среди своих' },
  { w: 'hervorragend', r: 2, d: 'официально — в отзыве, в письме' },
  { w: 'einwandfrei', r: 2, d: 'формально — «без замечаний»' },
  { w: 'nicht schlecht', r: 1, d: 'по-немецки это почти комплимент' }
];
const swapEl = $('#swap'), swapReg = $('#swapReg'), meter = $$('#meter i');
let si = 0;
function scramble(el, to) {
  if (reduce) { el.textContent = to; return; }
  const ch = 'abcdefghijklmnopqrstuvwxyzäöüß', from = el.textContent, len = Math.max(from.length, to.length);
  let f = 0; const total = 16;
  (function step() {
    let out = '';
    for (let i = 0; i < to.length; i++) out += (f / total > i / len) ? to[i] : (to[i] === ' ' ? ' ' : ch[Math.random() * ch.length | 0]);
    el.textContent = out;
    if (++f <= total) requestAnimationFrame(() => setTimeout(step, 28)); else el.textContent = to;
  })();
}
function setSwap(i) {
  const s = SWAP[i];
  scramble(swapEl, s.w);
  swapReg.textContent = s.d;
  meter.forEach((m, k) => m.classList.toggle('on', k <= s.r));
}
setSwap(0);
let swapTimer = setInterval(() => { si = (si + 1) % SWAP.length; setSwap(si); }, 2400);
swapEl.style.cursor = 'pointer';
swapEl.addEventListener('click', () => { clearInterval(swapTimer); si = (si + 1) % SWAP.length; setSwap(si); speak(SWAP[si].w); });

/* ---------- hero parallax / tilt ---------- */
const stage = $('#stage'), floats = $$('.float', stage), phone = $('#heroPhone'), bgword = $('#bgword');
let px = 0, py = 0;
if (!reduce) {
  if (fine) stage.addEventListener('pointermove', e => {
    const r = stage.getBoundingClientRect();
    px = (e.clientX - r.left) / r.width - .5; py = (e.clientY - r.top) / r.height - .5; heroFrame();
  });
  stage.addEventListener('pointerleave', () => { px = py = 0; heroFrame(); });
  addEventListener('scroll', heroFrame, { passive: true });
}
function heroFrame() {
  const y = Math.min(scrollY, 900);
  phone.style.transform = `perspective(1200px) rotateY(${px * 12}deg) rotateX(${-py * 8}deg) translateY(${-y * .06}px)`;
  floats.forEach(f => { const d = +f.dataset.depth; f.style.transform = `translate3d(${px * 22 * d}px, ${py * 18 * d - y * .12 * d}px, 0)`; });
  bgword.style.transform = `translateX(calc(-50% - ${y * .25}px))`;
}
const hp = $('.f-guides path.draw');
if (hp) { const L = hp.getTotalLength(); hp.style.strokeDasharray = L; hp.style.strokeDashoffset = L; hp.getBoundingClientRect(); hp.style.transition = 'stroke-dashoffset 1.8s cubic-bezier(.2,.8,.2,1) .6s'; requestAnimationFrame(() => hp.style.strokeDashoffset = 0); }

/* ---------- big quote word reveal ---------- */
const bq = $('#bigquote');
bq.innerHTML = bq.textContent.split(' ').map(w => `<span class="w">${esc(w)}</span>`).join(' ');
const words = $$('.w', bq);
function quoteFrame() {
  const r = bq.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, (innerHeight * .85 - r.top) / (r.height + innerHeight * .35)));
  const n = Math.round(p * words.length);
  words.forEach((w, i) => w.classList.toggle('on', i < n));
}
if (reduce) words.forEach(w => w.classList.add('on')); else { addEventListener('scroll', quoteFrame, { passive: true }); quoteFrame(); }

/* ---------- ladder ---------- */
const LAD = [
  ['приветствие', 'Hi!', 'Hallo!', 'Sehr geehrte Damen und Herren,'],
  ['получать', 'kriegen', 'bekommen', 'erhalten'],
  ['разговаривать', 'quatschen', 'reden', 'ein Gespräch führen'],
  ['понимать', 'kapieren', 'verstehen', 'nachvollziehen'],
  ['деньги', 'die Kohle', 'das Geld', 'die finanziellen Mittel'],
  ['сломан', 'hin', 'kaputt', 'defekt'],
  ['прощание', 'Tschüss!', 'Bis bald!', 'Mit freundlichen Grüßen']
];
const SENT = [
  ['С другом', 'Hi! Ich hab die Kohle noch nicht gekriegt.', 'Так пишут другу в WhatsApp. В письмо в Jobcenter — нельзя. Как прийти на собеседование в шлёпках.'],
  ['Нейтрально', 'Hallo! Ich habe das Geld noch nicht bekommen.', 'Безопасный вариант. Подходит почти везде. Сомневаетесь — берите средний этаж.'],
  ['Jobcenter / письмо', 'Sehr geehrte Damen und Herren, ich habe die finanziellen Mittel noch nicht erhalten.', 'Так пишут в Jobcenter, Ausländerbehörde, арендодателю. Другу так напишете — он решит, что вы обиделись.']
];
const ladder = $('#ladder'), seg = $('#seg'), knob = $('.knob', seg);
ladder.innerHTML = LAD.map((r, i) => `<div class="lad-row"><div><small>${r[0]}</small><span class="lad-word" id="lw${i}"></span></div><button class="say" data-lad="${i}" aria-label="Послушать">${SAY}</button></div>`).join('');
let reg = 1;
function setReg(r) {
  reg = r;
  $$('button', seg).forEach(b => b.classList.toggle('on', +b.dataset.r === r));
  knob.style.transform = `translateX(${r * 100}%)`;
  $('#thermo').style.left = `${8 + r * 42}%`;
  LAD.forEach((row, i) => { const el = $('#lw' + i); el.innerHTML = `<span style="animation-delay:${i * 45}ms">${esc(row[r + 1])}</span>`; $(`[data-lad="${i}"]`).dataset.say = row[r + 1]; });
  $('#sentCtx').textContent = SENT[r][0];
  $('#sent').innerHTML = `<span class="lad-word" style="font-size:inherit;display:inline"><span>${esc(SENT[r][1])}</span></span>`;
  $('#sentSay').dataset.say = SENT[r][1];
  $('#ladNote').textContent = SENT[r][2];
}
$$('button', seg).forEach(b => b.addEventListener('click', () => setReg(+b.dataset.r)));
setReg(1);

/* ---------- pairs ---------- */
const PAIRS = [
  { w: ['sagen', 'sprechen', 'reden', 'erzählen'], s: ['На разговорном клубе парень рассказывает про выходные.', 'Говорит: ich habe viel mit meiner Frau gesagt.', 'Все поняли. Но звучит так, будто он зачитал жене протокол.', 'Надо было: wir haben viel geredet.'],
    r: [['sagen', 'что именно: слова, фраза, факт', 'Er sagt, dass er müde ist.'], ['sprechen', 'язык и официальный разговор', 'Ich spreche Deutsch und Ukrainisch.'], ['reden', 'болтать, обсуждать — разговорно', 'Wir reden über den Urlaub.'], ['erzählen', 'рассказывать историю', 'Erzähl mal von deinem Wochenende!']],
    t: 'Язык — только sprechen. Ich spreche Deutsch. Не «ich rede Deutsch» и не «ich sage Deutsch».' },
  { w: ['wissen', 'kennen', 'können'], s: ['Женщина в Jobcenter говорит: ich weiß Frau Müller.', 'Сотрудница спрашивает: was wissen Sie über Frau Müller?', 'Женщина думает. Говорит: что она Frau Müller.', 'Надо было: ich kenne Frau Müller.'],
    r: [['wissen', 'факт, информация', 'Ich weiß, wo die Apotheke ist.'], ['kennen', 'знаком лично, бывал, видел', 'Ich kenne diese Stadt.'], ['können', 'умею', 'Ich kann ein bisschen Deutsch.']],
    t: 'После wissen часто идёт целое предложение: wissen, dass / wo / wann. После kennen — просто кто или что.' },
  { w: ['lernen', 'studieren', 'unterrichten', 'lehren'], s: ['Ученик говорит соседу-немцу: ich studiere Deutsch.', 'Сосед спрашивает: an welcher Uni?', 'Ученик говорит: на кухне. По вечерам.', 'Кухня — это lernen.'],
    r: [['lernen', 'учить, осваивать', 'Ich lerne Deutsch im Integrationskurs.'], ['studieren', 'учиться в вузе', 'Meine Tochter studiert Medizin.'], ['unterrichten', 'преподавать в школе, на курсе', 'Sie unterrichtet Deutsch an der VHS.'], ['lehren', 'преподавать — книжно, в вузе', 'Er lehrt an der Universität.']],
    t: 'Даже если вы на курсе по 8 часов в день — ich lerne Deutsch.' },
  { w: ['fragen', 'bitten', 'verlangen'], s: ['Подруга в пекарне говорит: ich frage ein Brötchen.', 'Продавщица ждёт вопрос.', 'Вопроса нет.', 'Булочки тоже.'],
    r: [['fragen', 'задать вопрос', 'Darf ich Sie etwas fragen?'], ['bitten um', 'попросить', 'Ich bitte Sie um Hilfe.'], ['verlangen', 'требовать', 'Der Vermieter verlangt die Miete.']],
    t: 'Просить — bitten um. А в пекарне проще всего: Ich hätte gern ein Brötchen.' },
  { w: ['werden', 'bekommen', 'kriegen', 'erhalten'], s: ['Парень на собеседовании говорит: ich möchte Krankenpfleger bekommen.', 'Хотел сказать — стать медбратом.', 'Сказал — получить медбрата.', 'Работодатель задумался.'],
    r: [['werden', 'стать', 'Ich möchte Krankenpfleger werden.'], ['bekommen', 'получить — нейтрально', 'Ich bekomme morgen den Brief.'], ['kriegen', 'получить — разговорно', 'Hast du meine Nachricht gekriegt?'], ['erhalten', 'получить — официально', 'Wir haben Ihre Unterlagen erhalten.']],
    t: 'bekommen похоже на английское become. Но значит «получать». Стать — только werden.' },
  { w: ['finden', 'glauben', 'denken', 'meinen'], s: ['Немка спрашивает ученицу: wie findest du Berlin?', 'Ученица говорит: ich denke, Berlin ist groß.', 'Немка кивает.', 'Потом объясняет, что спрашивала не про размеры.'],
    r: [['finden', 'оценка, впечатление', 'Ich finde den Film super.'], ['glauben', 'предполагаю, не уверен', 'Ich glaube, der Bus kommt später.'], ['denken', 'думать, размышлять', 'Ich denke oft an meine Familie.'], ['meinen', 'иметь в виду, считать', 'Was meinst du damit?']],
    t: 'Спросили wie findest du…? — отвечайте ich finde… Это вопрос о впечатлении, а не о фактах.' },
  { w: ['sehen', 'schauen', 'gucken', 'beobachten'], s: ['Врач говорит: schauen Sie bitte nach oben.', 'Пациент смотрит вверх. Видит потолок.', 'Врач спрашивает: sehen Sie das Licht?', 'Одно слово — куда смотреть. Другое — что видно.'],
    r: [['sehen', 'видеть — глаза работают', 'Ich sehe dich nicht.'], ['schauen', 'смотреть специально', 'Wir schauen uns die Wohnung an.'], ['gucken', 'то же, разговорно', 'Guck mal, da!'], ['beobachten', 'наблюдать долго', 'Ich beobachte die Vögel im Park.']],
    t: 'Телевизор — fernsehen: Ich sehe fern. Фильм — einen Film sehen или anschauen.' },
  { w: ['Beruf', 'Arbeit', 'Stelle', 'Job'], s: ['В Jobcenter спрашивают: was ist Ihr Beruf?', 'Мужчина отвечает: Lager. Nachtschicht.', 'Сотрудница говорит: das ist Ihre Arbeit. Ihr Beruf ist Ingenieur.', 'Beruf — это кто вы. Arbeit — что вы делаете сейчас.'],
    r: [['der Beruf', 'профессия', 'Mein Beruf ist Ingenieurin.'], ['die Arbeit', 'работа: место и процесс', 'Ich gehe zur Arbeit.'], ['die Stelle', 'вакансия, должность', 'Ich suche eine Stelle als Pflegekraft.'], ['der Job', 'подработка — разговорно', 'Ich habe einen Minijob.']],
    t: 'Ищете вакансию — eine Stelle suchen. В объявлениях так и пишут: Stellenangebote.' }
];
const track = $('#track'), pager = $('#pager');
track.innerHTML = PAIRS.map((p, i) => `
  <article class="pair" aria-roledescription="слайд" aria-label="${i + 1} из ${PAIRS.length}">
    <div class="pair-head">${p.w.map(w => `<span class="de">${esc(w)}</span>`).join('<span class="sep">·</span>')}</div>
    <div class="pair-story"><span class="pill">История</span>${p.s.map(l => `<p>${esc(l)}</p>`).join('')}</div>
    <div class="rules">
      ${p.r.map(r => `<div class="rule"><span class="de">${esc(r[0])}</span><div><p>${esc(r[1])}</p><em>${esc(r[2])} ${sayBtn(r[2])}</em></div></div>`).join('')}
      <div class="trap"><b>Ловушка</b><span>${esc(p.t)}</span></div>
    </div>
  </article>`).join('');
pager.innerHTML = PAIRS.map((_, i) => `<button aria-label="Слайд ${i + 1}">${i + 1}</button>`).join('');
let cur = 0;
function go(i) {
  cur = (i + PAIRS.length) % PAIRS.length;
  track.style.transform = `translateX(calc(${-cur * 100}% - ${cur * 14}px))`;
  $$('button', pager).forEach((b, k) => b.classList.toggle('on', k === cur));
  const b = $$('button', pager)[cur]; pager.scrollTo({ left: b.offsetLeft - pager.clientWidth / 2 + 19, behavior: 'smooth' });
}
$$('button', pager).forEach((b, i) => b.addEventListener('click', () => go(i)));
$('#prev').addEventListener('click', () => go(cur - 1));
$('#next').addEventListener('click', () => go(cur + 1));
go(0);
// swipe
let sx = 0, sy = 0, dx = 0, drag = false, lock = null;
track.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; drag = true; lock = null; sx = e.clientX; sy = e.clientY; dx = 0; track.style.transition = 'none'; });
addEventListener('pointermove', e => {
  if (!drag) return;
  dx = e.clientX - sx; const dy = e.clientY - sy;
  if (lock === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
  if (lock === 'x') track.style.transform = `translateX(calc(${-cur * 100}% - ${cur * 14}px + ${dx}px))`;
});
addEventListener('pointerup', () => {
  if (!drag) return; drag = false; track.style.transition = '';
  if (lock === 'x' && Math.abs(dx) > 50) go(cur + (dx < 0 ? 1 : -1)); else go(cur);
});
addEventListener('keydown', e => {
  const r = track.getBoundingClientRect(); if (r.top > innerHeight || r.bottom < 0) return;
  if (e.key === 'ArrowRight') go(cur + 1); if (e.key === 'ArrowLeft') go(cur - 1);
});

/* ---------- rescue ---------- */
const FORM = [
  ['Das ist ein Ding, mit dem man …', 'предмет: для чего он'],
  ['Das ist jemand, der …', 'человек: что он делает'],
  ['Das ist so ähnlich wie …', 'похоже на что-то знакомое'],
  ['Das Gegenteil von …', 'противоположность'],
  ['Wie sagt man … auf Deutsch?', 'просто спросить — это нормально'],
  ['Also, ich meine …', 'поправиться и сказать иначе']
];
$('#formulas').innerHTML = FORM.map((f, i) => `<div class="formula rv rv-d${i % 3}"><div><span class="de">${esc(f[0])}</span><small>${esc(f[1])}</small></div>${sayBtn(f[0].replace(/…/g, ''))}</div>`).join('');
const GAME = [
  { sc: 'Аптека', q: 'Нужен пластырь. Слово <span class="miss">das Pflaster</span> вылетело из головы. Что скажете?', o: [['Äh… ähm… nichts, danke.', 'Ушли без пластыря. С порезом.'], ['Ich brauche so ein Ding für eine kleine Wunde. Zum Aufkleben.', 'Идеально. Описали, для чего вещь, — вам дали пластырь.'], ['Ich brauche eine Pflasterung, bitte.', 'Pflasterung — это мостовая. Вам предложат выложить дорогу.']], a: 1, w: 'das Pflaster' },
  { sc: 'Врач', q: 'Хотите записаться на приём. Слово <span class="miss">der Termin</span> пропало.', o: [['Ich möchte einen Arzt kaufen.', 'Врача не продают. Даже в Германии.'], ['Arzt. Jetzt. Bitte.', 'Поймут. Но звучит как ультиматум.'], ['Ich möchte zum Arzt. Wann haben Sie Zeit?', 'Отлично. Синоним «время» спас. Вам предложат Termin сами.']], a: 2, w: 'einen Termin vereinbaren' },
  { sc: 'Квартира', q: 'Надо сказать про арендодателя. Слово <span class="miss">der Vermieter</span> не приходит.', o: [['Die Person, der die Wohnung gehört.', 'Точно. Описали человека — поняли все.'], ['Der Mieter.', 'Mieter — это вы. Тот, кто снимает. Ровно наоборот.'], ['Mein Wohnungschef.', 'Смешно и почти понятно. Почти.']], a: 0, w: 'der Vermieter' },
  { sc: 'Магазин техники', q: 'Нужен холодильник. <span class="miss">der Kühlschrank</span> — слишком длинно, забылось.', o: [['Ein kaltes Haus für Essen.', 'Креативно. Отведут в отдел морозилок. Или в подвал.'], ['Ein Ding in der Küche, das das Essen kalt macht.', 'Формула сработала: Ding + для чего. Холодильник ваш.'], ['Eine Kühlung… Klima?', 'Кондиционер вам тоже продадут.']], a: 1, w: 'der Kühlschrank' },
  { sc: 'Фитнес-клуб', q: 'Хотите расторгнуть договор. Слово <span class="miss">die Kündigung</span> забыли.', o: [['Ich möchte den Vertrag töten.', 'Убить договор. Выразительно. Но договор выживет.'], ['Vertrag weg, bitte.', 'Поймут. Оформят не с первого раза.'], ['Ich möchte den Vertrag beenden.', 'Синоним beenden поймут везде. Договор закрыт.']], a: 2, w: 'den Vertrag kündigen' }
];
const game = $('#game');
let gi = 0, gs = 0;
function renderGame() {
  if (gi >= GAME.length) {
    game.innerHTML = `<div class="g-final"><span class="pill" style="background:rgba(255,255,255,.7);box-shadow:none">Спасатель</span><div class="big" style="margin-top:16px">${gs}<span style="font-size:24px;color:rgba(0,0,0,.4)">/${GAME.length}</span></div><p>Вы только что говорили без нужного слова. И вас поняли. Так и работает приём.</p><button class="btn btn-ink" id="gAgain">Ещё раз</button></div>`;
    $('#gAgain').onclick = () => { gi = gs = 0; renderGame(); };
    return;
  }
  const g = GAME[gi], order = shuffle(g.o.map((o, i) => i));
  game.innerHTML = `
    <div class="game-top"><span class="pill" style="background:rgba(255,255,255,.7);box-shadow:none">Спасатель · ${g.sc}</span><div class="dots">${GAME.map((_, i) => `<i class="${i < gi ? 'done' : i === gi ? 'cur' : ''}"></i>`).join('')}</div></div>
    <p class="g-q">${g.q}</p>
    <div class="opts">${order.map((i, k) => `<button class="opt" data-i="${i}"><span class="k">${'ABC'[k]}</span><span>${esc(g.o[i][0])}</span></button>`).join('')}</div>
    <div class="fb" id="gFb"></div>`;
  $$('.opt', game).forEach(b => b.addEventListener('click', () => {
    const i = +b.dataset.i, ok = i === g.a;
    $$('.opt', game).forEach(x => { x.disabled = true; if (+x.dataset.i === g.a) x.classList.add('ok'); });
    if (!ok) b.classList.add('bad'); else { gs++; burst(b); }
    speak(g.o[i][0]);
    const fb = $('#gFb');
    fb.innerHTML = `${esc(g.o[i][1])}<div class="row">Слово было: ${esc(g.w)} ${sayBtn(g.w)}</div><button class="btn btn-ink full g-next">${gi < GAME.length - 1 ? 'Следующая ситуация' : 'Итог'}</button>`;
    fb.classList.add('show');
    $('.g-next', fb).onclick = () => { gi++; renderGame(); };
  }));
}
renderGame();

/* ---------- confetti ---------- */
function burst(el) {
  if (reduce) return;
  const r = el.getBoundingClientRect(), box = document.createElement('div');
  box.className = 'burst'; box.style.left = r.left + r.width / 2 + 'px'; box.style.top = r.top + r.height / 2 + 'px';
  const cols = ['#FF6A55', '#FFA53D', '#FFD553', '#DDE1FB', '#2BB673'];
  for (let i = 0; i < 22; i++) {
    const p = document.createElement('i'), a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 90;
    p.style.background = cols[i % cols.length];
    p.style.setProperty('--x', Math.cos(a) * d + 'px'); p.style.setProperty('--y', Math.sin(a) * d - 30 + 'px'); p.style.setProperty('--r', (Math.random() * 540 - 270) + 'deg');
    box.appendChild(p);
  }
  document.body.appendChild(box); setTimeout(() => box.remove(), 1000);
}

/* ---------- trainer ---------- */
const TR = [
  { s: 'Письмо в Jobcenter', q: 'Ich habe Ihr Schreiben vom 3. Mai ___.', ru: 'Я получил(а) ваше письмо от 3 мая.', o: ['erhalten', 'gekriegt', 'gecheckt'], e: 'Официальное письмо — erhalten. Gekriegt — для друга, gecheckt — сленг.' },
  { s: 'Чат с другом', q: 'Kannst du mir von deinem Urlaub ___?', ru: 'Расскажешь мне про отпуск?', o: ['erzählen', 'sprechen', 'sagen'], e: 'История — erzählen von. Sagen нужен объект «что», sprechen — про язык и беседу.' },
  { s: 'У врача', q: 'Ich ___ nicht, wie das Medikament heißt.', ru: 'Я не знаю, как называется лекарство.', o: ['weiß', 'kenne', 'kann'], e: 'Информация, а после — придаточное (wie…). Значит wissen.' },
  { s: 'Поиск работы', q: 'Ich suche eine ___ als Lagerist.', ru: 'Я ищу место кладовщика.', o: ['Stelle', 'Beruf', 'Studium'], e: 'Вакансия — Stelle. Beruf — профессия, её не ищут, она у вас есть.' },
  { s: 'Мнение', q: 'Wie ___ du den neuen Kollegen?', ru: 'Как тебе новый коллега?', o: ['findest', 'glaubst', 'weißt'], e: 'Спрашивают впечатление — finden.' },
  { s: 'Курсы', q: 'Ich ___ Deutsch an der Volkshochschule.', ru: 'Я учу немецкий в народной школе.', o: ['lerne', 'studiere', 'lehre'], e: 'Курс, VHS, дома — lernen. Studieren — это университет.' },
  { s: 'Соседу', q: 'Darf ich Sie um einen Gefallen ___?', ru: 'Можно попросить вас об одолжении?', o: ['bitten', 'fragen', 'verlangen'], e: 'um etwas bitten — просить. Fragen — задать вопрос, verlangen — требовать.' },
  { s: 'Письмо в Hausverwaltung', q: 'Ich möchte mich über den Lärm ___.', ru: 'Я хочу пожаловаться на шум.', o: ['beschweren', 'meckern', 'motzen'], e: 'Официально — sich beschweren. Meckern и motzen — ворчать, разговорно.' },
  { s: 'Собеседование', q: 'Ich möchte Pflegefachkraft ___.', ru: 'Я хочу стать медсестрой.', o: ['werden', 'bekommen', 'kriegen'], e: 'Стать — werden. Bekommen и kriegen — получить.' },
  { s: 'Чат с другом', q: 'Lass uns heute Abend ein bisschen ___!', ru: 'Давай вечером поболтаем!', o: ['quatschen', 'kommunizieren', 'verhandeln'], e: 'С другом — quatschen. Kommunizieren звучит, как будто вы два сервера.' }
];
let ti = 0, tscore = 0, hist = [];
const trBar = $('#trBar'), trCount = $('#trCount'), trSit = $('#trSit'), trText = $('#trText'), trRu = $('#trRu'), trOpts = $('#trOpts'), trFb = $('#trFb'), trNext = $('#trNext');
function renderTr() {
  const t = TR[ti];
  trBar.style.width = `${ti / TR.length * 100}%`;
  trCount.textContent = `${ti + 1} / ${TR.length}`;
  trSit.innerHTML = `<span class="dot"></span>${esc(t.s)}`;
  trText.innerHTML = esc(t.q).replace('___', '<span class="gap">…</span>');
  trRu.textContent = t.ru;
  trOpts.innerHTML = shuffle(t.o).map((o, k) => `<button class="opt" data-o="${esc(o)}"><span class="k">${'ABC'[k]}</span><span>${esc(o)}</span></button>`).join('');
  trFb.className = 'tr-fb'; trNext.style.display = 'none';
  $$('.opt', trOpts).forEach(b => b.addEventListener('click', () => answerTr(b)));
}
function answerTr(b) {
  const t = TR[ti], ok = b.dataset.o === t.o[0];
  $$('.opt', trOpts).forEach(x => { x.disabled = true; if (x.dataset.o === t.o[0]) x.classList.add('ok'); });
  if (ok) { tscore++; burst(b); } else b.classList.add('bad');
  hist.push(tscore);
  const gap = $('.gap', trText); gap.textContent = t.o[0]; gap.classList.add('fill');
  const full = t.q.replace('___', t.o[0]);
  trFb.innerHTML = `<b>${ok ? 'Точно.' : 'Не то.'}</b> ${esc(t.e)} <span style="display:inline-flex;vertical-align:middle">${sayBtn(full)}</span>`;
  trFb.classList.add('show');
  trNext.style.display = '';
  trNext.firstChild.textContent = ti < TR.length - 1 ? 'Дальше ' : 'Показать результат ';
}
trNext.addEventListener('click', () => { ti++; if (ti < TR.length) renderTr(); else showRes(); });
function showRes() {
  trBar.style.width = '100%';
  $('#trQ').style.display = 'none';
  const res = $('#trRes'); res.classList.add('show');
  const n = $('#resN'); let k = 0; const iv = setInterval(() => { n.textContent = k; if (k++ >= tscore) clearInterval(iv); }, 90);
  const txt = tscore === 10 ? '10 из 10. Можно писать в Jobcenter. И другу. И не перепутать, кому что.'
    : tscore >= 7 ? `${tscore} из 10. Хорошо. Пара слов зашла не на тот этаж. Бывает. Шпаргалка ниже.`
    : tscore >= 4 ? `${tscore} из 10. Это нормально: курсы учат слова, но редко — где их использовать. Вернитесь к парам выше.`
    : `${tscore} из 10. Мало. Зато честно. Теперь вы знаете, где каша. Начните с лестницы регистров.`;
  $('#resText').textContent = txt;
  const svg = $('#resSvg'); $$('path,circle', svg).forEach(x => x.remove());
  const pts = [[0, 112]].concat(hist.map((v, i) => [(i + 1) * 30, 112 - v * 10.4]));
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], cx = (x0 + x1) / 2; d += ` C${cx} ${y0} ${cx} ${y1} ${x1} ${y1}`; }
  const ns = 'http://www.w3.org/2000/svg';
  const grid = document.createElementNS(ns, 'path'); grid.setAttribute('d', 'M0 112H300M0 60H300M0 8H300'); grid.setAttribute('stroke', '#ECEBE6'); grid.setAttribute('stroke-dasharray', '3 5'); svg.appendChild(grid);
  const p = document.createElementNS(ns, 'path'); p.setAttribute('d', d); p.setAttribute('class', 'line'); svg.appendChild(p);
  const L = p.getTotalLength(); p.style.strokeDasharray = L; p.style.strokeDashoffset = L; p.getBoundingClientRect(); p.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(.2,.8,.2,1)'; p.style.strokeDashoffset = 0;
  const last = pts[pts.length - 1], c = document.createElementNS(ns, 'circle'); c.setAttribute('cx', last[0] - 3); c.setAttribute('cy', last[1]); c.setAttribute('r', 5); c.setAttribute('fill', '#FF6A55'); svg.appendChild(c);
  if (tscore >= 7) setTimeout(() => burst($('.res-num')), 400);
}
$('#trAgain').addEventListener('click', () => { ti = tscore = 0; hist = []; $('#trRes').classList.remove('show'); $('#trQ').style.display = ''; renderTr(); });
renderTr();

/* ---------- cheatsheet ---------- */
const CS = [
  ['получать', 'v', 'kriegen', 'bekommen', 'erhalten'],
  ['разговаривать', 'v', 'quatschen', 'reden', 'ein Gespräch führen'],
  ['понимать', 'v', 'kapieren', 'verstehen', 'nachvollziehen'],
  ['начинать', 'v', 'loslegen', 'anfangen', 'beginnen'],
  ['заканчивать', 'v', 'aufhören', 'beenden', 'abschließen'],
  ['помогать', 'v', 'unter die Arme greifen', 'helfen', 'unterstützen'],
  ['проверять', 'v', 'checken', 'prüfen', 'überprüfen'],
  ['звонить', 'v', 'durchklingeln', 'anrufen', 'telefonisch kontaktieren'],
  ['есть, кушать', 'v', 'futtern', 'essen', 'speisen'],
  ['уходить', 'v', 'abhauen', 'gehen', 'sich verabschieden'],
  ['жаловаться', 'v', 'meckern', 'sich beschweren', 'Beschwerde einlegen'],
  ['сообщить', 'v', 'Bescheid sagen', 'sagen', 'mitteilen'],
  ['хотеть', 'v', 'Bock haben', 'wollen', 'wünschen'],
  ['деньги', 'n', 'die Kohle', 'das Geld', 'die finanziellen Mittel'],
  ['работа', 'n', 'der Job', 'die Arbeit', 'die Tätigkeit'],
  ['квартира, жильё', 'n', 'die Bude', 'die Wohnung', 'die Unterkunft'],
  ['машина', 'n', 'die Karre', 'das Auto', 'das Fahrzeug'],
  ['врач', 'n', 'der Doc', 'der Arzt', 'der Mediziner'],
  ['проблема', 'n', 'der Stress', 'das Problem', 'die Schwierigkeit'],
  ['хороший', 'a', 'super', 'gut', 'hervorragend'],
  ['плохой', 'a', 'mies', 'schlecht', 'mangelhaft'],
  ['быстро', 'a', 'fix', 'schnell', 'zügig'],
  ['сломан', 'a', 'hin', 'kaputt', 'defekt'],
  ['уставший', 'a', 'platt', 'müde', 'erschöpft']
];
const CAT = { v: 'глагол', n: 'сущ.', a: 'прил./нареч.' }, TAGS = [['tag-umg', 'разг.'], ['tag-neu', 'нейтр.'], ['tag-for', 'офиц.']];
const csList = $('#csList');
csList.innerHTML = CS.map((r, i) => `<div class="cs-row" data-c="${r[1]}" data-q="${esc((r[0] + ' ' + r.slice(2).join(' ')).toLowerCase())}"><div class="ru"><span>${esc(r[0])}</span><span>${CAT[r[1]]}</span></div><div class="cs-words">${r.slice(2).map((w, k) => `<button class="cs-w" data-say="${esc(w)}">${esc(w)}<span class="tag ${TAGS[k][0]}">${TAGS[k][1]}</span><span class="say">${SAY}</span></button>`).join('')}</div></div>`).join('');
let csF = 'all';
function filterCs() {
  const q = $('#csSearch').value.trim().toLowerCase(); let n = 0;
  $$('.cs-row', csList).forEach(r => { const on = (csF === 'all' || r.dataset.c === csF) && (!q || r.dataset.q.includes(q)); r.classList.toggle('hide', !on); if (on) n++; });
  $('#csEmpty').style.display = n ? 'none' : 'block';
}
$('#csSearch').addEventListener('input', filterCs);
$$('#csFilters button').forEach(b => b.addEventListener('click', () => { csF = b.dataset.f; $$('#csFilters button').forEach(x => x.classList.toggle('on', x === b)); filterCs(); }));
document.addEventListener('click', e => { const w = e.target.closest('.cs-w'); if (w) { const s = $('.say', w); s.classList.add('playing'); setTimeout(() => s.classList.remove('playing'), 900); } });

/* ---------- laptop tilt ---------- */
const tl = $('#tiltLaptop');
function tiltFrame() { const r = tl.getBoundingClientRect(); const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight * .8))); tl.style.transform = `perspective(1400px) rotateX(${18 * (1 - p)}deg) scale(${.94 + .06 * p})`; }
if (!reduce) { addEventListener('scroll', tiltFrame, { passive: true }); tiltFrame(); } else tl.style.transform = 'none';

/* ---------- before / after ---------- */
const ba = $('#ba'); let baDrag = false;
function setBa(x) { const r = ba.getBoundingClientRect(); const p = Math.min(96, Math.max(4, (x - r.left) / r.width * 100)); ba.style.setProperty('--pos', p + '%'); }
ba.addEventListener('pointerdown', e => { baDrag = true; setBa(e.clientX); ba.setPointerCapture(e.pointerId); });
ba.addEventListener('pointermove', e => { if (baDrag) setBa(e.clientX); });
ba.addEventListener('pointerup', () => baDrag = false);
ba.addEventListener('pointercancel', () => baDrag = false);
const baIo = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting || reduce) return; baIo.disconnect();
  const t0 = performance.now();
  (function a(t) { const p = Math.min(1, (t - t0) / 2200); const v = 50 + Math.sin(p * Math.PI * 2) * 32 * (1 - p); ba.style.setProperty('--pos', v + '%'); if (p < 1 && !baDrag) requestAnimationFrame(a); })(t0);
}), { threshold: .6 });
baIo.observe(ba);

/* ---------- spotlight ---------- */
$$('.why-card').forEach(c => c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); c.style.setProperty('--mx', e.clientX - r.left + 'px'); c.style.setProperty('--my', e.clientY - r.top + 'px'); }));

/* ---------- calculator ---------- */
const cr = $('#calcRange');
function calc() {
  // половина времени — слова (≈30 секунд на слово), половина — гайды (≈25 минут на гайд), 90 дней
  const m = +cr.value;
  $('#calcMin').textContent = m;
  $('#calcWords').textContent = Math.min(7500, m * 90).toLocaleString('ru-RU');
  $('#calcGuides').textContent = Math.min(340, Math.max(1, Math.round(m / 2 * 90 / 25)));
  cr.style.setProperty('--p', ((m - 5) / 55 * 100) + '%');
  const pct = Math.min(1, m * 90 / 7500); $('#calcP').style.strokeDashoffset = 201 * (1 - pct); $('#calcPct').textContent = Math.round(pct * 100) + '%';
  $('#calcSay').textContent = m <= 10 ? 'Это одна поездка в автобусе. Или очередь в Jobcenter. Там всё равно ждать.'
    : m <= 20 ? 'Это одна серия сериала. Который вы уже видели.'
    : m <= 40 ? 'Это обеденный перерыв. Без листания ленты.'
    : 'Это уже серьёзно. Немцы начнут спрашивать, сколько вы тут живёте.';
}
cr.addEventListener('input', calc); calc();

/* ---------- slideshows ---------- */
function slideshow(box, list, dur = 4000, onChange) {
  box.innerHTML = list.map(n => `<img src="assets/img/${n}.webp" alt="Экран платформы Stellas" loading="lazy">`).join('');
  const imgs = $$('img', box); let i = 0, t = null, vis = false;
  const dots = document.createElement('div'); dots.className = 'sl-dots'; dots.style.setProperty('--dur', dur + 'ms');
  dots.innerHTML = list.map(() => '<i></i>').join('');
  if (!onChange) box.closest('.laptop').after(dots);
  const set = k => { i = (k + list.length) % list.length; imgs.forEach((im, j) => im.classList.toggle('on', j === i)); $$('i', dots).forEach((d, j) => { d.classList.remove('on'); if (j === i) { void d.offsetWidth; d.classList.add('on'); } }); onChange && onChange(i); };
  const loop = () => { clearTimeout(t); if (vis && !reduce) t = setTimeout(() => { set(i + 1); loop(); }, dur); };
  new IntersectionObserver(es => es.forEach(e => { vis = e.isIntersecting; loop(); }), { threshold: .2 }).observe(box);
  set(0);
  return { set: k => { set(k); loop(); }, stop: () => { clearTimeout(t); vis = false; } };
}
$$('.slides[data-slides]').forEach(b => slideshow(b, b.dataset.slides.split(',')));

/* ---------- showcase (images) ---------- */
const SHOW = [
  ['a0-home', 'Главная A0–A2', 'Навигация, подборки фильмов, мультфильмов, книг и подкастов. Всё в одном месте.'],
  ['lexik-themes', 'Лексика по темам', 'Еда, дом, работа, здоровье. Внутри — слова, фразы и видео.'],
  ['hospital', 'Больница и аптека', 'У терапевта, в аптеке, звонок в скорую. Фразы на случай, когда не до учебника.'],
  ['work-topics', 'Работа и документы', 'JobCenter, собеседование, поиск работы. Лексика, которую не дают на курсах.'],
  ['services', 'Услуги и уход за собой', 'Парикмахерская, салон, запись на приём, спортзал.'],
  ['exams', 'Экзамены', 'Goethe и другие форматы по уровням. Без поиска материалов по форумам.'],
  ['topic-progress', 'Прогресс по темам', 'Видно, что пройдено, а что ещё нет. Никакой каши.'],
  ['srs', 'Интервальные повторения', 'Слова возвращаются, когда их пора освежить.'],
  ['b1-home', 'Главная B1–C1', 'Для тех, у кого B1 есть, а речи нет.'],
  ['materials', 'Больше материалов', 'Тексты, аудио, упражнения по уровням.']
];
const tabs = $('#showTabs');
tabs.innerHTML = SHOW.map((s, i) => `<button data-i="${i}">${esc(s[1])}</button>`).join('');
const showSS = slideshow($('#showScr'), SHOW.map(s => s[0]), 5000, i => {
  $$('button', tabs).forEach((b, k) => b.classList.toggle('on', k === i));
  $('#showTitle').textContent = SHOW[i][1]; $('#showDesc').textContent = SHOW[i][2]; $('#showNum').textContent = String(i + 1).padStart(2, '0');
  const b = $$('button', tabs)[i]; if (b && tabs.getBoundingClientRect().top < innerHeight && tabs.getBoundingClientRect().bottom > 0) tabs.scrollTo({ left: b.offsetLeft - 40, behavior: 'smooth' });
});
$$('button', tabs).forEach(b => b.addEventListener('click', () => { tabs.classList.add('manual'); showSS.set(+b.dataset.i); }));

/* ---------- video strip ---------- */
const VIDS = [
  ['gemini', 'Пример гайда', 'Слова для супермаркета с озвучкой, диалоги, тест'],
  ['notion-grammar', 'Грамматика по порядку', 'От алфавита до модальных глаголов'],
  ['lexik-gallery', 'Лексика по темам', 'Открыли тему — внутри слова, фразы, видео'],
  ['situations', 'Ситуации из жизни', 'У врача, на работе, в аптеке'],
  ['phrases', 'Словарь с транскрипцией', 'Слово, транскрипция, перевод, озвучка'],
  ['novel', 'Интерактивная новелла', 'Выбираете ответ — учитесь реагировать'],
  ['derdiedas', 'Артикли в лицах', 'Herr Der, Frau Die и Baby Das'],
  ['expert', 'Резюме по-немецки', 'Lebenslauf: структура и фото']
];
const vt = $('#vidTrack'), vn = $('#vidNav');
vt.innerHTML = VIDS.map(v => `<article class="vcard"><div class="v" style="background-image:url(assets/vid/${v[0]}.jpg)"><video src="assets/vid/${v[0]}.mp4" poster="assets/vid/${v[0]}.jpg" muted loop playsinline preload="none" data-autoplay></video><span class="live">запись экрана</span></div><div class="cap"><b>${esc(v[1])}</b><span>${esc(v[2])}</span></div></article>`).join('');
vn.innerHTML = VIDS.map(() => '<i></i>').join('');
function vidNav() { const c = $$('.vcard', vt); const mid = vt.scrollLeft + vt.clientWidth / 2; let k = 0, best = 1e9; c.forEach((el, i) => { const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid); if (d < best) { best = d; k = i; } }); $$('i', vn).forEach((d, i) => d.classList.toggle('on', i === k)); }
vt.addEventListener('scroll', vidNav, { passive: true }); vidNav();

const SHOTS = ['city-food', 'p4-words', 'calendar', 'progress-wheel', 'p5-builder', 'lexik', 'p8-situations', 'weekdays', 'p7-work', 'audio-lesson', 'p6-tracker', 'services'];
const shotHtml = SHOTS.map(s => `<button data-lb="assets/img/${s}.webp" aria-label="Открыть скриншот"><img src="assets/img/${s}.webp" alt="Экран платформы Stellas" loading="lazy"></button>`).join('');
$('#shots').innerHTML = shotHtml + shotHtml.replace(/<button /g, '<button tabindex="-1" aria-hidden="true" ');

/* ---------- reviews ---------- */
const wall = $('#rvWall');
wall.innerHTML = Array.from({ length: 18 }, (_, i) => { const f = `assets/rev/rv${String(i + 1).padStart(2, '0')}.webp`; return `<button data-lb="${f}" aria-label="Открыть отзыв"><img src="${f}" alt="Отзыв о платформе Stellas" loading="lazy"></button>`; }).join('');
$('#rvMore').addEventListener('click', e => { wall.classList.remove('clip'); e.currentTarget.parentElement.remove(); });

/* ---------- lightbox ---------- */
const lb = $('#lb'), lbImg = $('img', lb);
document.addEventListener('click', e => { const b = e.target.closest('[data-lb]'); if (!b) return; lbImg.src = b.dataset.lb; lb.classList.add('open'); });
lb.addEventListener('click', () => lb.classList.remove('open'));
addEventListener('keydown', e => { if (e.key === 'Escape') { lb.classList.remove('open'); document.body.classList.remove('menu-open'); } });

/* ---------- faq ---------- */
$$('.qa button').forEach(b => b.addEventListener('click', () => { const q = b.parentElement, o = q.classList.contains('open'); $$('.qa').forEach(x => x.classList.remove('open')); if (!o) q.classList.add('open'); }));

/* ---------- mp4 + webm sources ---------- */
$$('video[src$=".mp4"]').forEach(v => {
  const src = v.getAttribute('src'); v.removeAttribute('src');
  v.innerHTML = `<source src="${src}" type='video/mp4; codecs="avc1.640028"'><source src="${src.replace(/\.mp4$/, '.webm')}" type="video/webm">`;
});

/* ---------- video -> canvas mirror (кадры видны даже там, где видеослой не рисуется) ---------- */
function mirror(v) {
  const c = document.createElement('canvas'); c.className = 'vmirror'; c.setAttribute('aria-hidden', 'true');
  v.after(c);
  const ctx = c.getContext('2d'); let on = false;
  const draw = () => {
    if (!on) return;
    if (v.readyState >= 2 && v.videoWidth) {
      const dpr = Math.min(2, devicePixelRatio || 1), W = c.clientWidth, H = c.clientHeight;
      if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); }
      const vw = v.videoWidth, vh = v.videoHeight, fit = getComputedStyle(v).objectFit;
      const k = fit === 'contain' ? Math.min(c.width / vw, c.height / vh) : Math.max(c.width / vw, c.height / vh);
      const dw = vw * k, dh = vh * k;
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(v, (c.width - dw) / 2, 0, dw, dh);
      c.classList.add('ready');
    }
    v.requestVideoFrameCallback ? v.requestVideoFrameCallback(draw) : requestAnimationFrame(draw);
  };
  return { start() { if (!on) { on = true; draw(); } }, stop() { on = false; } };
}

/* ---------- autoplay videos ---------- */
const vio = new IntersectionObserver(es => es.forEach(e => {
  const v = e.target; v._m = v._m || mirror(v);
  if (e.isIntersecting) { if (v.preload === 'none') v.preload = 'auto'; v.play().then(() => v._m.start()).catch(() => {}); v._m.start(); }
  else { v.pause(); v._m.stop(); }
}), { threshold: .25 });
$$('video[data-autoplay]').forEach(v => vio.observe(v));

/* ---------- magnetic ---------- */
if (fine && !reduce) $$('.magnetic').forEach(b => {
  b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .3}px)`; });
  b.addEventListener('pointerleave', () => b.style.transform = '');
});


/* ---------- ticker ---------- */
const REGC = ['#FF6A55', '#FFB547', '#8FA2F2'], REGN = ['разг.', 'нейтр.', 'офиц.'];
const TK = [['kriegen', 0], ['bekommen', 1], ['erhalten', 2], ['quatschen', 0], ['reden', 1], ['sich unterhalten', 2], ['kapieren', 0], ['verstehen', 1], ['nachvollziehen', 2], ['die Kohle', 0], ['das Geld', 1], ['die Mittel', 2]];
const TK2 = [['Tschüss', 0], ['Bis bald', 1], ['Mit freundlichen Grüßen', 2], ['super', 0], ['gut', 1], ['hervorragend', 2], ['fix', 0], ['schnell', 1], ['zügig', 2], ['abhauen', 0], ['gehen', 1], ['sich verabschieden', 2]];
const tkHtml = a => { const h = a.map(([w, r]) => `<span class="tk-w"><i style="background:${REGC[r]}"></i>${esc(w)}<small>${REGN[r]}</small></span>`).join(''); return h + h; };
$('#tk1').innerHTML = tkHtml(TK); $('#tk2').innerHTML = tkHtml(TK2);

/* ---------- phone posters ---------- */
$$('.phone video').forEach(v => { v.closest('.screen').style.backgroundImage = `url(${v.getAttribute('poster')})`; });

/* ---------- anatomy donut ---------- */
const ANAT = [
  ['#9DB0F5', 'Значение', 'получать — это есть в любом словаре', 'bekommen = получать'],
  ['#FF6A55', 'Регистр', 'нейтрально: подходит и другу, и врачу', 'kriegen ← bekommen → erhalten'],
  ['#FFB547', 'Оттенок', 'получить то, что дали, а не взять самому', 'Ich bekomme ein Geschenk'],
  ['#2BB673', 'Компания', 'с какими словами живёт в паре', 'Hunger bekommen · Angst bekommen']
];
const donut = $('#donut'), R = 78, C = 2 * Math.PI * R, GAP = 6, SEG = C / 4 - GAP;
donut.innerHTML = `<circle class="bg" cx="100" cy="100" r="${R}"/>` + ANAT.map((a, i) => `<circle class="seg" data-i="${i}" cx="100" cy="100" r="${R}" stroke="${a[0]}" stroke-dasharray="0 ${C}" stroke-dashoffset="${-(i * C / 4)}"/>`).join('');
const segs = $$('.seg', donut);
$('#legend').innerHTML = ANAT.map((a, i) => `<button class="lg" data-i="${i}"><i style="background:${a[0]}"></i><div><b>${a[1]}</b><span>${esc(a[2])}</span><br><span class="de">${esc(a[3])}</span></div></button>`).join('');
function hlAnat(i) {
  segs.forEach((c, k) => { c.classList.toggle('dim', i !== null && k !== i); c.classList.toggle('hl', k === i); });
  $$('.lg').forEach((l, k) => l.classList.toggle('on', k === i));
  $('#donutLbl').textContent = i === null ? '4 слоя' : ANAT[i][1].toLowerCase();
}
$$('.lg').forEach(l => l.addEventListener('click', () => hlAnat(+l.dataset.i)));
segs.forEach(c => c.addEventListener('click', () => hlAnat(+c.dataset.i)));
new IntersectionObserver((es, o) => es.forEach(e => { if (!e.isIntersecting) return; o.disconnect(); segs.forEach((c, i) => setTimeout(() => { c.style.strokeDasharray = `${SEG} ${C - SEG}`; }, reduce ? 0 : 250 * i)); }), { threshold: .4 }).observe(donut);

/* ---------- spectrum ---------- */
const SP1 = [['Moin!', 5, 0], ['Hi!', 18, 0], ['Hallo!', 38, 1], ['Guten Tag!', 60, 1], ['Grüß Gott!', 74, 1], ['Sehr geehrte…', 90, 2]];
const SP2 = [['Tschüss!', 6, 0], ['Ciao!', 20, 0], ['Bis bald!', 40, 1], ['Auf Wiedersehen!', 64, 1], ['MfG', 92, 2]];
const spHtml = a => a.map(([w, x, r], i) => `<button class="sp ${i % 2 ? 'dn' : 'up'}" style="--x:${x}%;--c:${REGC[r]};--i:${i}" data-say="${esc(w.replace('…', ' Damen und Herren').replace('MfG', 'Mit freundlichen Grüßen'))}"><span>${esc(w)}</span></button>`).join('');
$('#spec1').innerHTML = spHtml(SP1); $('#spec2').innerHTML = spHtml(SP2);

/* ---------- synonym map ---------- */
const MAP = [
  { ru: 'сказать', note: 'Sagen — всегда можно. Quatschen — только с друзьями. Mitteilen — только в письме.', w: [['quatschen', 12, 22, 0, 'болтать'], ['labern', 16, 70, 0, 'трепаться'], ['reden', 36, 16, 1, 'говорить'], ['sagen', 44, 80, 1, 'сказать'], ['erzählen', 62, 22, 1, 'рассказать'], ['äußern', 80, 74, 2, 'высказать'], ['mitteilen', 86, 28, 2, 'сообщить']] },
  { ru: 'хороший', note: 'Geil — комплимент от друга. От начальника — повод насторожиться.', w: [['geil', 10, 26, 0, 'круто'], ['super', 20, 74, 0, 'супер'], ['toll', 36, 18, 1, 'здорово'], ['gut', 44, 80, 1, 'хорошо'], ['prima', 62, 20, 1, 'отлично'], ['hervorragend', 80, 72, 2, 'превосходно'], ['einwandfrei', 84, 26, 2, 'безупречно']] },
  { ru: 'получать', note: 'В письме из Jobcenter вы всегда erhalten. В WhatsApp — kriegen.', w: [['kriegen', 14, 26, 0, 'получить'], ['abstauben', 18, 74, 0, 'урвать'], ['bekommen', 44, 18, 1, 'получить'], ['empfangen', 70, 78, 2, 'принять'], ['erhalten', 84, 28, 2, 'получить']] },
  { ru: 'деньги', note: 'Kohle и Knete — у друзей. Finanzielle Mittel — в анкете.', w: [['die Kohle', 12, 24, 0, 'бабки'], ['die Knete', 18, 76, 0, 'бабло'], ['das Geld', 44, 18, 1, 'деньги'], ['das Gehalt', 50, 82, 1, 'зарплата'], ['die Mittel', 78, 74, 2, 'средства'], ['die Finanzen', 84, 24, 2, 'финансы']] },
  { ru: 'уходить', note: 'Abhauen — сбежать с вечеринки. Sich verabschieden — уйти вежливо.', w: [['abhauen', 12, 24, 0, 'свалить'], ['verschwinden', 18, 76, 0, 'исчезнуть'], ['gehen', 42, 16, 1, 'идти'], ['weggehen', 52, 82, 1, 'уйти'], ['sich verabschieden', 78, 24, 2, 'попрощаться'], ['verlassen', 84, 74, 2, 'покинуть']] }
];
const mapStage = $('#mapStage'), mapSvg = $('#mapSvg'), mapChips = $('#mapChips');
mapChips.innerHTML = MAP.map((m, i) => `<button data-i="${i}">${esc(m.ru)}</button>`).join('');
function setMap(i) {
  const m = MAP[i];
  $$('button', mapChips).forEach((b, k) => b.classList.toggle('on', k === i));
  mapStage.classList.remove('on');
  $$('.mnode', mapStage).forEach(n => n.remove());
  const n = m.w.length, ROWS = [15, 67, 33, 84];
  const pts = m.w.map((w, k) => [w[0], 18 + (n > 1 ? k * 64 / (n - 1) : 32), ROWS[k % 4], w[3], w[4]]);
  mapSvg.innerHTML = pts.map(([w, x, y, r]) => `<line x1="50" y1="49" x2="${x}" y2="${y}" stroke="${REGC[r]}" pathLength="1"/>`).join('');
  const html = `<div class="mnode center" style="--x:50%;--y:49%;--c:#151515;--i:0">${esc(m.ru)}</div>` + pts.map(([w, x, y, r, ru], k) => `<button class="mnode" data-say="${esc(w)}" style="--x:${x}%;--y:${y}%;--c:${REGC[r]};--i:${k + 1}"><span class="fl" style="--i:${k}">${esc(w)}<small>${esc(ru)}</small></span></button>`).join('');
  mapStage.insertAdjacentHTML('beforeend', html);
  $('#mapNote').textContent = m.note;
  requestAnimationFrame(() => requestAnimationFrame(() => mapStage.classList.add('on')));
}
$$('button', mapChips).forEach(b => b.addEventListener('click', () => setMap(+b.dataset.i)));
setMap(0); mapStage.classList.remove('on');
new IntersectionObserver((es, o) => es.forEach(e => { if (e.isIntersecting) { o.disconnect(); setMap(0); } }), { threshold: .35 }).observe(mapStage);

/* ---------- rescue flow ---------- */
io.observe($('#rflow'));

/* ---------- roadmap ---------- */
const ROAD = [
  ['A0', 'Старт с нуля', 'Алфавит, чтение, произношение, числа.', ['Aussprache', 'Zahlen']],
  ['A1', 'Первые фразы', 'Знакомство, магазин, врач, дни недели.', ['Ich heiße…', 'Termin']],
  ['A2', 'Жизнь в Германии', 'Perfekt, падежи, работа и документы.', ['Perfekt', 'Dativ']],
  ['B1', 'Экзамен и письма', 'Придаточные, письма, подготовка к B1.', ['weil / dass', 'Brief']],
  ['B2', 'Работа и спор', 'Пассив, аргументы, лексика по профессии. Синонимы — здесь.', ['Passiv', 'Synonyme'], 1],
  ['C1', 'Свободно', 'Стиль, нюансы, сложные тексты.', ['Nominalstil', 'Nuancen']]
];
const rl = $('#roadList');
rl.insertAdjacentHTML('beforeend', ROAD.map(r => `<div class="ms${r[4] ? ' here' : ''}"><span class="ms-dot">${r[0]}</span><div class="ms-card"><b>${r[1]}</b><p>${r[2]}</p><div class="chips">${r[3].map(c => `<span class="chip de">${esc(c)}</span>`).join('')}</div></div></div>`).join(''));
const rf = $('#roadFill'), msEls = $$('.ms', rl);
function roadFrame() {
  const r = rl.getBoundingClientRect(), line = innerHeight * .65;
  const h = Math.max(0, Math.min(r.height - 12, line - r.top));
  rf.style.height = h + 'px';
  msEls.forEach(m => { const mr = m.getBoundingClientRect(); m.classList.toggle('lit', mr.top + 18 < line); });
}
addEventListener('scroll', roadFrame, { passive: true }); roadFrame();

observeReveal();
requestAnimationFrame(() => $$('.hero .rv').forEach(el => el.classList.add('in')));
})();
