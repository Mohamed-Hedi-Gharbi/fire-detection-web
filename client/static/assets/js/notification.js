document.addEventListener('DOMContentLoaded', function() {
    const socket = new WebSocket("ws://195.35.24.22:8000/ws/mqtt/");

    socket.onmessage = function(event) {
        const data = JSON.parse(event.data);
        if (data.message === 'MQTT data received' && data.data.detection === 1) {
            showNotification(data.data);
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

    function showNotification(data) {
        const notification = createNotificationElement(data);
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.remove('show');
            notification.addEventListener('transitionend', () => notification.remove());
        }, 15000); //* Hide after 15 seconds
    }

    function createNotificationElement(data) {
        const container = document.createElement('div');
        container.className = 'notification-container show';

        const header = document.createElement('div');
        header.className = 'notification-header';

        const title = document.createElement('h5');
        title.className = 'notification-title';
        title.innerHTML = `<img src="/static/assets/images/icons/danger.png" alt="Danger Icon" style="width: 24px; height: 24px; margin-right: 10px;"> Fire Alert Notification!`;

        const closeBtn = document.createElement('span');
        closeBtn.className = 'close';
        closeBtn.innerHTML = '&times;';
        closeBtn.onclick = function() {
            container.classList.remove('show');
            container.addEventListener('transitionend', () => container.remove());
        };

        const body = document.createElement('div');
        body.className = 'notification-body';
        body.innerHTML = `
            <p>Node ID: <strong>${data.device_id}</strong> has detected a potential fire. Please investigate immediately.</p>
        `;

        header.appendChild(title);
        header.appendChild(closeBtn);
        container.appendChild(header);
        container.appendChild(body);

        return container;
    }
});
