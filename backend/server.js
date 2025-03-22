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
	origin: [
		'https://www.justinztam.com',
		'https://justinztam.com',
		'https://www.justinztam.com/drinks-app',
		'https://justinztam.com/drinks-app',
		'http://127.0.0.1:5503',
		'http://localhost:8000',
		'https://storage.googleapis.com',
		process.env.FRONTEND_REROUTE
	].filter(Boolean),
	methods: ['POST', 'OPTIONS'],
	allowedHeaders: ['Content-Type'],
	preflightContinue: false,
	optionsSuccessStatus: 204
};

// Enable pre-flight requests for all routes
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json());
app.use(helmet());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

const slidingWindowLimiter = {
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 40, // Limit to 30 requests per minute globally
	message: 'Server is experiencing high load, please try again later.',
	standardHeaders: true,
	legacyHeaders: false,
	store: new rateLimit.MemoryStore(),
	keyGenerator: () => 'sliding_global'
};

app.use(rateLimit(slidingWindowLimiter));

const limiter = rateLimit({
	windowMs: 10 * 60 * 1000, // 15 minutes
	max: 30 // limit each IP to 100 requests per windowMs
});

app.use(limiter);

const validateRecommendRequest = [
	body('spirits').isArray().notEmpty(),
	body('flavors').isArray().notEmpty(),
	body('strength').isString().notEmpty(),
	body('complexity').isString().notEmpty(),
	body('preferences').isArray().notEmpty(),
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
	const { spirits, flavors, complexity, strength, preferences, liqueurs } = req.body;
	console.log("Received body:", req.body);  // Log the request body.

	try {
		if (!spirits || !flavors || !strength || !complexity || !preferences) {
			console.error("Missing parameters in request body");
			return res.status(400).json({ error: "Missing parameters" });
		}
		const prompt = `Assume these common ingredients are always available: water, soda, ice, lime, lemon, sugar, simple syrup, spices, mint, and salt.

Using:
- Alcohols: ${spirits.join(', ')}
- Liqueurs: ${liqueurs.join(', ')}

Generate **3 diverse drink recipes** that:
- Match one or more of these flavor profiles: ${flavors.join(', ')}
- Match the preferred strength: ${strength}
- Match the complexity level: ${complexity} (simple, balanced, or complex)
- Incorporate these preferences: ${preferences}

**Formatting instructions (must be followed exactly):**

Each drink should follow this exact format with consistent brackets and spacing:

[drink_name] Mojito
[ingredients_and_measurements] 2 oz White Rum, 1 oz Fresh Lime Juice, 0.75 oz Simple Syrup, 6-8 Mint Leaves, Soda Water
[instructions] Muddle mint leaves with simple syrup, add rum and lime juice, shake with ice, strain into glass, top with soda
[strength] Middle
[drink_category] Highball
[comments] Garnish with mint sprig and lime wheel

**Rules:**
- Return exactly 3 drinks, each separated by a single blank line.
- Ensure drinks are diverse in alcohol base, flavor, and/or category.
- Follow the specified complexity level:
  - **Simple**: 3–4 ingredients, minimal steps.
  - **Balanced**: 4–6 ingredients, standard mixing methods.
  - **Complex**: 6+ ingredients, advanced preparation (infusions, layering, etc.)
- Follow any preferences, such as "add garnish," "no shaken drinks," or "include seasonal flavors."
- Do **not** include extra text, explanations, or formatting outside of the specified bracket structure.
- Do **not** use colons, semicolons, or other punctuation after bracket labels.
- Make sure each of the bracket labels are maintained in the output: [drink_name], [ingredients_and_measurements], [instructions], [strength], and [drink_category].

**Allowed drink categories:**
Sour, Highball, Martini, Oldfashioned, Fizz_Collins, Tiki_Tropical, Creamy, Champagne_Sparkling, Hot, Punch`;
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