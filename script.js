document.addEventListener('DOMContentLoaded', function () {
    const menuBtn = document.getElementById('mobile-menu-btn') || document.querySelector('.mobile-menu-btn');
    const nav = document.getElementById('site-nav') || document.querySelector('.main-nav');
    const backdrop = document.getElementById('nav-backdrop');
    const body = document.body;
    const siteHeader = document.querySelector('.site-header');

    function syncMobileHeaderHeight() {
        if (!siteHeader) return;
        var mq = window.matchMedia('(max-width: 768px)');
        if (mq.matches) {
            requestAnimationFrame(function () {
                requestAnimationFrame(function () {
                    document.documentElement.style.setProperty(
                        '--mobile-header-h',
                        siteHeader.offsetHeight + 'px',
                    );
                });
            });
        } else {
            document.documentElement.style.setProperty('--mobile-header-h', '0px');
        }
    }

    syncMobileHeaderHeight();
    window.addEventListener('resize', syncMobileHeaderHeight, { passive: true });
    window.addEventListener('orientationchange', syncMobileHeaderHeight);

    var navTransitionEndHandler = null;
    var navVisibilityFallback = null;

    function syncNavVisibilityForViewport() {
        if (!nav) return;
        if (window.matchMedia('(max-width: 768px)').matches) {
            if (body.classList.contains('nav-open')) {
                nav.style.visibility = 'visible';
                nav.setAttribute('aria-hidden', 'false');
            } else {
                nav.style.visibility = 'hidden';
                nav.setAttribute('aria-hidden', 'true');
            }
        } else {
            body.classList.remove('nav-open');
            body.style.overflow = '';
            if (backdrop) {
                backdrop.hidden = true;
                backdrop.setAttribute('aria-hidden', 'true');
            }
            if (menuBtn) menuBtn.setAttribute('aria-expanded', 'false');
            nav.style.visibility = '';
            nav.setAttribute('aria-hidden', 'false');
        }
    }

    syncNavVisibilityForViewport();
    window.addEventListener('resize', syncNavVisibilityForViewport, { passive: true });

    function setNavOpen(open) {
        if (!menuBtn || !nav) return;
        if (!window.matchMedia('(max-width: 768px)').matches) return;
        if (navTransitionEndHandler) {
            nav.removeEventListener('transitionend', navTransitionEndHandler);
            navTransitionEndHandler = null;
        }
        if (open) {
            if (navVisibilityFallback) {
                window.clearTimeout(navVisibilityFallback);
                navVisibilityFallback = null;
            }
            nav.style.visibility = 'visible';
            nav.setAttribute('aria-hidden', 'false');
            syncMobileHeaderHeight();
            body.classList.add('nav-open');
        } else {
            if (navVisibilityFallback) {
                window.clearTimeout(navVisibilityFallback);
                navVisibilityFallback = null;
            }
            navVisibilityFallback = window.setTimeout(function () {
                navVisibilityFallback = null;
                if (!body.classList.contains('nav-open')) {
                    nav.style.visibility = 'hidden';
                    nav.setAttribute('aria-hidden', 'true');
                }
            }, 380);
            navTransitionEndHandler = function (e) {
                if (e.propertyName !== 'transform') return;
                if (navVisibilityFallback) {
                    window.clearTimeout(navVisibilityFallback);
                    navVisibilityFallback = null;
                }
                nav.removeEventListener('transitionend', navTransitionEndHandler);
                navTransitionEndHandler = null;
                if (!body.classList.contains('nav-open')) {
                    nav.style.visibility = 'hidden';
                    nav.setAttribute('aria-hidden', 'true');
                }
            };
            nav.addEventListener('transitionend', navTransitionEndHandler);
            body.classList.remove('nav-open');
        }
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (backdrop) {
            backdrop.hidden = !open;
            backdrop.setAttribute('aria-hidden', open ? 'false' : 'true');
        }
        body.style.overflow = open ? 'hidden' : '';
    }

    if (menuBtn && nav) {
        menuBtn.addEventListener('click', function () {
            setNavOpen(!body.classList.contains('nav-open'));
        });
    }

    if (backdrop) {
        backdrop.addEventListener('click', function () {
            setNavOpen(false);
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') setNavOpen(false);
    });

    nav &&
        nav.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                if (window.matchMedia('(max-width: 768px)').matches) {
                    setNavOpen(false);
                }
            });
        });

    const progressEl = document.getElementById('scroll-progress');
    if (progressEl) {
        function updateProgress() {
            const doc = document.documentElement;
            const scrollTop = doc.scrollTop || document.body.scrollTop;
            const height = doc.scrollHeight - doc.clientHeight;
            const pct = height > 0 ? Math.round((scrollTop / height) * 100) : 0;
            progressEl.style.width = pct + '%';
            progressEl.setAttribute('aria-valuenow', String(pct));
        }
        window.addEventListener('scroll', updateProgress, { passive: true });
        updateProgress();
    }

    try {
        var path = location.pathname + location.search;
        var key = 'alko_recent_v1';
        var arr = JSON.parse(localStorage.getItem(key) || '[]');
        if (!Array.isArray(arr)) arr = [];
        if (path && path.length > 0 && !/\.(ico|png|jpe?g|svg|webp|gif)$/i.test(path)) {
            arr = arr.filter(function (p) {
                return p !== path;
            });
            arr.unshift(path);
            arr = arr.slice(0, 6);
            localStorage.setItem(key, JSON.stringify(arr));
        }
    } catch (err) {
        /* ignore */
    }

    function labelForPath(p) {
        if (p === '/' || p === '') return 'Главная';
        if (p.indexOf('/catalog') !== -1) return 'Каталог';
        if (p.indexOf('/contacts') !== -1) return 'Контакты';
        if (p.indexOf('/faq') !== -1) return 'FAQ';
        if (p.indexOf('/rayony') !== -1) return 'Районы';
        if (p.indexOf('/metro/') !== -1) return 'Метро';
        if (p.indexOf('/kategoria/') !== -1) return 'Категории';
        if (p.indexOf('/povod/') !== -1) return 'Повод';
        if (p.indexOf('/vopros/') !== -1) return 'Вопросы';
        if (p.indexOf('/raion/') !== -1) return 'Район';
        var base = p.replace(/\/$/, '').split('/').pop() || p;
        if (base.indexOf('.html') !== -1) base = base.replace('.html', '');
        return base.length > 24 ? base.slice(0, 22) + '…' : base;
    }

    function renderRecentWidget() {
        var host = document.querySelector('[data-recent-widget]');
        if (!host) return;
        try {
            var list = JSON.parse(localStorage.getItem('alko_recent_v1') || '[]');
            if (!Array.isArray(list) || list.length < 2) return;
            var skip = location.pathname + location.search;
            var items = list.filter(function (p) {
                return p !== skip;
            }).slice(0, 4);
            if (!items.length) return;
            var ul = document.createElement('ul');
            items.forEach(function (p) {
                var li = document.createElement('li');
                var a = document.createElement('a');
                a.href = p;
                a.textContent = labelForPath(p);
                li.appendChild(a);
                ul.appendChild(li);
            });
            var title = document.createElement('h3');
            title.textContent = host.getAttribute('data-label') || 'Вы недавно смотрели';
            host.innerHTML = '';
            host.appendChild(title);
            host.appendChild(ul);
            host.hidden = false;
        } catch (e) {
            /* ignore */
        }
    }

    renderRecentWidget();

    const categoryBtns = document.querySelectorAll('.category-btn');
    const products = document.querySelectorAll('.product-card');
    if (categoryBtns.length && products.length) {
        categoryBtns.forEach(function (btn) {
            btn.addEventListener('click', function () {
                categoryBtns.forEach(function (b) {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                const category = btn.dataset.category;
                products.forEach(function (product) {
                    if (category === 'all' || product.dataset.category === category) {
                        product.style.display = 'block';
                    } else {
                        product.style.display = 'none';
                    }
                });
            });
        });
    }

    const form = document.getElementById('feedback-form');
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            const statusDiv = document.getElementById('order-status');
            if (!statusDiv) return;
            statusDiv.innerHTML = '⏳ Отправка...';
            statusDiv.style.color = '#333';

            const name = document.getElementById('name').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const comment = document.getElementById('comment').value.trim();

            const data = {
                name: name,
                phone: phone,
                comment: comment,
                source: 'Сайт Алко 24 Онлайн',
            };

            try {
                const response = await fetch('/api/telegram', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                });

                const result = await response.json();

                if (result.success) {
                    statusDiv.innerHTML =
                        '✅ Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в ближайшее время.';
                    statusDiv.style.color = '#2e7d32';
                    form.reset();
                } else {
                    statusDiv.innerHTML = '❌ Ошибка: ' + (result.error || 'Неизвестная ошибка');
                    statusDiv.style.color = '#d32f2f';
                }
            } catch (err) {
                statusDiv.innerHTML =
                    '❌ Ошибка соединения. Позвоните +7 (999) 786-39-67 или напишите в мессенджер.';
                statusDiv.style.color = '#d32f2f';
            }
        });
    }

    document.querySelectorAll('.accordion-header').forEach(function (header) {
        header.addEventListener('click', function () {
            const parentItem = header.parentElement;
            if (parentItem) parentItem.classList.toggle('active');
        });
    });
});

