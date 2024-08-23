document.addEventListener('DOMContentLoaded', function() {
    const mapWrapper = document.getElementById('mapWrapper');
    if (!mapWrapper) {
        console.error('Map wrapper not found');
        return;
    }

    const latitude = 37.207400;
    const longitude = 10.116500;
    const zoomLevel = 12;  
    let map;

    window.onload = function() {
        const initializeMap = (lat, lng, zoom) => {
            if (map !== undefined) {
                map.remove();
            }

            map = L.map('map', {
                center: [lat, lng],
                zoom: zoom,
            });

            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {}).addTo(map);

            map.on('moveend', function() {
                const mapState = {
                    center: map.getCenter(),
                    zoom: map.getZoom(),
                };
                localStorage.setItem('mapState', JSON.stringify(mapState));
            });
        };

        initializeMap(latitude, longitude, zoomLevel);
    };
});
