var ctxHum = document.getElementById('humidityChart').getContext('2d');
var humidityChart = new Chart(ctxHum, {
    type: 'line',
    data: {
    labels: ['0h', '1h', '2h', '3h', '4h', '5h', '6h', '7h', '8h', '9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h', '19h', '20h', '21h', '22h', '23h'],
    datasets: [{
        label: 'Daily Humidity',
        data: [80, 78, 77, 76, 75, 74, 73, 72, 71, 70, 69, 68, 69, 70, 70, 69, 67, 68, 65, 60, 59, 58, 57, 56],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        fill: true,  // Enable fill
        tension: 0.1
    }]
    },
    options: {
    scales: {
        x: {
        title: {
            display: true,
            text: 'Hours'
        }
        },
        y: {
        title: {
            display: true,
            text: 'Humidity (%)'
        },
        suggestedMin: 50,
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
        text: 'Daily Humidity'
        },
        tooltip: {
        callbacks: {
            label: function(context) {
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