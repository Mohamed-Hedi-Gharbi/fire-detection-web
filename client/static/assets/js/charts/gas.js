document.addEventListener('DOMContentLoaded', function() {
    const gasChartElement = document.querySelector('.card-header[data-project-id][data-node-id]');
    if (!gasChartElement) {
        console.error('Element with data-project-id and data-node-id not found.');
        return;
    }

    const projectId = gasChartElement.getAttribute('data-project-id');
    const nodeId = gasChartElement.getAttribute('data-node-id');

    if (!projectId || !nodeId) {
        console.error('projectId or nodeId not found in the element attributes.');
        return;
    }

    const ctxGas = document.getElementById('gasChart').getContext('2d');
    const gasChart = new Chart(ctxGas, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Gas (ppm) per Hour',
                data: [],
                backgroundColor: 'rgba(255, 0, 0, 0.2)',
                borderColor: 'rgba(255, 0, 0, 1)',
                borderWidth: 2,
                fill: true,
                tension: 0.1,
                pointRadius: 3,
                pointBackgroundColor: 'rgba(255, 0, 0, 1)'
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
                        text: 'Gas (ppm)'
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
                    text: 'Gas (ppm) per Hour'
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += context.parsed.y + ' ppm';
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
        const labels = data.gas.map(entry => new Date(entry.interval));
        const gas = data.gas.map(entry => entry.gas);

        // Vérifier et trier les dates
        labels.forEach(label => {
            if (isNaN(label.getTime())) {
                console.error('Date incorrecte détectée:', label);
            }
        });

        // Trier les labels et les données
        const sortedData = labels.map((label, index) => ({ label, gas: gas[index] }))
                                .sort((a, b) => a.label - b.label);

        gasChart.data.labels = sortedData.map(entry => entry.label);
        gasChart.data.datasets[0].data = sortedData.map(entry => entry.gas);
        gasChart.update();
    })
    .catch(error => console.error('Error fetching gas data:', error));

    const socket = new WebSocket("ws://195.35.24.22:8000/ws/mqtt/");

    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.message === 'MQTT data received') {
            const newData = data.data;
            const newLabel = new Date(newData.timestamp);
            const newGas = newData.gas;

            if (!isNaN(newLabel.getTime())) {
                // Add new data
                gasChart.data.labels.push(newLabel);
                gasChart.data.datasets[0].data.push(newGas);

                // Remove data older than 24 hours
                const now = new Date();
                while (gasChart.data.labels.length > 0 && (now - new Date(gasChart.data.labels[0])) > 24 * 60 * 60 * 1000) {
                    gasChart.data.labels.shift();
                    gasChart.data.datasets[0].data.shift();
                }

                // Trier les données après ajout
                const sortedData = gasChart.data.labels.map((label, index) => ({ label, gas: gasChart.data.datasets[0].data[index] }))
                                                       .sort((a, b) => a.label - b.label);

                gasChart.data.labels = sortedData.map(entry => entry.label);
                gasChart.data.datasets[0].data = sortedData.map(entry => entry.gas);

                gasChart.update();
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
