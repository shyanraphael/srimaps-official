document.addEventListener("DOMContentLoaded", () => {

  //  Run features that appear on every single page
  initNavbar();// Loads the navigation menu
  initLenis();// Enables smooth scrolling

  // Checks if we are on the Driver page
  if (document.getElementById("start") && document.getElementById("stop")) {
    initDriverPage();
  }

  // Checks if we are on the Bus Schedule page
  if (document.getElementById('scheduleGrid')) {
    initBusSchedulePage();
  }

  // Checks if we are on the Lost & Found page
  if (document.getElementById('lost') && document.getElementById('found')) {
    initLostFoundPage();
  }

  // Checks if the page has an Alerts section
  if (document.getElementById('alertsContainer')) {
    initAlertsSection();
  }

  // Checks if the page has a News section
  if (document.getElementById('NewsContainer')) {
    initNewsSection();
  }
});

/* <---- GLOBAL FUNCTIONS: Shared across all pages ----> */

// Fetches the navbar.html file and injects it into the placeholder div
function initNavbar() {
  fetch('navbar.html')
    .then(res => res.text())
    .then(data => {
      const navPlaceholder = document.getElementById('navbar-placeholder');
      if (navPlaceholder) {
        navPlaceholder.innerHTML = data;

        if (typeof initCart === 'function') initCart();
        if (typeof loadCheckoutSummary === 'function') loadCheckoutSummary();

        const cartScroll = document.querySelector('.cart-scroll');
        if (cartScroll) {
          cartScroll.addEventListener('wheel', e => e.stopPropagation());
          cartScroll.addEventListener('touchmove', e => e.stopPropagation());
        }
      }
    })
    .catch(err => console.error('Navbar Error:', err));

}

// Sets up the Lenis library for smooth, modern scrolling effects
function initLenis() {
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
}

// Opens and closes the mobile hamburger menu
window.toggleMenu = function () {
  const navLinks = document.querySelector('.nav-list');
  const menuToggle = document.querySelector('.menu-toggle');
  if (navLinks && menuToggle) {
    navLinks.classList.toggle('active');
    menuToggle.classList.toggle('active');
  }
};

/* <------ DRIVER PAGE ----> */

function initDriverPage() {
  console.log("Initializing Driver Page...");
  let watchId = null;
  const statusDisplay = document.getElementById("status");
  const stopBtn = document.getElementById("stop");

  // Starts tracking the driver's location when "Start" is clicked
  document.getElementById("start").addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    // Continuously watches the GPS position
    watchId = navigator.geolocation.watchPosition(
      pos => {
        const location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          time: Date.now()
        };
        // Saves location to browser storage (LocalStorage)
        localStorage.setItem("driverLocation", JSON.stringify(location));

        statusDisplay.innerText = "GPS: Active";
        statusDisplay.classList.add("active");
        stopBtn.classList.add("active");
      },
      error => alert("GPS Error: " + error.message)
    );
  });

  // Stops the GPS tracking
  stopBtn.addEventListener("click", () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
      localStorage.removeItem("driverLocation");

      statusDisplay.innerText = "GPS: Off";
      statusDisplay.classList.remove("active");
      stopBtn.classList.remove("active");
    }
  });
}

/* <----- BUS SCHEDULE PAGE ----> */

let scheduleData = []; // Holds the list of bus routes

async function initBusSchedulePage() {
  console.log("Initializing Schedule Page...");

  const searchBtn = document.getElementById('searchBtn');
  const clearBtn = document.getElementById('clearBtn');
  const searchInput = document.getElementById('routeSearch');

  // Assign search actions to buttons and "Enter" key
  if (searchBtn) searchBtn.addEventListener('click', performSearch);
  if (clearBtn) clearBtn.addEventListener('click', clearSearch);
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') performSearch();
    });
  }

  // Load the schedule data from the JSON file
  try {
    const response = await fetch('BusSchedule.json');
    if (!response.ok) throw new Error('Failed to load schedule');

    scheduleData = await response.json();
    renderSchedule(null); // Show "Please enter a route" message initially
  } catch (error) {
    console.error('Error loading schedule:', error);
    document.getElementById('scheduleGrid').innerHTML = '<div class="error">Failed to load schedule data.</div>';
  }
}

// Handles drawing the schedule tables on the page
function renderSchedule(searchQuery = null) {
  const grid = document.getElementById('scheduleGrid');
  if (!grid) return;

  grid.innerHTML = '';

  // Show instruction message if search is empty
  if (!searchQuery) {
    grid.innerHTML = '<div class="no-results">Please enter a route number to view the schedule.</div>';
    return;
  }

  // Filter the list to find matching route numbers
  const filteredData = scheduleData.filter(route =>
    route.route.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show "not found" message if no routes match
  if (filteredData.length === 0) {
    grid.innerHTML = '<div class="no-results">No routes found matching your search.</div>';
    return;
  }

  // Build the HTML table for each matching route
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
        <thead><tr><th>Stop</th><th>Departure Time</th></tr></thead>
        <tbody>
          ${route.stops.map(stop => `
            <tr><td>${stop.stop}</td><td class="route-time">${stop.time}</td></tr>
          `).join('')}
        </tbody>
      </table>
    `;
    grid.appendChild(section);
  });
}

// Gets the text from the search box and triggers the render
function performSearch() {
  const searchInput = document.getElementById('routeSearch');
  const val = searchInput.value.trim();
  if (val === '') {
    alert('Please enter a route number to search');
    return;
  }
  renderSchedule(val);
}

// Resets the search results
function clearSearch() {
  document.getElementById('routeSearch').value = '';
  renderSchedule(null);
}

/* <---- LOST & FOUND PAGE -----> */

function initLostFoundPage() {
  const tabs = document.querySelectorAll('.lostfound-tab-btn');
  const sections = document.querySelectorAll('.lostfound-content-section');

  // Handles clicking "Lost" vs "Found" tabs
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.tab;

      // Highlight the active button
      tabs.forEach(t => t.classList.remove('active'));
      btn.classList.add('active');

      // Hide all content and show only the chosen one
      sections.forEach(sec => sec.classList.add('hidden'));
      document.getElementById(targetId).classList.remove('hidden');
    });
  });

  // Load items from the JSON file
  fetch('lost_found.json')
    .then(res => res.json())
    .then(items => populateLostFound(items));
}

// Fallback function for switching tabs using old HTML onclick methods
window.showTab = function (tabId) {
  const btns = document.querySelectorAll('.lostfound-tab-btn');
  const sections = document.querySelectorAll('.lostfound-content-section');

  btns.forEach(btn => btn.classList.remove('active'));
  sections.forEach(sec => sec.classList.add('hidden'));

  document.getElementById(tabId).classList.remove('hidden');

  const activeBtn = Array.from(btns).find(b => b.textContent.toLowerCase().includes(tabId));
  if (activeBtn) activeBtn.classList.add('active');
}

// Creates the item cards (Wallet, Keys, etc.) dynamically
function populateLostFound(items) {
  const lostGrid = document.querySelector('#lost .lostfound-grid');
  const foundGrid = document.querySelector('#found .lostfound-grid');

  if (!lostGrid || !foundGrid) return;

  lostGrid.innerHTML = '';
  foundGrid.innerHTML = '';

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'lostfound-card';
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

    // Put the card in the correct category
    if (item.type === 'lost') lostGrid.appendChild(card);
    else foundGrid.appendChild(card);

    // Open the detail modal when the button is clicked
    card.querySelector('.details-btn').addEventListener('click', () => showDetails(item));
  });
}

// Shows a pop-up (modal) with more info about a specific item
function showDetails(item) {
  const modal = document.getElementById('details-modal');
  const modalBody = document.getElementById('modal-body');
  if (!modal || !modalBody) return;

  modalBody.innerHTML = `
    <h2>${item.emoji} ${item.name}</h2>
    <p><strong>Status:</strong> ${item.type.charAt(0).toUpperCase() + item.type.slice(1)}</p>
    <p><strong>Date:</strong> ${item.date}</p>
    <p><strong>Location:</strong> ${item.location}</p>
    <p><strong>Description:</strong> ${item.description}</p>
  `;
  modal.style.display = 'block';
}

// Hides the pop-up
window.closeModal = function () {
  const modal = document.getElementById('details-modal');
  if (modal) modal.style.display = 'none';
}

/* <------ ALERTS & NEWS PAGES ----- > */

// Loads safety alerts (like weather or delays) from JSON
function initAlertsSection() {
  fetch('alerts.json')
    .then(res => res.ok ? res.json() : Promise.reject(res.status))
    .then(data => {
      const container = document.getElementById('alertsContainer');
      if (!container) return;

      if (data.length === 0) {
        container.innerHTML = '<p>No active alerts.</p>';
        return;
      }
      container.innerHTML = data.map(alert => `
        <div class="alert">
          <div class="alert-header">
            <h3>${alert.title}</h3>
            <span class="alert-time">${new Date(alert.timestamp).toLocaleString()}</span>
          </div>
          <p>${alert.message}</p>
        </div>
      `).join('');
    })
    .catch(err => console.error('Alerts Error:', err));
}

// Loads general bus news from JSON
function initNewsSection() {
  fetch('busNews.json')
    .then(res => res.ok ? res.json() : Promise.reject(res.status))
    .then(data => {
      const container = document.getElementById('NewsContainer');
      if (!container) return;

      if (!Array.isArray(data) || data.length === 0) {
        container.innerHTML = '<p>No active news.</p>';
        return;
      }

      container.innerHTML = data.map(item => `
        <div class="news-item">
          <div class="news-header">
            <h3>${item.title}</h3>
            <span class="news-date">${new Date(item.date).toLocaleDateString()}</span>
          </div>
          <div class="news-body">
            <p class="news-summary">${item.summary}</p>
            <p class="news-details">${item.details}</p>
          </div>
        </div>
      `).join('');
    })
    .catch(err => console.error('News Error:', err));
}