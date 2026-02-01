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

  // Loading lost and found items from our lost_found.JSON file
  fetch('lost_found.json')
    .then(response => response.json())
    .then(items => {
      populateLostFound(items);
    })
    .catch(error => {
      console.error('Error loading JSON:', error);
    });

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

/* <--- lostFound.html Beginning ---> */

// Switching between tabs - pretty standard stuff
function showTab(tab) {

  document.querySelectorAll('.lostfound-tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  // Make the clicked one active
  event.target.classList.add('active');

  // Hide all sections first
  document.querySelectorAll('.lostfound-content-section').forEach(section => {
    section.classList.add('hidden');
  });
  // Then show the one we want
  document.getElementById(tab).classList.remove('hidden');
}

// Building all the lost/found cards dynamically
function populateLostFound(items) {
  const lostGrid = document.querySelector('#lost .lostfound-grid');
  const foundGrid = document.querySelector('#found .lostfound-grid');

  // Start fresh each time
  lostGrid.innerHTML = '';
  foundGrid.innerHTML = '';

  // Go through each item and make a card
  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'lostfound-card';

    // Fill it with the item's info using template strings
    card.innerHTML = `
            <div class="lostfound-card-top">
                <span style="font-size: 1.8rem;">${item.emoji}</span>
                <span class="lostfound-status ${item.type}">${item.type.charAt(0).toUpperCase() + item.type.slice(1)}</span>
            </div>
            <div>
                <div class="lostfound-item-name">${item.name}</div>
                <div class="lostfound-item-info">
                    📅 ${item.date} • ${item.location}<br>
                    ${item.description}
                </div>
            </div>
            <div class="lostfound-btn-group">
                <button class="lostfound-btn lostfound-btn-secondary details-btn">Details</button>
                <button class="lostfound-btn lostfound-btn-primary">${item.type === 'lost' ? 'I Found This' : 'Claim This'}</button>
            </div>
        `;

    // Put it in the right grid
    if (item.type === 'lost') {
      lostGrid.appendChild(card);
    } else {
      foundGrid.appendChild(card);
    }

    // Make the details button actually work
    const detailsBtn = card.querySelector('.details-btn');
    detailsBtn.addEventListener('click', () => showDetails(item));
  });
}

// Pop up the details modal when someone clicks
function showDetails(item) {
  const modal = document.getElementById('details-modal');
  const modalBody = document.getElementById('modal-body');

  // Fill the modal with this item's details
  modalBody.innerHTML = `
        <h2>${item.emoji} ${item.name}</h2>
        <p><strong>Status:</strong> ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}</p>
        <p><strong>Date:</strong> ${item.date}</p>
        <p><strong>Location:</strong> ${item.location}</p>
        <p><strong>Description:</strong> ${item.description}</p>
    `;

  // Show the modal
  modal.style.display = 'block';
}

// Close the modal - simple as that
function closeModal() {
  const modal = document.getElementById('details-modal');
  modal.style.display = 'none';
}

/* <--- lostFound.html Ends ---> */
