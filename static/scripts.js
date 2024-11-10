document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements that are frequently accessed
    const popup = document.getElementById('popup');
    const popupImage = document.getElementById('popup-image');
    const popupImageLink = document.getElementById('popup-image-link');
    const popupName = document.getElementById('popup-name');
    const popupDescription = document.getElementById('popup-description');
    const nextImage = document.getElementById('nextImage');
    const prevImage = document.getElementById('prevImage');
    const closePopup = document.getElementById('closePopup');
    
    // State management
    let currentIndex = 0;
    let currentImages = [];
    
    // Use event delegation for project clicks instead of multiple event listeners
    document.addEventListener('click', function(e) {
        const project = e.target.closest('.project');
        if (project) {
            handleProjectClick(project);
        } else if (e.target === popup) {
            hidePopup();
        }
    });

    // Optimize image setting with better loading handling
    function setImage(imageSrc) {
        popupImage.classList.add("loading");
        popupImage.src = imageSrc;
        popupImageLink.href = imageSrc;
    }

    // Single event listener for image load
    popupImage.addEventListener('load', () => {
        popupImage.classList.remove("loading");
    });

    function handleProjectClick(project) {
        const name = project.getAttribute('data-name');
        const description = project.getAttribute('data-description');
        currentImages = JSON.parse(project.getAttribute('data-images'));
        currentIndex = 0;

        // Reset and set initial state
        popupImage.src = '';
        popupImageLink.href = '';
        setImage(currentImages[currentIndex]);

        // Update content
        popupName.textContent = name;
        popupDescription.textContent = description;

        // Update navigation visibility
        const hasMultipleImages = currentImages.length > 1;
        nextImage.style.display = hasMultipleImages ? 'inline-block' : 'none';
        prevImage.style.display = hasMultipleImages ? 'inline-block' : 'none';

        showPopup();
    }

    // Navigation handlers
    nextImage.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % currentImages.length;
        setImage(currentImages[currentIndex]);
    });

    prevImage.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
        setImage(currentImages[currentIndex]);
    });

    // Close handlers
    closePopup.addEventListener('click', hidePopup);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hidePopup();
    });

    function showPopup() {
        popup.classList.add("show");
        document.body.style.overflow = 'hidden';

    }

    function hidePopup() {
        popup.classList.remove("show");
        document.body.style.overflow = 'auto';
    }

    // Optimize card animations using RequestAnimationFrame
    const cards = document.querySelectorAll('.project-inner');
    cards.forEach(card => {
        const height = card.clientHeight;
        const width = card.clientWidth;
        let rafId = null;

        function updateCardTransform(e) {
            if (rafId) return; // Skip if animation frame is pending

            rafId = requestAnimationFrame(() => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const xRotation = 20 * ((y - height / 2) / height);
                const yRotation = -20 * ((x - width / 2) / width);

                card.style.transform = `
                    perspective(1500px)
                    rotateX(${xRotation}deg)
                    rotateY(${yRotation}deg)
                `;
                
                rafId = null;
            });
        }

        card.addEventListener('mousemove', updateCardTransform);
        
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'transform 0s ease';
        });

        card.addEventListener('mouseleave', () => {
            if (rafId) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            card.style.transition = 'transform 0.4s ease';
            card.style.transform = 'perspective(2000px) rotateX(0deg) rotateY(0deg)';
        });
    });
});
