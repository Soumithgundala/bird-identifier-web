import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const TestMap = () => {
  return (
    <div style={{ height: "500px" }}>
      <MapContainer center={[40, -95]} zoom={6}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />
        <Marker position={[40, -95]}>
          <Popup>Test Marker</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default TestMap;