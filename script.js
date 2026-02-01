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

/* <--- busSchedule.html Beginning ---> */


// Bus schedule data - will be loaded from JSON file
let scheduleData = [];
// Load schedule data from JSON file
async function loadScheduleData() {
  try {
    const response = await fetch('BusSchedule.json');
    if (!response.ok) {
      throw new Error('Failed to load schedule data');
    }
    scheduleData = await response.json();
    console.log('Schedule data loaded successfully');
  } catch (error) {
    console.error('Error loading schedule data:', error);
  }
}

// Render schedule
function renderSchedule(searchQuery = null) {
  const grid = document.getElementById('scheduleGrid');
  grid.innerHTML = '';

  // Filter data based on search
  const filteredData = scheduleData.filter(route =>
    route.route.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // If no results found
  if (filteredData.length === 0) {
    grid.innerHTML = '<div class="no-results"> No routes found matching </div>';
    return;
  }

  // Display results
  filteredData.forEach(route => {
    const section = document.createElement('div');
    section.className = 'route-section';

    section.innerHTML = `
                    <div class="route-header">
                        <div>
                            <span class="route-number">Route ${route.route}</span>
                            <span class="route-name"> - ${route.name}</span>
                        </div>
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th>Stop</th>
                                <th>Departure Time</th>                                              
                            </tr>
                        </thead>
                        <tbody>
                            ${route.stops.map(stop => `
                                <tr>
                                    <td>${stop.stop}</td>
                                    <td class="time">${stop.time}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;

    grid.appendChild(section);
  });
}

// Search function
function performSearch() {
  const searchInput = document.getElementById('routeSearch');
  const searchQuery = searchInput.value.trim();

  if (searchQuery === '') {
    alert('Please enter a route number to search');
    return;
  }

  renderSchedule(searchQuery);
}

// Clear function
function clearSearch() {
  document.getElementById('routeSearch').value = '';
  renderSchedule(null);
}

// Event listeners
document.getElementById('searchBtn').addEventListener('click', performSearch);
document.getElementById('clearBtn').addEventListener('click', clearSearch);

// Allow Enter key to search
document.getElementById('routeSearch').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    performSearch();
  }
});

// Initialize
async function init() {
  await loadScheduleData(); // Load data from JSON file first
  updateTime();
  setInterval(updateTime, 1000);
  renderSchedule(null); // Start with no results shown
}

init();

/* <--- busSchedule.html Ends ---> */
