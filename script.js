// script.js – Dynamically render property cards

let properties = [];
let map;
let markersLayer;


// Load property data from listings.json
async function loadProperties() {
  try {
    const response = await fetch('listings.json');
    if (!response.ok) throw new Error('Network response was not ok');
    properties = await response.json();
  } catch (error) {
    console.error('Failed to load property listings:', error);
  }
}

/* ---------- Card creation ---------- */
function createCard(property) {
  const card = document.createElement('div');
  card.className = 'card';

  const img = document.createElement('img');
  img.src = property.image;
  img.alt = property.title;
  card.appendChild(img);

  // Lightbox click event
  img.addEventListener('click', () => {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImg');
    modal.style.display = "block";
    modalImg.src = property.image;
  });


  const info = document.createElement('div');
  info.className = 'info';

  const title = document.createElement('h3');
  title.textContent = property.title;
  info.appendChild(title);

  const desc = document.createElement('p');
  desc.textContent = property.description;
  info.appendChild(desc);

  const price = document.createElement('p');
  price.className = 'price';
  price.textContent = property.price;
  info.appendChild(price);

  const loc = document.createElement('p');
  loc.className = 'location';
  loc.innerHTML = `<small>📍 ${property.location}</small>`;
  loc.style.marginTop = "0.5rem";
  loc.style.color = "#888";
  info.appendChild(loc);


  card.appendChild(info);
  return card;
}

/* ---------- Render listings ---------- */
function renderListings(filteredProperties = null) {
  const displayProps = filteredProperties || properties;
  
  // Update Cards
  const container = document.getElementById('listingsContainer') ||
    document.getElementById('galleryContainer');
  if (!container) return;
  container.innerHTML = '';
  displayProps.forEach(prop => {
    const card = createCard(prop);
    container.appendChild(card);
  });

  // Update Map Markers (Only if on index.html)
  if (map && markersLayer) {
    markersLayer.clearLayers();
    displayProps.forEach(prop => {
      if (prop.coords) {
        const marker = L.marker(prop.coords).addTo(markersLayer);
        marker.bindPopup(`
          <div style="width: 150px">
            <img src="${prop.image}" style="width: 100%; height: 80px; object-fit: cover; border-radius: 4px;">
            <h4 style="margin: 5px 0">${prop.title}</h4>
            <p style="margin: 0; color: #007bff; font-weight: bold">${prop.price}</p>
          </div>
        `);
      }
    });

    // Auto-center map if there are markers
    if (displayProps.length > 0) {
      const group = new L.featureGroup(markersLayer.getLayers());
      if (group.getLayers().length > 0) {
        map.fitBounds(group.getBounds().pad(0.1));
      }
    }
    // Force Leaflet to recalculate container size (critical for mobile layout shifts)
    setTimeout(() => { map.invalidateSize(); }, 100);
  }
}

/* ---------- Search ---------- */
function handleSearch() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filtered = properties.filter(p =>
    p.title.toLowerCase().includes(query) ||
    p.description.toLowerCase().includes(query) ||
    p.location.toLowerCase().includes(query)
  );

  renderListings(filtered);
}

/* ---------- Event listeners ---------- */
document.addEventListener('DOMContentLoaded', async () => {
  await loadProperties();

  // Initialize Map (only if container exists)
  const mapElement = document.getElementById('map');
  if (mapElement) {
    map = L.map('map').setView([40.7128, -74.0060], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    markersLayer = L.layerGroup().addTo(map);
  }

  renderListings();

  const searchBtn = document.getElementById('searchBtn');
  const searchInput = document.getElementById('searchInput');

  if (searchBtn && searchInput) {
    searchBtn.addEventListener('click', handleSearch);
    
    // Real-time (Live) search as user types
    searchInput.addEventListener('input', handleSearch);

    // Trigger search on Enter key (redundant but good for UX)
    searchInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') handleSearch();
    });
  }


  // Modal close logic
  const modal = document.getElementById('imageModal');
  const closeBtn = document.querySelector('.close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = "none";
    });
  }
  window.addEventListener('click', (event) => {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  });

  // Handle window resize to keep map responsive
  window.addEventListener('resize', () => {
    if (map) {
      map.invalidateSize();
    }
  });

  // Highlight active nav link
  let currentPath = window.location.pathname.split("/").pop();
  if (!currentPath || currentPath === "") currentPath = 'index.html';
  
  const navLinks = document.querySelectorAll('.navbar a');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath) {
      link.classList.add('active');
    }
  });
});
