// Zamora Tech - Equatorial Guinea News App
const API_TOKEN = '0k6Vgz5rTnthXRyNMURI1JGPuBdC4h9t5Zw4itJp';
const BASE_URL = 'https://api.thenewsapi.com/v1/news';

const state = {
    view: 'tech',
    searchQuery: '',
    page: 1,
    limit: 6,
    language: 'es',
    dateAfter: ''
};

const els = {
    navItems: document.querySelectorAll('.nav-item'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    results: document.getElementById('results-container'),
    viewTitle: document.getElementById('current-view-title'),
    pagination: document.getElementById('pagination-controls'),
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    pageInfo: document.getElementById('page-info'),
    modal: document.getElementById('modal'),
    modalBody: document.getElementById('modal-body'),
    closeModal: document.getElementById('close-modal'),
    loading: document.getElementById('loading-indicator')
};

async function fetchAPI(endpoint, params = {}) {
    params.api_token = API_TOKEN;
    const url = new URL(`${BASE_URL}${endpoint}`);
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== '') {
            url.searchParams.append(key, params[key]);
        }
    });

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error?.message || 'Error al conectar con el servidor de noticias');
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

async function loadData() {
    els.results.innerHTML = '';
    els.loading.classList.remove('hidden');
    els.pagination.style.display = 'none';

    try {
        let response;
        let params = { 
            language: state.language, 
            categories: 'tech', 
            page: state.page, 
            limit: state.limit 
        };

        if (state.dateAfter) {
            params.published_after = state.dateAfter;
        }

        if (state.searchQuery) {
            response = await fetchAPI('/all', { ...params, search: state.searchQuery });
        } else {
            switch (state.view) {
                case 'tech':
                    // Prioridad a Guinea Ecuatorial, pero si no hay, buscamos tecnología en África/General
                    response = await fetchAPI('/all', { ...params, search: 'tecnologia guinea ecuatorial OR tecnologia africa' });
                    break;
                case 'ai':
                    response = await fetchAPI('/all', { ...params, search: 'inteligencia artificial' });
                    break;
                case 'gadgets':
                    response = await fetchAPI('/all', { ...params, search: 'smartphones gadgets hardware' });
                    break;
                case 'cyber':
                    response = await fetchAPI('/all', { ...params, search: 'ciberseguridad hacking seguridad' });
                    break;
                case 'crypto':
                    response = await fetchAPI('/all', { ...params, search: 'bitcoin ethereum blockchain crypto' });
                    break;
            }
        }

        renderGrid(response.data);
        if (response.meta) updatePagination(response.meta);
        if (!response.data || response.data.length === 0) {
            throw new Error('No se encontraron noticias con los filtros seleccionados.');
        }
    } catch (error) {
        els.results.innerHTML = `<div class="status-message">⚠️ ${error.message}</div>`;
    } finally {
        els.loading.classList.add('hidden');
    }
}

function renderGrid(articles) {
    if (!articles || articles.length === 0) {
        els.results.innerHTML = '<div class="status-message">No se encontraron noticias recientes. Intenta otra categoría.</div>';
        return;
    }

    els.results.innerHTML = articles.map(item => `
        <article class="card">
            <div class="card-img-container">
                <img src="${item.image_url || 'https://via.placeholder.com/600x400?text=Zamora+Tech'}" alt="Tech" class="card-img">
            </div>
            <div class="card-body">
                <div class="card-meta">
                    <span>${new Date(item.published_at).toLocaleDateString()}</span>
                    <span>${item.source.toUpperCase()}</span>
                </div>
                <h3 class="card-title">${item.title}</h3>
                <p class="card-desc">${item.snippet || 'Explora los detalles de esta innovación tecnológica.'}</p>
                <div class="card-actions">
                    <a href="${item.url}" target="_blank" class="card-link">Leer Noticia</a>
                </div>
            </div>
        </article>
    `).join('');
}

function updatePagination(meta) {
    els.pagination.style.display = 'flex';
    els.pageInfo.textContent = `Pagina ${meta.page}`;
    els.prevBtn.disabled = meta.page <= 1;
    els.nextBtn.disabled = meta.returned < state.limit;
}

function bindEvents() {
    els.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            els.navItems.forEach(nav => nav.classList.remove('active'));
            e.currentTarget.classList.add('active');
            state.view = e.currentTarget.dataset.view;
            state.page = 1;
            state.searchQuery = '';
            els.searchInput.value = '';
            els.viewTitle.textContent = e.currentTarget.textContent.trim();
            loadData();
        });
    });

    els.searchBtn.addEventListener('click', () => {
        const query = els.searchInput.value.trim();
        if (query) {
            state.searchQuery = query;
            state.page = 1;
            els.viewTitle.textContent = `Busqueda: ${query}`;
            els.navItems.forEach(nav => nav.classList.remove('active'));
            loadData();
        }
    });

    els.searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') els.searchBtn.click(); });
    els.prevBtn.addEventListener('click', () => { if (state.page > 1) { state.page--; loadData(); } });
    els.nextBtn.addEventListener('click', () => { state.page++; loadData(); });

    document.getElementById('apply-filters').addEventListener('click', () => {
        state.language = document.getElementById('lang-select').value;
        state.dateAfter = document.getElementById('date-select').value;
        state.page = 1;
        loadData();
    });
}

// Init
bindEvents();
loadData();

// Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('Zamora Tech PWA Ready'));
    });
}
