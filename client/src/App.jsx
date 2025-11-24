import { useState, useEffect } from 'react'; // Import useEffect
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  
  // State for history
  const [history, setHistory] = useState([]);

  // Fetch history when the app loads
  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://localhost:3000/reports');
      setHistory(res.data);
    } catch (err) {
      console.error("Could not fetch history");
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setReport("");
    setError("");
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError("");

    // --- 1. Start the analysis simulation ---
    setStatusMessage("1. Uploading file and preparing prompt...");

    const formData = new FormData();
    formData.append('codeFile', file);

    try {

      // --- 2. Update status before the major delay (LLM call) ---
      setStatusMessage("Sending code to Assitant for analysis (This may take a moment)...");

      const response = await axios.post('http://localhost:3000/review', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // --- 3. Final success message ---
      setStatusMessage("Analysis complete! Building the final report...");

      setReport(response.data.report);
      fetchHistory(); // Refresh the list after a new upload
    } catch (err) {
      console.error(err);
      setError("Failed to analyze code.");
    } finally {
      setLoading(false);
      setStatusMessage(""); // Clear message after finished
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>🤖 Code Review Assistant</h1>
      </header>

      <div className="upload-section">
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload} disabled={loading || !file}>
          {loading ? "Analyzing..." : "Review Code"}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      {/* --- PROGRESS BAR / LOADING STATUS DISPLAY --- */}
      {loading && (
        <div className="progress-section">
          <div className="spinner"></div> {/* The actual spinner animation */}
          <p className="status-text">{statusMessage}</p>
        </div>
      )}

     

      {/* Current Report */}
      {report && (
        <div className="report-section">
          <h2>Latest Review</h2>
          <div className="markdown-body">
            <ReactMarkdown>{report}</ReactMarkdown>
          </div>
        </div>
      )}

      {/* History Section */}
      <div className="history-section">
        <h2>Past Reviews</h2>
        {history.length === 0 ? <p>No reports yet.</p> : (
          <div className="history-list">
            {history.map((item) => (
              <div key={item._id} className="history-item">
                <strong>📄 {item.filename}</strong>
                <span>{new Date(item.createdAt).toLocaleString()}</span>
                {/* Optional: Add a button here to 'View' this specific report again */}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;