/* ==========================================================================
   K Car 안심직거래 × 세상의 모든 직거래 (1:1 Production-Twin Interactive App)
   ========================================================================== */
(function () {
  'use strict';

  const META = window.KCAR_ALL_C2C_META || {
    crawledDate: '2026-11-17',
    updatedAt: '2026-11-17 09:16:22',
    rawDbTotal: 13552,
    marketTotal: 40715,
    platforms: {
      kcar: { name: 'K Car 안심직거래', totalCount: 342 },
      daangn: { name: '당근마켓', totalCount: 37829 },
      encar: { name: '엔카닷컴', totalCount: 2512 },
      kb: { name: 'KB차차차', totalCount: 32 }
    }
  };

  const VEHICLES = Array.isArray(window.KCAR_ALL_C2C_VEHICLES) ? window.KCAR_ALL_C2C_VEHICLES : [];
  const SHORTS_GROUPS =
    window.KCAR_MODEL_SHORTS_DATA && Array.isArray(window.KCAR_MODEL_SHORTS_DATA.groups)
      ? window.KCAR_MODEL_SHORTS_DATA.groups
      : [];

  const FALLBACK_CAR_IMG =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
        <rect width="400" height="400" fill="#f2f2f2"/>
        <path d="M102 224l24-52a22 22 0 0 1 20-13h108a22 22 0 0 1 20 13l24 52" fill="none" stroke="#b0b2bd" stroke-width="8" stroke-linecap="round"/>
        <rect x="78" y="220" width="244" height="52" rx="14" fill="#d8dee8"/>
        <circle cx="128" cy="274" r="20" fill="#82848b"/>
        <circle cx="272" cy="274" r="20" fill="#82848b"/>
      </svg>`
    );

  // Clean Vector Brand Marks for Avatar Circles (Zero OS Emojis!)
  const BRAND_VECTOR_AVATARS = {
    daangn: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#fff7f2"/><circle cx="20" cy="22" r="8.5" fill="none" stroke="#ff6f0f" stroke-width="3.4"/><path d="M20 9c2.2 0 3.8 1.6 3.8 3.6 0 1.4-1.8 2.8-3.8 2.8s-3.8-1.4-3.8-2.8C16.2 10.6 17.8 9 20 9z" fill="#0cb211"/></svg>`
    )}`,
    encar: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#f6f8fa"/><rect x="10" y="13" width="20" height="14" rx="3" fill="#22252e"/><circle cx="25" cy="20" r="3" fill="#e60012"/><rect x="13" y="18.5" width="7" height="3" rx="1.5" fill="#fff"/></svg>`
    )}`,
    kb: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#fffbeb"/><circle cx="20" cy="20" r="11" fill="#ffbc00"/><path d="M20 13l2.1 4.5 4.9.6-3.6 3.4.9 4.9-4.3-2.4-4.3 2.4.9-4.9-3.6-3.4 4.9-.6z" fill="#3b3020"/></svg>`
    )}`,
    kcar: `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#fff"/><rect x="11" y="11" width="8" height="8" rx="1.5" fill="#b70f28"/><path d="M29 11a8 8 0 0 0-8 8h8v-8z" fill="#b70f28"/><rect x="11" y="21" width="8" height="8" rx="1.5" fill="#b0b2bd"/><path d="M21 21a8 8 0 0 0 8 8v-8h-8z" fill="#b70f28"/></svg>`
    )}`
  };

  const BELL_SVG = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16171d" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  `;

  const SEARCH_SVG = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16171d" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="7.2"></circle>
      <path d="M20 20l-3.8-3.8"></path>
    </svg>
  `;

  const state = {
    view: 'home', // 'home' | 'list' | 'detail' | 'exhibit'
    prevView: 'home',
    homeExtTab: 'all',
    platCat: 'all', // 'all' | 'external' | 'kcar' | 'daangn' | 'encar' | 'kb'
    keyword: '',
    certOnly: false,
    negoOnly: false,
    bodyType: 'ALL',
    sido: 'ALL',
    priceBand: 'ALL',
    origin: 'ALL',
    sortBy: 'recommended',
    wishOnly: false,
    pageSize: 15,
    visibleCount: 15,
    u500Band: 'all', // 'all' | 'under300' | '300to500'
    u500Sort: 'recommended',
    u500ExtPlat: 'all', // 'all' | 'daangn' | 'encar' | 'kb'
    u500KcarExpanded: false,
    u500ExtPageSize: 12,
    u500ExtVisible: 12,
    prevScrollTop: 0,
    selectedCar: null,
    wishedIds: new Set(),
    modalConfirmFn: null,
    shortsEnabled: true,
    activeShortsList: [],
    activeShortsIdx: 0,
    activeShortsLabel: ''
  };

  function esc(val) {
    return String(val ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function fmtNum(n) {
    return Number(n || 0).toLocaleString('ko-KR');
  }

  function fmtPrice(manwon) {
    const p = Number(manwon || 0);
    if (p <= 0) return '가격문의';
    if (p >= 10000) {
      const eok = Math.floor(p / 10000);
      const rem = p % 10000;
      return rem > 0 ? `${eok}억 ${fmtNum(rem)}만원` : `${eok}억원`;
    }
    return `${fmtNum(p)}만원`;
  }

  function fmtMileage(km) {
    const k = Number(km || 0);
    if (k <= 0) return '주행거리 확인';
    if (k >= 10000) {
      const man = (k / 10000).toFixed(1).replace(/\.0$/, '');
      return `${man}만km`;
    }
    return `${fmtNum(k)}km`;
  }

  function getColorHex(colorName) {
    const s = String(colorName || '');
    if (s.includes('블랙') || s.includes('검정')) return '#353535';
    if (s.includes('화이트') || s.includes('흰색') || s.includes('진주')) return '#f7f8fa';
    if (s.includes('그레이') || s.includes('쥐색') || s.includes('은색')) return '#babec6';
    if (s.includes('브라운') || s.includes('갈색')) return '#b85928';
    if (s.includes('베이지')) return '#f5ebcd';
    if (s.includes('블루') || s.includes('파랑') || s.includes('네이비')) return '#0653ff';
    if (s.includes('그린') || s.includes('녹색')) return '#1f6f4a';
    if (s.includes('오렌지') || s.includes('주황')) return '#fe7b12';
    if (s.includes('레드') || s.includes('빨강')) return '#ed0606';
    return '#babec6';
  }

  function getPlatInfo(plat) {
    switch (plat) {
      case 'kcar':
        return {
          short: 'K Car 직거래',
          full: 'K Car 안심직거래',
          badgeCls: 'badge-plat--kcar',
          ctaLabel: '채팅하기',
          avatar: BRAND_VECTOR_AVATARS.kcar
        };
      case 'daangn':
        return {
          short: '당근마켓',
          full: '당근마켓 중고차',
          badgeCls: 'badge-plat--daangn',
          ctaLabel: '당근마켓에서 상세보기',
          avatar: BRAND_VECTOR_AVATARS.daangn
        };
      case 'encar':
        return {
          short: '엔카 직거래',
          full: '엔카닷컴 개인직거래',
          badgeCls: 'badge-plat--encar',
          ctaLabel: '엔카닷컴에서 상세보기',
          avatar: BRAND_VECTOR_AVATARS.encar
        };
      case 'kb':
        return {
          short: 'KB차차차',
          full: 'KB차차차 개인직거래',
          badgeCls: 'badge-plat--kb',
          ctaLabel: 'KB차차차에서 상세보기',
          avatar: BRAND_VECTOR_AVATARS.kb
        };
      default:
        return {
          short: '외부직거래',
          full: '외부 직거래 플랫폼',
          badgeCls: 'badge-plat--encar',
          ctaLabel: '원본 사이트에서 상세보기',
          avatar: BRAND_VECTOR_AVATARS.encar
        };
    }
  }

  window.onCarImgFallback = function (el) {
    if (!el || el.dataset.fb === '1') return;
    el.dataset.fb = '1';
    el.src = FALLBACK_CAR_IMG;
  };

  window.onShortThumbFallback = function (el, videoId) {
    if (!el || el.dataset.sfb === '1') return;
    el.dataset.sfb = '1';
    el.src = `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg`;
  };

  function getDisplayModelName(car) {
    const brand = String(car.brand || '').replace(/\(.*\)/g, '').trim();
    const model = String(car.model || '').replace(/\s*\(.*?\)\s*/g, ' ').trim();
    if (brand && model && brand !== '수입차' && !model.startsWith(brand)) {
      return `${brand} ${model}`;
    }
    if (model) return model;
    return String(car.title || '').split(/\s+/).slice(0, 2).join(' ');
  }

  function resolveShortsForCar(car) {
    const displayModel = getDisplayModelName(car);
    const hay = `${car.brand || ''} ${car.model || ''} ${car.title || ''}`.toLowerCase();

    let matchedGroup = null;
    for (let i = 0; i < SHORTS_GROUPS.length; i++) {
      const g = SHORTS_GROUPS[i];
      if (!g.keywords || g.keywords.length === 0) continue;
      for (let k = 0; k < g.keywords.length; k++) {
        const kw = String(g.keywords[k]).toLowerCase();
        if (kw && hay.includes(kw)) {
          matchedGroup = g;
          break;
        }
      }
      if (matchedGroup) break;
    }

    const isDirectMatch = Boolean(matchedGroup && matchedGroup.shorts && matchedGroup.shorts.length > 0);
    if (!matchedGroup || !matchedGroup.shorts || matchedGroup.shorts.length === 0) {
      const fbKey = String(car.bodyType || '').includes('SUV') ? 'fallback_suv' : 'fallback_sedan';
      matchedGroup = SHORTS_GROUPS.find((g) => g.key === fbKey) || SHORTS_GROUPS[0] || null;
    }

    const shorts = matchedGroup && Array.isArray(matchedGroup.shorts) ? matchedGroup.shorts : [];
    const ytSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      `${displayModel} 시승기 실오너 후기 #shorts`
    )}`;

    return {
      displayModel,
      groupLabel: isDirectMatch ? displayModel : matchedGroup ? matchedGroup.label : displayModel,
      isDirectMatch,
      shorts,
      ytSearchUrl
    };
  }

  function renderCarShortsSection(car) {
    if (!state.shortsEnabled || !car) return '';
    const resolved = resolveShortsForCar(car);
    if (!resolved.shorts.length) return '';

    state.activeShortsList = resolved.shorts;
    state.activeShortsLabel = resolved.displayModel;

    const subCopy = resolved.isDirectMatch
      ? '구매 전 확인하면 좋은 동일 차종 실오너 후기·시승 쇼츠만 모았어요.'
      : `${resolved.displayModel} 탐색에 도움되는 중고차 핵심 체크 쇼츠예요.`;

    return `
      <section class="dtl-shorts-sec" id="secCarShorts">
        <div class="dtl-shorts-head">
          <div class="dtl-shorts-tit-row">
            <span class="shorts-brand-mark" aria-hidden="true">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#b70f28">
                <path d="M17.77 10.32l-1.2-.5L18 9.06a3.74 3.74 0 0 0-3.5-6.62l-6 2.49a3.74 3.74 0 0 0 .23 6.79l1.2.49L8.5 12.97a3.74 3.74 0 0 0 3.5 6.62l6-2.49a3.74 3.74 0 0 0-.23-6.78zM10 14.65v-5.3L14.5 12 10 14.65z"/>
              </svg>
            </span>
            <h3 class="dtl-shorts-tit">
              <span class="accent-model">${esc(resolved.displayModel)}</span> 쇼츠 리뷰
            </h3>
          </div>
          <a class="dtl-shorts-more" href="${esc(resolved.ytSearchUrl)}" target="_blank" rel="noopener noreferrer">
            유튜브 더보기 &gt;
          </a>
        </div>
        <p class="dtl-shorts-sub">${esc(subCopy)}</p>

        <div class="shorts-swiper-row">
          ${resolved.shorts
            .map(
              (s, idx) => `
            <button type="button" class="shorts-card" data-short-idx="${idx}" aria-label="${esc(s.title)} 쇼츠 재생">
              <img src="${esc(s.thumb)}" alt="${esc(s.title)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="onShortThumbFallback(this, '${esc(s.videoId)}')" />
              <div class="shorts-card-top">
                <span class="shorts-angle-chip">${esc(s.tag || '핵심 리뷰')}</span>
                <span class="shorts-play-circle" aria-hidden="true">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>
                </span>
              </div>
              <div class="shorts-card-bottom">
                <p class="shorts-card-tit">${esc(s.title)}</p>
                <span class="shorts-card-ch">@${esc(s.channel)}</span>
              </div>
            </button>
          `
            )
            .join('')}
        </div>

        <div class="dtl-shorts-notice">
          <span>타사 딜러 매물 홍보를 제외한 차종 정보 큐레이션입니다.</span>
          <span class="safe-tag">리뷰 전용</span>
        </div>
      </section>
      <div class="gray-divider"></div>
    `;
  }

  function renderShortsModalSlide() {
    const list = state.activeShortsList || [];
    if (!list.length) return;
    const idx = ((state.activeShortsIdx % list.length) + list.length) % list.length;
    state.activeShortsIdx = idx;
    const item = list[idx];
    const car = state.selectedCar;

    document.getElementById('shortsModalTitle').textContent = `${state.activeShortsLabel} 쇼츠`;
    document.getElementById('shortsModalIdx').textContent = `${idx + 1} / ${list.length}`;
    document.getElementById('shortsModalChannel').textContent = `@${item.channel}`;
    document.getElementById('shortsModalVideoTit').textContent = item.title;

    const ytUrl = `https://www.youtube.com/shorts/${encodeURIComponent(item.videoId)}`;
    document.getElementById('linkShortsYoutube').href = ytUrl;

    const box = document.getElementById('shortsIframeBox');
    if (window.location.protocol === 'file:') {
      box.innerHTML = `
        <div style="width:100%; height:100%; position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:24px; text-align:center; background:#0f1015;">
          <img src="${esc(item.thumb)}" alt="" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0.32;" />
          <div style="position:relative; z-index:2; display:flex; flex-direction:column; align-items:center; gap:12px;">
            <p style="font-size:13px; line-height:19px; color:#fff;">로컬 파일(file://) 열기 모드에서는 유튜브 보안 정책상 새 창 재생으로 연결됩니다.<br/><span style="font-size:11.5px; color:rgba(255,255,255,0.7);">(쇼츠미리보기_열기.bat 실행 시 앱 내 즉시 자동재생 지원)</span></p>
            <a href="${esc(ytUrl)}" target="_blank" rel="noopener noreferrer" style="height:40px; padding:0 18px; border-radius:100px; background:#f01d29; color:#fff; font-size:13px; font-weight:700; display:inline-flex; align-items:center; gap:6px;">
              <span>YouTube 쇼츠 바로 재생 ↗</span>
            </a>
          </div>
        </div>
      `;
    } else {
      const embedUrl = `https://www.youtube.com/embed/${encodeURIComponent(
        item.videoId
      )}?autoplay=1&playsinline=1&rel=0&modestbranding=1`;
      box.innerHTML = `
        <iframe
          src="${embedUrl}"
          title="${esc(item.title)}"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
      `;
    }

    if (car) {
      const thumbEl = document.getElementById('shortsBarCarThumb');
      thumbEl.dataset.fb = '0';
      thumbEl.src = car.thumbnail || FALLBACK_CAR_IMG;
      document.getElementById('shortsBarCarTitle').textContent = car.title;
      document.getElementById('shortsBarCarPrice').textContent = `${fmtPrice(car.priceManwon)} · ${car.yearLabel}`;
    }
  }

  function openShortsModal(idx) {
    if (!state.activeShortsList || !state.activeShortsList.length) return;
    state.activeShortsIdx = Number(idx) || 0;
    renderShortsModalSlide();
    const dlg = document.getElementById('kcarShortsModal');
    if (dlg && typeof dlg.showModal === 'function' && !dlg.open) {
      dlg.showModal();
    }
  }

  function closeShortsModal() {
    const dlg = document.getElementById('kcarShortsModal');
    const box = document.getElementById('shortsIframeBox');
    if (box) box.innerHTML = '';
    if (dlg && dlg.open) dlg.close();
  }

  let snackTimer = null;
  function showSnack(msg) {
    const el = document.getElementById('kcarSnackbar');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('is-visible');
    clearTimeout(snackTimer);
    snackTimer = setTimeout(() => el.classList.remove('is-visible'), 2300);
  }

  function openKcarModal({ title, html, confirmLabel = '확인', onConfirm = null }) {
    const dlg = document.getElementById('kcarModal');
    document.getElementById('modalTit').textContent = title;
    document.getElementById('modalDesc').innerHTML = html;
    document.getElementById('btnModalConfirm').textContent = confirmLabel;
    state.modalConfirmFn = onConfirm;
    if (dlg && typeof dlg.showModal === 'function') {
      dlg.showModal();
    }
  }

  function openSelfRegPolicyModal() {
    openKcarModal({
      title: '내차 셀프 등록 안내',
      html: `
        <strong>K Car 안심직거래</strong>의 직접 차량 등록 및 보증·채팅 거래는 <strong>K Car 실소유자 인증을 완료한 차량</strong>만 등록할 수 있습니다.<br/><br/>
        <span style="display:block; padding:10px 12px; border-radius:6px; background:#f6f8fa; font-size:12px; color:#54555a; line-height:18px;">
          · K Car 등록 차량: 실소유자 인증 · K Car 진단 · 안심채팅 · 안전거래 지원<br/>
          · 외부 플랫폼(당근·엔카·KB): 고객 검색 편의를 위해 크롤링 요약 정보만 제공되며 원본 사이트로 이동합니다.
        </span>
      `,
      confirmLabel: '셀프 등록 안내 보기',
      onConfirm: () => {
        window.open('https://marketm.kcar.com/main', '_blank', 'noopener,noreferrer');
      }
    });
  }

  // Render Static KPIs from Today's Crawled Data
  function initKPIs() {
    const p = META.platforms;
    const total = META.marketTotal || 40715;
    const totalEl = document.getElementById('homeMetaTotalTxt');
    totalEl.textContent = `총 ${fmtNum(total)}대`;
    if (META.updatedAt) {
      totalEl.title = `자동 업데이트 기준: ${META.updatedAt}`;
    }
    document.getElementById('pillCntAll').textContent = fmtNum(total);
    document.getElementById('pillCntDaangn').textContent = fmtNum(p.daangn.totalCount);
    document.getElementById('pillCntEncar').textContent = fmtNum(p.encar.totalCount);
    document.getElementById('pillCntKb').textContent = fmtNum(p.kb.totalCount);
    document.getElementById('pillCntKcar').textContent = fmtNum(p.kcar.totalCount);

    // Dynamically update Hero Rolling Banner Slot Counter
    const slotEl = document.getElementById('heroSlotCounter');
    if (slotEl) {
      const formatted = fmtNum(total);
      const tokens = [];
      for (let i = 0; i < formatted.length; i++) {
        const ch = formatted[i];
        if (ch === ',' && tokens.length > 0) {
          tokens[tokens.length - 1] += ',';
        } else {
          tokens.push(ch);
        }
      }
      slotEl.innerHTML =
        tokens.map((t) => `<span class="slot-digit">${esc(t)}</span>`).join('') +
        `<span class="slot-digit is-unit">대</span>`;
    }
  }

  // Exact K Car .car-item.vert Renderer (Home 2-col & 3-col horizontal peeking cards)
  function renderVertCard(car) {
    const pi = getPlatInfo(car.platform);
    const chips = (car.options && car.options.length ? car.options : car.tags || []).slice(0, 3);

    let topBadgeHtml = '';
    if (car.platform === 'kcar' && car.diagYn) {
      topBadgeHtml = `<div class="badge-cert"><span>K Car 진단</span></div>`;
    } else if (car.isExternal) {
      topBadgeHtml = `<div class="badge-plat ${pi.badgeCls}">${esc(pi.short)}</div>`;
    }

    return `
      <article class="car-item-vert" data-car-id="${esc(car.id)}">
        <div class="thumb">
          <img src="${esc(car.thumbnail)}" alt="${esc(car.title)}" decoding="async" referrerpolicy="no-referrer" onerror="onCarImgFallback(this)" />
          <div class="badge-area">${topBadgeHtml}</div>
        </div>
        <div class="info">
          <h3 class="car-name">${esc(car.title)}</h3>
          <div class="sub-info">
            <span>${esc(car.yearLabel)}</span><span>${esc(fmtMileage(car.mileageKm))}</span><span>${esc(car.fuel)}</span><span>${esc(car.region || car.sido)}</span>
          </div>
          <div class="price-wrap">
            ${car.negoYn ? `<div class="badge-nego">가격제안가능</div>` : ''}
            <p class="price">${esc(fmtPrice(car.priceManwon))}</p>
          </div>
          <div class="kcar-counts">
            <span class="cnt-wish">${fmtNum(car.wishCount || 0)}</span>
            <span class="cnt-chat">${fmtNum(car.chatCount || 0)}</span>
          </div>
          <div class="kcar-opt-list">
            ${chips.map((c) => `<span class="label-gray">${esc(c)}</span>`).join('')}
          </div>
        </div>
      </article>
    `;
  }

  // Exact K Car .carItem.swiper Feed Card Renderer (Search / CarList View)
  function renderFeedCard(car) {
    const pi = getPlatInfo(car.platform);
    const imgs = car.images && car.images.length ? car.images : [car.thumbnail];
    const singleCls = imgs.length === 1 ? 'is-single' : '';

    const avatarSrc = !car.isExternal && car.avatarUrl ? car.avatarUrl : pi.avatar;
    const headerTitle = car.isExternal ? pi.full : car.plateNo || 'K Car 인증차량';
    const addressLine = car.isExternal
      ? `${car.region || car.sido} · ${car.collectedAt.slice(5, 16)} 수집`
      : car.region || car.sido;

    let photoBadgeHtml = '';
    if (car.platform === 'kcar' && car.diagYn) {
      photoBadgeHtml = `<div class="badge-cert"><span>K Car 진단</span></div>`;
    } else if (car.isExternal) {
      photoBadgeHtml = `<div class="badge-plat ${pi.badgeCls}">${esc(pi.short)}</div>`;
    }

    const chips = car.isExternal
      ? [car.origin, car.bodyType, '개인 직거래', '아웃랜딩 연결']
      : (car.options && car.options.length ? car.options : ['1인 소유', '비흡연 차량', '실내 주차']).slice(0, 4);

    return `
      <article class="car-feed-card" data-car-id="${esc(car.id)}">
        <div class="carHeader">
          <span class="avatar-circle">
            <img src="${esc(avatarSrc)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.src='${BRAND_VECTOR_AVATARS.kcar}'" />
          </span>
          <div>
            <div class="carNumb">${esc(headerTitle)}</div>
            <div class="carAddress">${esc(addressLine)}</div>
          </div>
        </div>

        <div class="swiper-photo-row">
          ${imgs
            .map(
              (u, idx) => `
            <div class="swiper-photo-cell ${singleCls}">
              <img src="${esc(u)}" alt="${esc(car.title)}" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="onCarImgFallback(this)" />
              ${idx === 0 && photoBadgeHtml ? `<div class="top-left-badge">${photoBadgeHtml}</div>` : ''}
              ${
                idx === 0 && imgs.length > 1
                  ? `<span class="top-right-cnt">1 / ${imgs.length}</span>`
                  : ''
              }
            </div>
          `
            )
            .join('')}
        </div>

        <h3 class="carName">${esc(car.title)}</h3>
        <div class="subInfo">
          <span>${esc(car.yearLabel)}</span><span>${esc(fmtMileage(car.mileageKm))}</span><span>${esc(car.fuel)}</span>
        </div>

        <div class="priceRow">
          <p class="priceVal">${esc(fmtPrice(car.priceManwon))}</p>
          ${
            car.negoYn
              ? `<div class="badge-nego is-large">가격제안가능</div>`
              : `<span class="label-gray label-tint-blue">요약상세 · 아웃랜딩</span>`
          }
        </div>

        <div class="kcar-opt-list">
          ${chips.map((c) => `<span class="label-gray">${esc(c)}</span>`).join('')}
        </div>

        <div class="ownersMsg">
          <strong class="titleTxt">${car.isExternal ? `${pi.short} 수집 요약` : '차주의 한마디'}</strong>
          <p>${esc(car.ownerComment)}</p>
        </div>

        <div class="kcar-counts">
          <span class="cnt-wish">${fmtNum(car.wishCount || 0)}</span>
          <span class="cnt-chat">${fmtNum(car.chatCount || 0)}</span>
        </div>
      </article>
    `;
  }

  // Render Home Screen Sections
  function renderHome() {
    const kcarCars = VEHICLES.filter((v) => v.platform === 'kcar');
    document.getElementById('homeKcarGrid').innerHTML = kcarCars.slice(0, 4).map(renderVertCard).join('');
    document.getElementById('homeHotSwiperRow').innerHTML = kcarCars.slice(4, 10).map(renderVertCard).join('');
    renderHomeExtGrid();
  }

  function renderHomeExtGrid() {
    let pool = VEHICLES;
    if (state.homeExtTab === 'external') {
      pool = VEHICLES.filter((v) => v.isExternal);
    } else if (state.homeExtTab !== 'all') {
      pool = VEHICLES.filter((v) => v.platform === state.homeExtTab);
    }
    document.getElementById('homeExternalGrid').innerHTML = pool.slice(0, 6).map(renderVertCard).join('');
  }

  // Filtering Logic for View 2 (CarList)
  function passSubFilters(v) {
    if (state.wishOnly && !state.wishedIds.has(v.id)) return false;
    if (state.certOnly && !(v.platform === 'kcar' && v.diagYn)) return false;
    if (state.negoOnly && !v.negoYn) return false;
    if (state.bodyType !== 'ALL' && v.bodyType !== state.bodyType) return false;
    if (state.sido !== 'ALL' && v.sido !== state.sido) return false;
    if (state.priceBand !== 'ALL' && v.priceBand !== state.priceBand) return false;
    if (state.origin !== 'ALL' && v.origin !== state.origin) return false;
    if (state.keyword.trim() !== '') {
      const q = state.keyword.trim().toLowerCase();
      const hay = `${v.title} ${v.brand} ${v.model} ${v.region} ${v.sido} ${v.platformLabel} ${v.bodyType} ${v.fuel}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }

  function isSubFiltered() {
    return (
      state.wishOnly ||
      state.certOnly ||
      state.negoOnly ||
      state.bodyType !== 'ALL' ||
      state.sido !== 'ALL' ||
      state.priceBand !== 'ALL' ||
      state.origin !== 'ALL' ||
      state.keyword.trim() !== ''
    );
  }

  function renderCarList() {
    const base = VEHICLES.filter(passSubFilters);
    const hasCond = isSubFiltered();
    const pm = META.platforms;

    // Update Platform Category Pill Counts
    document.getElementById('catCntAll').textContent = fmtNum(hasCond ? base.length : META.marketTotal);
    document.getElementById('catCntExt').textContent = fmtNum(
      hasCond ? base.filter((v) => v.isExternal).length : pm.daangn.totalCount + pm.encar.totalCount + pm.kb.totalCount
    );
    document.getElementById('catCntKcar').textContent = fmtNum(
      hasCond ? base.filter((v) => v.platform === 'kcar').length : pm.kcar.totalCount
    );
    document.getElementById('catCntDaangn').textContent = fmtNum(
      hasCond ? base.filter((v) => v.platform === 'daangn').length : pm.daangn.totalCount
    );
    document.getElementById('catCntEncar').textContent = fmtNum(
      hasCond ? base.filter((v) => v.platform === 'encar').length : pm.encar.totalCount
    );
    document.getElementById('catCntKb').textContent = fmtNum(
      hasCond ? base.filter((v) => v.platform === 'kb').length : pm.kb.totalCount
    );

    document.querySelectorAll('#listPlatTabBar .theme-tab-pill').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.platCat === state.platCat);
    });

    document.getElementById('btnToggleCertFilter').classList.toggle('isActive', state.certOnly);
    document.getElementById('btnToggleNegoFilter').classList.toggle('isActive', state.negoOnly);

    ['selBodyType', 'selSido', 'selPriceBand', 'selOrigin'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.toggle('has-val', el.value !== 'ALL');
    });

    let list = base;
    if (state.platCat === 'external') {
      list = base.filter((v) => v.isExternal);
    } else if (state.platCat !== 'all') {
      list = base.filter((v) => v.platform === state.platCat);
    }

    list = [...list];
    if (state.sortBy === 'price_asc') list.sort((a, b) => a.priceManwon - b.priceManwon);
    else if (state.sortBy === 'price_desc') list.sort((a, b) => b.priceManwon - a.priceManwon);
    else if (state.sortBy === 'mileage_asc') list.sort((a, b) => (a.mileageKm || 999999) - (b.mileageKm || 999999));
    else if (state.sortBy === 'year_desc') list.sort((a, b) => (b.year || 0) - (a.year || 0));

    // Update Notice & Section Copy (Matching m.kcar.com CarList copy style)
    const ribbonEl = document.getElementById('listRibbonMsg');
    const secTit = document.getElementById('listSecTitle');
    const secSub = document.getElementById('listSecSubtitle');

    if (state.wishOnly) {
      ribbonEl.textContent = '찜한 K Car 안심직거래 및 외부 플랫폼 직거래 차량 목록이에요.';
      secTit.textContent = '찜한 직거래 매물';
      secSub.textContent = `선택하신 관심 차량 ${fmtNum(list.length)}대를 모아서 보여드리고 있어요.`;
    } else if (state.platCat === 'kcar') {
      ribbonEl.textContent = '모든 매물은 차량 실소유자 인증이 완료된 차량이에요.';
      secTit.textContent = '추천 HOT 매물';
      secSub.textContent = '많은 사람들의 관심을 끌고 있는 K Car 안심직거래 차량들만 골라서 보여드리고 있어요.';
    } else if (state.platCat === 'all') {
      ribbonEl.textContent = 'K Car 실소유자 인증 매물과 외부 플랫폼 크롤링 직거래 매물을 함께 비교해요.';
      secTit.textContent = '세상의 모든 직거래 매물';
      secSub.textContent = `케이카 · 당근마켓 · 엔카 · KB차차차 직거래 매물(샘플 연동 ${fmtNum(list.length)}대)을 한 번에 확인하세요.`;
    } else {
      const names = {
        external: '외부 플랫폼 통합 직거래 매물',
        daangn: '당근마켓 직거래 수집 매물',
        encar: '엔카 개인직거래 수집 매물',
        kb: 'KB차차차 직거래 수집 매물'
      };
      ribbonEl.textContent = '외부 플랫폼 크롤링 매물은 K Car 요약 상세 확인 후 원본 사이트로 아웃랜딩 연결돼요.';
      secTit.textContent = names[state.platCat] || '직거래 매물';
      secSub.textContent = `크롤링된 썸네일 연동 매물 ${fmtNum(list.length)}대 · 클릭 시 케이카 포맷 요약 상세로 이동합니다.`;
    }

    const feedEl = document.getElementById('carFeedContainer');
    const moreBtn = document.getElementById('btnLoadMoreCars');

    if (list.length === 0) {
      feedEl.innerHTML = `
        <div style="padding:56px 20px; text-align:center;">
          <p style="font-size:15px; font-weight:500; color:#16171d; margin-bottom:6px;">조건에 맞는 직거래 차량이 없습니다.</p>
          <p style="font-size:13px; color:#82848b;">필터 조건이나 검색어를 다시 설정해 보세요.</p>
        </div>
      `;
      moreBtn.style.display = 'none';
      return;
    }

    const visible = list.slice(0, state.visibleCount);
    feedEl.innerHTML = visible.map(renderFeedCard).join('');

    if (list.length > state.visibleCount) {
      moreBtn.style.display = 'block';
      moreBtn.textContent = `직거래 차량 더 보기 (${fmtNum(state.visibleCount)} / ${fmtNum(list.length)}대)`;
    } else {
      moreBtn.style.display = 'none';
    }
  }

  // View 3: Exact K Car Detail Page Renderer (External Simplified + Native K Car)
  function renderDetail(car) {
    if (!car) return;
    const pi = getPlatInfo(car.platform);
    const imgs = car.images && car.images.length ? car.images : [car.thumbnail];

    document.getElementById('dtlHeaderCno').textContent = car.isExternal
      ? `${pi.short} 직거래`
      : car.plateNo || 'K Car 안심직거래';

    const similarKcar = VEHICLES.filter(
      (v) => v.platform === 'kcar' && v.id !== car.id && (v.bodyType === car.bodyType || v.priceBand === car.priceBand)
    ).slice(0, 2);

    const target = document.getElementById('detailRenderTarget');

    if (car.isExternal) {
      // ======================================================================
      // EXTERNAL CRAWLED VEHICLE -> K CAR FORMAT SIMPLIFIED DETAIL + OUTLANDING
      // ======================================================================
      target.innerHTML = `
        <div class="dtl-gallery">
          <div class="dtl-gallery-track" id="dtlGalleryTrack">
            ${imgs
              .map(
                (u, idx) => `
              <div class="dtl-gallery-slide">
                <img src="${esc(u)}" alt="${esc(car.title)}" ${idx === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} referrerpolicy="no-referrer" onerror="onCarImgFallback(this)" />
              </div>
            `
              )
              .join('')}
          </div>
          <div class="dtl-photo-counter">
            <span id="dtlSlideIdx">1 / ${imgs.length}</span>
            <span class="sep"></span>
            <span>크롤링 썸네일</span>
          </div>
        </div>

        <div class="product-detail-header-card">
          <div class="dtl-badge-row">
            <span class="badge-plat ${pi.badgeCls}">${esc(pi.full)}</span>
            <span class="label-gray">수집일시 ${esc(car.collectedAt)}</span>
          </div>

          <h2 class="title">${esc(car.title)}</h2>
          <div class="sub-info">
            <span>${esc(car.yearLabel)}</span><span>${esc(fmtMileage(car.mileageKm))}</span><span>${esc(car.fuel)}</span><span>${esc(car.region || car.sido)}</span>
          </div>

          <div class="price-row">
            <strong class="price">${esc(fmtPrice(car.priceManwon))}</strong>
            <button type="button" class="btn-safe" id="btnToggleSafeBox">
              <span>K Car 안전거래·출장진단 이용 시</span>
              <i class="arrow"></i>
            </button>
          </div>

          <div class="safe-accordion-box" id="safeAccordionBox">
            외부 플랫폼(${esc(pi.short)})에서 찾으신 개인 직거래 차량도 거래 전 <strong>K Car 전문 차량평가사 출장진단</strong> 및 <strong>K Car 안전거래(대금 에스크로·온라인 명의이전)</strong>를 신청해 안심하고 인수하실 수 있습니다.
          </div>

          <ul class="benefit-list">
            <li class="benefit-item">
              <i class="benefit-ico ico-kw-sync"></i>
              <span>${esc(pi.short)} 수집</span>
            </li>
            <li class="benefit-item">
              <i class="benefit-ico ico-kw-owner"></i>
              <span>개인 직거래</span>
            </li>
            <li class="benefit-item">
              <i class="benefit-ico ico-kw-garage"></i>
              <span>${esc(car.bodyType)}</span>
            </li>
            <li class="benefit-item">
              <i class="benefit-ico ico-kw-shield"></i>
              <span>출장진단 가능</span>
            </li>
          </ul>

          <div class="dtl-owners-card">
            <strong class="title-txt">외부 직거래 크롤링 요약 안내</strong>
            <p>${esc(car.ownerComment)}</p>
          </div>
        </div>

        <div class="dtl-assurance-bar is-external">
          <span>케이카 요약 상세입니다 · 상세보기 시 ${esc(pi.short)} 페이지로 이동합니다.</span>
        </div>

        <nav class="dtl-anchor-tabs">
          <button type="button" class="dtl-anchor-tab is-active" data-dtl-scroll="secExtReport">요약 리포트</button>
          <button type="button" class="dtl-anchor-tab" data-dtl-scroll="secExtSpec">상세 정보</button>
          ${state.shortsEnabled ? '<button type="button" class="dtl-anchor-tab" data-dtl-scroll="secCarShorts">차종 쇼츠<span class="tab-new-dot"></span></button>' : ''}
          <button type="button" class="dtl-anchor-tab" data-dtl-scroll="secExtSimilar">추천 차량</button>
        </nav>

        <div class="dtl-dark-report" id="secExtReport">
          <h4>외부 직거래 차량도 K Car가 진단해 드려요</h4>
          <p>
            ${esc(pi.full)}에 등록된 개인 간 직거래 차량입니다. 구매 확정 전 K Car 평가사의 객관적인 출장진단 리포트와 안전결제 서비스를 이용해 보세요.
          </p>
          <div class="dtl-dark-actions">
            <button type="button" class="dtl-dark-btn" data-svc="diag">출장진단 서비스 안내</button>
            <button type="button" class="dtl-dark-btn" data-svc="outlink">원본 매물 바로 열기 ↗</button>
          </div>
        </div>

        <div class="dtl-info-sec" id="secExtSpec">
          <p class="sub-h4">기본 정보 (크롤링 데이터)</p>
          <ul class="list-base-split">
            <li><span class="lbl">수집 플랫폼</span><div class="aside"><span>${esc(pi.full)}</span></div></li>
            <li><span class="lbl">판매자 구분</span><div class="aside"><span>개인 직거래</span></div></li>
            <li><span class="lbl">국산/수입 · 차종</span><div class="aside"><span>${esc(car.origin)} · ${esc(car.bodyType)}</span></div></li>
            <li><span class="lbl">연식</span><div class="aside"><span>${esc(car.yearLabel)} (${esc(car.year)}년)</span></div></li>
            <li><span class="lbl">주행거리</span><div class="aside"><span>${esc(fmtNum(car.mileageKm))}km</span></div></li>
            <li><span class="lbl">엔진 / 연료</span><div class="aside"><span>${esc(car.fuel)}</span></div></li>
            <li><span class="lbl">변속기</span><div class="aside"><span>${esc(car.transmission)}</span></div></li>
            <li><span class="lbl">거래 지역</span><div class="aside"><span>${esc(car.region || car.sido)}</span></div></li>
            <li><span class="lbl">최종 수집일시</span><div class="aside"><span>${esc(car.collectedAt)}</span></div></li>
          </ul>
          <p class="dtl-footnote">
            ※ 본 화면은 고객 검색 편의를 위해 외부 직거래 플랫폼의 공개 매물 정보를 요약한 페이지입니다. 정확한 옵션, 성능점검기록부 및 차주 연락은 하단 상세보기 버튼을 눌러 원본 사이트에서 확인해 주세요.
          </p>
        </div>

        <div class="gray-divider"></div>

        ${renderCarShortsSection(car)}

        ${
          similarKcar.length > 0
            ? `
          <div class="kcar-section" id="secExtSimilar">
            <div class="title-area">
              <h2 class="sub-h3">이런 K Car 인증 차량은 어떠세요?</h2>
              <span class="ad-help-pill">K Car 직거래</span>
            </div>
            <div class="vert-grid-2col">
              ${similarKcar.map(renderVertCard).join('')}
            </div>
          </div>
        `
            : ''
        }

        <div class="dtl-safe-pill-wrap">
          <button type="button" class="dtl-safe-pill" data-svc="safe">
            <span>금액이 커질수록, 안전거래로 든든하게 &gt;&gt;&gt;</span>
          </button>
        </div>
      `;
    } else {
      // ======================================================================
      // NATIVE K CAR 안심직거래 DETAIL PAGE (1:1 marketm.kcar.com/ds/detail)
      // ======================================================================
      const extHex = getColorHex(car.extrColor);
      const intHex = getColorHex(car.intrColor);

      target.innerHTML = `
        <div class="dtl-gallery">
          <div class="dtl-gallery-track" id="dtlGalleryTrack">
            ${imgs
              .map(
                (u, idx) => `
              <div class="dtl-gallery-slide">
                <img src="${esc(u)}" alt="${esc(car.title)}" ${idx === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} referrerpolicy="no-referrer" onerror="onCarImgFallback(this)" />
              </div>
            `
              )
              .join('')}
          </div>
          <div class="dtl-photo-counter">
            <span id="dtlSlideIdx">1 / ${imgs.length}</span>
            <span class="sep"></span>
            <span>모두보기</span>
          </div>
        </div>

        <div class="product-detail-header-card">
          <div class="dtl-badge-row">
            <div class="badge-cert"><span>${car.diagYn ? 'K Car 진단' : 'K Car 안심직거래'}</span></div>
          </div>

          <h2 class="title">${esc(car.title)}</h2>
          <div class="sub-info">
            <span>${esc(car.yearLabel)}</span><span>${esc(fmtMileage(car.mileageKm))}</span><span>${esc(car.fuel)}</span><span>${esc(car.region || car.sido)}</span>
          </div>

          <div class="price-row">
            <strong class="price">${esc(fmtPrice(car.priceManwon))}</strong>
            <button type="button" class="btn-safe" id="btnToggleSafeBox">
              <span>안전거래 패키지 이용 시</span>
              <i class="arrow"></i>
            </button>
          </div>

          <div class="safe-accordion-box" id="safeAccordionBox">
            차량 대금 에스크로 보호부터 온라인 명의이전, 직거래 보증 가입까지 K Car 안전거래 패키지로 간편하게 진행할 수 있습니다.
          </div>

          <ul class="benefit-list">
            <li class="benefit-item">
              <i class="benefit-ico ico-kw-owner"></i>
              <span>소유자 인증</span>
            </li>
            <li class="benefit-item">
              <i class="benefit-ico ico-kw-nego"></i>
              <span>${car.negoYn ? '가격제안가능' : '정찰가 판매'}</span>
            </li>
            <li class="benefit-item">
              <i class="benefit-ico ico-kw-one"></i>
              <span>1인 소유</span>
            </li>
            <li class="benefit-item">
              <i class="benefit-ico ico-kw-nosmoke"></i>
              <span>비흡연 차량</span>
            </li>
          </ul>

          <div class="dtl-owners-card">
            <strong class="title-txt">차주의 한마디</strong>
            <p>${esc(car.ownerComment)}</p>
          </div>
        </div>

        <div class="dtl-assurance-bar">
          <span>직거래 후에도 K Car가 책임지는 진단·인증 완료 차량입니다.</span>
        </div>

        <nav class="dtl-anchor-tabs">
          <button type="button" class="dtl-anchor-tab is-active" data-dtl-scroll="secKcarReport">안심 리포트</button>
          <button type="button" class="dtl-anchor-tab" data-dtl-scroll="secKcarSpec">상세 정보</button>
          ${state.shortsEnabled ? '<button type="button" class="dtl-anchor-tab" data-dtl-scroll="secCarShorts">차종 쇼츠<span class="tab-new-dot"></span></button>' : ''}
          <button type="button" class="dtl-anchor-tab" data-dtl-scroll="secKcarSimilar">추천 차량</button>
        </nav>

        <div class="dtl-dark-report" id="secKcarReport">
          <h4>K Car 실소유자 인증 및 진단 완료</h4>
          <p>
            K Car에 직접 등록된 안심직거래 차량으로 실소유자 인증이 완료되었으며, 앱 내 1:1 안심채팅 및 안전거래 결제를 바로 이용하실 수 있습니다.
          </p>
          <div class="dtl-dark-actions">
            <button type="button" class="dtl-dark-btn" data-svc="safe">안전거래 패키지 보기</button>
            <button type="button" class="dtl-dark-btn" data-svc="outlink">실제 K Car 페이지 열기 ↗</button>
          </div>
        </div>

        <div class="dtl-info-sec" id="secKcarSpec">
          <p class="sub-h4">주요 옵션</p>
          <div class="kcar-opt-list" style="margin-bottom: 24px;">
            ${(car.options && car.options.length ? car.options : ['선루프', 'LED 헤드 라이트', '가죽시트', '통풍시트', '후방카메라', '스마트 크루즈 컨트롤'])
              .map((o) => `<span class="label-gray">${esc(o)}</span>`)
              .join('')}
          </div>

          <p class="sub-h4">기본 정보</p>
          <ul class="list-base-split">
            <li><span class="lbl">차량번호</span><div class="aside"><span>${esc(car.plateNo)}</span></div></li>
            <li><span class="lbl">연식</span><div class="aside"><span>${esc(car.yearLabel)} (${esc(car.year)}년형)</span></div></li>
            <li><span class="lbl">주행거리</span><div class="aside"><span>${esc(fmtNum(car.mileageKm))}km</span></div></li>
            <li><span class="lbl">엔진</span><div class="aside"><span>${esc(car.fuel)}</span></div></li>
            <li><span class="lbl">변속기</span><div class="aside"><span>${esc(car.transmission)}</span></div></li>
            <li>
              <span class="lbl">차량색상</span>
              <div class="aside"><span class="color-chip" style="background:${extHex};"></span><span>${esc(car.extrColor)}</span></div>
            </li>
            <li>
              <span class="lbl">시트색상</span>
              <div class="aside"><span class="color-chip" style="background:${intHex};"></span><span>${esc(car.intrColor)}</span></div>
            </li>
            <li><span class="lbl">거래지역</span><div class="aside"><span>${esc(car.region || car.sido)}</span></div></li>
          </ul>
          <p class="dtl-footnote">※ 실제 차량과 정보가 상이할 수 있으니 반드시 확인해 주세요.</p>
        </div>

        <div class="gray-divider"></div>

        ${renderCarShortsSection(car)}

        ${
          similarKcar.length > 0
            ? `
          <div class="kcar-section" id="secKcarSimilar">
            <div class="title-area">
              <h2 class="sub-h3">이런 차량은 어떠세요?</h2>
              <span class="ad-help-pill">AD ?</span>
            </div>
            <div class="vert-grid-2col">
              ${similarKcar.map(renderVertCard).join('')}
            </div>
          </div>
        `
            : ''
        }

        <div class="dtl-safe-pill-wrap">
          <button type="button" class="dtl-safe-pill" data-svc="safe">
            <span>금액이 커질수록, 안전거래로 든든하게 &gt;&gt;&gt;</span>
          </button>
        </div>
      `;
    }

    // Gallery swipe counter binding
    const gTrack = document.getElementById('dtlGalleryTrack');
    const gIdx = document.getElementById('dtlSlideIdx');
    if (gTrack && gIdx && imgs.length > 1) {
      gTrack.addEventListener(
        'scroll',
        () => {
          const idx = Math.round(gTrack.scrollLeft / Math.max(1, gTrack.clientWidth)) + 1;
          gIdx.textContent = `${Math.min(imgs.length, Math.max(1, idx))} / ${imgs.length}`;
        },
        { passive: true }
      );
    }

    // Safe accordion toggle
    const safeToggleBtn = document.getElementById('btnToggleSafeBox');
    const safeBox = document.getElementById('safeAccordionBox');
    if (safeToggleBtn && safeBox) {
      safeToggleBtn.addEventListener('click', () => safeBox.classList.toggle('is-open'));
    }

    // Update Sticky Bottom CTA Bar
    const favBtn = document.getElementById('btnDetailFav');
    const isFav = state.wishedIds.has(car.id);
    favBtn.classList.toggle('is-wished', isFav);
    favBtn.innerHTML = isFav
      ? `<svg viewBox="0 0 24 24" fill="#f01d29"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="#54555a" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;

    const primaryCta = document.getElementById('btnDetailPrimaryCta');
    primaryCta.innerHTML = car.isExternal
      ? `<span>${esc(pi.ctaLabel)}</span><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M9 7h8v8"/></svg>`
      : `<span>채팅하기</span>`;
  }

  // View 4: Under-500M Special Exhibition Renderer (K Car TOP -> External Platforms BELOW)
  function sortExhibitionList(list, sortKey) {
    const arr = [...list];
    if (sortKey === 'price_asc') arr.sort((a, b) => a.priceManwon - b.priceManwon);
    else if (sortKey === 'mileage_asc') arr.sort((a, b) => (a.mileageKm || 999999) - (b.mileageKm || 999999));
    else if (sortKey === 'year_desc') arr.sort((a, b) => (b.year || 0) - (a.year || 0));
    return arr;
  }

  function interleaveExternalRecommended(extCars) {
    const d = extCars.filter((v) => v.platform === 'daangn');
    const e = extCars.filter((v) => v.platform === 'encar');
    const k = extCars.filter((v) => v.platform === 'kb');
    const res = [];
    let di = 0, ei = 0, ki = 0;
    while (di < d.length || ei < e.length || ki < k.length) {
      if (di < d.length) res.push(d[di++]);
      if (di < d.length) res.push(d[di++]);
      if (ei < e.length) res.push(e[ei++]);
      if (ki < k.length) res.push(k[ki++]);
    }
    return res;
  }

  function renderExhibition() {
    const allUnder500 = VEHICLES.filter((v) => v.priceManwon > 0 && v.priceManwon < 500);
    const totalKcarAll = allUnder500.filter((v) => v.platform === 'kcar').length;
    const totalExtAll = allUnder500.filter((v) => v.isExternal).length;

    const summaryEl = document.getElementById('exhibitTotalSummary');
    if (summaryEl) {
      summaryEl.textContent = `전체 ${fmtNum(allUnder500.length)}대 · 케이카 ${fmtNum(totalKcarAll)}대 · 외부 플랫폼 ${fmtNum(totalExtAll)}대`;
    }

    const bandPool = allUnder500.filter((v) => {
      if (state.u500Band === 'under300') return v.priceManwon < 300;
      if (state.u500Band === '300to500') return v.priceManwon >= 300 && v.priceManwon < 500;
      return true;
    });

    document.querySelectorAll('#exhibitBandTabs [data-u500-band]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.u500Band === state.u500Band);
    });
    const sortEl = document.getElementById('selExhibitSort');
    if (sortEl) sortEl.value = state.u500Sort;

    // 1. TOP SECTION: K Car Vehicles (< 500만원)
    let kcarList = bandPool.filter((v) => v.platform === 'kcar');
    if (state.u500Sort === 'recommended') {
      kcarList = [...kcarList].sort((a, b) => Number(Boolean(b.diagYn)) - Number(Boolean(a.diagYn)));
    } else {
      kcarList = sortExhibitionList(kcarList, state.u500Sort);
    }

    document.getElementById('exhibitKcarCount').textContent = `${fmtNum(kcarList.length)}대`;
    const kcarGrid = document.getElementById('exhibitKcarGrid');
    const kcarExpandBtn = document.getElementById('btnExpandExhibitKcar');

    if (kcarList.length === 0) {
      kcarGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 28px 12px; text-align: center;">
          <p style="font-size: 14px; font-weight: 500; color: #16171d;">해당 가격대의 케이카 차량이 없습니다.</p>
        </div>
      `;
      kcarExpandBtn.style.display = 'none';
    } else {
      const kcarInitialCnt = 6;
      const shownKcar = state.u500KcarExpanded ? kcarList : kcarList.slice(0, kcarInitialCnt);
      kcarGrid.innerHTML = shownKcar.map(renderVertCard).join('');

      if (kcarList.length > kcarInitialCnt) {
        kcarExpandBtn.style.display = 'block';
        kcarExpandBtn.textContent = state.u500KcarExpanded
          ? `케이카 차량 접기 (${fmtNum(kcarList.length)}대)`
          : `케이카 차량 전체보기 (${fmtNum(kcarInitialCnt)} / ${fmtNum(kcarList.length)}대)`;
      } else {
        kcarExpandBtn.style.display = 'none';
      }
    }

    // 2. BOTTOM SECTION: External Platform Vehicles (< 500만원)
    const extBase = bandPool.filter((v) => v.isExternal);
    document.getElementById('exhibitExtCount').textContent = `${fmtNum(extBase.length)}대`;
    document.getElementById('u500CntExtAll').textContent = fmtNum(extBase.length);
    document.getElementById('u500CntDaangn').textContent = fmtNum(extBase.filter((v) => v.platform === 'daangn').length);
    document.getElementById('u500CntEncar').textContent = fmtNum(extBase.filter((v) => v.platform === 'encar').length);
    document.getElementById('u500CntKb').textContent = fmtNum(extBase.filter((v) => v.platform === 'kb').length);

    document.querySelectorAll('#exhibitExtTabs [data-u500-plat]').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.u500Plat === state.u500ExtPlat);
    });

    let extList =
      state.u500ExtPlat === 'all' ? extBase : extBase.filter((v) => v.platform === state.u500ExtPlat);

    if (state.u500Sort === 'recommended' && state.u500ExtPlat === 'all') {
      extList = interleaveExternalRecommended(extList);
    } else {
      extList = sortExhibitionList(extList, state.u500Sort);
    }

    const extGrid = document.getElementById('exhibitExtGrid');
    const extMoreBtn = document.getElementById('btnMoreExhibitExt');

    if (extList.length === 0) {
      extGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 32px 12px; text-align: center;">
          <p style="font-size: 14px; font-weight: 500; color: #16171d;">조건에 맞는 외부 플랫폼 차량이 없습니다.</p>
        </div>
      `;
      extMoreBtn.style.display = 'none';
    } else {
      const visibleExt = extList.slice(0, state.u500ExtVisible);
      extGrid.innerHTML = visibleExt.map(renderVertCard).join('');

      if (extList.length > state.u500ExtVisible) {
        extMoreBtn.style.display = 'block';
        extMoreBtn.textContent = `외부 플랫폼 차량 더 보기 (${fmtNum(state.u500ExtVisible)} / ${fmtNum(extList.length)}대)`;
      } else {
        extMoreBtn.style.display = 'none';
      }
    }
  }

  // View Router
  function switchView(nextView, opts = {}) {
    const scrollBody = document.getElementById('appScrollBody');
    if (nextView === 'detail' && state.view !== 'detail') {
      state.prevView = state.view;
      state.prevScrollTop = scrollBody ? scrollBody.scrollTop : 0;
    }
    state.view = nextView;

    const isDetail = nextView === 'detail';
    const isExhibit = nextView === 'exhibit';
    document.getElementById('headerMainList').style.display = isDetail || isExhibit ? 'none' : 'flex';
    document.getElementById('headerDetail').style.display = isDetail ? 'flex' : 'none';
    document.getElementById('headerExhibition').style.display = isExhibit ? 'flex' : 'none';
    document.getElementById('bottomNavBar').style.display = isDetail ? 'none' : 'block';
    document.getElementById('detailFixedBar').classList.toggle('is-active', isDetail);

    // Swap Bell SVG on Home vs Search SVG on List (Matches real marketm.kcar.com vs m.kcar.com!)
    const hdrActionBtn = document.getElementById('btnHdrSearchOrAlarm');
    if (nextView === 'home') {
      hdrActionBtn.innerHTML = BELL_SVG;
      hdrActionBtn.setAttribute('aria-label', '알림');
    } else if (nextView === 'list') {
      hdrActionBtn.innerHTML = SEARCH_SVG;
      hdrActionBtn.setAttribute('aria-label', '검색');
    }

    document.getElementById('viewHome').classList.toggle('is-active', nextView === 'home');
    document.getElementById('viewList').classList.toggle('is-active', nextView === 'list');
    document.getElementById('viewDetail').classList.toggle('is-active', nextView === 'detail');
    document.getElementById('viewExhibition').classList.toggle('is-active', isExhibit);

    // Sync Bottom Tabbar
    document.querySelectorAll('#bottomNavBar .tabbar-link').forEach((btn) => {
      const k = btn.dataset.bnav;
      const on =
        ((nextView === 'home' || isExhibit) && k === 'home') ||
        (nextView === 'list' && state.wishOnly && k === 'wish') ||
        (nextView === 'list' && !state.wishOnly && k === 'search');
      btn.classList.toggle('is-active', on);
    });

    if (nextView === 'list') {
      if (!opts.preserveScroll) state.visibleCount = state.pageSize;
      renderCarList();
    } else if (isExhibit) {
      if (!opts.preserveScroll) {
        state.u500ExtVisible = state.u500ExtPageSize;
        state.u500KcarExpanded = false;
      }
      renderExhibition();
    } else if (nextView === 'detail' && state.selectedCar) {
      renderDetail(state.selectedCar);
    }

    if (opts.preserveScroll) {
      if (scrollBody) scrollBody.scrollTop = state.prevScrollTop || 0;
    } else if (scrollBody) {
      scrollBody.scrollTop = 0;
    }
  }

  function openCarById(id) {
    const car = VEHICLES.find((v) => v.id === id);
    if (!car) return;
    state.selectedCar = car;
    switchView('detail');
  }

  function goToList({ platCat = 'all', keyword = '', wishOnly = false } = {}) {
    state.platCat = platCat;
    state.keyword = keyword;
    state.wishOnly = wishOnly;
    if (platCat !== 'kcar') state.certOnly = false;
    const kwEl = document.getElementById('listKeywordInput');
    kwEl.value = keyword;
    document.getElementById('btnClearKeyword').style.display = keyword ? 'inline-block' : 'none';
    switchView('list');
  }

  // Bind UI Events
  function bindEvents() {
    // Hero Swiper Pagination Fraction Update & Slide Clicks
    const heroTrack = document.getElementById('heroSwiperTrack');
    const heroFrac = document.getElementById('heroPageFraction');
    heroTrack.addEventListener(
      'scroll',
      () => {
        const idx = Math.round(heroTrack.scrollLeft / 340) + 1;
        heroFrac.textContent = `${Math.min(4, Math.max(1, idx))} / 4`;
      },
      { passive: true }
    );

    heroTrack.addEventListener('click', (e) => {
      const slide = e.target.closest('[data-hero-action]');
      if (!slide) return;
      const act = slide.dataset.heroAction;
      if (act === 'all-c2c') goToList({ platCat: 'all' });
      else if (act === 'self-reg') openSelfRegPolicyModal();
      else if (act === 'diag') showServiceModal('diag');
      else if (act === 'safe') showServiceModal('safe');
    });

    // Header Buttons
    document.getElementById('btnBackMain').addEventListener('click', () => {
      if (state.view === 'list') switchView('home');
      else showSnack('안심직거래 메인 화면입니다.');
    });
    document.getElementById('btnLogoHome').addEventListener('click', () => switchView('home'));
    document.getElementById('btnTitleHome').addEventListener('click', () => switchView('home'));

    document.getElementById('btnHdrSearchOrAlarm').addEventListener('click', () => {
      if (state.view === 'home') {
        goToList({ platCat: 'all', keyword: '' });
      }
      setTimeout(() => document.getElementById('listKeywordInput').focus(), 60);
    });

    document.getElementById('btnHdrMenu').addEventListener('click', () => {
      openKcarModal({
        title: 'K Car 안심직거래 전체메뉴',
        html: `
          <div style="display:flex; flex-direction:column; gap:8px; margin-top:4px;">
            <button type="button" class="exec-nav-btn" onclick="document.getElementById('kcarModal').close(); document.getElementById('qMenuAllC2C').click();">
              <span>세상의 모든 직거래 매물검색 (케이카·당근·엔카·KB)</span>
            </button>
            <button type="button" class="exec-nav-btn" onclick="document.getElementById('kcarModal').close(); document.getElementById('btnUnder500Promo').click();">
              <span>500만원 미만 실속 직거래 기획전</span>
            </button>
            <button type="button" class="exec-nav-btn" onclick="document.getElementById('kcarModal').close(); document.getElementById('qMenuSelfReg').click();">
              <span>내차 셀프 등록 (K Car 인증차량 전용)</span>
            </button>
            <button type="button" class="exec-nav-btn" onclick="document.getElementById('kcarModal').close(); document.getElementById('qMenuDiag').click();">
              <span>출장진단 서비스 안내</span>
            </button>
            <button type="button" class="exec-nav-btn" onclick="document.getElementById('kcarModal').close(); document.getElementById('qMenuSafe').click();">
              <span>안전거래 지원 서비스 안내</span>
            </button>
          </div>
        `,
        confirmLabel: '통합 매물 검색하기',
        onConfirm: () => goToList({ platCat: 'all' })
      });
    });

    // Service Info Helper
    function showServiceModal(kind) {
      if (kind === 'diag') {
        openKcarModal({
          title: 'K Car 출장진단 서비스',
          html: `
            K Car 직영 차량평가사가 약속 장소로 직접 방문해 사고 유무 및 주요 부위를 정밀 진단해 드립니다.<br/><br/>
            K Car 등록 매물뿐만 아니라 <strong>당근마켓·엔카·KB차차차</strong>에서 찾으신 외부 직거래 매물도 구매 전 출장진단을 신청할 수 있습니다.
          `,
          confirmLabel: '외부 직거래 매물 보기',
          onConfirm: () => goToList({ platCat: 'external' })
        });
      } else {
        openKcarModal({
          title: 'K Car 안전거래 지원 서비스',
          html: `
            개인 간 직거래 시 불안한 차량 대금 결제(에스크로 보관), 온라인 명의이전, 직거래 전용 보증 가입까지 K Car가 안전하게 지원합니다.
          `,
          confirmLabel: '확인'
        });
      }
    }

    // Quick Menu Icons & Under-500M Promo Banner
    document.getElementById('qMenuAllC2C').addEventListener('click', () => goToList({ platCat: 'all' }));
    document.getElementById('qMenuSelfReg').addEventListener('click', openSelfRegPolicyModal);
    document.getElementById('qMenuDiag').addEventListener('click', () => showServiceModal('diag'));
    document.getElementById('qMenuSafe').addEventListener('click', () => showServiceModal('safe'));
    document.getElementById('btnMidSafeBanner').addEventListener('click', () => showServiceModal('safe'));
    document.getElementById('btnUnder500Promo').addEventListener('click', () => switchView('exhibit'));

    // Special Exhibition Controls
    document.getElementById('btnBackExhibit').addEventListener('click', () => switchView('home'));
    document.getElementById('btnShareExhibit').addEventListener('click', () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href).catch(() => {});
      }
      showSnack('500만원 미만 직거래 기획전 링크가 복사되었습니다.');
    });

    document.querySelectorAll('#exhibitBandTabs [data-u500-band]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.u500Band = btn.dataset.u500Band;
        state.u500ExtVisible = state.u500ExtPageSize;
        state.u500KcarExpanded = false;
        renderExhibition();
      });
    });

    document.getElementById('selExhibitSort').addEventListener('change', (e) => {
      state.u500Sort = e.target.value;
      renderExhibition();
    });

    document.querySelectorAll('#exhibitExtTabs [data-u500-plat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.u500ExtPlat = btn.dataset.u500Plat;
        state.u500ExtVisible = state.u500ExtPageSize;
        renderExhibition();
      });
    });

    document.getElementById('btnExpandExhibitKcar').addEventListener('click', () => {
      state.u500KcarExpanded = !state.u500KcarExpanded;
      renderExhibition();
    });

    document.getElementById('btnMoreExhibitExt').addEventListener('click', () => {
      state.u500ExtVisible += state.u500ExtPageSize;
      renderExhibition();
    });

    // Home Search & Platform Chips
    document.getElementById('homeSearchForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const kw = document.getElementById('homeSearchInput').value.trim();
      goToList({ platCat: 'all', keyword: kw });
    });

    document.querySelectorAll('[data-home-jump]').forEach((btn) => {
      btn.addEventListener('click', () => goToList({ platCat: btn.dataset.homeJump }));
    });

    document.getElementById('btnHotKcarMore').addEventListener('click', () => goToList({ platCat: 'kcar' }));
    document.getElementById('btnExtMore').addEventListener('click', () => goToList({ platCat: state.homeExtTab }));

    document.querySelectorAll('#homeExtTabs [data-ext-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#homeExtTabs [data-ext-tab]').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        state.homeExtTab = btn.dataset.extTab;
        renderHomeExtGrid();
      });
    });

    // Delegated Clicks inside Scroll Body (Cards, Anchor Tabs, Detail Dark Buttons)
    document.getElementById('appScrollBody').addEventListener('click', (e) => {
      const anchorBtn = e.target.closest('[data-dtl-scroll]');
      if (anchorBtn) {
        document.querySelectorAll('.dtl-anchor-tab').forEach((t) => t.classList.remove('is-active'));
        anchorBtn.classList.add('is-active');
        const sec = document.getElementById(anchorBtn.dataset.dtlScroll);
        if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      const svcBtn = e.target.closest('[data-svc]');
      if (svcBtn) {
        const s = svcBtn.dataset.svc;
        if (s === 'outlink' && state.selectedCar) {
          window.open(state.selectedCar.outUrl, '_blank', 'noopener,noreferrer');
        } else {
          showServiceModal(s);
        }
        return;
      }

      const shortBtn = e.target.closest('[data-short-idx]');
      if (shortBtn) {
        openShortsModal(Number(shortBtn.dataset.shortIdx || 0));
        return;
      }

      const card = e.target.closest('[data-car-id]');
      if (card) {
        openCarById(card.dataset.carId);
      }
    });

    // CarList Controls
    document.getElementById('btnTabDirectCar').addEventListener('click', () => {
      showSnack('현재 화면은 직거래(케이카+외부플랫폼 통합) 시연 페이지입니다.');
    });

    const kwInput = document.getElementById('listKeywordInput');
    const clearKwBtn = document.getElementById('btnClearKeyword');
    kwInput.addEventListener('input', () => {
      state.keyword = kwInput.value;
      clearKwBtn.style.display = state.keyword ? 'inline-block' : 'none';
      state.visibleCount = state.pageSize;
      renderCarList();
    });

    clearKwBtn.addEventListener('click', () => {
      state.keyword = '';
      kwInput.value = '';
      clearKwBtn.style.display = 'none';
      state.visibleCount = state.pageSize;
      renderCarList();
    });

    document.querySelectorAll('#listPlatTabBar [data-plat-cat]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.wishOnly = false;
        state.platCat = btn.dataset.platCat;
        if (state.platCat !== 'kcar' && state.platCat !== 'all') state.certOnly = false;
        state.visibleCount = state.pageSize;
        renderCarList();
      });
    });

    document.getElementById('btnToggleCertFilter').addEventListener('click', () => {
      state.certOnly = !state.certOnly;
      if (state.certOnly && state.platCat !== 'all' && state.platCat !== 'kcar') {
        state.platCat = 'kcar';
      }
      state.visibleCount = state.pageSize;
      renderCarList();
    });

    document.getElementById('btnToggleNegoFilter').addEventListener('click', () => {
      state.negoOnly = !state.negoOnly;
      state.visibleCount = state.pageSize;
      renderCarList();
    });

    ['selBodyType', 'selSido', 'selPriceBand', 'selOrigin'].forEach((id) => {
      document.getElementById(id).addEventListener('change', (e) => {
        const v = e.target.value;
        if (id === 'selBodyType') state.bodyType = v;
        if (id === 'selSido') state.sido = v;
        if (id === 'selPriceBand') state.priceBand = v;
        if (id === 'selOrigin') state.origin = v;
        state.visibleCount = state.pageSize;
        renderCarList();
      });
    });

    document.getElementById('btnResetAllFilters').addEventListener('click', () => {
      state.platCat = 'all';
      state.keyword = '';
      state.certOnly = false;
      state.negoOnly = false;
      state.bodyType = 'ALL';
      state.sido = 'ALL';
      state.priceBand = 'ALL';
      state.origin = 'ALL';
      state.wishOnly = false;
      kwInput.value = '';
      clearKwBtn.style.display = 'none';
      document.getElementById('selBodyType').value = 'ALL';
      document.getElementById('selSido').value = 'ALL';
      document.getElementById('selPriceBand').value = 'ALL';
      document.getElementById('selOrigin').value = 'ALL';
      state.visibleCount = state.pageSize;
      renderCarList();
      showSnack('검색 필터가 초기화되었습니다.');
    });

    document.getElementById('selSortOrder').addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderCarList();
    });

    document.getElementById('btnLoadMoreCars').addEventListener('click', () => {
      state.visibleCount += state.pageSize;
      renderCarList();
    });

    document.getElementById('btnScrollTop').addEventListener('click', () => {
      document.getElementById('appScrollBody').scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.getElementById('btnFabSelfReg').addEventListener('click', openSelfRegPolicyModal);

    // Detail Header & Bottom CTA
    document.getElementById('btnBackDetail').addEventListener('click', () => {
      switchView(state.prevView || 'list', { preserveScroll: true });
    });

    document.getElementById('btnDtlShare').addEventListener('click', () => {
      if (state.selectedCar && navigator.clipboard) {
        navigator.clipboard.writeText(state.selectedCar.outUrl).catch(() => {});
      }
      showSnack('매물 링크가 복사되었습니다.');
    });

    document.getElementById('btnDtlMore').addEventListener('click', () => {
      if (state.selectedCar) {
        window.open(state.selectedCar.outUrl, '_blank', 'noopener,noreferrer');
      }
    });

    document.getElementById('btnDetailFav').addEventListener('click', () => {
      const car = state.selectedCar;
      if (!car) return;
      if (state.wishedIds.has(car.id)) {
        state.wishedIds.delete(car.id);
        showSnack('찜한 차량에서 해제되었습니다.');
      } else {
        state.wishedIds.add(car.id);
        showSnack('찜한 차량에 저장되었습니다.');
      }
      renderDetail(car);
    });

    document.getElementById('btnDetailPrimaryCta').addEventListener('click', () => {
      const car = state.selectedCar;
      if (!car) return;
      const pi = getPlatInfo(car.platform);

      if (car.isExternal) {
        showSnack(`${pi.short} 원본 매물 페이지로 이동합니다.`);
        window.open(car.outUrl, '_blank', 'noopener,noreferrer');
      } else {
        openKcarModal({
          title: `${car.plateNo || ''} 차주와 채팅하기`,
          html: `
            K Car 안심직거래에 직접 등록된 매물은 외부 이동 없이 <strong>K Car 앱/웹 내 안심채팅</strong>으로 즉시 거래할 수 있습니다.<br/><br/>
            실제 K Car 안심직거래 모바일 상세페이지도 새 창에서 확인하실 수 있습니다.
          `,
          confirmLabel: '실제 K Car 상세 보기',
          onConfirm: () => window.open(car.outUrl, '_blank', 'noopener,noreferrer')
        });
      }
    });

    // Bottom 5-Tab Bar
    document.querySelectorAll('#bottomNavBar .tabbar-link').forEach((btn) => {
      btn.addEventListener('click', () => {
        const b = btn.dataset.bnav;
        if (b === 'home') switchView('home');
        else if (b === 'wish') goToList({ platCat: 'all', wishOnly: true });
        else if (b === 'search') goToList({ platCat: 'all', wishOnly: false });
        else if (b === 'chat') showSnack('안심채팅은 K Car 직접 등록 차량에서 이용 가능합니다.');
        else if (b === 'mypage') openSelfRegPolicyModal();
      });
    });

    // Modal Dialog Close / Confirm
    const modal = document.getElementById('kcarModal');
    document.getElementById('btnModalCancel').addEventListener('click', () => modal.close());
    document.getElementById('btnModalConfirm').addEventListener('click', () => {
      const fn = state.modalConfirmFn;
      modal.close();
      if (typeof fn === 'function') fn();
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.close();
    });

    // Shorts Player Modal Controls
    const shortsModal = document.getElementById('kcarShortsModal');
    if (shortsModal) {
      document.getElementById('btnCloseShortsModal').addEventListener('click', closeShortsModal);
      document.getElementById('btnShortsBackToCar').addEventListener('click', closeShortsModal);
      document.getElementById('btnPrevShort').addEventListener('click', () => {
        state.activeShortsIdx -= 1;
        renderShortsModalSlide();
      });
      document.getElementById('btnNextShort').addEventListener('click', () => {
        state.activeShortsIdx += 1;
        renderShortsModalSlide();
      });
      shortsModal.addEventListener('close', () => {
        const box = document.getElementById('shortsIframeBox');
        if (box) box.innerHTML = '';
      });
      shortsModal.addEventListener('click', (e) => {
        if (e.target === shortsModal) closeShortsModal();
      });
    }

    // Optional Preview Compare Bar (Only shown when ?preview=1 or ?preview=shorts is explicitly passed)
    const previewBar = document.getElementById('previewCompareBar');
    const hasPreviewParam = new URLSearchParams(window.location.search).has('preview');
    if (previewBar && hasPreviewParam) {
      previewBar.style.display = 'flex';
      const toggleBtn = document.getElementById('btnToggleShortsPreview');
      const infoBtn = document.getElementById('btnPreviewRollbackInfo');

      toggleBtn.addEventListener('click', () => {
        state.shortsEnabled = !state.shortsEnabled;
        toggleBtn.classList.toggle('is-on', state.shortsEnabled);
        toggleBtn.textContent = state.shortsEnabled ? '쇼츠 ON' : '기존 화면(OFF)';
        if (state.view === 'detail' && state.selectedCar) {
          const scrollBody = document.getElementById('appScrollBody');
          const savedScroll = scrollBody ? scrollBody.scrollTop : 0;
          renderDetail(state.selectedCar);
          if (scrollBody) scrollBody.scrollTop = savedScroll;
        } else if (VEHICLES.length > 0) {
          openCarById(VEHICLES[0].id);
        }
        showSnack(
          state.shortsEnabled
            ? '차량 상세페이지에 동일 차종 쇼츠 섹션이 적용되었습니다.'
            : '기존 원본 상세페이지(쇼츠 제외) 비교 화면입니다.'
        );
      });

      infoBtn.addEventListener('click', () => {
        openKcarModal({
          title: '미리보기 상태 및 롤백 안내',
          html: `
            현재 화면은 <strong>실제 배포 사이트(GitHub Pages)에 반영하기 전 로컬 미리보기</strong> 상태입니다.<br/><br/>
            <span style="display:block; padding:10px 12px; border-radius:6px; background:#f6f8fa; font-size:12px; color:#54555a; line-height:18px;">
              · <strong>실시간 비교</strong>: 하단 바의 [쇼츠 ON / 기존 화면] 버튼으로 전·후 느낌을 즉시 비교할 수 있습니다.<br/>
              · <strong>1초 원상복구(롤백)</strong>: 폴더 내 <strong>쇼츠기능_롤백.bat</strong> 파일을 실행하시면 원본 파일로 100% 복원됩니다.<br/>
              · <strong>실제 사이트 적용</strong>: 확인 후 마음에 드시면 깃허브 업로드 실행 시 실제 사이트에 반영됩니다.
            </span>
          `,
          confirmLabel: '차량 상세 쇼츠 확인하기',
          onConfirm: () => {
            if (state.view !== 'detail' && VEHICLES.length > 0) {
              openCarById(VEHICLES[0].id);
              setTimeout(() => {
                const sec = document.getElementById('secCarShorts');
                if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 120);
            }
          }
        });
      });
    }
  }

  initKPIs();
  renderHome();
  bindEvents();
})();
