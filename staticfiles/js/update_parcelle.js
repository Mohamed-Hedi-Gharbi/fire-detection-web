document.addEventListener('DOMContentLoaded', function() {
    const customParcelsNodesModal = new bootstrap.Modal(document.getElementById('customParcelsNodesModal'), {
        backdrop: 'static',
        keyboard: false
    });

    document.querySelectorAll('#showCustomParcelsNodesModal').forEach(function(button) {
        button.addEventListener('click', function() {
            const projectId = this.getAttribute('data-project-id');
            const projectName = this.getAttribute('data-project-name');

            const modalTitle = document.getElementById('customParcelsNodesModalLabel');
            modalTitle.innerHTML = `UPDATE NODE AND PARCELLE OF PROJECT: <span style="color: black;">${projectName}</span>`;
            
            loadParcelsNodesMap(projectId);
            customParcelsNodesModal.show();
        });
    });

    function loadParcelsNodesMap(projectId) {
        const mapElement = document.getElementById('customParcelsNodesMap');
        if (!mapElement) {
            console.error("Map element is missing.");
            return;
        }
        
        // Remove any existing map instance
        if (window.customMap) {
            window.customMap.remove();
        }
        
        fetch(`/dashboard_super/get_project_details/${projectId}/`)
            .then(response => response.json())
            .then(projectData => {
                const latitude = projectData.latitude;
                const longitude = projectData.longitude;

                const map = window.customMap = L.map(mapElement).setView([latitude, longitude], 15); // Center on project coordinates

                L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {}).addTo(map);

                fetch(`/dashboard_super/get_parcelles_with_nodes_for_project/?project_id=${projectId}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.parcelles && data.parcelles.length > 0) {
                            const bounds = [];
                            data.parcelles.forEach(parcelle => {
                                const polygon = L.polygon(parcelle.coordinates);
                                polygon.feature = { properties: { id: parcelle.id } };
                                polygon.addTo(map);
                                bounds.push(...parcelle.coordinates);

                                parcelle.nodes.forEach(node => {
                                    const marker = L.marker([node.latitude, node.longitude]);
                                    marker.bindPopup(
                                        `<b>Name:</b> ${node.name}<br>
                                         <b>Ref:</b> ${node.ref}`
                                    );
                                    marker.addTo(map);
                                });
                            });
                            map.fitBounds(bounds);
                        } else {
                            console.log("No parcels found for this project.");
                        }
                    })
                    .catch(error => console.error('Error fetching parcels:', error));

                let drawnItemsPolygon = new L.FeatureGroup();
                map.addLayer(drawnItemsPolygon);

                let drawnItemsMarker = new L.FeatureGroup();
                map.addLayer(drawnItemsMarker);

                let drawControlPolygon = new L.Control.Draw({
                    edit: {
                        featureGroup: drawnItemsPolygon
                    },
                    draw: {
                        polygon: true,
                        polyline: false,
                        rectangle: false,
                        circle: false,
                        marker: false,
                        circlemarker: false
                    }
                });
                map.addControl(drawControlPolygon);

                let drawControlMarker = new L.Control.Draw({
                    edit: {
                        featureGroup: drawnItemsMarker
                    },
                    draw: {
                        polygon: false,
                        polyline: false,
                        rectangle: false,
                        circle: false,
                        marker: true,
                        circlemarker: false
                    }
                });
                map.addControl(drawControlMarker);

                map.on(L.Draw.Event.CREATED, function(event) {
                    const layer = event.layer;
                    if (event.layerType === 'polygon') {
                        drawnItemsPolygon.addLayer(layer);
                    } else if (event.layerType === 'marker') {
                        drawnItemsMarker.addLayer(layer);
                    }
                });

                document.getElementById('customParcelsNodesUpdateButton').addEventListener('click', function() {
                    updateParcelsNodes(projectId, drawnItemsPolygon, drawnItemsMarker);
                });
            })
            .catch(error => console.error('Error fetching project details:', error));
    }

    function updateParcelsNodes(projectId, drawnItemsPolygon, drawnItemsMarker) {
        const layersPolygon = drawnItemsPolygon.getLayers();
        const layersMarker = drawnItemsMarker.getLayers();

        if (layersPolygon.length === 0 && layersMarker.length === 0) {
            alert('Please draw at least one polygon or marker on the map.');
            return;
        }

        const coordinatesPolygon = layersPolygon.map(layer => layer.getLatLngs()[0].map(latlng => [latlng.lat, latlng.lng]));
        const coordinatesMarker = layersMarker.map(layer => layer.getLatLng());

        fetch('/dashboard_super/update_parcels_nodes/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: JSON.stringify({
                project_id: projectId,
                polygons: coordinatesPolygon,
                markers: coordinatesMarker
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert('Parcels and nodes updated successfully.');
                customParcelsNodesModal.hide();
            } else if (data.error) {
                alert('Error updating parcels and nodes.');
            }
        })
        .catch(error => console.error('Error:', error));
    }
});
