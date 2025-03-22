import { useState, useRef } from "react";
import "./BirdUpload.css";

const BirdUpload = () => {
  const [preview, setPreview] = useState("");
  const [speciesData, setSpeciesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

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

      const response = await fetch("http://localhost:5000/classify-bird", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Classification failed");
      }

      const responseData = await response.json();
      setSpeciesData(responseData);
    } catch (err) {
      setError(err.message || "Failed to process image");
    } finally {
      setLoading(false);
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

        <button type="submit" disabled={loading} className="submit-btn">
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
                        <source src={url} type="audio/mpeg" />
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
                        key={index}
                        src={img}
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
                          key={index}
                          src={img}
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
      </form>
    </div>
  );
};

export default BirdUpload;