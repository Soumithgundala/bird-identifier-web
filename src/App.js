import React from 'react';
import BirdUpload from './BirdUpload';
import './App.css';

function App() {
    return (
        <div className="App">
            <header className="app-header">
                <h1>AI Bird Identifier</h1>
                <p>Upload a bird image to identify its species</p>
            </header>
            <main>
                <BirdUpload />
            </main>
            <footer>
                <p>Powered by GPT-4 Vision API</p>
            </footer>
        </div>
    );
}

export default App;