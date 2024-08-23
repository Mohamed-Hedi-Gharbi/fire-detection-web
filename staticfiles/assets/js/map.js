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

            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 17,
            }).addTo(map);

            if (data.parcelles && data.parcelles.length > 0) {
                const bounds = [];
                data.parcelles.forEach(parcelle => {
                    const polygon = L.polygon(parcelle.coordinates, {
                        color: 'blue',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.5
                    });
                    polygon.addTo(map);
                    bounds.push(...parcelle.coordinates);

                    // Display nodes for each parcel
                    parcelle.nodes.forEach(node => {
                        const marker = L.marker([node.latitude, node.longitude]);
                        marker.bindPopup(
                            `   <b>Name:</b>${node.name}<br>
                                <b>Ref:</b>${node.ref}
                            `);
                        marker.addTo(map);
                    });
                });
                map.fitBounds(bounds);
            } else {
                console.log("No parcels found for this project.");
            }
        })
        .catch(error => console.error('Error fetching parcels:', error));
});
