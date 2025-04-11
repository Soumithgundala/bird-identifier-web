import React, { useState, useRef, useEffect } from "react";
import "./BirdUpload.css";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default,
  iconUrl: require('leaflet/dist/images/marker-icon.png').default,
  shadowUrl: require('leaflet/dist/images/marker-shadow.png').default,
});
// // Fix leaflet marker icons
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//     iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
//     iconUrl: require('leaflet/dist/images/marker-icon.png'),
//     shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
// });

const BirdUpload = () => {
    const [preview, setPreview] = useState("");
    const [speciesData, setSpeciesData] = useState(null);
    const [birdLocations, setBirdLocations] = useState([]);
    const [migrationPath, setMigrationPath] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef(null);
    const mapRef = useRef();
    const [mlModel, setMlModel] = useState(null); // State for the ML model
    const [mlPredictions, setMlPredictions] = useState([]);

    // Load MobileNet model when the component mounts
    useEffect(() => {
        const loadMobileNetModel = async () => {
            try {
                await tf.ready(); 
                console.log("Loading MobileNet model...");
                const model = await mobilenet.load();
                setMlModel(model);
                console.log("MobileNet model loaded successfully.");
            } catch (error) {
                console.error("Error loading MobileNet model:", error);
                setError("Failed to load MobileNet model. Please try again.");
            }
        };

        loadMobileNetModel();
    }, []);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result);
        reader.readAsDataURL(file);
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!preview) {
            setError("Please select an image first!");
            return;
        }
        setLoading(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append("image", fileInputRef.current.files[0]);

            // Perform ML analysis using TensorFlow.js (if model is loaded)
            if (mlModel) {
                const imageElement = document.createElement('img');
                imageElement.src = preview; // Use the image preview as the source

                imageElement.onload = async () => {
                    try {
                        const predictions = await mlModel.classify(imageElement);
                        console.log("ML Predictions:", predictions);
                        setMlPredictions(predictions); // Set ML predictions to state
                    } catch (mlError) {
                        console.error("Error during ML analysis:", mlError);
                        setError("ML analysis failed.");
                    } finally {
                        setLoading(false); // Ensure loading is set to false
                    }
                };

                imageElement.onerror = () => {
                    console.error("Error loading image for ML analysis.");
                    setError("Failed to load image for ML analysis.");
                    setLoading(false);
                };
            }
            else {
                setLoading(false)
                setError("Model not loaded");
            }

            // Send image to backend for classification
            const classificationResponse = await axios.post(
                "http://localhost:5000/classify-bird",
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            if (!classificationResponse.data.success) {
                throw new Error(classificationResponse.data.error || "Classification failed");
            }

            const responseData = classificationResponse.data;
            setSpeciesData(responseData);

            // Fetch bird locations based on the returned species
            const locationsResponse = await axios.get("http://localhost:5000/bird-locations", {
                params: {
                    species: responseData.scientificName,
                    lat: 40,
                    lng: -95,
                    dist: 50,
                },
            });

            if (locationsResponse.data.success) {
                const observations = locationsResponse.data.observations
                    .filter(obs => obs.lat && obs.lng)
                    .map(obs => ({
                        ...obs,
                        lat: Number(obs.lat),
                        lng: Number(obs.lng)
                    }));

                setBirdLocations(observations);

                // Create migration path
                const sortedObs = observations.sort((a, b) =>
                    new Date(a.obsDt) - new Date(b.obsDt)
                );
                setMigrationPath(sortedObs.map(obs => [obs.lat, obs.lng]));
            }
        } catch (err) {
            setError(err.message || "Failed to process image");
        } finally {
            //setLoading(false);
        }
    };

    return (
        <div className="container">
            <form onSubmit={handleSubmit}>
                <div className="upload-section">
                    <input
                        ref={fileInputRef}
                        type="file"
                        id="image"
                        accept="image/*"
                        onChange={handleImageChange}
                        hidden
                    />
                    <label htmlFor="image" className="upload-btn">
                        {preview ? "Change Image" : "Choose Image"}
                    </label>
                    {preview && (
                        <div className="image-preview">
                            <img src={preview} alt="Upload preview" />
                        </div>
                    )}
                </div>
                <button type="submit" disabled={loading || !mlModel} className="submit-btn">
                    {loading ? (
                        <>
                            <span className="spinner"></span>
                            Analyzing...
                        </>
                    ) : (
                        "Identify Species"
                    )}
                </button>
                {error && <div className="error">{error}</div>}
            </form>

            {mlPredictions.length > 0 && (
                <div className="ml-results">
                    <h2>TensorFlow.js Predictions:</h2>
                    <ul>
                        {mlPredictions.map((prediction, index) => (
                            <li key={index}>
                                {prediction.className}: {prediction.probability.toFixed(3)}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {speciesData && (
                <div className="results">
                    <h2 className="highlight-header">Identification Results</h2>
                    <div className="text-content">
                        <div className="species">
                            <strong>Species:</strong> {speciesData.species}
                        </div>
                        <div className="scientificName">
                            <strong>Scientific Name:</strong> {speciesData.scientificName}
                        </div>
                        <div className="lifespan">
                            <strong>Lifespan:</strong> {speciesData.lifespan}
                        </div>
                        <div className="commonFood">
                            <strong>Common Food:</strong> {speciesData.commonFood}
                        </div>
                        <div className="commonPredators">
                            <strong>Common Predators:</strong> {speciesData.commonPredators}
                        </div>
                        <div className="description">{speciesData.description}</div>
                    </div>

                    <div className="media-sections">
                        <section className="sound-section">
                            <h3>Bird Sounds</h3>
                            <div className="audio-grid">
                                {speciesData.soundUrls?.length > 0 ? (
                                    speciesData.soundUrls.map((url, index) => (
                                        <audio key={index} controls className="audio-player">
                                            <source src={`${url}?t=${Date.now()}`} type="audio/mpeg" />
                                            Your browser does not support audio
                                        </audio>
                                    ))
                                ) : (
                                    <div className="no-content">No sound samples available</div>
                                )}
                            </div>
                        </section>

                        <section className="image-section">
                            <div className="bird-images">
                                <h3>Bird Images</h3>
                                <div className="image-grid">
                                    {speciesData.images?.bird?.map((img, index) => (
                                        <img
                                            key={`bird-${index}-${Date.now()}`}
                                            src={`${img}?t=${Date.now()}`}
                                            alt={`${speciesData.species} example ${index + 1}`}
                                            loading="lazy"
                                        />
                                    ))}
                                </div>
                            </div>

                            {speciesData.images?.nest?.length > 0 && (
                                <div className="nest-images">
                                    <h3>Nest Images</h3>
                                    <div className="image-grid">
                                        {speciesData.images.nest.map((img, index) => (
                                            <img
                                                key={`nest-${index}-${Date.now()}`}
                                                src={`${img}?t=${Date.now()}`}
                                                alt={`${speciesData.species} nest example ${index + 1}`}
                                                loading="lazy"
                                            />
                                            
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            )}

            {birdLocations.length > 0 && (
                <div className="map-section">
                    <h2>Common Locations & Migration Route</h2>
                    <MapContainer
                        ref={mapRef}
                        center={[40, -95]}
                        zoom={6}
                        style={{ height: "500px", width: "100%" }}
                    >
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="&copy; OpenStreetMap contributors"
                        />
                        {birdLocations.map((obs, index) => (
                            <Marker key={index} position={[obs.lat, obs.lng]}>
                                <Popup>
                                    <strong>{obs.comName}</strong>
                                    <br />
                                    {obs.locName}
                                    <br />
                                    Observed: {new Date(obs.obsDt).toLocaleDateString()}
                                </Popup>
                            </Marker>
                        ))}
                        {migrationPath.length > 1 && (
                            <Polyline
                                positions={migrationPath}
                                color="blue"
                                pathOptions={{ smoothFactor: 1.5 }}
                            />
                        )}
                    </MapContainer>
                </div>
            )}
        </div>
    );
};
export default BirdUpload;
