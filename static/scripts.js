document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements that are frequently accessed
    const popup = document.getElementById('popup');
    const popupImage = document.querySelector('.popup-image');
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
        // The popupImageLink.href will be set in handleProjectClick
    }

    // Single event listener for image load
    popupImage.addEventListener('load', () => {
        popupImage.classList.remove("loading");
    });

    function handleProjectClick(project) {
        const name = project.getAttribute('data-name');
        const description = project.getAttribute('data-description');
        const externalImageLink = project.getAttribute('data-external-link-image');
        currentImages = JSON.parse(project.getAttribute('data-images'));
        currentIndex = 0;

        // Reset and set initial state
        popupImage.src = '';
        popupImageLink.href = ''; // Reset the link

        if (externalImageLink && currentImages.length > 0) {
            popupImageLink.href = externalImageLink; // Set external link
            setImage(currentImages?.[currentIndex]);
        } else if (currentImages.length > 0) {
            popupImageLink.href = currentImages?.[currentIndex]; // Default image link
            setImage(currentImages?.[currentIndex]);
        }

        // Update content
        popupName.textContent = name;
        popupDescription.textContent = description;

        // Update navigation visibility
        const hasMultipleImages = currentImages?.length > 1;
        nextImage.style.display = hasMultipleImages ? 'inline-block' : 'none';
        prevImage.style.display = hasMultipleImages ? 'inline-block' : 'none';

        showPopup();
    }

    // Navigation handlers (no change needed)
    nextImage.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % currentImages.length;
        // For now, navigation will still point to the image source.
        // If you have multiple images and want different external links for each,
        // you'd need a more complex data structure.
        if (projectCurrentlyHasExternalLink()) {
            popupImageLink.href = document.querySelector('.project.show-popup')?.getAttribute('data-external-link-image') || currentImages?.[currentIndex];
        } else {
            popupImageLink.href = currentImages?.[currentIndex];
        }
        setImage(currentImages?.[currentIndex]);
    });

    prevImage.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
        // Similar logic as nextImage
        if (projectCurrentlyHasExternalLink()) {
            popupImageLink.href = document.querySelector('.project.show-popup')?.getAttribute('data-external-link-image') || currentImages?.[currentIndex];
        } else {
            popupImageLink.href = currentImages?.[currentIndex];
        }
        setImage(currentImages?.[currentIndex]);
    });

    // Helper function to check if the currently open popup has an external link
    function projectCurrentlyHasExternalLink() {
        return document.querySelector('.project.show-popup')?.hasAttribute('data-external-link-image');
    }

    // Close handlers (no change needed)
    closePopup.addEventListener('click', hidePopup);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hidePopup();
    });

    function showPopup() {
        popup.classList.add("show");
        // Add a class to the project div when its popup is shown, to easily reference it
        const projectName = document.querySelector(`#popup-name`).textContent;
        document.querySelectorAll('.project').forEach(proj => {
            proj.classList.remove('show-popup');
            if (proj.getAttribute('data-name') === projectName) {
                proj.classList.add('show-popup');
            }
        });
        document.body.style.overflow = 'hidden';
    }

    function hidePopup() {
        popup.classList.remove("show");
        document.querySelectorAll('.project').forEach(proj => proj.classList.remove('show-popup'));
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
    const buttons = document.querySelectorAll(".language-btn");

    // Handle language selection
    buttons.forEach((button) => {
        button.addEventListener("click", () => {
            const lang = button.dataset.lang;
            if (lang === "tr") {
                window.location.href = "index-tr.html";
            } else if (lang === "ar") {
                window.location.href = "index-ar.html";
            } else {
                window.location.href = "index-en.html";
            }
        });
    });
    // List of profile pictures
    const profilePictures = [
        "/static/images/me4.jpeg",
        "/static/images/me3.jpeg",
        "/static/images/me2.jpeg"
    ];
    
    // Initial index
    let currentIndex1 = 0;
    
    // Get the profile picture element
    const pfp = document.getElementById("pfp");
    
    // Add click event listener
    pfp.addEventListener("click", () => {
        // Increment the index
        currentIndex1 = (currentIndex1 + 1) % profilePictures.length;
    
        // Update the `src` attribute to the next image
        pfp.src = profilePictures[currentIndex1];
    });

});
