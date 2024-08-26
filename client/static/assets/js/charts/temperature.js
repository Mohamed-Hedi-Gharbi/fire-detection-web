document.addEventListener('DOMContentLoaded', function() {
    const temperatureChartElement = document.querySelector('.card-header[data-project-id][data-node-id]');
    if (!temperatureChartElement) {
        console.error('Element avec project-id et node-id non trouvé.');
        return;
    }

    const projectId = temperatureChartElement.getAttribute('data-project-id');
    const nodeId = temperatureChartElement.getAttribute('data-node-id');

    if (!projectId || !nodeId) {
        console.error('projectId ou nodeId non trouvé dans les attributs de l\'élément.');
        return;
    }

    console.log(`projectId: ${projectId}, nodeId: ${nodeId}`);

    const ctxTemp = document.getElementById('temperatureChart').getContext('2d');
    const temperatureChart = new Chart(ctxTemp, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Temperature (°C) per Hour',
                data: [],
                backgroundColor: 'rgba(0, 123, 255, 0.2)',
                borderColor: 'rgba(0, 123, 255, 1)',
                borderWidth: 2,
                fill: true,
                tension: 0.1,
                pointRadius: 3,
                pointBackgroundColor: 'rgba(0, 123, 255, 1)'
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'hour',
                        stepSize: 1,
                        displayFormats: {
                            hour: 'HH:mm'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Time (Hourly Intervals)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Temperature (°C)'
                    },
                    suggestedMin: 5,
                    suggestedMax: 45
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Temperature (°C) per Hour'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y + '°C';
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });

    const url = `/dashboard_client/node_detail/${projectId}/${nodeId}/`;

    fetch(url, {
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        const labels = data.temperatures.map(entry => new Date(entry.interval));
        const temperatures = data.temperatures.map(entry => entry.temperature);

        // Vérifier et trier les dates
        labels.forEach(label => {
            if (isNaN(label.getTime())) {
                console.error('Date incorrecte détectée:', label);
            }
        });

        // Trier les labels et les données
        const sortedData = labels.map((label, index) => ({ label, temperature: temperatures[index] }))
                                .sort((a, b) => a.label - b.label);

        temperatureChart.data.labels = sortedData.map(entry => entry.label);
        temperatureChart.data.datasets[0].data = sortedData.map(entry => entry.temperature);
        temperatureChart.update();
    })
    .catch(error => console.error('Error fetching temperature data:', error));

    const socket = new WebSocket("ws://195.35.24.22:8000/ws/mqtt/");

    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.message === 'MQTT data received') {
            const newData = data.data;
            const newLabel = new Date(newData.timestamp);
            const newTemperature = newData.temperature;

            if (!isNaN(newLabel.getTime())) {
                // Add new data
                temperatureChart.data.labels.push(newLabel);
                temperatureChart.data.datasets[0].data.push(newTemperature);

                // Remove data older than 24 hours
                const now = new Date();
                while (temperatureChart.data.labels.length > 0 && (now - new Date(temperatureChart.data.labels[0])) > 24 * 60 * 60 * 1000) {
                    temperatureChart.data.labels.shift();
                    temperatureChart.data.datasets[0].data.shift();
                }

                // Trier les données après ajout
                const sortedData = temperatureChart.data.labels.map((label, index) => ({ label, temperature: temperatureChart.data.datasets[0].data[index] }))
                                                                .sort((a, b) => a.label - b.label);

                temperatureChart.data.labels = sortedData.map(entry => entry.label);
                temperatureChart.data.datasets[0].data = sortedData.map(entry => entry.temperature);

                temperatureChart.update();
            } else {
                console.error('Date incorrecte détectée:', newLabel);
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
});
