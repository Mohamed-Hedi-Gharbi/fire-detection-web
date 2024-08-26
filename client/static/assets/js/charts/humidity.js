document.addEventListener('DOMContentLoaded', function() {
    const humidityChartElement = document.querySelector('.card-header[data-project-id][data-node-id]');
    if (!humidityChartElement) {
        console.error('Element avec project-id et node-id non trouvé.');
        return;
    }

    const projectId = humidityChartElement.getAttribute('data-project-id');
    const nodeId = humidityChartElement.getAttribute('data-node-id');

    if (!projectId || !nodeId) {
        console.error('projectId ou nodeId non trouvé dans les attributs de l\'élément.');
        return;
    }

    const ctxHumidity = document.getElementById('humidityChart').getContext('2d');
    const humidityChart = new Chart(ctxHumidity, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Humidity (%) per Hour',
                data: [],
                backgroundColor: 'rgba(0, 255, 123, 0.2)',
                borderColor: 'rgba(0, 255, 123, 1)',
                borderWidth: 2,
                fill: true,
                tension: 0.1,
                pointRadius: 3,
                pointBackgroundColor: 'rgba(0, 255, 123, 1)'
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
                        text: 'Humidity (%)'
                    },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Humidity (%) per Hour'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y + '%';
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
        const labels = data.humidity.map(entry => new Date(entry.interval));
        const humidity = data.humidity.map(entry => entry.humidity);

        // Vérifier et trier les dates
        labels.forEach(label => {
            if (isNaN(label.getTime())) {
                console.error('Date incorrecte détectée:', label);
            }
        });

        // Trier les labels et les données
        const sortedData = labels.map((label, index) => ({ label, humidity: humidity[index] }))
                                .sort((a, b) => a.label - b.label);

        humidityChart.data.labels = sortedData.map(entry => entry.label);
        humidityChart.data.datasets[0].data = sortedData.map(entry => entry.humidity);
        humidityChart.update();
    })
    .catch(error => console.error('Error fetching humidity data:', error));

    const socket = new WebSocket("ws://195.35.24.22:8000/ws/mqtt/");

    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.message === 'MQTT data received') {
            const newData = data.data;
            const newLabel = new Date(newData.timestamp);
            const newHumidity = newData.humidity;

            if (!isNaN(newLabel.getTime())) {
                // Add new data
                humidityChart.data.labels.push(newLabel);
                humidityChart.data.datasets[0].data.push(newHumidity);

                // Remove data older than 24 hours
                const now = new Date();
                while (humidityChart.data.labels.length > 0 && (now - new Date(humidityChart.data.labels[0])) > 24 * 60 * 60 * 1000) {
                    humidityChart.data.labels.shift();
                    humidityChart.data.datasets[0].data.shift();
                }

                // Trier les données après ajout
                const sortedData = humidityChart.data.labels.map((label, index) => ({ label, humidity: humidityChart.data.datasets[0].data[index] }))
                                                            .sort((a, b) => a.label - b.label);

                humidityChart.data.labels = sortedData.map(entry => entry.label);
                humidityChart.data.datasets[0].data = sortedData.map(entry => entry.humidity);

                humidityChart.update();
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
