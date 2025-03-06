import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from 'react';
import axios from 'axios';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const BirdMap = ({ speciesName }) => {
  const [locations, setLocations] = useState([]);
  const [migrationPath, setMigrationPath] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const response = await axios.get(
          `https://xeno-canto.org/api/2/recordings?query=${encodeURIComponent(speciesName)}&q:A`
        );

        const validRecords = response.data.recordings.filter(
          record => record.lat && record.lng
        );

        const uniqueLocations = Array.from(new Set(validRecords.map(r => `${r.lat},${r.lng}`)))
          .map(pair => {
            const [lat, lng] = pair.split(',');
            return { lat: parseFloat(lat), lng: parseFloat(lng) };
          });

        // Calculate simple migration path (first to last point)
        if (uniqueLocations.length > 1) {
          setMigrationPath([
            [uniqueLocations[0].lat, uniqueLocations[0].lng],
            [uniqueLocations[uniqueLocations.length - 1].lat, uniqueLocations[uniqueLocations.length - 1].lng]
          ]);
        }

        setLocations(uniqueLocations);
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLoading(false);
      }
    };

    if (speciesName) {
      fetchLocations();
    }
  }, [speciesName]);

  if (loading) return <div className="map-loading">Loading map...</div>;
  if (!locations.length) return <div className="map-no-data">No location data available</div>;

  return (
    <div className="bird-map-container">
      <h3>Distribution and Migration Patterns</h3>
      <MapContainer
        center={[locations[0].lat, locations[0].lng]}
        zoom={3}
        style={{ height: '500px', width: '100%', borderRadius: '8px' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {locations.map((location, index) => (
          <Marker key={index} position={[location.lat, location.lng]}>
            <Popup>
              <div className="map-popup-content">
                <h4>{speciesName}</h4>
                <p>Observed Location</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {migrationPath.length > 0 && (
          <Polyline
            positions={migrationPath}
            color="#4a90e2"
            weight={2}
            dashArray="5, 5"
          />
        )}
      </MapContainer>
    </div>
  );
};

export default BirdMap; 