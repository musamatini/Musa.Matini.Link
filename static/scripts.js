document.addEventListener('DOMContentLoaded', function() {
    const popup = document.getElementById('popup');
    const popupImageLink = document.getElementById('popup-image-link');
    const popupImage = document.getElementById('popup-image');
    const popupName = document.getElementById('popup-name');
    const popupDescription = document.getElementById('popup-description');
    const nextImageBtn = document.getElementById('nextImage');
    const prevImageBtn = document.getElementById('prevImage');
    const closePopupBtn = document.getElementById('closePopup');

    let currentImages = [];
    let currentIndex = 0;
    const BLANK_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

    function showPopup() {
        popup.classList.add("show");
        document.body.style.overflow = 'hidden';
    }

    function hidePopup() {
        popup.classList.remove("show");
        document.body.style.overflow = 'auto';
        popupImage.src = BLANK_IMAGE;
    }

    function preloadImage(url) {
        const img = new Image();
        img.src = url;
    }

    function updateNavigation() {
        const hasMultipleImages = currentImages.length > 1;
        nextImageBtn.style.display = hasMultipleImages ? 'inline-block' : 'none';
        prevImageBtn.style.display = hasMultipleImages ? 'inline-block' : 'none';
    }

    function loadImage(index) {
        if (!currentImages[index]) return;

        currentIndex = index;
        popupImageLink.classList.add('loading');
        
        const imageUrl = currentImages[currentIndex];
        const loader = new Image();

        loader.onload = () => {
            const externalLink = document.querySelector('.project.active-popup')?.getAttribute('data-external-link-image');
            popupImage.src = loader.src;
            popupImageLink.href = externalLink || loader.src;
            popupImageLink.classList.remove('loading');
            
            if (currentImages.length > 1) {
                const nextIndex = (currentIndex + 1) % currentImages.length;
                const prevIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
                preloadImage(currentImages[nextIndex]);
                preloadImage(currentImages[prevIndex]);
            }
        };

        loader.onerror = () => {
            console.error("Failed to load image:", imageUrl);
            popupImageLink.classList.remove('loading');
        };
        
        loader.src = imageUrl;
    }

    document.querySelector('.projects').addEventListener('click', function(e) {
        const project = e.target.closest('.project');
        if (!project) return;

        document.querySelectorAll('.project').forEach(p => p.classList.remove('active-popup'));
        project.classList.add('active-popup');
        
        popupImage.src = BLANK_IMAGE;
        
        currentImages = JSON.parse(project.getAttribute('data-images'));
        popupName.textContent = project.getAttribute('data-name');
        popupDescription.textContent = project.getAttribute('data-description');
        
        updateNavigation();
        showPopup();
        loadImage(0);
    });

    nextImageBtn.addEventListener('click', () => {
        if (currentImages.length > 1) {
            loadImage((currentIndex + 1) % currentImages.length);
        }
    });

    prevImageBtn.addEventListener('click', () => {
        if (currentImages.length > 1) {
            loadImage((currentIndex - 1 + currentImages.length) % currentImages.length);
        }
    });

    closePopupBtn.addEventListener('click', hidePopup);

    popup.addEventListener('click', (e) => {
        if (e.target === popup) {
            hidePopup();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (popup.classList.contains('show')) {
            if (e.key === 'Escape') hidePopup();
            if (e.key === 'ArrowRight') nextImageBtn.click();
            if (e.key === 'ArrowLeft') prevImageBtn.click();
        }
    });

    const pfp = document.getElementById("pfp");
    if (pfp) {
        const profilePictures = ["/static/images/me4.jpeg", "/static/images/me3.jpeg", "/static/images/me2.jpeg"];
        let pfpIndex = 0;
        pfp.addEventListener("click", () => {
            pfpIndex = (pfpIndex + 1) % profilePictures.length;
            pfp.src = profilePictures[pfpIndex];
        });
    }

    const viewAllBtn = document.getElementById('view-all-btn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
            const hiddenProjects = document.querySelectorAll('.hidden-project');
            const currentState = viewAllBtn.getAttribute('data-state');
            if (currentState === 'hidden') {
                hiddenProjects.forEach(proj => {
                    proj.style.display = 'block';
                });
                viewAllBtn.textContent = viewAllBtn.getAttribute('data-hide-text');
                viewAllBtn.setAttribute('data-state', 'shown');
            } else {
                hiddenProjects.forEach(proj => {
                    proj.style.display = 'none';
                });
                viewAllBtn.textContent = viewAllBtn.getAttribute('data-show-text');
                viewAllBtn.setAttribute('data-state', 'hidden');
            }
        });
    }

    const newsletterList = document.querySelector('.newsletter-list ul');
    if (newsletterList && typeof newsletterData !== 'undefined') {
        const newsletterContentDiv = document.querySelector('.newsletter-content');
        newsletterList.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                const newsletterId = e.target.dataset.id;
                const newsletter = newsletterData.find(n => n.id === newsletterId);
                if (newsletter) {
                    newsletterContentDiv.innerHTML = `<h3>${newsletter.title}</h3><div>${newsletter.content}</div>`;
                    document.querySelectorAll('.newsletter-list li').forEach(li => li.classList.remove('active'));
                    e.target.classList.add('active');
                }
            }
        });
        if (newsletterList.firstElementChild) {
            newsletterList.firstElementChild.click();
        }
    }
});