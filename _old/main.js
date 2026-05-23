document.addEventListener('DOMContentLoaded', () => {

    // --- Theme Toggle ---
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;
    const SAVED_THEME = localStorage.getItem('theme');
    const PREFERS_DARK = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Apply initial theme
    if (SAVED_THEME) {
        html.setAttribute('data-theme', SAVED_THEME);
    } else if (PREFERS_DARK) {
        html.setAttribute('data-theme', 'dark');
    }

    // Toggle handler
    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // --- Smooth Scroll ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            const target = document.getElementById(targetId);

            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // --- FAQ Accordion ---
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(btn => {
        btn.addEventListener('click', () => {
            const answer = btn.nextElementSibling;
            const expanded = btn.getAttribute('aria-expanded') === 'true';

            // Close all others (optional, feels cleaner)
            /*
            faqQuestions.forEach(otherBtn => {
                if (otherBtn !== btn) {
                    otherBtn.setAttribute('aria-expanded', 'false');
                    otherBtn.nextElementSibling.style.height = '0';
                }
            });
            */

            // Toggle current
            btn.setAttribute('aria-expanded', !expanded);

            if (!expanded) {
                answer.style.height = answer.scrollHeight + 'px';
            } else {
                answer.style.height = '0';
            }
        });
    });

    // --- Scroll Animations (Intersection Observer) ---
    const fadeElements = document.querySelectorAll('.fade-in');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    });

    fadeElements.forEach(el => observer.observe(el));

    // --- Feature Showcase Scrollytelling ---
    const featurePanels = document.querySelectorAll('.feature-showcase__panel');
    const screenImages = document.querySelectorAll('.screen-img');

    // Only run if elements exist
    if (featurePanels.length > 0) {
        const featureObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // 1. Highlight active text panel
                    featurePanels.forEach(p => p.classList.remove('is-active'));
                    entry.target.classList.add('is-active');

                    // 2. Switch phone screen image with Mixed Vertical/Horizontal logic
                    const featureKey = entry.target.getAttribute('data-feature');

                    // Current Active Info
                    const activePanel = entry.target;
                    const activeGroup = activePanel.getAttribute('data-group'); // Get group from active panel
                    const panelsArray = Array.from(featurePanels);
                    const activeIndex = panelsArray.indexOf(activePanel);

                    // Find image with matching data-img
                    const targetImage = document.querySelector(`.screen-img[data-img="${featureKey}"]`);

                    if (targetImage) {
                        // Apply classes based on index relation AND group relation
                        screenImages.forEach((img) => {
                            const imgKey = img.getAttribute('data-img');
                            // Find the panel that corresponds to this image to get its index & group
                            const correspondingPanel = document.querySelector(`.feature-showcase__panel[data-feature="${imgKey}"]`);

                            if (correspondingPanel) {
                                const imgIndex = panelsArray.indexOf(correspondingPanel);
                                const imgGroup = correspondingPanel.getAttribute('data-group');

                                // Reset all transition classes
                                img.classList.remove('active', 'prev', 'next', 'prev-vertical', 'next-vertical');

                                if (imgIndex === activeIndex) {
                                    // CASE: Active Image
                                    img.classList.add('active');
                                } else if (imgIndex < activeIndex) {
                                    // CASE: Previous Image (Scrolled Past)
                                    if (imgGroup === activeGroup) {
                                        // Same Group -> Slide Left (Horizontal)
                                        img.classList.add('prev');
                                    } else {
                                        // Different Group -> Slide Up (Vertical)
                                        img.classList.add('prev-vertical');
                                    }
                                } else {
                                    // CASE: Next Image (Upcoming)
                                    if (imgGroup === activeGroup) {
                                        // Same Group -> Slide Right (Wait Horizontal)
                                        img.classList.add('next');
                                    } else {
                                        // Different Group -> Slide Down (Wait Vertical)
                                        img.classList.add('next-vertical');
                                    }
                                }
                            }
                        });
                    }
                }
            });
        }, {
            root: null,
            threshold: 0.5, // Trigger when 50% of the panel is visible
            rootMargin: "-10% 0px -10% 0px"
        });

        featurePanels.forEach(panel => featureObserver.observe(panel));
    }
});
