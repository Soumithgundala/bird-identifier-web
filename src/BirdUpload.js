import { useState } from "react";
import "./BirdUpload.css";

const BirdUpload = () => {
  const [preview, setPreview] = useState("");
  const [species, setSpecies] = useState("");
  const [lifeSpan, setlifeSpan] = useState("");
  const [scientificName, setscietificName] = useState("");
  const [commonFood, setcommonFood] = useState("");
  const [commonPredators, setcommonPredators] = useState("");
  const [description, setDescription] = useState("");
  const [soundUrls, setsoundUrls] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreview(URL.createObjectURL(file));
      setSpecies("");
      setscietificName("");
      setlifeSpan("");
      setcommonFood("");
      setcommonPredators("");
      setDescription("");
      setsoundUrls("");
      setError("");
    }
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
      formData.append("image", e.target.image.files[0]);

      const response = await fetch("http://localhost:5000/classify-bird", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || "Classification failed");

      setSpecies(data.species);
      setscietificName(data.scientificName)
      setlifeSpan(data.lifespan);
      setcommonFood(data.commonFood);
      setcommonPredators(data.commonPredators)
      setDescription(data.description);
      setsoundUrls(data.soundUrl); 

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <form onSubmit={handleSubmit}>
        <div className="upload-section"></div>
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
          <div className="container">
          <div className="search-container">
          <input 
          type="text" 
          className="search-bar" 
          placeholder="Search bird species..."
          />
          </div>
</div>
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? "Analyzing..." : "Identify Species"}
        </button>

        {error && <div className="error">{error}</div>}

        {species && (
          <div className="results">
            <h2>Identification Results</h2>
            <div className="species">Species: {species}</div>
            <div className="scientificName">Scientific Name: {scientificName}</div>
            <div className="Lifespan">Lifespan: {lifeSpan}</div>
            <div className="CommonFood">Common Food: {commonFood}</div>
            <div className="CommonPredators">Common Predators: {commonPredators}</div>
            <div className="description">{description}</div>
            <div className="results">
            <div className="text-content">
            <h2 className="highlight-header">Identification Results</h2>
            </div>
            <div className="image-content">
            <img src={preview} alt="Preview" className="preview" />
            </div>
            </div>
            
            
            {/* Add audio player section */}
            {soundUrls?.length > 0 ? (
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
          </div>
        )}
      </form>
    </div>
  );
};

export default BirdUpload;