import { useState } from "react";

const BirdUpload = () => {
    const [image, setImage] = useState(null);
    const [classification, setClassification] = useState("");
    const [loading, setLoading] = useState(false);

    const handleImageChange = (event) => {
        setImage(event.target.files[0]);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!image) {
            alert("Please select an image!");
            return;
        }

        const formData = new FormData();
        formData.append("image", image);

        setLoading(true);

        try {
            const response = await fetch("http://localhost:5000/classify", {
                method: "POST",
                body: formData
            });

            const data = await response.json();
            if (data.classification) {
                setClassification(data.classification);
            } else {
                setClassification("Failed to classify image.");
            }
        } catch (error) {
            console.error("Error:", error);
            setClassification("Error classifying image.");
        }

        setLoading(false);
    };

    return (
        <div>
            <h2>Upload a Bird Image</h2>
            <form onSubmit={handleSubmit}>
                <input type="file" accept="image/*" onChange={handleImageChange} />
                <button type="submit">Classify</button>
            </form>
            {loading && <p>Classifying...</p>}
            {classification && <p>Bird Species: {classification}</p>}
        </div>
    );
};

export default BirdUpload;
