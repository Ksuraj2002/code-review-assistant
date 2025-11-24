require('dotenv').config();
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const mongoose = require('mongoose');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- DATABASE CONNECTION & MODEL DEFINITION ---

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/code-review-db')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Define the Schema 
const ReportSchema = new mongoose.Schema({
    filename: String,
    codeContent: String, 
    aiReview: String,
    createdAt: { type: Date, default: Date.now }
});

// Define the Model at the top level
const Report = mongoose.model('Report', ReportSchema); 

// --- END DATABASE SETUP ---

// Configure Multer for file uploads (stores files in 'uploads/' folder)
const upload = multer({ dest: 'uploads/' });

const genai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY
});

/**
 * POST /review
 * Accepts a file upload, reads the content, and sends it to the LLM.
 */
app.post('/review', upload.single('codeFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        // 1. DATA GATHERING
        const filePath = req.file.path;
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const filename = req.file.originalname;

        // 2. LLM CALL
        const systemPrompt = "You are a Senior Code Reviewer..."; // (prompt content shortened for clarity)
        const userPrompt = `Code to review (File: ${filename}):\n${fileContent}`;

        const response = await genai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            config: {
                systemInstruction: systemPrompt
            }
        });

        const reviewReport = response.text;
        
        // --- 3. DATABASE SAVE (MOVED HERE) ---
        // Instantiation must happen here, after variables are defined
        const newReport = new Report({
            filename: filename,
            codeContent: fileContent, // Storing the actual code
            aiReview: reviewReport 
        });

        
        
        // The save operation must be awaited
        await newReport.save();
        // ------------------------------------

        // 4. CLEANUP AND RESPONSE
        fs.unlinkSync(filePath);

        res.json({ 
            success: true, 
            report: reviewReport 
        });

    } catch (error) {
        console.error("Error processing review:", error);
        res.status(500).json({ 
            error: "Failed to process request. Check database status or API key." 
        });
    }
});

app.listen(port, () => {
    console.log(`Code Review Assistant API running on http://localhost:${port}`);
});