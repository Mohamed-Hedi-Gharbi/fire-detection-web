document.addEventListener('DOMContentLoaded', function() {
    const mapContainer = document.getElementById('mapContainer');
    const url = mapContainer ? mapContainer.getAttribute('data-url') : null;

    if (!mapContainer || !url) {
        console.error("Required elements are missing from the DOM.");
        return;
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            let defaultLat = 0;
            let defaultLng = 0;

            // Use city coordinates if available
            if (data.city) {
                defaultLat = parseFloat(data.city.latitude);
                defaultLng = parseFloat(data.city.longitude);
            }

            const map = L.map('map').setView([defaultLat, defaultLng], 15);

            L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}{r}.jpg?api_key=804a57a3-dbf8-4d82-a63f-b6cac9e41dc2', {
                maxZoom: 17,
            }).addTo(map);

            if (data.parcelles && data.parcelles.length > 0) {
                const bounds = [];
                data.parcelles.forEach(parcelle => {
                    const polygon = L.polygon(parcelle.coordinates);
                    polygon.addTo(map);
                    bounds.push(...parcelle.coordinates);
                });
                map.fitBounds(bounds);
            } else {
                console.log("No parcels found for this project.");
            }
        })
        .catch(error => console.error('Error fetching parcels:', error));
});