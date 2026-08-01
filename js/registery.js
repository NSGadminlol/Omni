//HELLO I AM SKIDDED I AM A SKIDDED LITTLE BOY I AM THE REGISTERY FOR ALL YOU NAUGHTY BOYS LIKE SHUSH DUCKLESS AND XHUNTER
let offenders = [];
let lightboxImg = null;

function getRegistryBasePath() {
    const script = document.querySelector('script[src*="registery.js"]');
    if (script) {
        const scriptUrl = new URL(script.getAttribute('src'), window.location.href);
        const marker = '/js/registery.js';
        const idx = scriptUrl.pathname.lastIndexOf(marker);
        if (idx !== -1) {
            return scriptUrl.pathname.slice(0, idx + 1);
        }
    }
    return getWikiBasePath?.() ?? '/';
}

async function loadRegistry() {
    const container = document.getElementById('registry');
    if (!container) return;

    const basePath = getRegistryBasePath();

    try {
        const idsResponse = await fetch(basePath + 'data/registry/index.json');
        if (!idsResponse.ok) throw new Error('Could not load registry index: ' + idsResponse.status);

        const ids = await idsResponse.json();
        if (!Array.isArray(ids)) throw new Error('Registry index is not an array');

        const entries = await Promise.all(
            ids.map(async id => {
                const response = await fetch(`${basePath}data/registry/${encodeURIComponent(id)}.json`);
                if (!response.ok) throw new Error(`Could not load registry entry: ${id}`);
                return response.json();
            })
        );

        offenders = entries;
        render(offenders);
        initLightbox();
    } catch (err) {
        console.error('[registry] load failed:', err);
        container.innerHTML = '<p>Could not load registry data. Please try again later.</p>';
    }
}

function buildEvidenceHTML(evidence) {
    if (!evidence.length) {
        return '<li class="reg-evidence-empty">No public evidence listed.</li>';
    }
    return evidence.map(ev => {
        if (ev.url) {
            // Link evidence
            return `
                <li class="reg-evidence-item reg-evidence-link">
                    <a href="${ev.url}" target="_blank" rel="noopener noreferrer">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                        ${ev.title ?? ev.url}
                    </a>
                </li>`;
        } else if (ev.text) {
            // Text-only evidence
            return `
                <li class="reg-evidence-item reg-evidence-text">
                    <span class="reg-evidence-text-label">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                        ${ev.title ? `<strong>${ev.title}:</strong>` : ''}
                    </span>
                    <span class="reg-evidence-text-body">${ev.text}</span>
                </li>`;
        }
        return '';
    }).join('');
}

function buildGalleryHTML(images, id) {
    if (!images || !images.length) return '';

    const thumbs = images.map((src, i) =>
        `<button class="reg-gallery-thumb" data-src="${src}" data-gallery="${id}" data-index="${i}" aria-label="View image ${i + 1}">
            <img src="${src}" alt="Evidence image ${i + 1}" loading="lazy" onerror="this.closest('.reg-gallery-thumb').style.display='none'">
        </button>`
    ).join('');

    return `
        <div class="reg-gallery-section">
            <button class="reg-gallery-toggle" data-gallery="${id}" aria-expanded="false">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                Images (${images.length})
                <svg class="reg-gallery-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div class="reg-gallery-grid" id="gallery-${id}" hidden>
                ${thumbs}
            </div>
        </div>`;
}

let cardCounter = 0;

function render(list) {
    const container = document.getElementById('registry');
    if (!container) return;
    cardCounter = 0;

    container.innerHTML = list.map(person => {
        const evidence = Array.isArray(person.evidence) ? person.evidence : [];
        const alts = Array.isArray(person.alts) ? person.alts : [];
        const offenses = Array.isArray(person.offenses) ? person.offenses : [];
        const images = Array.isArray(person.images) ? person.images : [];
        const id = `reg-card-${cardCounter++}`;

        const altsHTML = alts.length
            ? alts.map(alt => `<span class="wiki-cat">${alt}</span>`).join(' ')
            : '<span class="reg-none">None listed</span>';

        const offensesHTML = offenses.length
            ? offenses.map(o => `<span class="wiki-cat reg-offense">${o}</span>`).join(' ')
            : '<span class="reg-none">None listed</span>';

        return `
            <div class="card reg-card" id="${id}">
                <div class="reg-card-header">
                    <h2 class="reg-username">${person.username ?? 'Unknown'}</h2>
                    <span class="reg-userid">${person.userid ?? 'N/A'}</span>
                </div>
                <div class="reg-offenses-row">${offensesHTML}</div>
                <div class="reg-meta-row">
                    <span class="reg-meta-label">Known alts:</span> ${altsHTML}
                </div>
                ${person.description ? `<p class="reg-description">${person.description}</p>` : ''}
                <div class="reg-evidence-section">
                    <h4 class="reg-section-head">Evidence</h4>
                    <ul class="reg-evidence-list">${buildEvidenceHTML(evidence)}</ul>
                </div>
                ${buildGalleryHTML(images, id)}
            </div>
        `;
    }).join('');

    // Bind gallery toggles
    container.querySelectorAll('.reg-gallery-toggle').forEach(btn => {
        btn.addEventListener('click', () => {
            const galleryId = btn.dataset.gallery;
            const grid = document.getElementById(`gallery-${galleryId}`);
            const expanded = btn.getAttribute('aria-expanded') === 'true';
            btn.setAttribute('aria-expanded', String(!expanded));
            grid.hidden = expanded;
        });
    });

    // Bind lightbox
    container.querySelectorAll('.reg-gallery-thumb').forEach(btn => {
        btn.addEventListener('click', () => {
            openLightbox(btn.dataset.src);
        });
    });
}

function initLightbox() {
    if (document.getElementById('reg-lightbox')) return;

    const lb = document.createElement('div');
    lb.id = 'reg-lightbox';
    lb.className = 'reg-lightbox';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Image viewer');
    lb.innerHTML = `
        <div class="reg-lightbox-backdrop"></div>
        <div class="reg-lightbox-content">
            <img class="reg-lightbox-img" src="" alt="Evidence image">
            <button class="reg-lightbox-close" aria-label="Close image viewer">✕</button>
        </div>`;

    document.body.appendChild(lb);
    lightboxImg = lb.querySelector('.reg-lightbox-img');

    lb.querySelector('.reg-lightbox-backdrop').addEventListener('click', closeLightbox);
    lb.querySelector('.reg-lightbox-close').addEventListener('click', closeLightbox);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
}

function openLightbox(src) {
    const lb = document.getElementById('reg-lightbox');
    if (!lb) return;
    lightboxImg.src = src;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lb = document.getElementById('reg-lightbox');
    if (!lb) return;
    lb.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(() => { lightboxImg.src = ''; }, 200);
}

function initRegistrySearch() {
    const searchInput = document.getElementById('registrySearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', e => {
        const search = e.target.value.toLowerCase();

        render(
            offenders.filter(person => {
                const username = String(person.username ?? '').toLowerCase();
                const userid = String(person.userid ?? '');
                const offenses = Array.isArray(person.offenses) ? person.offenses : [];
                const description = String(person.description ?? '').toLowerCase();

                return username.includes(search)
                    || userid.includes(search)
                    || description.includes(search)
                    || offenses.some(offense => String(offense).toLowerCase().includes(search));
            })
        );
    });
}

document.addEventListener('DOMContentLoaded', () => {
    initRegistrySearch();
    loadRegistry();
});
