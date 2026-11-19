(() => {
  'use strict';
  // ─────────────────────────────────────────────────────────────
  // 문의 폼 접수 주소. 비어 있으면 실제 전송 없이 안내 문구만 보여 줍니다.
  // 호스팅이 정해지면 폼을 받는 주소(예: /api/inquiry, 폼 수신 서비스 주소)를 넣으세요.
  const FORM_ENDPOINT = '';
  // ─────────────────────────────────────────────────────────────
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const AW = JSON.parse($('#aw-data').textContent);
  const ROOT = $('#aw-data').dataset.root || '';

  // 헤더 · 떠 있는 버튼
  const hd = $('.hd'), fab = $('.fab');
  const onScroll = () => {
    hd.classList.toggle('on', scrollY > 30);
    fab.classList.toggle('on', scrollY > innerHeight * .6);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  new IntersectionObserver(es => fab.classList.toggle('at-form', es[0].isIntersecting)).observe($('#fm'));
  $('.burger').addEventListener('click', () => {
    const o = document.body.classList.toggle('nav-open');
    $('.burger').setAttribute('aria-expanded', o);
  });
  $$('.nav a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('nav-open')));

  // 현재 섹션 표시
  const links = $$('.gnb>li>a');
  const secIo = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('cur', a.getAttribute('href').split('#')[1] === e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => secIo.observe(s));

  // 등장 효과
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .14, rootMargin: '0px 0px -6% 0px' });
  $$('.rv').forEach(el => io.observe(el));

  // 숫자 올라가기
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, t0 = performance.now(), dur = 1500;
    const step = t => {
      const p = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - p, 3)));
      el.textContent = v.toLocaleString('ko-KR');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => cio.observe(el));

  // 히어로 엠블럼 순환 (메인에만 있음)
  const stage = $('a.stage-em');
  if (stage) {
    const ems = $$('img', stage), dots = $$('.stage-dots button'), capK = $('.stage-cap strong'), capE = $('.stage-cap span');
    let cur = 0, timer;
    const show = i => {
      cur = (i + ems.length) % ems.length;
      ems.forEach((m, k) => m.classList.toggle('on', k === cur));
      dots.forEach((d, k) => d.classList.toggle('on', k === cur));
      capK.textContent = AW[cur].name; capE.textContent = AW[cur].en;
      stage.href = `${ROOT}awards/${AW[cur].slug}/`;
    };
    const play = () => { clearInterval(timer); timer = setInterval(() => show(cur + 1), 3200); };
    dots.forEach((d, k) => d.addEventListener('click', () => { show(k); play(); }));
    show(0); play();
  }

  // 어워즈 분류 탭
  $$('.tabs button').forEach(b => b.addEventListener('click', () => {
    $$('.tabs button').forEach(x => x.classList.toggle('on', x === b));
    const c = b.dataset.cat;
    $$('.aw').forEach(a => a.classList.toggle('hide', c !== 'all' && a.dataset.cat !== c));
  }));

  // 상장 크게 보기
  document.addEventListener('click', e => {
    const z = e.target.closest('[data-zoom]');
    if (z) { $('#lb img').src = z.dataset.zoom; $('#lb').showModal(); }
  });
  $$('dialog').forEach(d => d.addEventListener('click', () => d.close()));


  // 문의 폼
  const fm = $('#fm'), res = $('.fm-res');
  // 상 미리 선택: 주소의 ?award=<slug> 가 있으면 그 상, 없으면 상별 페이지 자신의 상
  const qs = new URLSearchParams(location.search).get('award');
  const pre = qs || document.body.dataset.award;
  if (pre) {
    const cb = $$('.pick input').find(i => i.dataset.slug === pre);
    if (cb) {
      cb.checked = true;
      if (qs) requestAnimationFrame(() => $('#contact').scrollIntoView());
    }
  }
  const tel = fm.elements.tel;
  tel.addEventListener('input', () => {
    const d = tel.value.replace(/\D/g, '').slice(0, 11);
    tel.value = d.length < 4 ? d : d.length < 8 ? `${d.slice(0, 3)}-${d.slice(3)}`
      : d.startsWith('02') ? `${d.slice(0, 2)}-${d.slice(2, d.length - 4)}-${d.slice(-4)}`
      : `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`;
  });
  const rules = {
    company: v => v.trim().length > 0,
    name: v => v.trim().length > 0,
    tel: v => v.replace(/\D/g, '').length >= 9,
    email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  };
  const check = k => {
    const ok = rules[k](fm.elements[k].value);
    fm.elements[k].closest('.fd').classList.toggle('err', !ok);
    return ok;
  };
  Object.keys(rules).forEach(k => fm.elements[k].addEventListener('blur', () => check(k)));
  Object.keys(rules).forEach(k => fm.elements[k].addEventListener('input', () => { if (fm.elements[k].closest('.fd').classList.contains('err')) check(k); }));
  fm.elements.agree.addEventListener('change', () => { if (fm.elements.agree.checked) $('.agree').classList.remove('err'); });
  fm.addEventListener('submit', async e => {
    e.preventDefault();
    res.classList.remove('show');
    const bad = Object.keys(rules).filter(k => !check(k));
    const ag = fm.elements.agree.checked;
    $('.agree').classList.toggle('err', !ag);
    if (bad.length || !ag) {
      (bad.length ? fm.elements[bad[0]] : fm.elements.agree).focus();
      return;
    }
    const data = Object.fromEntries(new FormData(fm).entries());
    data.awards = $$('.pick input:checked').map(i => i.value);
    delete data.award;
    if (!FORM_ENDPOINT) {
      res.textContent = '입력 내용은 정상입니다. 다만 접수 주소가 아직 연결되지 않아 실제로 전송되지는 않았습니다. (호스팅 확정 후 연결)';
      res.classList.add('show');
      return;
    }
    const btn = $('button[type=submit]', fm); btn.disabled = true;
    try {
      const r = await fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error(r.status);
      fm.reset();
      res.textContent = '문의가 접수되었습니다. 담당자가 확인 후 연락드리겠습니다.';
    } catch (err) {
      res.textContent = '전송 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
    }
    btn.disabled = false;
    res.classList.add('show');
  });
})();
