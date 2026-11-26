(() => {
  'use strict';
  // ─────────────────────────────────────────────────────────────
  // 문의 폼 접수 주소. 비어 있으면 실제 전송 없이 안내 문구만 보여 줍니다.
  // 호스팅이 정해지면 폼을 받는 주소(예: /api/inquiry, 폼 수신 서비스 주소)를 넣으세요.
  const FORM_ENDPOINT = '';
  // 접수 마감일은 site_config.json 의 deadline 한 곳에서만 정합니다 (빌드 때 아래 값으로 들어옵니다).
  const DEADLINE = document.getElementById('aw-data').dataset.deadline || '';
  // 광고 유입 추적값: 주소에 붙어 온 값을 폼과 함께 보냅니다.
  const TRACK_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'n_media', 'n_query', 'n_keyword', 'n_ad'];
  // ─────────────────────────────────────────────────────────────
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];

  // 헤더 · 떠 있는 버튼
  const hd = $('.hd'), fab = $('.fab');
  const onScroll = () => {
    hd.classList.toggle('on', scrollY > 24);
    fab.classList.toggle('on', scrollY > innerHeight * .6);
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const burger = $('.burger');
  const setNav = o => {
    document.body.classList.toggle('nav-open', o);
    burger.setAttribute('aria-expanded', o);
    burger.setAttribute('aria-label', o ? '메뉴 닫기' : '메뉴 열기');
  };
  burger.addEventListener('click', () => setNav(!document.body.classList.contains('nav-open')));
  $$('.nav a').forEach(a => a.addEventListener('click', () => setNav(false)));

  // 현재 섹션 표시
  const links = $$('.gnb>li>a');
  const secIo = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) links.forEach(a => a.classList.toggle('cur', a.getAttribute('href').split('#')[1] === e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach(s => secIo.observe(s));

  // 등장 효과 (fade-up 한 종류)
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .1, rootMargin: '0px 0px -5% 0px' });
  $$('.rv').forEach(el => io.observe(el));

  // 접수 마감 카운트다운 (마감일이 있을 때만 띠가 존재)
  const cd = $('#dday .cd');
  if (cd && DEADLINE) {
    const end = new Date(DEADLINE + 'T23:59:59+09:00').getTime();
    const p2 = n => String(n).padStart(2, '0');
    const tick = () => {
      const t = Math.max(0, end - Date.now()), s = Math.floor(t / 1000);
      cd.innerHTML = t ? `<span><b>${Math.floor(s / 86400)}</b>일</span><span><b>${p2(Math.floor(s / 3600) % 24)}</b>시간</span><span><b>${p2(Math.floor(s / 60) % 60)}</b>분</span><span><b>${p2(s % 60)}</b>초</span>`
        : '<span>접수가 마감되었습니다</span>';
    };
    tick(); setInterval(tick, 1000);
  }

  // 어워즈 분류 탭
  $$('.tabs button').forEach(b => b.addEventListener('click', () => {
    $$('.tabs button').forEach(x => x.classList.toggle('on', x === b));
    const c = b.dataset.cat;
    $$('.aw').forEach(a => a.parentElement.classList.toggle('hide', c !== 'all' && a.dataset.cat !== c));
  }));

  // 상장 크게 보기
  const lb = $('#lb');
  document.addEventListener('click', e => {
    const z = e.target.closest('[data-zoom]');
    if (z) { $('img', lb).src = z.dataset.zoom; lb.showModal(); }
  });
  lb.addEventListener('click', () => lb.close());

  // ── 문의 폼 ──
  const fm = $('#fm'), res = $('.fm-res'), mbar = $('.mbar');
  // 폼이 화면에 보이는 동안에는 모바일 하단 바를 숨긴다
  new IntersectionObserver(es => mbar.classList.toggle('hide', es[0].isIntersecting), { threshold: 0 }).observe(fm);

  // 광고 유입 추적값을 hidden 필드로 (다른 페이지로 옮겨 다녀도 유지)
  const q = new URLSearchParams(location.search);
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem('kba-trk') || '{}'); } catch (e) { /* 저장소를 못 쓰는 환경 */ }
  TRACK_KEYS.forEach(k => { if (q.get(k)) saved[k] = q.get(k); });
  try { sessionStorage.setItem('kba-trk', JSON.stringify(saved)); } catch (e) { /* 무시 */ }
  TRACK_KEYS.forEach(k => {
    const i = document.createElement('input');
    i.type = 'hidden'; i.name = k; i.value = saved[k] || '';
    $('#trk').appendChild(i);
  });

  // 상 미리 선택: 주소의 ?award=<slug> 가 있으면 그 상, 없으면 상별 페이지 자신의 상
  const qs = q.get('award');
  const pre = qs || document.body.dataset.award;
  if (pre) {
    const cb = $$('.pick input').find(i => i.dataset.slug === pre);
    if (cb) {
      cb.checked = true;
      if (qs) requestAnimationFrame(() => $('#contact').scrollIntoView());
    }
  }
  // 연락처 자동 하이픈
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
    const el = fm.elements[k], ok = rules[k](el.value);
    el.closest('.fd').classList.toggle('err', !ok);
    el.setAttribute('aria-invalid', !ok);
    return ok;
  };
  Object.keys(rules).forEach(k => {
    fm.elements[k].addEventListener('blur', () => check(k));
    fm.elements[k].addEventListener('input', () => { if (fm.elements[k].closest('.fd').classList.contains('err')) check(k); });
  });
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
    data.page = location.pathname;
    delete data.award;
    const btn = $('button[type=submit]', fm), label = btn.innerHTML;
    btn.disabled = true; btn.textContent = '보내는 중…';
    try {
      if (!FORM_ENDPOINT) {
        res.textContent = '입력 내용은 정상입니다. 다만 접수 주소가 아직 연결되지 않아 실제로 전송되지는 않았습니다. (호스팅 확정 후 연결)';
      } else {
        const r = await fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (!r.ok) throw new Error(r.status);
        fm.reset();
        res.textContent = '문의가 접수되었습니다. 담당자가 확인 후 연락드리겠습니다.';
      }
    } catch (err) {
      res.textContent = '전송 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
    }
    btn.disabled = false; btn.innerHTML = label;
    res.classList.add('show');
  });
})();
