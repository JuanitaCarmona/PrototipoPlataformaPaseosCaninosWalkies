type LeafletProps = {
  pickupLat: number;
  pickupLng: number;
  walkerLat?: number | null;
  walkerLng?: number | null;
};

export function buildLeafletTrackingHtml({
  pickupLat,
  pickupLng,
  walkerLat,
  walkerLng,
}: LeafletProps): string {
  const hasWalker = walkerLat != null && walkerLng != null;
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; background: #E6F6ED; }
    .legend {
      position: absolute; z-index: 500; left: 10px; bottom: 10px;
      background: #fff; padding: 8px 10px; border-radius: 10px;
      font: 12px/1.3 system-ui, sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,.12);
    }
    .dot { display:inline-block; width:10px; height:10px; border-radius:50%; margin-right:6px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="legend">
    <div><span class="dot" style="background:#1B7A4A"></span>Recogida</div>
    <div><span class="dot" style="background:#2563eb"></span>Paseador</div>
  </div>
  <script>
    const pickup = [${pickupLat}, ${pickupLng}];
    const walker = ${hasWalker ? `[${walkerLat}, ${walkerLng}]` : 'null'};
    const map = L.map('map', { zoomControl: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);
    const pickupMarker = L.marker(pickup).addTo(map).bindPopup('Recogida');
    let walkerMarker = walker ? L.marker(walker).addTo(map).bindPopup('Paseador') : null;
    let line = walker ? L.polyline([pickup, walker], { color: '#1B7A4A', weight: 3 }).addTo(map) : null;
    function fit(a, b) {
      if (b) map.fitBounds([a, b], { padding: [28, 28], maxZoom: 16 });
      else map.setView(a, 15);
    }
    fit(pickup, walker);
    function apply(d) {
      const p = [d.pickupLat, d.pickupLng];
      pickupMarker.setLatLng(p);
      if (d.walkerLat != null && d.walkerLng != null) {
        const w = [d.walkerLat, d.walkerLng];
        if (walkerMarker) walkerMarker.setLatLng(w);
        else walkerMarker = L.marker(w).addTo(map).bindPopup('Paseador');
        if (line) line.setLatLngs([p, w]);
        else line = L.polyline([p, w], { color: '#1B7A4A', weight: 3 }).addTo(map);
        fit(p, w);
      } else {
        fit(p, null);
      }
    }
    window.addEventListener('message', function (e) {
      if (!e.data || e.data.type !== 'walkies-track') return;
      apply(e.data);
    });
  </script>
</body>
</html>`;
}
