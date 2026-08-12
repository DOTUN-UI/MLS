/* Matchday Workforce — shared UI helpers */
(function () {
  const params = new URLSearchParams(window.location.search);

  function qs(sel, root = document) {
    return root.querySelector(sel);
  }

  function qsa(sel, root = document) {
    return [...root.querySelectorAll(sel)];
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function monthDay(iso) {
    const d = new Date(iso + 'T12:00:00');
    return {
      month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: String(d.getDate()),
    };
  }

  function stadiumImageURL(stadium) {
    if (!stadium?.image) return '';
    return stadium.image
      .split('/')
      .map((part) => encodeURIComponent(part))
      .join('/');
  }

  function showToast(message) {
    let el = qs('#toast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast';
      el.className = 'toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => el.classList.remove('show'), 2800);
  }

  function setActiveNav() {
    const path = location.pathname.split('/').pop() || 'index.html';
    qsa('.nav-links a').forEach((a) => {
      const href = a.getAttribute('href');
      if (href === path || (path === '' && href === 'index.html')) {
        a.classList.add('active');
      }
    });
  }

  function initWeAreSlideshow() {
    /* Homepage slideshow is parked in index.html (restore:start we-are-slideshow). */
    const root = qs('#we-are-slideshow');
    if (!root) return;
    const slides = qsa('.multi-slide', root);
    const dots = qsa('.multi-dots button', root);
    if (slides.length < 2) return;

    let index = 0;
    let timer;

    const show = (i) => {
      index = (i + slides.length) % slides.length;
      slides.forEach((slide, n) => slide.classList.toggle('is-active', n === index));
      dots.forEach((dot, n) => dot.classList.toggle('is-active', n === index));
    };

    const next = () => show(index + 1);

    const start = () => {
      clearInterval(timer);
      timer = setInterval(next, 2000);
    };

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        show(Number(dot.dataset.slide) || 0);
        start();
      });
    });

    root.addEventListener('mouseenter', () => clearInterval(timer));
    root.addEventListener('mouseleave', start);

    show(0);
    start();
  }

  function initValuesTrack() {
    const track = qs('#values-track');
    if (!track) return;
    let down = false;
    let startX = 0;
    let scrollLeft = 0;
    track.addEventListener('pointerdown', (e) => {
      down = true;
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointerup', () => { down = false; });
    track.addEventListener('pointerleave', () => { down = false; });
    track.addEventListener('pointermove', (e) => {
      if (!down) return;
      e.preventDefault();
      const x = e.pageX - track.offsetLeft;
      track.scrollLeft = scrollLeft - (x - startX);
    });
  }

  function initNav() {
    const nav = qs('.site-nav');
    const toggle = qs('.nav-toggle');
    const links = qs('.nav-links');

    if (nav) {
      const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    if (toggle && links) {
      toggle.addEventListener('click', () => {
        const open = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      links.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', () => {
          links.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
      window.addEventListener('resize', () => {
        if (window.innerWidth > 860) {
          links.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });
    }

    setActiveNav();
  }

  function initFooterDrops() {
    const drops = qsa('.footer-drop');
    if (!drops.length) return;
    drops.forEach((drop) => {
      drop.addEventListener('toggle', () => {
        if (!drop.open) return;
        drops.forEach((other) => {
          if (other !== drop) other.open = false;
        });
      });
    });
  }

  function initFloatingJobsCta() {
    const heroBtn = qs('#hero-search-jobs');
    const floatBtn = qs('#floating-search-jobs');
    if (!heroBtn || !floatBtn) return;

    const setVisible = (visible) => {
      floatBtn.classList.toggle('is-visible', visible);
      floatBtn.setAttribute('aria-hidden', visible ? 'false' : 'true');
      floatBtn.tabIndex = visible ? 0 : -1;
    };

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );

    observer.observe(heroBtn);
    setVisible(false);
  }

  function jobRowHTML(job) {
    const s = job.stadium;
    const badgeClass =
      job.status === 'Open' ? 'badge-open' : job.status === 'Hiring soon' ? 'badge-event' : 'badge-closed';
    return `
      <a class="job-row" href="job.html?id=${job.id}">
        <div>
          <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;margin-bottom:0.35rem">
            <h3>${job.title}</h3>
            <span class="badge ${badgeClass}">${job.status}</span>
            ${job.urgent ? '<span class="badge badge-urgent">Urgent</span>' : ''}
          </div>
          <div class="job-meta">
            <span>${s.name}</span>
            <span>${s.city}, ${s.state}</span>
            <span>${job.category}</span>
            <span>${job.type}</span>
            <span>Apply by ${formatDate(job.deadline)}</span>
          </div>
        </div>
        <div class="pay">${job.payLabel}</div>
      </a>
    `;
  }

  function eventItemHTML(evt) {
    const s = MW.getStadium(evt.stadiumId);
    const md = monthDay(evt.date);
    return `
      <article class="event-item">
        <div class="event-date">
          <div class="month">${md.month}</div>
          <div class="day">${md.day}</div>
        </div>
        <div>
          <h3 style="font-family:var(--font-display);font-size:1.1rem;margin-bottom:0.25rem">${evt.title}</h3>
          <div class="job-meta">
            <span>${s.name} · ${s.city}</span>
            <span>${evt.time}</span>
            <span>${evt.roles.join(', ')}</span>
          </div>
        </div>
        <a class="btn btn-secondary btn-sm" href="events.html?id=${evt.id}">Details</a>
      </article>
    `;
  }

  function stadiumTileHTML(s) {
    const openCount = MW.jobs.filter((j) => j.stadiumId === s.id && j.status === 'Open').length;
    return `
      <a class="stadium-tile" href="stadium.html?id=${s.id}">
        <h3>${s.name}</h3>
        <p>${s.city}, ${s.state} · ${openCount} open roles</p>
      </a>
    `;
  }

  function filterJobs(filters = {}) {
    return MW.enrichedJobs()
      .filter((job) => {
        if (filters.q) {
          const hay = `${job.title} ${job.category} ${job.stadium.name} ${job.stadium.city} ${job.stadium.club}`.toLowerCase();
          if (!hay.includes(filters.q.toLowerCase())) return false;
        }
        if (filters.city && job.stadium.city !== filters.city) return false;
        if (filters.club && job.stadium.club !== filters.club) return false;
        if (filters.stadium && job.stadiumId !== filters.stadium) return false;
        if (filters.category && job.category !== filters.category) return false;
        if (filters.type && job.type !== filters.type) return false;
        if (filters.payMin && job.payMax < Number(filters.payMin)) return false;
        if (filters.status && job.status !== filters.status) return false;
        return true;
      })
      .sort((a, b) => a.deadline.localeCompare(b.deadline));
  }

  function renderHome() {
    const featured = qs('#featured-jobs');
    const events = qs('#upcoming-events');
    const stadiums = qs('#stadium-strip');
    if (featured) {
      featured.innerHTML = MW.enrichedJobs()
        .filter((j) => j.status === 'Open')
        .slice(0, 4)
        .map(jobRowHTML)
        .join('');
    }
    if (events) {
      events.innerHTML = MW.events.slice(0, 3).map(eventItemHTML).join('');
    }
    if (stadiums) {
      stadiums.innerHTML = MW.stadiums.map(stadiumTileHTML).join('');
    }

    const form = qs('#hero-search');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = qs('#search-q')?.value || '';
        const city = qs('#search-city')?.value || '';
        const role = qs('#search-role')?.value || '';
        const url = new URL('jobs.html', location.href);
        if (q) url.searchParams.set('q', q);
        if (city) url.searchParams.set('city', city);
        if (role) url.searchParams.set('category', role);
        location.href = url.toString();
      });
    }
  }

  function renderJobsPage() {
    const form = qs('#filters-form');
    const fixturesList = qs('#fixtures-list');
    const clubList = qs('#club-jobs-list');
    if (!form || (!fixturesList && !clubList)) return;

    const fixturesView = qs('#fixtures-view');
    const rolesView = qs('#match-roles-view');
    const matchHero = qs('#match-hero');
    const rolesList = qs('#match-roles-list');
    const fixturesCount = qs('#fixtures-count');
    const rolesCount = qs('#roles-count');
    const clubCount = qs('#club-jobs-count');
    const matchdayPanel = qs('#matchday-panel');
    const clubPanel = qs('#club-panel');
    const citySel = qs('#filter-city');
    const clubSel = qs('#filter-club');
    const stadiumSel = qs('#filter-stadium');

    let activeTab = params.get('tab') === 'club' ? 'club' : 'matchday';
    let selectedMatchId = params.get('match') || '';

    const filters = () =>
      form ? Object.fromEntries(new FormData(form).entries()) : Object.fromEntries(params.entries());

    const stadiumsFor = (cityFilter = '', clubFilter = '') =>
      MW.stadiums.filter((s) => {
        if (cityFilter && s.city !== cityFilter) return false;
        if (clubFilter && s.club !== clubFilter) return false;
        return true;
      });

    const populateClubOptions = (cityFilter = citySel?.value || '') => {
      if (!clubSel) return;
      const selected = clubSel.value;
      clubSel.innerHTML = '<option value="">Any club</option>';
      [...new Set(stadiumsFor(cityFilter).map((s) => s.club))]
        .sort((a, b) => a.localeCompare(b))
        .forEach((club) => {
          clubSel.insertAdjacentHTML('beforeend', `<option value="${club}">${club}</option>`);
        });
      if ([...clubSel.options].some((o) => o.value === selected)) clubSel.value = selected;
    };

    const populateStadiumOptions = (
      cityFilter = citySel?.value || '',
      clubFilter = clubSel?.value || ''
    ) => {
      if (!stadiumSel) return;
      const selected = stadiumSel.value;
      stadiumSel.innerHTML = '<option value="">Any stadium</option>';
      stadiumsFor(cityFilter, clubFilter)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach((s) => {
          stadiumSel.insertAdjacentHTML('beforeend', `<option value="${s.id}">${s.name}</option>`);
        });
      if ([...stadiumSel.options].some((o) => o.value === selected)) stadiumSel.value = selected;
    };

    const refreshLocationFilters = () => {
      populateClubOptions();
      populateStadiumOptions();
    };

    const setUrl = () => {
      const f = filters();
      const url = new URL(location.href);
      ['city', 'club', 'stadium', 'month', 'category'].forEach((key) => {
        if (f[key]) url.searchParams.set(key, f[key]);
        else url.searchParams.delete(key);
      });
      if (activeTab === 'club') url.searchParams.set('tab', 'club');
      else url.searchParams.delete('tab');
      if (selectedMatchId && activeTab === 'matchday') url.searchParams.set('match', selectedMatchId);
      else url.searchParams.delete('match');
      history.replaceState({}, '', url);
    };

    const filterFixtures = (f) =>
      MW.enrichedFixtures().filter((fx) => {
        const s = fx.stadium;
        if (!s) return false;
        if (f.city && s.city !== f.city) return false;
        if (f.club && s.club !== f.club && fx.home !== f.club && fx.away !== f.club) return false;
        if (f.stadium && fx.stadiumId !== f.stadium) return false;
        if (f.month && !fx.date.startsWith(f.month)) return false;
        return true;
      });

    const filterClubJobs = (f) =>
      (MW.clubJobs || []).filter((job) => {
        if (f.city && job.city !== f.city) return false;
        if (f.club && job.club !== f.club) return false;
        if (f.stadium) {
          const home = MW.stadiums.find((s) => s.id === f.stadium);
          if (home && job.club !== home.club) return false;
        }
        return true;
      });

    const filterMatchRoles = (f) =>
      (MW.matchRoles || []).filter((role) => {
        if (f.category && role.category !== f.category) return false;
        return true;
      });

    const fixtureCardHTML = (fx, index) => {
      const s = fx.stadium;
      const md = monthDay(fx.date);
      const img = stadiumImageURL(s);
      return `
        <button type="button" class="fixture-card${img ? ' has-photo' : ''}" data-match-id="${fx.id}" style="--i:${index}">
          ${img ? `<img class="fixture-bg" src="${img}" alt="" loading="lazy" decoding="async" />` : ''}
          <div class="fixture-date">
            <span class="month">${md.month}</span>
            <span class="day">${md.day}</span>
          </div>
          <div class="fixture-body">
            <p class="fixture-match">${fx.home} <span>vs</span> ${fx.away}</p>
            <p class="fixture-meta">${fx.time} · ${s.name}, ${s.city}</p>
            <p class="fixture-openings">${fx.openings} roles hiring</p>
          </div>
          <span class="fixture-cta btn btn-primary btn-sm">View roles</span>
        </button>
      `;
    };

    const roleCardHTML = (role, fixture) => `
      <article class="role-card">
        <div class="role-card-main">
          <h3>${role.title}</h3>
          <p class="role-card-meta">${role.category} · ${role.type} · ${fixture.stadium.name}</p>
          <p class="role-card-slots">${role.slots} spots · ${role.payLabel}</p>
        </div>
        <a class="btn btn-primary btn-sm" href="apply.html?match=${encodeURIComponent(fixture.id)}&role=${encodeURIComponent(role.id)}">Apply</a>
      </article>
    `;

    const clubJobCardHTML = (job, index) => `
      <article class="club-job-card" style="--i:${index}">
        <div class="club-job-mark" aria-hidden="true">${MW.clubInitials(job.club)}</div>
        <div class="club-job-main">
          <h3>${job.title}</h3>
          <p class="club-job-org">${job.club}</p>
          <p class="club-job-loc">${job.city} · ${job.state}</p>
          <p class="club-job-level">${job.level || job.type}</p>
        </div>
        <a class="btn btn-primary btn-sm" href="apply.html?clubJob=${encodeURIComponent(job.id)}">View</a>
      </article>
    `;

    const showMatchRoles = (matchId) => {
      const fixture = MW.enrichFixture(MW.getFixture(matchId) || {});
      if (!fixture?.id || !fixture.stadium) {
        selectedMatchId = '';
        showFixtures();
        return;
      }
      selectedMatchId = matchId;
      fixturesView.hidden = true;
      rolesView.hidden = false;
      const md = monthDay(fixture.date);
      const img = stadiumImageURL(fixture.stadium);
      matchHero.classList.toggle('has-photo', Boolean(img));
      matchHero.style.backgroundImage = '';
      matchHero.innerHTML = `
        ${img ? `<img class="match-hero-bg" src="${img}" alt="" loading="eager" decoding="async" />` : ''}
        <div class="match-hero-date">
          <span class="month">${md.month}</span>
          <span class="day">${md.day}</span>
        </div>
        <div>
          <p class="match-hero-kicker">Matchday hiring · ${fixture.stadium.name}</p>
          <h3>${fixture.home} <span>vs</span> ${fixture.away}</h3>
          <p>${fixture.time} · ${fixture.stadium.name}, ${fixture.stadium.city}</p>
        </div>
      `;
      const roles = filterMatchRoles(filters());
      rolesCount.textContent = `${roles.length} role${roles.length === 1 ? '' : 's'}`;
      rolesList.innerHTML = roles.length
        ? roles.map((r) => roleCardHTML(r, fixture)).join('')
        : `<div class="empty">No roles in that category for this match. Clear the role filter.</div>`;
      setUrl();
      rolesView.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const showFixtures = () => {
      selectedMatchId = '';
      fixturesView.hidden = false;
      rolesView.hidden = true;
      const results = filterFixtures(filters());
      fixturesCount.textContent = `${results.length} matchday${results.length === 1 ? '' : 's'}`;
      fixturesList.innerHTML = results.length
        ? results.map(fixtureCardHTML).join('')
        : `<div class="empty">No matchdays match those filters.</div>`;
      setUrl();
    };

    const showClubJobs = () => {
      const results = filterClubJobs(filters());
      clubCount.textContent = `${results.length} role${results.length === 1 ? '' : 's'}`;
      clubList.innerHTML = results.length
        ? results.map(clubJobCardHTML).join('')
        : `<div class="empty">No club roles match those filters.</div>`;
      setUrl();
    };

    const setTab = (tab) => {
      activeTab = tab;
      qsa('.jobs-tab').forEach((btn) => {
        const on = btn.dataset.jobsTab === tab;
        btn.classList.toggle('is-active', on);
        btn.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      if (matchdayPanel) {
        matchdayPanel.hidden = tab !== 'matchday';
        matchdayPanel.classList.toggle('is-active', tab === 'matchday');
      }
      if (clubPanel) {
        clubPanel.hidden = tab !== 'club';
        clubPanel.classList.toggle('is-active', tab === 'club');
      }
      if (tab === 'club') {
        selectedMatchId = '';
        showClubJobs();
      } else if (selectedMatchId) {
        showMatchRoles(selectedMatchId);
      } else {
        showFixtures();
      }
    };

    const apply = () => {
      refreshLocationFilters();
      if (activeTab === 'club') showClubJobs();
      else if (selectedMatchId) showMatchRoles(selectedMatchId);
      else showFixtures();
    };

    if (citySel && citySel.options.length <= 1) {
      MW.marketRegions.forEach((region) => {
        const options = region.cities
          .map((c) => `<option value="${c.city}">${c.city}, ${c.state}</option>`)
          .join('');
        citySel.insertAdjacentHTML('beforeend', `<optgroup label="${region.label}">${options}</optgroup>`);
      });
    }

    ['city', 'club', 'stadium', 'month', 'category'].forEach((key) => {
      const el = form.elements[key];
      if (el && params.get(key)) el.value = params.get(key);
    });

    refreshLocationFilters();
    setTab(activeTab);

    form.addEventListener('change', apply);
    form.addEventListener('input', apply);
    qs('#clear-filters')?.addEventListener('click', () => {
      form.reset();
      selectedMatchId = '';
      refreshLocationFilters();
      apply();
    });

    qsa('.jobs-tab').forEach((btn) => {
      btn.addEventListener('click', () => setTab(btn.dataset.jobsTab));
    });

    fixturesList.addEventListener('click', (e) => {
      const card = e.target.closest('[data-match-id]');
      if (!card) return;
      showMatchRoles(card.dataset.matchId);
    });

    qs('#match-back')?.addEventListener('click', () => {
      selectedMatchId = '';
      showFixtures();
      fixturesView.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function renderStadiumPage() {
    const root = qs('#stadium-page');
    if (!root) return;
    const id = params.get('id') || 'providence-park';
    const s = MW.getStadium(id);
    if (!s) {
      root.innerHTML = `<div class="empty">Stadium not found.</div>`;
      return;
    }
    const jobs = MW.enrichedJobs().filter((j) => j.stadiumId === s.id);
    const events = MW.events.filter((e) => e.stadiumId === s.id);

    const venueImg = stadiumImageURL(s);
    root.innerHTML = `
      <div class="venue-hero${venueImg ? ' has-photo' : ''}">
        ${venueImg ? `<img class="venue-hero-bg" src="${venueImg}" alt="" loading="eager" decoding="async" />` : ''}
        <p class="section-kicker" style="color:rgba(255,255,255,0.75)">${s.club}</p>
        <h1>${s.name}</h1>
        <p style="opacity:0.85;margin-top:0.35rem">${s.city}, ${s.state}${s.capacity ? ` · Capacity ${s.capacity}` : ''}</p>
      </div>
      <div class="detail-layout">
        <div class="detail-main">
          <p>${s.about}</p>
          ${s.address ? `<p style="color:var(--muted);margin-top:0.75rem">${s.address}</p>` : ''}
          <h2>Upcoming home matches</h2>
          <p style="color:var(--muted);font-size:0.9rem;margin-bottom:0.75rem">Real 2026 fixtures from club schedules${s.source ? ` (${s.source})` : ''}.</p>
          <div class="job-grid">
            ${s.matches
              .map(
                (m) => `
              <div class="job-row" style="cursor:default">
                <div>
                  <div style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;margin-bottom:0.25rem">
                    <h3>${m.opponent}</h3>
                    ${m.competition ? `<span class="badge badge-status">${m.competition}</span>` : ''}
                  </div>
                  <div class="job-meta">
                    <span>${m.displayDate || m.date}</span>
                    <span>Kickoff ${m.kickoff}</span>
                    ${m.broadcast ? `<span>${m.broadcast}</span>` : ''}
                  </div>
                </div>
              </div>`
              )
              .join('')}
          </div>
          <h2>Open positions</h2>
          <div class="job-grid">${jobs.map(jobRowHTML).join('') || '<div class="empty">No openings right now.</div>'}</div>
          <h2>Hiring events</h2>
          <div class="event-list">${events.map(eventItemHTML).join('') || '<div class="empty">No events scheduled.</div>'}</div>
        </div>
        <aside class="side-panel">
          <h3>Venue info</h3>
          <div class="meta-stack" style="margin-top:1rem">
            <div class="meta-row"><span>Report to</span><span>${s.reportTo}</span></div>
            <div class="meta-row"><span>Staffing partner</span><span>${s.partner}</span></div>
            ${s.capacity ? `<div class="meta-row"><span>Capacity</span><span>${s.capacity}</span></div>` : ''}
            <div class="meta-row"><span>Check-in</span><span>${s.mapNote}</span></div>
          </div>
          <a class="btn btn-primary" style="width:100%" href="jobs.html?stadium=${s.id}">View all jobs</a>
        </aside>
      </div>
    `;
  }

  function renderJobPage() {
    const root = qs('#job-page');
    if (!root) return;
    const id = params.get('id');
    const raw = (id && MW.getJob(id)) || MW.jobs[0];
    if (!raw) {
      root.innerHTML = `<div class="empty">No openings are listed right now. <a href="jobs.html">Back to jobs</a></div>`;
      return;
    }
    const job = MW.enrichJob(raw);
    const s = job.stadium;

    root.innerHTML = `
      <div class="breadcrumbs">
        <a href="index.html">Home</a> / <a href="jobs.html">Jobs</a> /
        <a href="stadium.html?id=${s.id}">${s.name}</a> / <span>${job.title}</span>
      </div>
      <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem">
        <span class="badge badge-open">${job.status}</span>
        <span class="badge badge-status">${job.type}</span>
        ${job.urgent ? '<span class="badge badge-urgent">Urgent hire</span>' : ''}
      </div>
      <h1 style="font-family:var(--font-display);font-size:clamp(1.8rem,4vw,2.6rem);letter-spacing:-0.02em">${job.title}</h1>
      <p style="color:var(--muted);margin-top:0.4rem">${s.name} · ${s.city}, ${s.state} · ${s.club}</p>
      <div class="detail-layout">
        <div class="detail-main">
          <h2>About the role</h2>
          <p>${job.description}</p>
          <h2>Responsibilities</h2>
          <ul>${job.responsibilities.map((r) => `<li>${r}</li>`).join('')}</ul>
          <h2>Qualifications</h2>
          <ul>${job.qualifications.map((r) => `<li>${r}</li>`).join('')}</ul>
          <h2>Physical requirements</h2>
          <p>${job.physical}</p>
          <h2>Background check</h2>
          <p>${job.background}</p>
        </div>
        <aside class="side-panel">
          <div class="label" style="font-size:0.78rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted)">Pay range</div>
          <div class="pay-lg">${job.payLabel}</div>
          <div class="meta-stack">
            <div class="meta-row"><span>Category</span><span>${job.category}</span></div>
            <div class="meta-row"><span>Schedule</span><span>${job.schedule}</span></div>
            <div class="meta-row"><span>Minimum age</span><span>${job.minAge}+</span></div>
            <div class="meta-row"><span>Deadline</span><span>${formatDate(job.deadline)}</span></div>
            <div class="meta-row"><span>Employer partner</span><span>${s.partner}</span></div>
          </div>
          <a class="btn btn-primary" style="width:100%;margin-bottom:0.5rem" href="apply.html?job=${job.id}">Apply now</a>
          <a class="btn btn-secondary" style="width:100%" href="stadium.html?id=${s.id}">View stadium</a>
        </aside>
      </div>
    `;
  }

  function renderApply() {
    const root = qs('#apply-form');
    if (!root) return;

    const matchId = params.get('match');
    const roleId = params.get('role');
    const clubJobId = params.get('clubJob');
    const jobId = params.get('job');

    let applyContext = null;
    let labelText = 'No openings available right now';

    if (matchId && roleId) {
      const fixture = MW.getFixture(matchId);
      const role = MW.getMatchRole(roleId);
      const stadium = fixture && MW.getStadium(fixture.stadiumId);
      if (fixture && role && stadium) {
        applyContext = { kind: 'match', matchId, roleId, title: role.title, stadium: stadium.name };
        labelText = `${role.title} · ${fixture.home} vs ${fixture.away} · ${stadium.name}`;
      }
    } else if (clubJobId) {
      const clubJob = MW.getClubJob(clubJobId);
      if (clubJob) {
        applyContext = { kind: 'club', clubJobId, title: clubJob.title, club: clubJob.club };
        labelText = `${clubJob.title} · ${clubJob.club}`;
      }
    } else if (jobId && MW.getJob(jobId)) {
      const job = MW.enrichJob(MW.getJob(jobId));
      applyContext = { kind: 'job', jobId: job.id, title: job.title };
      labelText = `${job.title} · ${job.stadium.name}`;
    } else if (MW.jobs[0]) {
      const job = MW.enrichJob(MW.jobs[0]);
      applyContext = { kind: 'job', jobId: job.id, title: job.title };
      labelText = `${job.title} · ${job.stadium.name}`;
    }

    const label = qs('#apply-job-label');
    if (label) label.textContent = labelText;
    if (!applyContext) return;

    let step = 0;
    const steps = qsa('.form-step');
    const pills = qsa('.step-pill');

    const show = () => {
      steps.forEach((s, i) => s.classList.toggle('active', i === step));
      pills.forEach((p, i) => {
        p.classList.toggle('active', i === step);
        p.classList.toggle('done', i < step);
      });
      qs('#prev-step').style.visibility = step === 0 ? 'hidden' : 'visible';
      qs('#next-step').textContent = step === steps.length - 1 ? 'Submit application' : 'Continue';
    };

    qs('#next-step')?.addEventListener('click', () => {
      if (step < steps.length - 1) {
        step += 1;
        show();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const draft = {
          ...applyContext,
          submittedAt: new Date().toISOString(),
          name: qs('#full-name')?.value || 'Applicant',
        };
        localStorage.setItem('mw_last_application', JSON.stringify(draft));
        showToast('Application submitted. We’ll be in touch by email.');
        setTimeout(() => (location.href = 'jobs.html'), 1200);
      }
    });

    qs('#prev-step')?.addEventListener('click', () => {
      if (step > 0) {
        step -= 1;
        show();
      }
    });

    show();
  }

  function renderDashboard() {
    const apps = qs('#app-list');
    if (!apps) return;
    if (params.get('submitted') === '1') {
      showToast('Your application was received. Track status below.');
    }
    apps.innerHTML = MW.applications
      .map((a) => {
        const job = MW.enrichJob(MW.getJob(a.jobId));
        const dot =
          a.status.includes('Interview') ? 'interview' : a.status.includes('Documents') ? 'review' : 'review';
        return `
          <tr>
            <td>
              <strong>${job.title}</strong><br>
              <span style="color:var(--muted);font-size:0.85rem">${job.stadium.name}</span>
            </td>
            <td><span class="status-dot ${dot}"></span>${a.status}</td>
            <td>${a.updated}</td>
            <td>${a.next}</td>
          </tr>`;
      })
      .join('');

    const msgs = qs('#msg-list');
    if (msgs) {
      msgs.innerHTML = MW.messages
        .map(
          (m) => `
        <div class="course-item">
          <div>
            <strong>${m.subject}</strong>
            <div style="color:var(--muted);font-size:0.88rem;margin-top:0.2rem">${m.from} · ${m.time}</div>
            <p style="margin-top:0.35rem">${m.preview}</p>
          </div>
          <button class="btn btn-secondary btn-sm" type="button" data-reply>Reply</button>
        </div>`
        )
        .join('');
      msgs.addEventListener('click', (e) => {
        if (e.target.matches('[data-reply]')) showToast('Message composer opens in the full product');
      });
    }
  }

  function renderEventsPage() {
    const list = qs('#events-list');
    const detail = qs('#event-detail');
    if (list) {
      list.innerHTML = MW.events.map(eventItemHTML).join('');
    }
    if (detail) {
      const id = params.get('id') || MW.events[0].id;
      const evt = MW.events.find((e) => e.id === id) || MW.events[0];
      const s = MW.getStadium(evt.stadiumId);
      const md = monthDay(evt.date);
      detail.innerHTML = `
        <div class="panel">
          <div style="display:flex;gap:1rem;align-items:start;margin-bottom:1rem">
            <div class="event-date"><div class="month">${md.month}</div><div class="day">${md.day}</div></div>
            <div>
              <h2 style="font-family:var(--font-display);font-size:1.5rem">${evt.title}</h2>
              <p style="color:var(--muted);margin-top:0.25rem">${s.name} · ${s.city}, ${s.state}</p>
            </div>
          </div>
          <div class="meta-stack">
            <div class="meta-row"><span>Time</span><span>${evt.time}</span></div>
            <div class="meta-row"><span>Location</span><span>${evt.location}</span></div>
            <div class="meta-row"><span>Roles hiring</span><span>${evt.roles.join(', ')}</span></div>
            <div class="meta-row"><span>Spots</span><span>${evt.spots} remaining</span></div>
          </div>
          <h3 style="margin:1rem 0 0.5rem;font-family:var(--font-display)">What to bring</h3>
          <ul style="margin-left:1.1rem;list-style:disc">${evt.bring.map((b) => `<li style="margin-bottom:0.35rem;color:var(--ink-soft)">${b}</li>`).join('')}</ul>
          ${evt.note ? `<p style="margin-top:1rem;color:var(--muted);font-size:0.9rem">${evt.note}</p>` : ''}
          <button class="btn btn-primary" style="margin-top:1.25rem;width:100%" id="register-event" type="button">Register for this event</button>
          <p class="hint" style="margin-top:0.75rem;font-size:0.85rem;color:var(--muted);text-align:center">You'll receive a confirmation email with check-in details.</p>
        </div>`;
      qs('#register-event')?.addEventListener('click', () => {
        localStorage.setItem('mw_event_reg', evt.id);
        showToast('Registered! Confirmation email sent (demo).');
      });
    }
  }

  function renderTraining() {
    const list = qs('#course-list');
    if (!list) return;
    list.innerHTML = MW.courses
      .map(
        (c) => `
      <div class="course-item">
        <div>
          <div style="display:flex;gap:0.5rem;align-items:center;margin-bottom:0.25rem">
            <strong>${c.title}</strong>
            <span class="badge badge-status">${c.category}</span>
          </div>
          <div style="color:var(--muted);font-size:0.85rem">${c.minutes} min · ${c.progress}% complete</div>
          <div class="progress-bar"><span style="width:${c.progress}%"></span></div>
        </div>
        <button class="btn btn-secondary btn-sm" type="button" data-course="${c.id}">
          ${c.progress === 100 ? 'Review' : c.progress > 0 ? 'Continue' : 'Start'}
        </button>
      </div>`
      )
      .join('');

    list.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-course]');
      if (!btn) return;
      showToast('Lesson player opens in the full training module');
    });

    const overall = Math.round(MW.courses.reduce((sum, c) => sum + c.progress, 0) / MW.courses.length);
    const bar = qs('#overall-progress');
    if (bar) bar.style.width = overall + '%';
    const label = qs('#overall-label');
    if (label) label.textContent = overall + '% complete';
  }

  function renderWorker() {
    const root = qs('#worker-assignment');
    if (!root) return;
    const s = MW.getStadium('providence-park');
    const next = s.matches.find((m) => m.date >= '2026-08-11') || s.matches[0];
    root.innerHTML = `
      <div class="assignment">
        <p class="section-kicker" style="color:rgba(255,255,255,0.7)">Next match assignment</p>
        <h2>Guest Services — Section 112</h2>
        <p class="sub">${s.name} · ${next.opponent} · ${next.displayDate || next.date}</p>
        <dl class="assignment-grid">
          <div><dt>Kickoff</dt><dd>${next.kickoff}</dd></div>
          <div><dt>Shift time</dt><dd>Arrive 90 min before kickoff</dd></div>
          <div><dt>Report to</dt><dd>${s.reportTo}</dd></div>
          <div><dt>Supervisor</dt><dd>Chris Alvarez · Gate D Lead</dd></div>
          <div><dt>Uniform</dt><dd>Black polo, khaki pants, closed-toe shoes</dd></div>
          <div><dt>Competition</dt><dd>${next.competition || 'MLS'} · ${next.broadcast || 'Apple TV'}</dd></div>
          <div><dt>Check-in</dt><dd>Scan QR at staff desk · bring photo ID</dd></div>
          <div><dt>Map note</dt><dd>${s.mapNote}</dd></div>
        </dl>
      </div>
    `;
  }

  function renderAdmin() {
    const table = qs('#admin-applicants');
    if (!table) return;
    table.innerHTML = MW.applicantsAdmin
      .map((a) => {
        const cls =
          a.status === 'Interview'
            ? 'interview'
            : a.status === 'Offer'
              ? 'offer'
              : a.status === 'Declined'
                ? 'declined'
                : 'review';
        return `
        <tr>
          <td><strong>${a.name}</strong></td>
          <td>${a.role}<br><span style="color:var(--muted);font-size:0.85rem">${a.stadium}</span></td>
          <td><span class="status-dot ${cls}"></span>${a.status}</td>
          <td>${a.applied}</td>
          <td>
            <button class="btn btn-secondary btn-sm" type="button" data-action="status">Update</button>
          </td>
        </tr>`;
      })
      .join('');

    table.closest('table')?.addEventListener('click', (e) => {
      if (e.target.matches('[data-action]')) showToast('Status updated (demo)');
    });

    qsa('[data-admin-action]').forEach((btn) => {
      btn.addEventListener('click', () => showToast(btn.dataset.adminAction));
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initNav();
    initFooterDrops();
    initFloatingJobsCta();
    initWeAreSlideshow();
    initValuesTrack();
    renderHome();
    renderJobsPage();
    renderStadiumPage();
    renderJobPage();
    renderApply();
    renderDashboard();
    renderEventsPage();
    renderTraining();
    renderWorker();
    renderAdmin();
  });

  window.MWApp = { showToast, filterJobs, formatDate };
})();
