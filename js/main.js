document.addEventListener('DOMContentLoaded', function() {
    const contrastToggle = document.querySelector('.alt-contrast');

    contrastToggle.addEventListener('click', function(event) {
    event.preventDefault(); 
    document.body.classList.toggle('high-contrast'); 
    });
});