// backend/server.js

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require("fs");
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load environment variables
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve index.html for the root route
app.get('/*', (req, res) => {
	res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});


app.post('/recommend', async (req, res) => {
	const { spirits, flavors, strength, liqueurs } = req.body;

	try {
		const prompt = `You can assume that everyone has these ingredients: water, soda, ice, lime, lemon, sugar, simple syrup, spices, mint, and salt. Generate 3 drinks using these alcohols: ${spirits.join(', ')} and liqueurs: ${liqueurs.join(', ')}.
			In addition use the following criterias:
			Tyr to make the flavor profiles: ${flavors.join(', ')} with the preferred strength: ${strength}.

			For each drink, provide the following details in this exact format:
			[drink_name]: Name of the drink
			[ingredients_and_measurements]: List all ingredients with their measurements
			[instructions]: Step-by-step instructions on how to make the drink
			[strength]: Alcohol forward, juice forward, or middle
			[drink_category]: Categorize the drink into one of the following: Sour, Highball, Martini, Oldfashioned, Fizz_Collins, Tiki_Tropical, Creamy, Champagne_Sparkling, Hot, Punch
			[comments]: Any additional information or tips about the drink.

			Return a list of exactly 3 drinks trying to keep the 3 drinks as diverse as possible. Ensure the format is strictly followed for each drink using '[field]:'.
			Do not include '*' in your response.`;
		console.log(prompt)

		console.log("Awaiting chat completion.")
		const result = await model.generateContent(prompt);
		console.log(result.response.text());

		const drinks = result.response.text();
		res.json({ drinks });
	} catch (error) {
		console.error('Error fetching recommendation:', error);  // Log the error
		res.status(500).json({ error: 'Failed to fetch recommendation' });
	}
});

// Start the server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));