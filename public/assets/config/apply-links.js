(function applyPromoLinks() {
    const links = window.PA_LINKS || {};
    const map = {
        interestFormUrl: links.interestFormUrl,
        donateUrl: links.donateUrl
    };

    document.querySelectorAll('[data-pa-link]').forEach((el) => {
        const key = el.getAttribute('data-pa-link');
        const href = map[key];
        if (href && !href.includes('REPLACE_WITH_YOUR')) {
            el.href = href;
            el.target = '_blank';
            el.rel = 'noopener noreferrer';
        } else {
            el.href = '#';
            el.title = 'Set this URL in public/assets/config/links.js';
            el.addEventListener('click', (event) => event.preventDefault());
        }
    });
}());
