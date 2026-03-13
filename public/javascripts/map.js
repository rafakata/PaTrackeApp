document.addEventListener('DOMContentLoaded', function () {
  const map = L.map('map').setView([36.7213, -4.4214], 15);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap'
  }).addTo(map);

  const activeKey = isLogged ? `parking_active_user_${currentUserId}` : 'parking_active_guest';
  const historyKey = isLogged ? null : 'parking_history_guest';

  let parkingData = null;
  let watchId = null;
  let timerInterval = null;
  let carMarker = null;
  let userMarker = null;
  let historyTable = null;
  let historyData = Array.isArray(initialHistory) ? initialHistory.map(normalizeHistoryRow) : [];

  const btnPark = document.getElementById('btn-park');
  const btnEnd = document.getElementById('btn-end');
  const distanceEl = document.getElementById('distance');
  const elapsedEl = document.getElementById('elapsed');
  const statusBadge = document.getElementById('status-badge');
  const infoPanel = document.getElementById('info-panel');
  const coordsVehicle = document.getElementById('coords-vehicle');
  const historyBody = document.getElementById('history-body');
  const historyTableEl = document.getElementById('history-table');

  function normalizeHistoryRow(row) {
    return {
      lat: Number(row.lat),
      lng: Number(row.lng),
      timestamp: typeof row.timestamp === 'number' ? row.timestamp : new Date(row.timestamp).getTime(),
      endedAt: row.endedAt ? (typeof row.endedAt === 'number' ? row.endedAt : new Date(row.endedAt).getTime()) : null,
      active: !!row.active
    };
  }

  function getGuestHistory() {
    try {
      const parsed = JSON.parse(localStorage.getItem(historyKey));
      if (!Array.isArray(parsed)) return [];
      return parsed.map(normalizeHistoryRow);
    } catch {
      return [];
    }
  }

  function saveGuestHistory(items) {
    localStorage.setItem(historyKey, JSON.stringify(items));
  }

  function syncHistoryStorage() {
    if (!isLogged) {
      saveGuestHistory(historyData);
    }
  }

  function renderHistory() {
    if (!historyBody) return;
    const rows = historyData.map((row, index) => {
      const endMs = row.active ? Date.now() : (row.endedAt ?? row.timestamp);
      const durationSeconds = Math.max(0, Math.floor((endMs - row.timestamp) / 1000));
      return {
        orderIndex: index + 1,
        lat: row.lat.toFixed(5),
        lng: row.lng.toFixed(5),
        date: new Date(row.timestamp).toLocaleString('es-ES'),
        durationSeconds,
        durationLabel: formatHistoryDuration(durationSeconds),
        status: row.active ? '<span class="badge bg-success">En curso</span>' : '<span class="badge bg-secondary">Finalizado</span>'
      };
    });

    if (historyTable) {
      historyTable.clear();
      historyTable.rows.add(rows).draw(false);
      return;
    }

    historyBody.innerHTML = '';
    if (!rows.length) {
      historyBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay aparcamientos registrados.</td></tr>';
      return;
    }

    rows.forEach((row) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.orderIndex}</td>
        <td>${row.lat}</td>
        <td>${row.lng}</td>
        <td>${row.date}</td>
        <td>${row.durationLabel}</td>
        <td>${row.status}</td>
      `;
      historyBody.appendChild(tr);
    });
  }

  function initHistoryTable() {
    if (!historyTableEl) return;
    if (!window.jQuery || !jQuery.fn || !jQuery.fn.DataTable) return;

    historyTable = jQuery(historyTableEl).DataTable({
      data: [],
      columns: [
        { data: 'orderIndex', orderable: true },
        { data: 'lat', orderable: false },
        { data: 'lng', orderable: false },
        { data: 'date', orderable: false },
        {
          data: 'durationSeconds',
          orderable: true,
          render: function (data, type, row) {
            if (type === 'sort' || type === 'type') return data;
            return row.durationLabel;
          }
        },
        { data: 'status', orderable: false }
      ],
      pageLength: 5,
      lengthChange: false,
      searching: false,
      info: false,
      pagingType: 'simple',
      order: [[0, 'asc']],
      language: {
        emptyTable: 'No hay aparcamientos registrados.',
        paginate: {
          previous: 'Anterior',
          next: 'Siguiente'
        }
      }
    });
  }

  function formatHistoryDuration(totalSeconds) {
    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    }
    if (totalSeconds < 3600) {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}m ${seconds}s`;
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const dPhi = (lat2 - lat1) * Math.PI / 180;
    const dLambda = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function formatDistance(meters) {
    return meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;
  }

  function formatElapsed(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  function updateUI() {
    if (!parkingData) return;
    const now = Date.now();
    const dist = haversine(parkingData.userLat, parkingData.userLng, parkingData.lat, parkingData.lng);
    distanceEl.textContent = formatDistance(dist);
    elapsedEl.textContent = formatElapsed(now - parkingData.timestamp);
    coordsVehicle.textContent = `Coche: ${parkingData.lat.toFixed(5)}, ${parkingData.lng.toFixed(5)}`;
  }

  function startWatch() {
    if (!navigator.geolocation) return;
    if (watchId !== null) return;

    watchId = navigator.geolocation.watchPosition((pos) => {
      if (!parkingData) return;
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      parkingData.userLat = lat;
      parkingData.userLng = lng;
      localStorage.setItem(activeKey, JSON.stringify(parkingData));

      if (userMarker) map.removeLayer(userMarker);
      userMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: '',
          html: '<i class="bi bi-person-fill" style="font-size: 1.5rem; color: #000;"></i>',
          iconSize: [30, 30]
        })
      }).addTo(map).bindPopup('Tu posición');

      map.fitBounds([[lat, lng], [parkingData.lat, parkingData.lng]], { padding: [40, 40] });
      updateUI();
    }, () => {}, { enableHighAccuracy: true });
  }

  function setActiveParking(data, appendToHistory = true) {
    parkingData = {
      lat: Number(data.lat),
      lng: Number(data.lng),
      timestamp: typeof data.timestamp === 'number' ? data.timestamp : new Date(data.timestamp).getTime(),
      userLat: Number(data.userLat ?? data.lat),
      userLng: Number(data.userLng ?? data.lng)
    };

    localStorage.setItem(activeKey, JSON.stringify(parkingData));

    if (appendToHistory) {
      historyData = historyData.map(item => ({ ...item, active: false }));
      historyData.unshift({
        lat: parkingData.lat,
        lng: parkingData.lng,
        timestamp: parkingData.timestamp,
        endedAt: null,
        active: true
      });
      syncHistoryStorage();
      renderHistory();
    }

    statusBadge.textContent = 'Vehículo aparcado';
    statusBadge.className = 'badge bg-success fs-6 mb-3';
    infoPanel.classList.remove('d-none');
    btnPark.classList.add('d-none');
    btnEnd.classList.remove('d-none');

    if (carMarker) map.removeLayer(carMarker);
    carMarker = L.marker([parkingData.lat, parkingData.lng], {
      icon: L.divIcon({
        className: '',
        html: '<i class="bi bi-car-front-fill" style="font-size: 1.5rem; color: #000;"></i>',
        iconSize: [30, 30]
      })
    }).addTo(map).bindPopup('Tu vehículo').openPopup();

    clearInterval(timerInterval);
    timerInterval = setInterval(updateUI, 1000);
    updateUI();
    startWatch();
  }

  function clearParking(markLatestFinished = true) {
    parkingData = null;
    localStorage.removeItem(activeKey);

    if (markLatestFinished) {
      const firstActiveIndex = historyData.findIndex(item => item.active);
      if (firstActiveIndex !== -1) {
        historyData[firstActiveIndex].active = false;
        historyData[firstActiveIndex].endedAt = Date.now();
      }
      syncHistoryStorage();
      renderHistory();
    }

    statusBadge.textContent = 'Sin aparcamiento activo';
    statusBadge.className = 'badge bg-secondary fs-6 mb-3';
    infoPanel.classList.add('d-none');
    btnPark.classList.remove('d-none');
    btnEnd.classList.add('d-none');

    if (carMarker) {
      map.removeLayer(carMarker);
      carMarker = null;
    }

    if (userMarker) {
      map.removeLayer(userMarker);
      userMarker = null;
    }

    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }

    clearInterval(timerInterval);
  }

  btnPark.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocalización no disponible en tu navegador');
      return;
    }

    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const timestamp = Date.now();

      setActiveParking({ lat, lng, timestamp, userLat: lat, userLng: lng }, true);

      if (isLogged) {
        fetch('/api/parking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng, timestamp: new Date(timestamp).toISOString() })
        }).catch(() => {});
      }
    }, (err) => {
      alert('No se pudo obtener tu ubicación: ' + err.message);
    });
  });

  btnEnd.addEventListener('click', () => {
    clearParking(true);
    if (isLogged) {
      fetch('/api/parking/end', { method: 'POST' }).catch(() => {});
    }
  });

  if (!isLogged) {
    historyData = getGuestHistory();
  }
  initHistoryTable();
  renderHistory();
  setInterval(() => {
    if (historyData.some(item => item.active)) {
      renderHistory();
    }
  }, 1000);

  const saved = localStorage.getItem(activeKey);
  if (saved) {
    try {
      setActiveParking(JSON.parse(saved), false);
    } catch {
      localStorage.removeItem(activeKey);
    }
  } else if (serverParking) {
    setActiveParking({
      lat: serverParking.lat,
      lng: serverParking.lng,
      timestamp: serverParking.timestamp,
      userLat: serverParking.lat,
      userLng: serverParking.lng
    }, false);
  }
});
