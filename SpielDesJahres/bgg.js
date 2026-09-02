/* ============================================================
   Spiel des Jahres – Preisträger-Datenbank
   BGG-Anbindung, Cache, Tabellen-Rendering, Sortierung/Filter, Excel-Export
   ============================================================ */

const BGG = (() => {
  const CACHE_KEY = 'sdj_bgg_cache_v1';
  const OVERRIDE_KEY = 'sdj_bgg_override_v1';
  const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 Tage

  function loadCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveCache(c) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch (e) {}
  }
  function loadOverrides() {
    try { return JSON.parse(localStorage.getItem(OVERRIDE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveOverrides(o) {
    try { localStorage.setItem(OVERRIDE_KEY, JSON.stringify(o)); } catch (e) {}
  }

  const cache = loadCache();
  const overrides = loadOverrides();

  function parseXML(text) {
    return new DOMParser().parseFromString(text, 'text/xml');
  }

  async function fetchText(url) {
    const res = await fetch(url, { headers: { Accept: 'application/xml' } });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.text();
  }

  // Sucht ein Spiel per Titel und wählt den besten Treffer anhand von
  // Namensähnlichkeit + Nähe des Erscheinungsjahres zum Auszeichnungsjahr.
  async function searchGameId(query, hintYear) {
    const url = `https://boardgamegeek.com/xmlapi2/search?type=boardgame&query=${encodeURIComponent(query)}`;
    const xml = parseXML(await fetchText(url));
    const items = Array.from(xml.getElementsByTagName('item'));
    if (!items.length) return null;

    const norm = s => (s || '').toLowerCase().replace(/[^a-z0-9äöüß]+/g, '');
    const qNorm = norm(query);

    let best = null, bestScore = -Infinity;
    for (const item of items) {
      const id = item.getAttribute('id');
      const nameEl = item.getElementsByTagName('name')[0];
      const name = nameEl ? nameEl.getAttribute('value') : '';
      const yearEl = item.getElementsByTagName('yearpublished')[0];
      const year = yearEl ? parseInt(yearEl.getAttribute('value'), 10) : null;

      let score = 0;
      const nNorm = norm(name);
      if (nNorm === qNorm) score += 50;
      else if (nNorm.startsWith(qNorm) || qNorm.startsWith(nNorm)) score += 25;
      else if (nNorm.includes(qNorm) || qNorm.includes(nNorm)) score += 10;
      else score -= 20;

      if (hintYear && year) {
        const diff = Math.abs(year - hintYear);
        score += Math.max(0, 15 - diff * 3);
      }
      // primary name in Suchergebnis leicht bevorzugen
      if (item.getElementsByTagName('name')[0] &&
          item.getElementsByTagName('name')[0].getAttribute('type') === 'primary') score += 2;

      if (score > bestScore) { bestScore = score; best = { id, name, year }; }
    }
    return best;
  }

  // Holt Detaildaten (batchweise, mehrere IDs kommagetrennt) via /thing
  async function fetchThings(ids) {
    if (!ids.length) return {};
    const url = `https://boardgamegeek.com/xmlapi2/thing?stats=1&id=${ids.join(',')}`;
    const xml = parseXML(await fetchText(url));
    const items = Array.from(xml.getElementsByTagName('item'));
    const out = {};
    for (const item of items) {
      const id = item.getAttribute('id');
      const g = (tag) => {
        const el = item.getElementsByTagName(tag)[0];
        return el ? el.getAttribute('value') : null;
      };
      const stats = item.getElementsByTagName('statistics')[0];
      let rating = null, weight = null, rank = null;
      if (stats) {
        const ratings = stats.getElementsByTagName('ratings')[0];
        if (ratings) {
          const avg = ratings.getElementsByTagName('average')[0];
          const aw = ratings.getElementsByTagName('averageweight')[0];
          rating = avg ? parseFloat(avg.getAttribute('value')) : null;
          weight = aw ? parseFloat(aw.getAttribute('value')) : null;
        }
      }
      out[id] = {
        bggId: id,
        bggName: g('name'),
        minPlayers: g('minplayers'),
        maxPlayers: g('maxplayers'),
        minPlaytime: g('minplaytime'),
        maxPlaytime: g('maxplaytime'),
        minAge: g('minage'),
        rating: rating,
        weight: weight,
        image: g('thumbnail')
      };
    }
    return out;
  }

  function cacheKeyFor(game) {
    return overrides[game.id] ? `ov:${overrides[game.id]}` : `t:${game.bggQuery || game.title}|${game.year}`;
  }

  // Lädt BGG-Daten für alle Spiele: erst Cache/Override prüfen, dann fehlende
  // Titel suchen (begrenzte Nebenläufigkeit) und Details batchweise nachladen.
  async function enrich(games, onProgress) {
    const now = Date.now();
    const needSearch = [];
    const idsToFetch = new Set();
    const resolvedIdByGame = {};

    for (const g of games) {
      const ck = cacheKeyFor(g);
      const cached = cache[ck];
      if (cached && cached.id && (now - cached.t) < CACHE_TTL_MS) {
        resolvedIdByGame[g.id] = cached.id;
        if (!cached.data) idsToFetch.add(cached.id);
      } else {
        needSearch.push(g);
      }
    }

    let done = 0;
    const total = needSearch.length || 1;
    const pool = 4;
    let idx = 0;
    async function worker() {
      while (idx < needSearch.length) {
        const g = needSearch[idx++];
        try {
          const found = await searchGameId(g.bggQuery || g.title, g.year);
          const ck = cacheKeyFor(g);
          if (found && found.id) {
            resolvedIdByGame[g.id] = found.id;
            idsToFetch.add(found.id);
            cache[ck] = { id: found.id, t: now, data: null };
          } else {
            cache[ck] = { id: null, t: now, data: {} };
          }
        } catch (e) {
          /* Netzwerkfehler: einfach überspringen, gilt dann als "unbekannt" */
        }
        done++;
        if (onProgress) onProgress(done, total, 'search');
      }
    }
    // manuelle Overrides sofort auflösen
    for (const g of games) {
      if (overrides[g.id]) {
        resolvedIdByGame[g.id] = overrides[g.id];
        idsToFetch.add(overrides[g.id]);
      }
    }
    await Promise.all(Array.from({ length: pool }, worker));

    // Details für alle noch unbekannten IDs in Batches von 20 laden
    const idsArr = Array.from(idsToFetch);
    const batchSize = 20;
    let fetched = 0;
    for (let i = 0; i < idsArr.length; i += batchSize) {
      const batch = idsArr.slice(i, i + batchSize);
      try {
        const data = await fetchThings(batch);
        for (const id of batch) {
          if (data[id]) {
            for (const g of games) {
              const ck = cacheKeyFor(g);
              if (resolvedIdByGame[g.id] === id) {
                cache[ck] = { id, t: now, data: data[id] };
              }
            }
          }
        }
      } catch (e) { /* Batch übersprungen bei Fehler */ }
      fetched += batch.length;
      if (onProgress) onProgress(total, total, 'details', fetched, idsArr.length);
    }
    saveCache(cache);

    // Ergebnisse den Spielen zuordnen
    return games.map(g => {
      const ck = cacheKeyFor(g);
      const entry = cache[ck];
      return Object.assign({}, g, {
        bgg: entry && entry.data ? entry.data : null,
        bggResolvedId: entry ? entry.id : null
      });
    });
  }

  function setOverride(gameId, bggId) {
    overrides[gameId] = String(bggId).trim();
    saveOverrides(overrides);
  }
  function clearCacheForGame(game) {
    delete cache[cacheKeyFor(game)];
    saveCache(cache);
  }

  return { enrich, setOverride, clearCacheForGame };
})();

/* ============================================================
   Tabellen-Controller: Rendering, Sortierung, Filter, Suche, Export
   ============================================================ */
function createSdjTable(opts) {
  const {
    container, games, categories, columns,
    excelFilename, printTitle
  } = opts;

  let enriched = games.slice();
  let sortKey = 'year';
  let sortDir = 'desc';
  let query = '';
  let activeCats = new Set(categories.map(c => c.key));

  function difficultyLabel(w) {
    if (w == null) return '';
    if (w < 1.5) return 'sehr leicht';
    if (w < 2.2) return 'leicht';
    if (w < 3.0) return 'mittel';
    if (w < 3.8) return 'anspruchsvoll';
    return 'komplex';
  }

  function fmtRange(a, b, unit) {
    if (!a && !b) return '<span class="cl-num na">–</span>';
    if (a === b || !b) return `<span class="cl-num">${a}${unit}</span>`;
    return `<span class="cl-num">${a}–${b}${unit}</span>`;
  }

  function rowMatches(g) {
    if (!activeCats.has(g.catKey)) return false;
    if (!query) return true;
    const hay = `${g.title} ${g.designer || ''} ${g.publisher || ''} ${g.year}`.toLowerCase();
    return hay.includes(query);
  }

  function sortedRows() {
    const rows = enriched.filter(rowMatches);
    rows.sort((a, b) => {
      let av, bv;
      switch (sortKey) {
        case 'title': av = a.title.toLowerCase(); bv = b.title.toLowerCase(); break;
        case 'year': av = a.year; bv = b.year; break;
        case 'category': av = a.catLabel; bv = b.catLabel; break;
        case 'rating': av = a.bgg && a.bgg.rating != null ? a.bgg.rating : -1; bv = b.bgg && b.bgg.rating != null ? b.bgg.rating : -1; break;
        case 'weight': av = a.bgg && a.bgg.weight != null ? a.bgg.weight : -1; bv = b.bgg && b.bgg.weight != null ? b.bgg.weight : -1; break;
        case 'duration': av = a.bgg && a.bgg.maxPlaytime ? parseInt(a.bgg.maxPlaytime) : -1; bv = b.bgg && b.bgg.maxPlaytime ? parseInt(b.bgg.maxPlaytime) : -1; break;
        case 'players': av = a.bgg && a.bgg.maxPlayers ? parseInt(a.bgg.maxPlayers) : -1; bv = b.bgg && b.bgg.maxPlayers ? parseInt(b.bgg.maxPlayers) : -1; break;
        case 'age': av = a.bgg && a.bgg.minAge ? parseInt(a.bgg.minAge) : -1; bv = b.bgg && b.bgg.minAge ? parseInt(b.bgg.minAge) : -1; break;
        default: av = a.year; bv = b.year;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return a.year - b.year;
    });
    return rows;
  }

  function badgeHtml(g) {
    return `<span class="cl-badge ${g.catBadgeClass}"><span class="dot"></span>${g.catLabel}</span>`;
  }

  function render() {
    const rows = sortedRows();
    const thead = columns.map(c => {
      const active = sortKey === c.key;
      const arrow = active ? (sortDir === 'asc' ? '▲' : '▼') : '↕';
      const ariaSort = active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none';
      return `<th data-key="${c.key}" aria-sort="${ariaSort}">${c.label}<span class="arrow">${arrow}</span></th>`;
    }).join('');

    let body;
    if (!rows.length) {
      body = `<tr><td colspan="${columns.length}"><div class="cl-empty">Keine Treffer für die aktuelle Suche/Filterauswahl.</div></td></tr>`;
    } else {
      body = rows.map(g => {
        const bgg = g.bgg || {};
        const rating = bgg.rating != null ? bgg.rating.toFixed(1) : null;
        const weight = bgg.weight != null ? bgg.weight.toFixed(2) : null;
        const weightPct = weight != null ? Math.min(100, (bgg.weight / 5) * 100) : 0;
        return `<tr data-id="${g.id}">
          <td class="cl-title-cell">${g.title}${g.designer ? `<span class="designer">${g.designer}${g.publisher ? ' · ' + g.publisher : ''}</span>` : ''}</td>
          <td class="cl-num">${g.year}</td>
          <td>${badgeHtml(g)}</td>
          <td>${rating ? `<span class="cl-rating">${rating}</span>` : '<span class="cl-rating na">–</span>'}</td>
          <td>${weight != null
              ? `<span class="cl-weight-bar"><span class="cl-weight-track"><span class="cl-weight-fill" style="width:${weightPct}%"></span></span><span class="cl-num">${weight}</span></span><div style="font-size:.72rem;color:var(--cl-ink-soft);">${difficultyLabel(bgg.weight)}</div>`
              : '<span class="cl-num na">–</span>'}</td>
          <td>${fmtRange(bgg.minPlaytime, bgg.maxPlaytime, ' Min')}</td>
          <td>${fmtRange(bgg.minPlayers, bgg.maxPlayers, '')}</td>
          <td>${bgg.minAge ? `<span class="cl-num">ab ${bgg.minAge}</span>` : '<span class="cl-num na">–</span>'}</td>
          <td><button class="cl-fix" title="BGG-Zuordnung korrigieren" data-fix="${g.id}">⚙︎</button></td>
        </tr>`;
      }).join('');
    }

    container.innerHTML = `
      <div class="cl-print-title">${printTitle}</div>
      <table class="cl-table">
        <thead><tr>${thead}<th></th></tr></thead>
        <tbody>${body}</tbody>
      </table>`;

    container.querySelectorAll('th[data-key]').forEach(th => {
      th.addEventListener('click', () => {
        const key = th.dataset.key;
        if (sortKey === key) sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        else { sortKey = key; sortDir = key === 'title' || key === 'category' ? 'asc' : 'desc'; }
        render();
      });
    });
    container.querySelectorAll('[data-fix]').forEach(btn => {
      btn.addEventListener('click', () => opts.onFixRequest && opts.onFixRequest(btn.dataset.fix));
    });
  }

  function setQuery(q) { query = q.trim().toLowerCase(); render(); }
  function toggleCategory(key, on) {
    if (on) activeCats.add(key); else activeCats.delete(key);
    render();
  }
  function setGames(newGames) { enriched = newGames.slice(); render(); }

  function exportExcel() {
    const rows = sortedRows().map(g => {
      const bgg = g.bgg || {};
      return {
        'Titel': g.title,
        'Jahr': g.year,
        'Kategorie': g.catLabel,
        'Autor': g.designer || '',
        'Verlag': g.publisher || '',
        'BGG-Bewertung': bgg.rating != null ? Number(bgg.rating.toFixed(2)) : '',
        'BGG-Schwierigkeit (1-5)': bgg.weight != null ? Number(bgg.weight.toFixed(2)) : '',
        'Dauer min (Min.)': bgg.minPlaytime || '',
        'Dauer max (Min.)': bgg.maxPlaytime || '',
        'Spieler min': bgg.minPlayers || '',
        'Spieler max': bgg.maxPlayers || '',
        'Empfohlenes Alter': bgg.minAge ? `ab ${bgg.minAge}` : '',
        'BGG-ID': g.bggResolvedId || ''
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [{ wch: 32 }, { wch: 6 }, { wch: 22 }, { wch: 24 }, { wch: 20 }, { wch: 14 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 9 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Preisträger');
    XLSX.writeFile(wb, excelFilename);
  }

  render();
  return { render, setQuery, toggleCategory, setGames, exportExcel };
}
