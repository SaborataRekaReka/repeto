// Dynamically set background images
document.addEventListener('DOMContentLoaded', function () {
    const bgDivs = document.querySelectorAll('[data-bg-img]');
    if (bgDivs.length > 0) {
        bgDivs.forEach(div => {
            const bgImg = div.getAttribute('data-bg-img');
            if (bgImg) {
                div.style.background = `url(${bgImg})`;
                div.style.backgroundSize = 'cover';
                div.style.backgroundPosition = 'center';
                div.style.zIndex = '999';
            }
        });
    }
});

// FAQ Section
const faqQuestions = document.querySelectorAll('.ub-faq__question');
if (faqQuestions.length > 0) {
    const firstAnswer = document.querySelector('.ub-faq__answer.active');
    if (firstAnswer) {
        firstAnswer.style.maxHeight = firstAnswer.scrollHeight + 'px';
    }

    faqQuestions.forEach(item => {
        item.addEventListener('click', () => {
            const faqItem = item.closest('.ub-faq__item');
            const answer = faqItem.querySelector('.ub-faq__answer');

            document.querySelectorAll('.ub-faq__answer').forEach(ans => {
                if (ans !== answer) {
                    ans.style.maxHeight = '0';
                    ans.classList.remove('active');
                }
            });

            document.querySelectorAll('.ub-faq__question').forEach(question => {
                if (question !== item) {
                    question.classList.remove('active');
                    question.closest('.ub-faq__item').classList.remove('active');
                }
            });

            if (answer.classList.contains('active')) {
                answer.style.maxHeight = '0';
                answer.classList.remove('active');
                item.classList.remove('active');
                faqItem.classList.remove('active');
            } else {
                answer.style.maxHeight = answer.scrollHeight + 'px';
                answer.classList.add('active');
                item.classList.add('active');
                faqItem.classList.add('active');
            }
        });
    });
}

// Pricing Switcher
const pricingSwitcherButtons = document.querySelectorAll('.ub-pricing__switcher-btn');
if (pricingSwitcherButtons.length > 0) {
    pricingSwitcherButtons.forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.ub-pricing__switcher-btn').forEach(btn => {
                btn.classList.remove('ub-pricing__switcher-btn--active');
            });

            button.classList.add('ub-pricing__switcher-btn--active');
            document.querySelectorAll('.ub-pricing__cards').forEach(cards => {
                cards.classList.add('ub-pricing__cards--hidden');
            });

            const targetClass = button.getAttribute('data-target');
            document.querySelector(`.ub-pricing__cards[data-target="${targetClass}"]`).classList.remove('ub-pricing__cards--hidden');
        });
    });
}

// Pricing Single Page Switcher
const pricingDetailsSwitcherButtons = document.querySelectorAll('.ub-pricing-details__switcher-btn');
if (pricingDetailsSwitcherButtons.length > 0) {
    pricingDetailsSwitcherButtons.forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.ub-pricing-details__switcher-btn').forEach(btn => {
                btn.classList.remove('ub-pricing-details__switcher-btn--active');
            });

            button.classList.add('ub-pricing-details__switcher-btn--active');
            document.querySelectorAll('.ub-pricing-details__card').forEach(card => {
                card.classList.add('ub-pricing-details__card--hidden');
            });

            const targetClass = button.getAttribute('data-target');
            document.querySelector(`.ub-pricing-details__card[data-target="${targetClass}"]`).classList.remove('ub-pricing-details__card--hidden');
        });
    });
}

// Filter Buttons
const filterButtons = document.querySelectorAll('.filter-btn');
if (filterButtons.length > 0) {
    filterButtons.forEach(button => {
        button.addEventListener('click', function (event) {
            event.preventDefault();
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
        });
    });
}

// Countdown Section
function startCounter() {
    const counters = document.querySelectorAll('.count');
    if (counters.length > 0) {
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            let count = 0;
            const duration = 2000;
            const startTime = performance.now();

            const updateCounter = (currentTime) => {
                const elapsedTime = currentTime - startTime;
                const progress = Math.min(elapsedTime / duration, 1);
                count = Math.floor(progress * target);

                counter.textContent = count.toLocaleString();

                if (progress < 1) {
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target.toLocaleString();
                }
            };

            requestAnimationFrame(updateCounter);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const statsSections = document.querySelectorAll('.counter-view');
    if (statsSections.length > 0) {
        const observer = new IntersectionObserver(
            (entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        startCounter();
                        observer.disconnect();
                    }
                });
            },
            { threshold: 0.5 }
        );

        statsSections.forEach(section => observer.observe(section));
    }
});

// Signin Page Tab
const tabButtons = document.querySelectorAll('.ub-auth__tab');
if (tabButtons.length > 0) {
    const forms = document.querySelectorAll('.ub-auth__form');
    tabButtons.forEach(button => {
        button.addEventListener('click', function (event) {
            event.preventDefault();
            tabButtons.forEach(btn => btn.classList.remove('ub-auth__tab--active'));
            button.classList.add('ub-auth__tab--active');
            const targetForm = button.getAttribute('data-target');
            forms.forEach(form => {
                form.classList.toggle('ub-auth__form--active', form.id === targetForm);
            });
        });
    });
}

// Mobile Menu
const menuToggle = document.querySelector('.ub-header__menu-toggle');
if (menuToggle) {
    const mobileNav = document.querySelector('.ub-mobile-nav');
    const closeBtn = document.querySelector('.ub-mobile-nav__close-btn');
    const body = document.body;

    const closeAllDropdowns = () => {
        document.querySelectorAll('.ub-mobile-nav__item--has-dropdown').forEach(item => {
            item.classList.remove('active');
        });
    };

    menuToggle.addEventListener('click', () => {
        mobileNav.classList.add('active');
        body.classList.add('menu-open');
    });

    closeBtn.addEventListener('click', () => {
        mobileNav.classList.remove('active');
        body.classList.remove('menu-open');
        closeAllDropdowns();
    });

    document.addEventListener('click', (e) => {
        if (!mobileNav.contains(e.target) && !menuToggle.contains(e.target) && mobileNav.classList.contains('active')) {
            mobileNav.classList.remove('active');
            body.classList.remove('menu-open');
            closeAllDropdowns();
        }
    });

    document.querySelectorAll('.ub-mobile-nav__item--has-dropdown').forEach(item => {
        const link = item.querySelector('.ub-mobile-nav__link');
        link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            item.classList.toggle('active');
            const parentItem = item.closest('.ub-mobile-nav__item--has-dropdown');
            if (parentItem) {
                parentItem.querySelectorAll('.ub-mobile-nav__item--has-dropdown').forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });
            } else {
                document.querySelectorAll('.ub-mobile-nav__item--has-dropdown').forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });
            }
        });
    });

    document.querySelectorAll('.ub-mobile-nav__item:not(.ub-mobile-nav__item--has-dropdown) .ub-mobile-nav__link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });
}

// Animation Initialization
if (typeof AOS !== 'undefined') {
    AOS.init({
        duration: 600, 
        offset: 10,     
        easing: 'ease-out', 
        once: false,    
        delay: 0       
    });
}


// Swiper Sliders
if (typeof Swiper !== 'undefined') {
    const brandSlider = new Swiper(".ub-brands__slider-area", {
        slidesPerView: 'auto',
        spaceBetween: 40,
        loop: true,
        speed: 3000,
        allowTouchMove: false,
        autoplay: {
            delay: 1,
            disableOnInteraction: false,
        },
        breakpoints: {
            1024: { spaceBetween: 40 },
            768: { spaceBetween: 30 },
            480: { spaceBetween: 20 }
        }
    });

    const swiperLeft = new Swiper(".ub-integrations__slider-left", {
        slidesPerView: 'auto',
        spaceBetween: 40,
        loop: true,
        speed: 3000,
        allowTouchMove: false,
        autoplay: {
            delay: 1,
            disableOnInteraction: false,
        },
        breakpoints: {
            1024: { spaceBetween: 40 },
            768: { spaceBetween: 30 },
            480: { spaceBetween: 20 }
        }
    });

    const swiperRight = new Swiper(".ub-integrations__slider-right", {
        slidesPerView: 'auto',
        spaceBetween: 40,
        loop: true,
        speed: 3000,
        allowTouchMove: false,
        autoplay: {
            delay: 1,
            disableOnInteraction: false,
            reverseDirection: true,
        },
        breakpoints: {
            1024: { spaceBetween: 40 },
            768: { spaceBetween: 30 },
            480: { spaceBetween: 20 }
        }
    });
}

// Active Menu Color on Desktop
const menuItems = document.querySelectorAll(".menu__item");
if (menuItems.length > 0) {
    const currentUrl = window.location.pathname.split("/").pop();
    menuItems.forEach((item) => {
        const link = item.querySelector("a");
        if (!link) return;
        const linkHref = link.getAttribute("href");
        if (linkHref === "#" || linkHref === "" || linkHref === null) return;
        if (linkHref === currentUrl) {
            item.classList.add("menu__item--active");
        }
        item.addEventListener("click", function () {
            menuItems.forEach((el) => el.classList.remove("menu__item--active"));
            this.classList.add("menu__item--active");
        });
    });
}

// Latest Post Filter
const latestPostFilterButtons = document.querySelectorAll(".ub-latest-posts__filter-btn");
if (latestPostFilterButtons.length > 0) {
    const posts = document.querySelectorAll(".ub-latest-posts__card");
    const noPostsMessage = document.querySelector(".ub-latest-posts__no-posts");

    latestPostFilterButtons.forEach(button => {
        button.addEventListener("click", function (event) {
            event.preventDefault();
            latestPostFilterButtons.forEach(btn => btn.classList.remove("ub-latest-posts__filter-btn--active"));
            this.classList.add("ub-latest-posts__filter-btn--active");

            const selectedCategory = this.getAttribute("data-category");
            let hasVisiblePost = false;

            posts.forEach(post => {
                const postCategory = post.getAttribute("data-category");
                if (selectedCategory === "all" || postCategory === selectedCategory) {
                    post.style.display = "block";
                    hasVisiblePost = true;
                } else {
                    post.style.display = "none";
                }
            });

            noPostsMessage.style.display = hasVisiblePost ? "none" : "block";
        });
    });
}

// Open Positions Filter
const openPositionFilters = document.querySelectorAll('.ub-open-positions__filter');
if (openPositionFilters.length > 0) {
    const items = document.querySelectorAll('.ub-open-positions__item');

    openPositionFilters.forEach(filter => {
        filter.addEventListener('click', function () {
            const filterValue = this.getAttribute('data-filter');
            openPositionFilters.forEach(f => f.classList.remove('ub-open-positions__filter--active'));
            this.classList.add('ub-open-positions__filter--active');

            items.forEach(item => {
                const category = item.getAttribute('data-category');
                if (filterValue === 'all' || category === filterValue) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

// Open Positions Item Toggle
const openPositionItems = document.querySelectorAll('.ub-open-positions__item');
if (openPositionItems.length > 0) {
    openPositionItems.forEach(item => {
        item.addEventListener('click', function () {
            const contentWrapper = this.querySelector('.ub-open-positions__content-wrapper');
            const isActive = this.classList.contains('ub-open-positions__item--active');

            document.querySelectorAll('.ub-open-positions__item').forEach(el => {
                el.classList.remove('ub-open-positions__item--active');
                const wrapper = el.querySelector('.ub-open-positions__content-wrapper');
                wrapper.style.maxHeight = '0px';
                wrapper.classList.remove('ub-open-positions__content-wrapper--active');
            });

            if (!isActive) {
                this.classList.add('ub-open-positions__item--active');
                contentWrapper.style.maxHeight = contentWrapper.scrollHeight + 'px';
                contentWrapper.classList.add('ub-open-positions__content-wrapper--active');
            }
        });
    });
}