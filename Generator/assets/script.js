document.addEventListener('DOMContentLoaded', () => {
    // --- TRANSITION & BOOT ---
    const urlParams = new URLSearchParams(window.location.search);
    const isTransition = urlParams.get('transition') === 'fade';
    const transitionOverlay = document.getElementById('transition-overlay');

    if (transitionOverlay) {
        if (isTransition) {
            const newUrl = window.location.href.split('?')[0];
            window.history.replaceState({}, document.title, newUrl);
            transitionOverlay.style.opacity = '1';
            transitionOverlay.style.display = 'block';
            setTimeout(() => {
                transitionOverlay.style.opacity = '0';
                setTimeout(() => { transitionOverlay.style.display = 'none'; }, 500);
            }, 100);
        } else {
            transitionOverlay.style.display = 'none';
        }
    }

    if (document.querySelector('main')) {
        document.querySelector('main').scrollTo(0, 0);
    }

    const bootLayer = document.getElementById('boot-layer');
    if (bootLayer) {
        if (isTransition) {
            bootLayer.style.display = 'none';
        } else {
            setTimeout(() => {
                bootLayer.style.opacity = '0';
                setTimeout(() => { bootLayer.style.display = 'none'; }, 500);
            }, 1500);
        }
    }

    // --- HAMBURGER MENU & NAV LOGIC ---
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const navLinksContainer = document.getElementById('nav-links-container');
    const navItems = document.querySelectorAll('.nav-item');

    if (hamburgerBtn && navLinksContainer) {
        hamburgerBtn.addEventListener('click', () => {
            navLinksContainer.classList.toggle('open');
            hamburgerBtn.classList.toggle('active');
        });

        navItems.forEach(link => {
            link.addEventListener('click', (e) => {
                navLinksContainer.classList.remove('open');
                hamburgerBtn.classList.remove('active');

                if (window.innerWidth <= 900 && link.getAttribute('href') === '#home-section') {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    const mainEl = document.querySelector('main');
                    if (mainEl) mainEl.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        });
    }

    // --- SCROLL SPY (RATIO BASED FIX) ---
    // Instead of a single trigger point, we track which section
    // takes up the MOST space on screen. This fixes the trackpad scroll glitch.
    
    const sections = document.querySelectorAll('main > section');
    const sidebarLeft = document.getElementById('global-sidebar-left');
    const sidebarRight = document.getElementById('global-sidebar-right');
    const mainContainer = document.querySelector('main');
    
    // Store visibility ratio of each section (0.0 to 1.0)
    let sectionVisibility = {}; 

    // Helper: Update UI based on the section with highest visibility
    const updateActiveSection = () => {
        // 1. Find the section ID with the highest ratio
        let maxRatio = 0;
        let winnerId = '';
        
        // Also apply a "Scroll Guard" - if we are literally at the top (Home), Home must win
        const currentScroll = window.scrollY || (mainContainer ? mainContainer.scrollTop : 0);
        if (currentScroll < 50) {
            winnerId = 'home-section';
        } else {
            sections.forEach(section => {
                const id = section.id;
                const ratio = sectionVisibility[id] || 0;
                if (ratio > maxRatio) {
                    maxRatio = ratio;
                    winnerId = id;
                }
            });
        }

        // 2. Apply updates if we found a winner
        if (winnerId) {
            // Update Nav Links
            navItems.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${winnerId}`) {
                    link.classList.add('active');
                }
            });

            // Update Sidebars
            if (sidebarLeft && sidebarRight) {
                // Find the DOM element for the winner to get its data attributes
                const winningSection = document.getElementById(winnerId);
                if (winningSection) {
                    // Force empty text for Home, otherwise use data attributes
                    if (winnerId === 'home-section') {
                        sidebarLeft.innerHTML = "";
                        sidebarRight.innerHTML = "";
                    } else {
                        const leftText = winningSection.dataset.sidebarLeft || '';
                        const rightText = winningSection.dataset.sidebarRight || '';
                        sidebarLeft.innerHTML = leftText.split('|').map(word => `<span class="sidebar-word">${word}</span>`).join('');
                        sidebarRight.innerHTML = rightText.split('|').map(word => `<span class="sidebar-word">${word}</span>`).join('');
                    }
                }
            }
        }
    };

    const observer = new IntersectionObserver((entries) => {
        // Update the ratio map for every changed entry
        entries.forEach(entry => {
            sectionVisibility[entry.target.id] = entry.intersectionRatio;
        });
        // Recalculate who is the winner
        updateActiveSection();
    }, { 
        root: mainContainer,
        // We use multiple thresholds so we get constant updates as the ratio changes
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0] 
    });

    sections.forEach(section => { observer.observe(section); });


    // --- PFP SHUFFLE ---
    const shuffleBtn = document.querySelector('.pfp-shuffle-btn');
    const profilePic = document.getElementById('profile-pic');
    const pfpLoader = document.querySelector('.pfp-loader');

    if (shuffleBtn && profilePic && typeof pfpList !== 'undefined') {
        const getFilename = (path) => path.split('/').pop();
        
        shuffleBtn.addEventListener('click', () => {
            if (pfpList.length <= 1) return;

            // 1. Calculate Next Image
            const currentFilename = getFilename(profilePic.src);
            let pfpIndex = pfpList.findIndex(path => getFilename(path) === currentFilename);
            let nextIndex = (pfpIndex + 1) % pfpList.length;
            const nextImageSrc = pfpList[nextIndex];

            // 2. FADE OUT (Start the animation)
            profilePic.style.opacity = '0';

            // 3. Wait 200ms (matches CSS) for fade out to finish, THEN swap
            setTimeout(() => {
                if (pfpLoader) pfpLoader.style.display = 'block'; // Show loader if internet is slow

                const tempImg = new Image();
                tempImg.src = nextImageSrc;

                tempImg.onload = () => {
                    profilePic.src = nextImageSrc; // Swap Source
                    
                    // Hide loader and Fade In
                    if (pfpLoader) pfpLoader.style.display = 'none';
                    
                    // Small delay to ensure browser has rendered the new image
                    requestAnimationFrame(() => {
                        profilePic.style.opacity = '1';
                    });
                };
            }, 200); // 200ms matches the CSS transition time
        });
    }

    // --- MODAL & GALLERY ---
    const modal = document.getElementById('detail-modal');
    const modalImage = document.getElementById('modal-image');
    const modalPdf = document.getElementById('modal-pdf');
    const modalLoader = document.querySelector('.modal-loader');
    const zoomContainer = document.querySelector('.image-zoom-container');
    const lens = document.querySelector('.zoom-lens');
    const modalDescription = document.getElementById('modal-description');
    const imageCounter = document.getElementById('image-counter');
    
    const prevImageBtn = document.getElementById('prev-image');
    const nextImageBtn = document.getElementById('next-image');
    const projPrevBtn = document.getElementById('proj-prev-btn');
    const projNextBtn = document.getElementById('proj-next-btn');
    const projPrevSidebar = document.getElementById('proj-prev-sidebar');
    const projNextSidebar = document.getElementById('proj-next-sidebar');

    const modalClose = document.querySelector('.modal-close');
    
    let currentProjectList = [];
    let currentProjectIndex = 0;
    let currentImageList = [];
    let currentImageIndex = 0;

    function resetZoom() {
        if(modalImage) {
            modalImage.style.transform = 'scale(1) translate(0px, 0px)';
            currentScale = 1;
            pointX = 0;
            pointY = 0;
        }
    }

    function populateModal(projectElement) {
        if (!projectElement) return;
        let imagesAttr = projectElement.dataset.images;
        if (!imagesAttr || imagesAttr === "") {
            const thumbImg = projectElement.querySelector('img');
            currentImageList = thumbImg ? [thumbImg.src] : [];
        } else {
            currentImageList = imagesAttr.split(',');
        }
        currentImageIndex = 0;
        const descDiv = projectElement.querySelector('.hidden-desc');
        modalDescription.innerHTML = descDiv ? descDiv.innerHTML : "<p>No description available.</p>";
        
        if (currentImageList.length > 0) {
            updateMedia();
        } else {
            modalImage.style.display = 'none'; 
            modalPdf.style.display = 'none';
        }
        modal.style.display = 'flex';
    }

    function updateMedia() {
        const fileUrl = currentImageList[currentImageIndex];
        const isPdf = fileUrl.toLowerCase().endsWith('.pdf');
        
        modalLoader.style.display = 'block';
        modalImage.style.display = 'none';
        modalPdf.style.display = 'none';
        lens.style.display = 'none';
        resetZoom();

        // 1. FIX: Force mouse to be VISIBLE while loading
        if (zoomContainer) zoomContainer.style.cursor = 'default';

        if (isPdf) {
            modalPdf.src = fileUrl;
            // Helper to show PDF
            const showPdf = () => {
                modalLoader.style.display = 'none';
                modalPdf.style.display = 'block';
                // PDFs don't zoom, so keep cursor visible
                if (zoomContainer) zoomContainer.style.cursor = 'default';
            };

            modalPdf.onload = showPdf;
            // Fallback if onload doesn't fire for PDF
            setTimeout(showPdf, 1000);

        } else {
            modalImage.src = ""; 
            modalImage.src = fileUrl;
            
            modalImage.onload = () => {
                modalLoader.style.display = 'none';
                modalImage.style.display = 'block';
                
                // 2. FIX: Only hide mouse IF we are on desktop (to allow Zooming)
                if (zoomContainer && !window.matchMedia("(pointer: coarse)").matches) {
                    zoomContainer.style.cursor = 'none';
                }
            };
        }

        imageCounter.textContent = `${currentImageIndex + 1} / ${currentImageList.length}`;
        const hasMultiple = currentImageList.length > 1;
        if (prevImageBtn) prevImageBtn.style.display = hasMultiple ? 'flex' : 'none';
        if (nextImageBtn) nextImageBtn.style.display = hasMultiple ? 'flex' : 'none';
        if (imageCounter) imageCounter.style.display = hasMultiple ? 'block' : 'none';
    }

    // --- DESKTOP MAGNIFIER ---
    function updateLens(mouseX, mouseY) {
        if (window.matchMedia("(pointer: coarse)").matches) return;
        
        if (modalImage.style.display === 'none' || !modalImage.naturalWidth) {
            lens.style.display = 'none'; return;
        }

        const containerRect = zoomContainer.getBoundingClientRect();
        
        const imgNaturalW = modalImage.naturalWidth;
        const imgNaturalH = modalImage.naturalHeight;
        const containerRatio = containerRect.width / containerRect.height;
        const imageRatio = imgNaturalW / imgNaturalH;
        let renderW, renderH, offsetLeft, offsetTop;
        
        if (imageRatio > containerRatio) {
            renderW = containerRect.width; renderH = renderW / imageRatio; offsetLeft = 0; offsetTop = (containerRect.height - renderH) / 2;
        } else {
            renderH = containerRect.height; renderW = renderH * imageRatio; offsetTop = 0; offsetLeft = (containerRect.width - renderW) / 2;
        }

        const relX = mouseX - containerRect.left;
        const relY = mouseY - containerRect.top;

        if (relX < offsetLeft || relX > offsetLeft + renderW || relY < offsetTop || relY > offsetTop + renderH) {
            lens.style.display = 'none'; return;
        }

        lens.style.display = 'block';
        lens.style.backgroundImage = `url('${modalImage.src}')`;
        const lensW = lens.offsetWidth; const lensH = lens.offsetHeight;
        let lensLeft = relX - (lensW / 2); let lensTop = relY - (lensH / 2);
        
        if (lensLeft < offsetLeft - lensW/2) lensLeft = offsetLeft - lensW/2;
        if (lensLeft > offsetLeft + renderW - lensW/2) lensLeft = offsetLeft + renderW - lensW/2;
        if (lensTop < offsetTop - lensH/2) lensTop = offsetTop - lensH/2;
        if (lensTop > offsetTop + renderH - lensH/2) lensTop = offsetTop + renderH - lensH/2;
        
        lens.style.left = lensLeft + "px"; lens.style.top = lensTop + "px";
        const zoomLevel = 2.5;
        const actualImgX = relX - offsetLeft;
        const actualImgY = relY - offsetTop;
        const bgPosX = -(actualImgX * zoomLevel - lensW / 2);
        const bgPosY = -(actualImgY * zoomLevel - lensH / 2);
        
        lens.style.backgroundSize = `${renderW * zoomLevel}px ${renderH * zoomLevel}px`;
        lens.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;
    }

    if (zoomContainer) {
        zoomContainer.addEventListener("mousemove", (e) => {
            if (e.target.closest('.gallery-arrow') || e.target.closest('.image-counter')) { lens.style.display = 'none'; return; }
            updateLens(e.clientX, e.clientY);
        });
        zoomContainer.addEventListener("mouseleave", () => lens.style.display = "none");
    }

    // --- MOBILE PINCH ZOOM LOGIC ---
    let currentScale = 1;
    let pointX = 0;
    let pointY = 0;
    let startX = 0;
    let startY = 0;
    let initialDistance = 0;

    if (zoomContainer) {
        zoomContainer.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                initialDistance = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
            } else if (e.touches.length === 1 && currentScale > 1) {
                startX = e.touches[0].pageX - pointX;
                startY = e.touches[0].pageY - pointY;
            }
        });

        zoomContainer.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const dist = Math.hypot(
                    e.touches[0].pageX - e.touches[1].pageX,
                    e.touches[0].pageY - e.touches[1].pageY
                );
                const scaleAmount = dist / initialDistance;
                let newScale = currentScale * scaleAmount;
                newScale = Math.min(Math.max(1, newScale), 4);
                
                modalImage.style.transform = `scale(${newScale}) translate(${pointX/newScale}px, ${pointY/newScale}px)`;
            } else if (e.touches.length === 1 && currentScale > 1) {
                e.preventDefault();
                pointX = e.touches[0].pageX - startX;
                pointY = e.touches[0].pageY - startY;
                modalImage.style.transform = `scale(${currentScale}) translate(${pointX/currentScale}px, ${pointY/currentScale}px)`;
            }
        });

        // Double Tap to Zoom
        let lastTap = 0;
        zoomContainer.addEventListener('touchend', (e) => {
            const currentTime = new Date().getTime();
            const tapLength = currentTime - lastTap;
            if (tapLength < 300 && tapLength > 0) {
                e.preventDefault();
                if (currentScale === 1) {
                    currentScale = 2.5;
                    modalImage.style.transition = 'transform 0.3s';
                    modalImage.style.transform = `scale(2.5)`;
                } else {
                    currentScale = 1;
                    pointX = 0; pointY = 0;
                    modalImage.style.transition = 'transform 0.3s';
                    modalImage.style.transform = `scale(1)`;
                }
                setTimeout(() => { modalImage.style.transition = ''; }, 300);
            }
            lastTap = currentTime;
        });
    }

    // --- EVENTS ---
    document.querySelectorAll('.grid-container').forEach(container => {
        const cards = Array.from(container.querySelectorAll('.grid-card'));
        cards.forEach((card, index) => {
            card.addEventListener('click', (e) => {
                e.preventDefault();
                currentProjectList = cards;
                currentProjectIndex = index;
                populateModal(card);
            });
        });
    });

    const nextProjectAction = () => { 
        currentProjectIndex = (currentProjectIndex + 1) % currentProjectList.length; 
        populateModal(currentProjectList[currentProjectIndex]); 
    };
    const prevProjectAction = () => { 
        currentProjectIndex = (currentProjectIndex - 1 + currentProjectList.length) % currentProjectList.length; 
        populateModal(currentProjectList[currentProjectIndex]); 
    };

    if (nextImageBtn) nextImageBtn.addEventListener('click', () => { currentImageIndex = (currentImageIndex + 1) % currentImageList.length; updateMedia(); });
    if (prevImageBtn) prevImageBtn.addEventListener('click', () => { currentImageIndex = (currentImageIndex - 1 + currentImageList.length) % currentImageList.length; updateMedia(); });
    
    if (projNextBtn) projNextBtn.addEventListener('click', nextProjectAction);
    if (projPrevBtn) projPrevBtn.addEventListener('click', prevProjectAction);
    if (projNextSidebar) projNextSidebar.addEventListener('click', nextProjectAction);
    if (projPrevSidebar) projPrevSidebar.addEventListener('click', prevProjectAction);

    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    if (modalClose) modalClose.addEventListener('click', () => { modal.style.display = 'none'; });
    // --- KEYBOARD NAVIGATION ---
    document.addEventListener('keydown', (e) => {
        
        // CHECK LANGUAGE FOR ARABIC LOGIC
        const isRTL = document.documentElement.lang === 'ar';

        // --- SCENARIO 1: MODAL IS OPEN ---
        if (modal.style.display === 'flex') {
            if (e.key === "Escape") {
                modal.style.display = 'none';
            } 
            
            // LOGIC HELPERS
            const goNext = () => {
                if (currentImageIndex < currentImageList.length - 1) {
                    currentImageIndex++;
                    updateMedia();
                } else {
                    nextProjectAction();
                }
            };

            const goPrev = () => {
                if (currentImageIndex > 0) {
                    currentImageIndex--;
                    updateMedia();
                } else {
                    prevProjectAction();
                }
            };

            // KEY MAPPING
            if (e.key === "ArrowRight") {
                // In Arabic, Right Arrow means "Go Back/Previous"
                if (isRTL) goPrev(); 
                else goNext();
            } 
            else if (e.key === "ArrowLeft") {
                // In Arabic, Left Arrow means "Go Forward/Next"
                if (isRTL) goNext(); 
                else goPrev();
            }
        } 
        
        // --- SCENARIO 2: MAIN WEBSITE SCROLL (Section Jumps) ---
        else {
            const getCurrentSectionIndex = () => {
                const sections = document.querySelectorAll('main > section');
                let maxRatio = 0;
                let index = 0;
                sections.forEach((sec, i) => {
                    const rect = sec.getBoundingClientRect();
                    const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
                    const ratio = Math.max(0, visibleHeight / window.innerHeight);
                    if (ratio > maxRatio) {
                        maxRatio = ratio;
                        index = i;
                    }
                });
                return index;
            };

            const sections = document.querySelectorAll('main > section');
            const currentIndex = getCurrentSectionIndex();

            if (e.key === "ArrowDown") {
                e.preventDefault(); 
                if (currentIndex < sections.length - 1) {
                    sections[currentIndex + 1].scrollIntoView({ behavior: 'smooth' });
                }
            } 
            else if (e.key === "ArrowUp") {
                e.preventDefault(); 
                if (currentIndex > 0) {
                    sections[currentIndex - 1].scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    });
});