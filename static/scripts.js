document.addEventListener('DOMContentLoaded', function() {
    const popup = document.getElementById('popup');
    const popupImage = document.querySelector('.popup-image');
    const popupImageLink = document.getElementById('popup-image-link');
    const popupName = document.getElementById('popup-name');
    const popupDescription = document.getElementById('popup-description');
    const nextImageBtn = document.getElementById('nextImage');
    const prevImageBtn = document.getElementById('prevImage');
    const closePopupBtn = document.getElementById('closePopup');
    
    let currentImages = [];
    let currentIndex = 0;

    function showPopup() { popup.classList.add("show"); document.body.style.overflow = 'hidden'; }
    function hidePopup() { popup.classList.remove("show"); document.body.style.overflow = 'auto'; }

    function updatePopupImage() {
        const externalLink = document.querySelector('.project.active-popup')?.getAttribute('data-external-link-image');
        popupImage.src = currentImages[currentIndex];
        popupImageLink.href = externalLink || currentImages[currentIndex];
    }

    document.querySelector('.projects').addEventListener('click', function(e) {
        const project = e.target.closest('.project');
        if (!project) return;
        document.querySelectorAll('.project').forEach(p => p.classList.remove('active-popup'));
        project.classList.add('active-popup');
        currentImages = JSON.parse(project.getAttribute('data-images'));
        currentIndex = 0;
        popupName.textContent = project.getAttribute('data-name');
        popupDescription.textContent = project.getAttribute('data-description');
        const hasMultipleImages = currentImages.length > 1;
        nextImageBtn.style.display = hasMultipleImages ? 'inline-block' : 'none';
        prevImageBtn.style.display = hasMultipleImages ? 'inline-block' : 'none';
        updatePopupImage();
        showPopup();
    });

    nextImageBtn.addEventListener('click', () => { currentIndex = (currentIndex + 1) % currentImages.length; updatePopupImage(); });
    prevImageBtn.addEventListener('click', () => { currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length; updatePopupImage(); });
    closePopupBtn.addEventListener('click', hidePopup);
    popup.addEventListener('click', (e) => { if (e.target === popup) hidePopup(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hidePopup(); });

    const pfp = document.getElementById("pfp");
    if (pfp) {
        const profilePictures = ["/static/images/me4.jpeg", "/static/images/me3.jpeg", "/static/images/me2.jpeg"];
        let pfpIndex = 0;
        pfp.addEventListener("click", () => { pfpIndex = (pfpIndex + 1) % profilePictures.length; pfp.src = profilePictures[pfpIndex]; });
    }

    const viewAllBtn = document.getElementById('view-all-btn');
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', () => {
            const hiddenProjects = document.querySelectorAll('.hidden-project');
            const currentState = viewAllBtn.getAttribute('data-state');
            if (currentState === 'hidden') {
                hiddenProjects.forEach(proj => { proj.style.display = 'block'; });
                viewAllBtn.textContent = viewAllBtn.getAttribute('data-hide-text');
                viewAllBtn.setAttribute('data-state', 'shown');
            } else {
                hiddenProjects.forEach(proj => { proj.style.display = 'none'; });
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
        if (newsletterList.firstElementChild) { newsletterList.firstElementChild.click(); }
    }

    const subscribeForm = document.getElementById('subscribe-form');
    if (subscribeForm) {
        const statusDiv = document.getElementById('subscribe-status');
        const nameInput = document.getElementById('subscribe-name');
        const emailInput = document.getElementById('subscribe-email');
        const submitButton = document.getElementById('subscribe-button');
        
        const API_ENDPOINT = 'https://musamatini.pythonanywhere.com/subscribe';

        subscribeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = nameInput.value;
            const email = emailInput.value;
            if (!name || !email) return;

            statusDiv.textContent = 'Subscribing...';
            statusDiv.style.color = 'white';
            submitButton.disabled = true;

            try {
                const response = await fetch(API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name, email: email })
                });

                if (response.ok) {
                    statusDiv.textContent = 'Success! Thank you for subscribing.';
                    statusDiv.style.color = '#4CAF50';
                    nameInput.value = '';
                    emailInput.value = '';
                } else {
                    const errorData = await response.json();
                    statusDiv.textContent = errorData.error || 'An error occurred. Please try again.';
                    statusDiv.style.color = '#f44336';
                }
            } catch (error) {
                statusDiv.textContent = 'Network error. Please check your connection.';
                statusDiv.style.color = '#f44336';
            } finally {
                submitButton.disabled = false;
            }
        });
    }
});