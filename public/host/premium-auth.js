/* global supabase */

(function premiumAuthBootstrap() {
    const ACCESS_TOKEN_KEY = 'pa_host_access_token';
    const EMAIL_KEY = 'pa_host_email';

    const state = {
        client: null,
        user: null,
        entitlements: null,
        accessToken: localStorage.getItem(ACCESS_TOKEN_KEY) || '',
        publicConfig: null
    };

    const dom = {
        email: document.getElementById('auth-email'),
        password: document.getElementById('auth-password'),
        signupBtn: document.getElementById('auth-signup-btn'),
        loginBtn: document.getElementById('auth-login-btn'),
        logoutBtn: document.getElementById('auth-logout-btn'),
        upgradeMonthlyBtn: document.getElementById('upgrade-monthly-btn'),
        upgradeYearlyBtn: document.getElementById('upgrade-yearly-btn'),
        manageBillingBtn: document.getElementById('manage-billing-btn'),
        promoCode: document.getElementById('promo-code-input'),
        status: document.getElementById('account-status')
    };

    function setStatus(text, isError = false) {
        if (!dom.status) return;
        dom.status.textContent = text;
        dom.status.style.color = isError ? '#ff7777' : '#FFD700';
    }

    function updateUI() {
        const signedIn = !!state.accessToken && !!state.user;
        const isPremium = signedIn && !!state.entitlements?.isPremium;

        function show(el) { if (el) el.style.display = ''; }
        function hide(el) { if (el) el.style.display = 'none'; }

        if (!signedIn) {
            // Signed out: show email/password/sign-up/sign-in
            show(dom.email);
            show(dom.password);
            show(dom.signupBtn);
            show(dom.loginBtn);
            hide(dom.promoCode);
            hide(dom.upgradeMonthlyBtn);
            hide(dom.upgradeYearlyBtn);
            hide(dom.manageBillingBtn);
            hide(dom.logoutBtn);
        } else if (!isPremium) {
            // Signed in, free tier: show promo + upgrade options + sign-out
            hide(dom.email);
            hide(dom.password);
            hide(dom.signupBtn);
            hide(dom.loginBtn);
            show(dom.promoCode);
            show(dom.upgradeMonthlyBtn);
            show(dom.upgradeYearlyBtn);
            hide(dom.manageBillingBtn);
            show(dom.logoutBtn);
        } else {
            // Signed in, premium: show manage billing + sign-out
            hide(dom.email);
            hide(dom.password);
            hide(dom.signupBtn);
            hide(dom.loginBtn);
            hide(dom.promoCode);
            hide(dom.upgradeMonthlyBtn);
            hide(dom.upgradeYearlyBtn);
            show(dom.manageBillingBtn);
            show(dom.logoutBtn);
        }
    }

    function saveToken(token) {
        state.accessToken = token || '';
        if (state.accessToken) {
            localStorage.setItem(ACCESS_TOKEN_KEY, state.accessToken);
        } else {
            localStorage.removeItem(ACCESS_TOKEN_KEY);
        }
        window.dispatchEvent(new CustomEvent('pa-auth-updated', {
            detail: {
                accessToken: state.accessToken,
                user: state.user,
                entitlements: state.entitlements
            }
        }));
    }

    function getAuthHeaders() {
        if (!state.accessToken) return {};
        return { Authorization: `Bearer ${state.accessToken}` };
    }

    async function fetchMe() {
        if (!state.accessToken) {
            state.user = null;
            state.entitlements = null;
            setStatus('Sign in to unlock premium host features.');
            updateUI();
            return;
        }

        const res = await fetch('/api/me', { headers: getAuthHeaders() });
        const data = await res.json();
        if (!res.ok || !data.success) {
            saveToken('');
            state.user = null;
            state.entitlements = null;
            setStatus('Session expired. Please sign in again.', true);
            updateUI();
            return;
        }

        state.user = data.profile;
        state.entitlements = data.entitlements;
        if (state.user?.email) {
            localStorage.setItem(EMAIL_KEY, state.user.email);
        }

        if (state.entitlements?.isPremium) {
            setStatus(`Signed in as ${state.user.email}. Premium active.`);
        } else {
            setStatus(`Signed in as ${state.user.email}. Free tier active.`);
        }

        updateUI();

        window.dispatchEvent(new CustomEvent('pa-auth-updated', {
            detail: {
                accessToken: state.accessToken,
                user: state.user,
                entitlements: state.entitlements
            }
        }));
    }

    async function initConfigAndClient() {
        const res = await fetch('/api/public-config');
        const cfg = await res.json();
        state.publicConfig = cfg;

        const url = cfg?.auth?.supabaseUrl;
        const anonKey = cfg?.auth?.supabaseAnonKey;
        if (!url || !anonKey || !window.supabase?.createClient) {
            setStatus('Auth is not configured on this deployment.', true);
            return;
        }
        state.client = window.supabase.createClient(url, anonKey);
    }

    async function signUp() {
        if (!state.client) return;
        const email = dom.email?.value.trim();
        const password = dom.password?.value;
        if (!email || !password) {
            setStatus('Email and password are required.', true);
            return;
        }

        const { error } = await state.client.auth.signUp({ email, password });
        if (error) {
            setStatus(error.message, true);
            return;
        }
        setStatus('Account created. Check your email if confirmation is enabled.');
        updateUI();
    }

    async function signIn() {
        if (!state.client) return;
        const email = dom.email?.value.trim();
        const password = dom.password?.value;
        if (!email || !password) {
            setStatus('Email and password are required.', true);
            return;
        }

        const { data, error } = await state.client.auth.signInWithPassword({ email, password });
        if (error) {
            setStatus(error.message, true);
            return;
        }

        saveToken(data?.session?.access_token || '');
        await fetchMe();
    }

    async function signOut() {
        if (state.client) {
            await state.client.auth.signOut();
        }
        state.user = null;
        state.entitlements = null;
        saveToken('');
        setStatus('Signed out.');
        updateUI();
    }

    async function startCheckout(priceCode) {
        if (!state.accessToken) {
            setStatus('Sign in first to upgrade.', true);
            return;
        }

        const promoCode = dom.promoCode?.value.trim() || '';
        const res = await fetch('/api/billing/checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ priceCode, promoCode })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
            setStatus(data.error || 'Failed to start checkout.', true);
            return;
        }

        if (data.redirectUrl) {
            window.location.href = data.redirectUrl;
            return;
        }

        if (data.url) {
            window.location.href = data.url;
        }
    }

    async function openBillingPortal() {
        if (!state.accessToken) {
            setStatus('Sign in first to manage billing.', true);
            return;
        }

        const res = await fetch('/api/billing/portal-session', {
            method: 'POST',
            headers: getAuthHeaders()
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
            setStatus(data.error || 'Failed to open billing portal.', true);
            return;
        }

        if (data.url) {
            window.location.href = data.url;
        }
    }

    function bindEvents() {
        dom.signupBtn?.addEventListener('click', signUp);
        dom.loginBtn?.addEventListener('click', signIn);
        dom.logoutBtn?.addEventListener('click', signOut);
        dom.upgradeMonthlyBtn?.addEventListener('click', () => startCheckout('premium_monthly'));
        dom.upgradeYearlyBtn?.addEventListener('click', () => startCheckout('premium_yearly'));
        dom.manageBillingBtn?.addEventListener('click', openBillingPortal);
    }

    async function bootstrap() {
        const params = new URLSearchParams(window.location.search);
        const billingParam = params.get('billing');
        if (billingParam === 'success') {
            setStatus('Payment successful! Premium is now active.');
        } else if (billingParam === 'founders_applied') {
            setStatus('Founders pass applied! Premium is now active.');
        } else if (billingParam === 'cancel') {
            setStatus('Checkout cancelled.');
        }

        const rememberedEmail = localStorage.getItem(EMAIL_KEY) || '';
        if (dom.email && rememberedEmail) dom.email.value = rememberedEmail;

        try {
            await initConfigAndClient();
        } catch (err) {
            setStatus(`Failed to initialize auth: ${err.message}`, true);
            return;
        }

        bindEvents();

        if (state.client) {
            const { data } = await state.client.auth.getSession();
            const token = data?.session?.access_token || state.accessToken;
            saveToken(token || '');
            await fetchMe();

            // Override status with billing redirect message after state is loaded
            if (billingParam === 'success') {
                setStatus('Payment successful! Premium is now active.');
            } else if (billingParam === 'founders_applied') {
                setStatus('Founders pass applied! Premium is now active.');
            } else if (billingParam === 'cancel') {
                setStatus('Checkout cancelled.');
            }

            state.client.auth.onAuthStateChange(async (_event, session) => {
                saveToken(session?.access_token || '');
                await fetchMe();
            });
        }
    }

    bootstrap();
})();
