var swiper = new Swiper(".products-slider", {
    loop: true,
    grabeCursor: true,
    spaceBetween: 20,
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
    },
    breakpoints: {
        0: {
            slidesPerView: 1,

        },
        550: {
            slidesPerView: 2,

        },
        850: {
            slidesPerView: 3,

        },
        1200: {
            slidesPerView: 4,

        },
    },
});