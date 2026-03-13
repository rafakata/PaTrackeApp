console.log('✅ map.js cargado');

// Esperar a que Leaflet esté listo
document.addEventListener('DOMContentLoaded', function() {
  // Inicialización del mapa con Leaflet
  const map = L.map('map').setView([36.7213, -4.4214], 15);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  const LS_KEY = 'parking_active';
  let parkingData = null;
  let watchId = null;

  const btnPark = document.getElementById('btn-park');
  const btnEnd = document.getElementById('btn-end');
  const distanceEl = document.getElementById('distance');
  const elapsedEl = document.getElementById('elapsed');
  const statusBadge = document.getElementById('status-badge');
  const infoPanel = document.getElementById('info-panel');
  const coordsVehicle = document.getElementById('coords-vehicle');

  // Haversine simplificado
  function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const φ1 = lat1 * Math.PI/180; const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180; const Δλ = (lng2-lng1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  function formatDistance(m) {
    return m > 1000 ? (m/1000).toFixed(1) + 'km' : Math.round(m) + 'm';
  }

  function formatElapsed(ms) {
    const s = Math.floor(ms / 1000);
    if (s < 60) return s + 's';
    const m = Math.floor(s / 60);
    return m + 'm ' + (s % 60) + 's';
  }

  function updateUI() {
    if (!parkingData) return;
    const now = Date.now();
    const dist = haversine(parkingData.userLat, parkingData.userLng, parkingData.lat, parkingData.lng);
    distanceEl.textContent = formatDistance(dist);
    elapsedEl.textContent = formatElapsed(now - parkingData.timestamp);
    coordsVehicle.textContent = `Coche: ${parkingData.lat.toFixed(5)}, ${parkingData.lng.toFixed(5)}`;
  }

  function setActiveParking(data) {
    parkingData = data;
    localStorage.setItem(LS_KEY, JSON.stringify(data));
    
    statusBadge.textContent = '🚗 Aparcado';
    statusBadge.className = 'badge bg-success fs-6 mb-3';
    infoPanel.classList.remove('d-none');
    btnPark.classList.add('d-none');
    btnEnd.classList.remove('d-none');
    
    carMarker = L.marker([data.lat, data.lng])
      .addTo(map)
      .bindPopup('🚗 Tu vehículo')
      .openPopup();
    
    setInterval(updateUI, 1000);
    navigator.geolocation.getCurrentPosition(pos => {
      parkingData.userLat = pos.coords.latitude;
      parkingData.userLng = pos.coords.longitude;
      L.marker([parkingData.userLat, parkingData.userLng])
        .addTo(map)
        .bindPopup('🧍 Tú');
      map.fitBounds([[parkingData.lat, data.lng], [parkingData.userLat, parkingData.userLng]]);
    });
  }

  function clearParking() {
    parkingData = null;
    localStorage.removeItem(LS_KEY);
    statusBadge.textContent = 'Sin aparcamiento activo';
    statusBadge.className = 'badge bg-secondary fs-6 mb-3';
    infoPanel.classList.add('d-none');
    btnPark.classList.remove('d-none');
    btnEnd.classList.add('d-none');
    if (carMarker) map.removeLayer(carMarker);
  }

  // Botón aparcar
  btnPark.addEventListener('click', () => {
    navigator.geolocation.getCurrentPosition(pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const data = { lat, lng, timestamp: Date.now(), userLat: lat, userLng: lng };
      setActiveParking(data);
      
      // Intentar guardar en servidor
      fetch('/api/parking', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({lat, lng, timestamp: new Date().toISOString()})
      }).catch(console.log);
    }, err => alert('Activa geolocalización: ' + err.message));
  });

  // Botón finalizar
  btnEnd.addEventListener('click', () => {
    clearParking();
    fetch('/api/parking/end', {method: 'POST'}).catch(console.log);
  });

  // Cargar datos guardados
  const saved = localStorage.getItem(LS_KEY);
  if (saved) setActiveParking(JSON.parse(saved));
  else if (serverParking) {
    serverParking.timestamp = new Date(serverParking.timestamp).getTime();
    setActiveParking(serverParking);
  }
});
