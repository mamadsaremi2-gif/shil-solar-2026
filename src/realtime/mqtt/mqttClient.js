import mqtt from "mqtt";

export const mqttClient =
  mqtt.connect(
    "wss://broker.hivemq.com:8884/mqtt"
  );
