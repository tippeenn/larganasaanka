/**
 * Privacy Policy Controller
 * Handles reading progress bar, active TOC scroll spy, and smooth scroll offsets
 */

document.addEventListener("DOMContentLoaded", () => {
    const scrollProgressBar = document.getElementById("scrollProgressBar");
    const btnBackToTop = document.getElementById("btnBackToTop");
    const tocLinks = document.querySelectorAll(".toc-link");
    const sections = document.querySelectorAll(".policy-content section");

    // 1. Reading Progress Bar & Back-to-Top Button Visibility
    function handleScrollProgress() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolledPercentage = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

        if (scrollProgressBar) {
            scrollProgressBar.style.width = `${scrolledPercentage}%`;
        }

        if (btnBackToTop) {
            if (scrollTop > 350) {
                btnBackToTop.classList.add("show");
            } else {
                btnBackToTop.classList.remove("show");
            }
        }
    }

    // 2. Active Section Spy for Sticky Table of Contents
    function handleScrollSpy() {
        let currentSectionId = "";
        const scrollPosition = (window.scrollY || document.documentElement.scrollTop) + 120;

        sections.forEach((section) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                currentSectionId = section.getAttribute("id");
            }
        });

        if (currentSectionId) {
            tocLinks.forEach((link) => {
                link.classList.remove("active");
                if (link.getAttribute("href") === `#${currentSectionId}`) {
                    link.classList.add("active");
                }
            });
        }
    }

    window.addEventListener("scroll", () => {
        handleScrollProgress();
        handleScrollSpy();
    });

    // 3. Back to Top Click Action
    if (btnBackToTop) {
        btnBackToTop.addEventListener("click", () => {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    // 4. Smooth Anchor Navigation Offset Handling
    tocLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const targetId = link.getAttribute("href");
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const navHeight = 70;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // Initial trigger
    handleScrollProgress();
});