import { useState } from "react";
import "./BirdUpload.css";

const BirdUpload = () => {
  const [preview, setPreview] = useState("");
  const [species, setSpecies] = useState("");
  const [lifeSpan, setLifeSpan] = useState("");
  const [scientificName, setScientificName] = useState("");
  const [commonFood, setCommonFood] = useState("");
  const [commonPredators, setCommonPredators] = useState("");
  const [description, setDescription] = useState("");
  const [soundUrls, setSoundUrls] = useState([]);
  const [birdImages, setBirdImages] = useState([]);
  const [nestImage, setNestImage] = useState(""); // NEW: Nest Image
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setSpecies("");
      setScientificName("");
      setLifeSpan("");
      setCommonFood("");
      setCommonPredators("");
      setDescription("");
      setSoundUrls([]);
      setBirdImages([]);
      setNestImage(""); // Reset nest image
      setError("");
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const file = e.target.elements.image.files[0];

    if (!preview) {
      setError("Please select an image first!");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", e.target.image.files[0]);

      const response = await fetch("http://localhost:5000/classify-bird", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Classification failed");

      setSpecies(data.species);
      setScientificName(data.scientificName);
      setLifeSpan(data.lifespan);
      setCommonFood(data.commonFood);
      setCommonPredators(data.commonPredators);
      setDescription(data.description);
      setSoundUrls(data.soundUrls || []);
      setBirdImages(data.birdImages || []);
      setNestImage(data.nestImage || []); // NEW: Get Nest Image URL

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="container">
      <form onSubmit={handleSubmit}>
        <div className="upload-section">
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            hidden
          />
          <label htmlFor="image" className="upload-btn">
            Choose Image
          </label>
        </div>

        <div className="search-container">
          <input 
            type="text" 
            className="search-bar" 
            placeholder="Search bird species..."
          />
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? "Analyzing..." : "Identify Species"}
        </button>

        {error && <div className="error">{error}</div>}

        {species && (
          <div className="results">
            <h2 className="highlight-header">Identification Results</h2>

            {/* Bird Details */}
            <div className="text-content">
              <div className="species"><strong>Species:</strong> {species}</div>
              <div className="scientificName"><strong>Scientific Name:</strong> {scientificName}</div>
              <div className="lifespan"><strong>Lifespan:</strong> {lifeSpan}</div>
              <div className="commonFood"><strong>Common Food:</strong> {commonFood}</div>
              <div className="commonPredators"><strong>Common Predators:</strong> {commonPredators}</div>
              <div className="description">{description}</div>
            </div>

            {/* Bird Sounds Section */}
            {soundUrls.length > 0 ? (
              <div className="sound-section">
                <h3>Bird Sounds</h3>
                {soundUrls.map((url, index) => (
                  <audio key={index} controls className="audio-player">
                    <source src={url} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                ))}
              </div>
            ) : (
              <div className="no-sound">No sound samples available</div>
            )}

            {/* Updated Image Section */}
            <div className="image-section">
              <div className="image-container">
                <h3>Bird Images</h3>
                <div className="image-grid">
                  {birdImages.map((img, index) => (
                    <img 
                      key={index} 
                      src={img} 
                      alt={`${species} example ${index + 1}`}
                      className="bird-image"
                    />
                  ))}
                </div>
              </div>
              
              {nestImage.length > 0 && (
                <div className="image-container">
                  <h3>Nest Images</h3>
                  <div className="image-grid">
                    {nestImage.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt={`${species} nest example ${index + 1}`}
                        className="nest-image"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default BirdUpload;