import json
import paho.mqtt.client as mqtt
from channels.generic.websocket import AsyncWebsocketConsumer
from supervisor.models.node import Node
from supervisor.models.data import Data
from django.utils import timezone
from asgiref.sync import async_to_sync
from .fwi import FWI

class MQTTConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()
        self.client = mqtt.Client()
        self.client.on_message = self.on_message
        self.client.username_pw_set("lorae5app2@ttn", "NNSXS.L7OEOKQDAZLRWX3BC735IQGORWL2ZZJZ2HPIQWI.NSSEJCLZWB5WVI6YXZUBVGDUB5RQ2HCDL6W5HFDCO6A5UVGKGAEQ")
        self.client.tls_set()
        self.client.connect("eu1.cloud.thethings.network", 8883, 60)
        self.client.subscribe("#", 2)
        self.client.loop_start()
        print("MQTT connection established successfully")

    async def disconnect(self, close_code):
        self.client.loop_stop()

    async def receive(self, text_data=None, bytes_data=None):
        if text_data:
            try:
                data = json.loads(text_data)
                await self.process_data(data)
            except json.JSONDecodeError:
                print("Invalid JSON received")
        else:
            print("No text data received")

    async def process_data(self, data):
        await self.send(text_data=json.dumps({
            'message': 'Data received',
            'data': data
        }))

    def on_message(self, client, userdata, message):
        parsed_json = json.loads(message.payload)
        
        if 'uplink_message' in parsed_json and 'decoded_payload' in parsed_json['uplink_message']:
            decoded_payload = parsed_json["uplink_message"]["decoded_payload"]
            temperature     = decoded_payload.get("temperature", "N/A")
            humidity        = decoded_payload.get("humidity", "N/A")
            gaz             = decoded_payload.get("gaz", "N/A")
            pressure        = decoded_payload.get("pressur", "N/A")
            rssi            = parsed_json["uplink_message"]["rx_metadata"][0].get("rssi", "N/A")
            device_id       = parsed_json["end_device_ids"]["device_id"]

            fwi = FWI()
            wind = fwi.calculate_wind(temperature, humidity, pressure)

            try:
                nodes = Node.objects.filter(reference=device_id)
                if nodes.exists():
                    for node in nodes:
                        try:
                            last_data = Data.objects.filter(node=node).latest('published_date')
                            ffmc_prev = last_data.ffmc if last_data else 85  # Utiliser une valeur par défaut si aucune donnée précédente
                        except Data.DoesNotExist:
                            ffmc_prev = 85  # Utiliser une valeur par défaut si aucune donnée précédente

                        ffmc_value = fwi.FFMC(temperature, humidity, wind, 0, ffmc_prev)
                        isi_value = fwi.ISI(wind, ffmc_value)
                        fwi_value = fwi.FWI(isi_value)  # Utiliser uniquement ISI pour le calcul de FWI
                        
                        node.FWI = fwi_value
                        node.save()

                        data = Data(
                            temperature=temperature,
                            humidity=humidity,
                            pressur=pressure,
                            gaz=gaz,
                            wind=wind,
                            ffmc=ffmc_value,
                            isi=isi_value,
                            fwi=fwi_value,
                            published_date=timezone.now(),
                            node=node
                        )
                        data.save()
                    print("Data saved successfully for all nodes")
                else:
                    print(f"No Node found with reference: {device_id}")
            except Exception as e:
                print(f"Error saving data: {e}")
            finally:
                async_to_sync(self.send_message_to_websocket)({
                    'temperature': temperature,
                    'humidity': humidity,
                    'gaz': gaz,
                    'pressure': pressure,
                    'rssi': rssi,
                    'wind_speed': wind,
                    'fwi': fwi_value, 
                    'device_id': device_id
                })
        else:
            print("Invalid message format: 'uplink_message' or 'decoded_payload' missing")

    async def send_message_to_websocket(self, data):
        await self.send(text_data=json.dumps({
            'message': 'MQTT data received',
            'data': data
        }))
