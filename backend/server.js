// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require("fs");
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

// Load environment variables
dotenv.config();
const app = express();

const corsOptions = {
	origin: ['http://127.0.0.1:5501', 'http://localhost:8000', process.env.FRONTEND_URL],
	methods: ['POST'],
	allowedHeaders: ['Content-Type']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(helmet());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100 // limit each IP to 100 requests per windowMs
});

app.use(limiter);

const validateRecommendRequest = [
	body('spirits').isArray().notEmpty(),
	body('flavors').isArray().notEmpty(),
	body('strength').isString().notEmpty(),
	body('liqueurs').isArray(),
	(req, res, next) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}
		next();
	}
];

app.post('/recommend', validateRecommendRequest, async (req, res) => {
	const { spirits, flavors, strength, liqueurs } = req.body;
	console.log("Received body:", req.body);  // Log the request body.

	try {
		if (!spirits || !flavors || !strength || !liqueurs) {
			console.error("Missing parameters in request body");
			return res.status(400).json({ error: "Missing parameters" });
		}
		const prompt = `You can assume that everyone has these ingredients: water, soda, ice, lime, lemon, sugar, simple syrup, spices, mint, and salt. Generate 3 drinks using these alcohols: ${spirits.join(', ')} and liqueurs: ${liqueurs.join(', ')}.
			In addition use the following criterias:
			Try to make the flavor profiles: ${flavors.join(', ')} with the preferred strength: ${strength}.

			Format each drink exactly as shown in this example, maintaining consistent bracket placement:
			[drink_name] Mojito
			[ingredients_and_measurements] 2 oz White Rum, 1 oz Fresh Lime Juice, 0.75 oz Simple Syrup, 6-8 Mint Leaves, Soda Water
			[instructions] Muddle mint leaves with simple syrup, add rum and lime juice, shake with ice, strain into glass, top with soda
			[strength] Middle
			[drink_category] Highball
			[comments] Garnish with mint sprig and lime wheel

			Return exactly 3 drinks, each separated by a blank line. Keep the drinks diverse. Do not include any additional formatting, punctuation, or text between the bracket label and the content. Do not include colons or semicolons after the brackets.
			Drink categories can be one of the following: Sour, Highball, Martini, Oldfashioned, Fizz_Collins, Tiki_Tropical, Creamy, Champagne_Sparkling, Hot, Punch.`;
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