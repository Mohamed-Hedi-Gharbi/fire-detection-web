document.addEventListener('DOMContentLoaded', function() {
    const mapContainer = document.getElementById('mapContainer');
    const url = mapContainer ? mapContainer.getAttribute('data-url') : null;

    function getColor(fwi) {
        if (fwi <= 7) {
            return 'green'; // Low risk
        } else if (fwi <= 16) {
            return 'yellow'; // Moderate risk
        } else if (fwi <= 25) {
            return 'orange'; // High risk
        } else if (fwi <= 31) {
            return 'red'; // Very high risk
        } else {
            return 'purple'; // Extreme risk
        }
    }

    function getPredictionMessage(fwi) {
        if (fwi <= 7) {
            return 'Low risk';
        } else if (fwi <= 16) {
            return 'Moderate risk';
        } else if (fwi <= 25) {
            return 'High risk';
        } else if (fwi <= 31) {
            return 'Very high risk';
        } else {
            return 'Extreme risk';
        }
    }

    if (!mapContainer || !url) {
        console.error("Required elements are missing from the DOM.");
        return;
    }

    fetch(url)
        .then(response => response.json())
        .then(data => {
            let defaultLat = 0;
            let defaultLng = 0;

            if (data.city) {
                defaultLat = parseFloat(data.city.latitude);
                defaultLng = parseFloat(data.city.longitude);
            }

            const map = L.map('map').setView([defaultLat, defaultLng], 15);

            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 17,
            }).addTo(map);

            const markers = {};
            const polygons = {};
            const storedNodeData = loadNodeDataFromLocalStorage();

            if (data.parcelles && data.parcelles.length > 0) {
                const bounds = [];
                data.parcelles.forEach(parcelle => {
                    let maxFwi = 0;
                    parcelle.nodes.forEach(node => {
                        const nodeData = storedNodeData[node.ref] || node.last_data || {};
                        const fwi = nodeData.fwi || 0;
                        if (fwi > maxFwi) {
                            maxFwi = fwi;
                        }
                    });

                    const polygon = L.polygon(parcelle.coordinates, {
                        color: getColor(maxFwi),
                        weight: 3.5,
                        opacity: 1,
                        fillOpacity: 0.1,
                        fillColor: getColor(maxFwi)
                    });
                    polygon.addTo(map);
                    bounds.push(...parcelle.coordinates);

                    polygons[parcelle.id] = polygon;

                    parcelle.nodes.forEach(node => {
                        const marker = L.marker([node.latitude, node.longitude]);
                        const nodeData = storedNodeData[node.ref] || node.last_data || {};
                        const popupContent = `
                            <div class="node-popup">
                                <div class="node-label" style="background-color: ${getColor(nodeData.fwi || 0)};">Node</div><br>
                                <b>Name:</b> ${node.name}<br>
                                <b>ID Parcelle:</b> ${node.ref}<br>
                                <b>RSSI:</b> ${nodeData.rssi || 'N/A'}<br>
                                <b>FWI:</b> ${nodeData.fwi || 'N/A'}<br>
                                <b>Prediction result:</b><span style="color: ${getColor(nodeData.fwi || 0)}; font-weight: bold;">${getPredictionMessage(nodeData.fwi || 0)}</span><br><br>
                                <b>Temperature:</b> ${nodeData.temperature || 'N/A'} °C<br>
                                <b>Humidity:</b> ${nodeData.humidity || 'N/A'} %<br>
                                <b>Pressure:</b> ${nodeData.pressure || 'N/A'} hPa<br>
                                <b>Gaz:</b> ${nodeData.gaz || 'N/A'} ppm<br>
                                <b>Wind speed:</b> ${nodeData.wind_speed ? nodeData.wind_speed.toFixed(2) : 'N/A'} km/h<br>
                            </div>
                        `;
                        marker.bindPopup(popupContent);
                        marker.addTo(map);

                        if (!markers[node.ref]) {
                            markers[node.ref] = [];
                        }
                        markers[node.ref].push(marker);
                    });
                });
                map.fitBounds(bounds);
            } else {
                console.log("No parcels found for this project.");
            }

            const socket = new WebSocket("ws://195.35.24.22:8000/ws/mqtt/");

            socket.onmessage = function(event) {
                const data = JSON.parse(event.data);
                if (data.message === 'MQTT data received') {
                    const nodeData = data.data;
                    const nodeMarkers = markers[nodeData.device_id];
                    if (nodeMarkers) {
                        nodeMarkers.forEach(marker => {
                            const updatedContent = `
                                <div class="node-popup">
                                    <div class="node-label" style="background-color: ${getColor(nodeData.fwi || 0)};">Node</div><br>
                                    <b>ID Parcelle:</b> ${nodeData.device_id}<br>
                                    <b>RSSI:</b> ${nodeData.rssi || 'N/A'}<br>
                                    <b>FWI:</b> ${nodeData.fwi || 'N/A'}<br>
                                    <b>Prediction result:</b><span style="color: ${getColor(nodeData.fwi || 0)}; font-weight: bold;">${getPredictionMessage(nodeData.fwi || 0)}</span><br><br>
                                    <b>Temperature:</b> ${nodeData.temperature || 'N/A'} °C<br>
                                    <b>Humidity:</b> ${nodeData.humidity || 'N/A'} %<br>
                                    <b>Pressure:</b> ${nodeData.pressure || 'N/A'} hPa<br>
                                    <b>Gaz:</b> ${nodeData.gaz || 'N/A'} ppm<br>
                                    <b>Wind speed:</b> ${nodeData.wind_speed ? nodeData.wind_speed.toFixed(2) : 'N/A'} km/h<br>
                                </div>
                            `;
                            marker.setPopupContent(updatedContent);
                        });
                        saveNodeDataToLocalStorage(nodeData.device_id, nodeData);
                    }

                    for (const parcelleId in polygons) {
                        if (polygons.hasOwnProperty(parcelleId)) {
                            const polygon = polygons[parcelleId];
                            const color = getColor(nodeData.fwi || 0);
                            polygon.setStyle({ fillColor: color });
                        }
                    }
                }
            };

            socket.onopen = function(event) {
                console.log("WebSocket connection established");
            };

            socket.onclose = function(event) {
                console.log("WebSocket connection closed");
            };

            socket.onerror = function(error) {
                console.error("WebSocket error: ", error);
            };

            document.querySelectorAll('.locate-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const lat = parseFloat(this.getAttribute('data-lat'));
                    const lng = parseFloat(this.getAttribute('data-lng'));
                    const name = this.getAttribute('data-name');
                    const ref = this.getAttribute('data-ref');
                    const nodeData = storedNodeData[ref] || {};
                    const popupContent = `
                        <div class="node-popup">
                            <div class="node-label" style="background-color: ${getColor(nodeData.fwi || 0)};">Node</div><br>
                            <b>Name:</b> ${name}<br>
                            <b>ID Parcelle:</b> ${ref}<br>
                            <b>RSSI:</b> ${nodeData.rssi || 'N/A'}<br>
                            <b>FWI:</b> ${nodeData.fwi || 'N/A'}<br>
                            <b>Prediction result:</b> <span style="color: ${getColor(nodeData.fwi || 0)}; font-weight: bold;">${getPredictionMessage(nodeData.fwi || 0)}</span><br><br>
                            <b>Temperature:</b> ${nodeData.temperature || 'N/A'} °C<br>
                            <b>Humidity:</b> ${nodeData.humidity || 'N/A'} %<br>
                            <b>Pressure:</b> ${nodeData.pressure || 'N/A'} hPa<br>
                            <b>Gaz:</b> ${nodeData.gaz || 'N/A'} ppm<br>
                            <b>Wind speed:</b> ${nodeData.wind_speed ? nodeData.wind_speed.toFixed(2) : 'N/A'} km/h<br>
                        </div>
                    `;
                    const tempMarker = L.marker([lat, lng]).addTo(map).bindPopup(popupContent).openPopup();
                    map.setView([lat, lng], 18);  // Ajuster le niveau de zoom
                    setTimeout(() => {
                        const popup = tempMarker.getPopup().getElement();
                        popup.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 200);  // Délai pour s'assurer que le popup est bien ouvert
                });
            });

        })
        .catch(error => console.error('Error fetching parcels:', error));

    function saveNodeDataToLocalStorage(ref, data) {
        const nodeDataCache = loadNodeDataFromLocalStorage();
        nodeDataCache[ref] = data;
        localStorage.setItem('nodeDataCache', JSON.stringify(nodeDataCache));
    }

    function loadNodeDataFromLocalStorage() {
        const nodeDataCache = localStorage.getItem('nodeDataCache');
        return nodeDataCache ? JSON.parse(nodeDataCache) : {};
    }
});
