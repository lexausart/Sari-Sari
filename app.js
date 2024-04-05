const leftBtn = document.querySelector(".l-btn");
const rightBtn = document.querySelector(".r-btn");


rightBtn.addEventListener("click",
    function (event) {
        const conent = document.querySelector(".product-slide");
        conent.scrollLeft += 1100;
        event.preventDefault();

    })
leftBtn.addEventListener("click",
    function (event) {
        const conent = document.querySelector(".product-slide");
        conent.scrollLeft -= 1100;
        event.preventDefault();

    })
const leftBtn1 = document.querySelector(".btn-1b");
const rightBtn1 = document.querySelector(".btn-1a");


rightBtn1.addEventListener("click",
    function (event) {
        const conent = document.querySelector(".product-slide-1");
        conent.scrollLeft += 1100;
        event.preventDefault();

    })
leftBtn1.addEventListener("click",
    function (event) {
        const conent = document.querySelector(".product-slide-1");
        conent.scrollLeft -= 1100;
        event.preventDefault();

    })
const leftBtn2 = document.querySelector(".btn-1c");
const rightBtn2 = document.querySelector(".btn-1d");


rightBtn2.addEventListener("click",
    function (event) {
        const conent = document.querySelector(".product-slide-2");
        conent.scrollLeft += 1100;
        event.preventDefault();

    })
leftBtn2.addEventListener("click",
    function (event) {
        const conent = document.querySelector(".product-slide-2");
        conent.scrollLeft -= 1100;
        event.preventDefault();

    })

const backtop = document.querySelector(".backtop");

backtop.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    })
})



sidebtn.addEventListener("click", () => {
    sidebar.classList.add("active");
    cross.classList.add("active");
    black.classList.add("active");
    document.body.classList.add("stop-scroll");
})
cross.addEventListener("click", () => {
    sidebar.classList.remove("active");
    cross.classList.remove("active");
    black.classList.remove("active");
    document.body.classList.remove("stop-scroll");
})

const sign = document.querySelector(".ac");
const tri = document.querySelector(".triangle");
const signin = document.querySelector(".hdn-sign");

sign.addEventListener("click", () => {
    black.classList.toggle("active-1");
    signin.classList.toggle("active");
    tri.classList.toggle("active");
    document.body.classList.toggle("stop-scroll");
})

// Get the button
let mybutton = document.getElementById("myBtn");

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function () { scrollFunction() };

function scrollFunction() {
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        mybutton.style.display = "block";
    } else {
        mybutton.style.display = "none";
    }
}

// When the user clicks on the button, scroll to the top of the document
function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}
