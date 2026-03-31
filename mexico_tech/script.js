const API_TOKEN = 'ojimcgH7qbrc8QMjRI9PXz1ZuElACNr2Woa1KcVN';
const BASE_URL = 'https://api.thenewsapi.com/v1/news';

const state = {
    category: 'tech',
    search: '',
    page: 1,
    perPage: 6,
    language: 'es',
    dateAfter: ''
};

const dom = {
    grid: document.getElementById('news-grid'),
    loader: document.getElementById('loader'),
    pagination: document.getElementById('pagination'),
    pageNum: document.getElementById('page-num'),
    prev: document.getElementById('prev'),
    next: document.getElementById('next'),
    queryInput: document.getElementById('query'),
    searchBtn: document.getElementById('search-btn'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    title: document.getElementById('view-title')
};

async function fetchNews() {
    dom.grid.innerHTML = '';
    dom.loader.classList.remove('hidden');
    dom.pagination.style.display = 'none';

    const params = new URLSearchParams({
        api_token: API_TOKEN,
        language: state.language,
        page: state.page,
        limit: state.perPage
    });

    if (state.dateAfter) {
        params.append('published_after', state.dateAfter);
    }

    if (state.search) {
        params.append('search', `${state.search} Mexico tech`);
    } else {
        // Default curated search for Mexico Tech
        params.append('search', 'tecnología méxico startup innovación');
    }

    try {
        const res = await fetch(`${BASE_URL}/all?${params.toString()}`);
        const data = await res.json();
        
        if (data.data && data.data.length > 0) {
            renderArticles(data.data);
            updateUI(data.meta);
        } else {
            dom.grid.innerHTML = '<div class="status-message">No se encontraron noticias con los filtros seleccionados.</div>';
        }
    } catch (err) {
        dom.grid.innerHTML = '<div class="status-message">Error al cargar noticias. Intenta de nuevo.</div>';
        console.error(err);
    } finally {
        dom.loader.classList.add('hidden');
    }
}

function renderArticles(articles) {
    dom.grid.innerHTML = articles.map(a => `
        <article class="article">
            <img src="${a.image_url || 'https://via.placeholder.com/600x400?text=Mexico+Tech'}" alt="${a.title}" class="article-img">
            <div class="article-content">
                <div class="article-meta">
                    <span>${a.source.toUpperCase()}</span>
                    <span>${new Date(a.published_at).toLocaleDateString()}</span>
                </div>
                <h3 class="article-title">${a.title}</h3>
                <a href="${a.url}" target="_blank" class="article-link">Ver más</a>
            </div>
        </article>
    `).join('');
}

function updateUI(meta) {
    dom.pagination.style.display = 'flex';
    dom.pageNum.textContent = state.page;
    dom.prev.disabled = state.page === 1;
    dom.next.disabled = !meta || meta.returned < state.perPage;
}

dom.searchBtn.onclick = () => {
    state.search = dom.queryInput.value.trim();
    state.page = 1;
    state.category = 'search';
    dom.title.textContent = state.search ? `Búsqueda: ${state.search}` : 'Lo más reciente';
    fetchNews();
};

dom.queryInput.onkeypress = (e) => { if (e.key === 'Enter') dom.searchBtn.click(); };

dom.filterBtns.forEach(btn => {
    btn.onclick = () => {
        dom.filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.search = btn.dataset.category !== 'general' ? btn.dataset.category : '';
        state.page = 1;
        dom.title.textContent = btn.textContent;
        fetchNews();
    };
});

dom.prev.onclick = () => { if (state.page > 1) { state.page--; fetchNews(); } };
dom.next.onclick = () => { state.page++; fetchNews(); };

document.getElementById('apply-filters').onclick = () => {
    state.language = document.getElementById('lang-select').value;
    state.dateAfter = document.getElementById('date-select').value;
    state.page = 1;
    fetchNews();
};

// Init
fetchNews();

// SW
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('Mexico Tech PWA Active'));
    });
}
