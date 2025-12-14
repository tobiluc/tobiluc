document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', e => {
        if (window.matchMedia('(hover: none)').matches) {
            e.preventDefault();
            card.classList.toggle('active');
        }
    });
});
