document.addEventListener("DOMContentLoaded", () => {

  //javbar
  fetch('navbar.html')
    .then(res => res.text())
    .then(data => {
      document.getElementById('navbar-placeholder').innerHTML = data;
      initCart();
      loadCheckoutSummary();

      const cartScroll = document.querySelector('.cart-scroll');
      if (cartScroll) {
        cartScroll.addEventListener('wheel', e => e.stopPropagation());
        cartScroll.addEventListener('touchmove', e => e.stopPropagation());
      }
    })
    .catch(err => console.error(err));

  //lenis stuff
  const lenis = new Lenis({
    duration: 1.1,
    smooth: true,
    lerp: 0.08,
    smoothWheel: true,
    smoothTouch: true,
    normalizeWheel: true
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);
});


//driver HTML
// DRIVER STARTS SHARING LOCATION
document.getElementById("start")?.addEventListener("click", () => {
  navigator.geolocation.watchPosition(pos => {
    const location = {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      time: Date.now()
    };

    localStorage.setItem("driverLocation", JSON.stringify(location));
    document.getElementById("status").innerText = "GPS: Active";
  });
});

// PASSENGER READS LOCATION
const stored = localStorage.getItem("driverLocation");
if (stored) {
  const busLocation = JSON.parse(stored);
  console.log("Bus is at:", busLocation.lat, busLocation.lng);
}
