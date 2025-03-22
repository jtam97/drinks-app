const BACKEND_URL = "https://cocktail-ai-819618430368.us-east1.run.app"
// const BACKEND_URL = "http://localhost:8000"

let currentStep = 1;
const totalSteps = 4;

const userSelections = {
	spirit: [],
	flavors: [],
	complexity: 2,
	strength: 2,
	preferences: [],
	liqueurs: []
};

// Add translation maps for complexity and strength
const complexityMap = {
	1: "Simple",
	2: "Balanced",
	3: "Complex"
};

const strengthMap = {
	1: "Light",
	2: "Medium",
	3: "Strong"
};

document.addEventListener('DOMContentLoaded', () => {
	setupEventListeners();
	updateNavigationButtons();
});

function setupEventListeners() {
	// Spirit chip selection
	document.querySelectorAll('.spirit-chip').forEach(chip => {
		chip.addEventListener('click', () => {
			const input = chip.querySelector('input');
			input.checked = !input.checked;
			if (input.checked) {
				chip.classList.add('selected');
			} else {
				chip.classList.remove('selected');
			}
		});
	});

	// Flavor chip selection
	document.querySelectorAll('.flavor-chip').forEach(chip => {
		chip.addEventListener('click', () => {
			const input = chip.querySelector('input');
			input.checked = !input.checked;
			if (input.checked) {
				chip.classList.add('selected');
			} else {
				chip.classList.remove('selected');
			}
		});
	});

	// Complexity slider
	const complexitySlider = document.getElementById('complexitySlider');
	if (complexitySlider) {
		complexitySlider.addEventListener('input', (e) => {
			userSelections.complexity = parseInt(e.target.value);
			updateSliderLabel('complexity', userSelections.complexity);
		});
	}

	// Strength slider
	const strengthSlider = document.getElementById('strengthSlider');
	if (strengthSlider) {
		strengthSlider.addEventListener('input', (e) => {
			userSelections.strength = parseInt(e.target.value);
			updateSliderLabel('strength', userSelections.strength);
		});
	}

	// Liqueur selection
	document.querySelectorAll('input[name="liqueur"]').forEach(input => {
		input.addEventListener('change', () => {
			const card = input.closest('.pref-card');
			if (input.checked) {
				card.classList.add('selected');
				if (!userSelections.liqueurs.includes(input.value)) {
					userSelections.liqueurs.push(input.value);
				}
			} else {
				card.classList.remove('selected');
				userSelections.liqueurs = userSelections.liqueurs.filter(l => l !== input.value);
			}
		});
	});

	// Preference selection
	document.querySelectorAll('input[name="preference"]').forEach(input => {
		input.addEventListener('change', () => {
			const card = input.closest('.pref-card');
			if (input.checked) {
				card.classList.add('selected');
				if (!userSelections.preferences.includes(input.value)) {
					userSelections.preferences.push(input.value);
				}
			} else {
				card.classList.remove('selected');
				userSelections.preferences = userSelections.preferences.filter(p => p !== input.value);
			}
		});
	});

	// Navigation buttons
	document.getElementById('nextBtn').addEventListener('click', () => {
		updateSelections();
		navigateSteps('next');
	});
	document.getElementById('backBtn').addEventListener('click', () => navigateSteps('back'));
}

function updateSliderLabel(type, value) {
	const map = type === 'complexity' ? complexityMap : strengthMap;
	const label = map[value];

	// Optional: Update UI to show current selection
	const labels = document.querySelector(`.${type}-labels`);
	if (labels) {
		labels.querySelectorAll('span').forEach((span, index) => {
			span.style.fontWeight = index + 1 === value ? 'bold' : 'normal';
			span.style.color = index + 1 === value ? 'var(--accent-color)' : 'inherit';
		});
	}
}

// New function to update selections when clicking next
function updateSelections() {
	// Update spirit selections
	const selectedSpirits = Array.from(document.querySelectorAll('.spirit-chip input:checked')).map(input => input.value);
	userSelections.spirit = selectedSpirits;

	// Update flavor selections
	const selectedFlavors = Array.from(document.querySelectorAll('.flavor-chip input:checked')).map(input => input.value);
	userSelections.flavors = selectedFlavors;

	// Update liqueur selections
	const selectedLiqueurs = Array.from(document.querySelectorAll('input[name="liqueur"]:checked')).map(input => input.value);
	userSelections.liqueurs = selectedLiqueurs;

	// Update preference selections
	const selectedPreferences = Array.from(document.querySelectorAll('input[name="preference"]:checked')).map(input => input.value);
	userSelections.preferences = selectedPreferences;
}

function navigateSteps(direction) {
	const previousStep = currentStep;

	// Create sliding blind if it doesn't exist
	let slidingBlind = document.querySelector('.sliding-blind');
	if (!slidingBlind) {
		slidingBlind = document.createElement('div');
		slidingBlind.className = 'sliding-blind';
		document.querySelector('.steps-container').appendChild(slidingBlind);
	}

	// Start transition
	const steps = document.querySelectorAll('.step');
	const currentStepElement = steps[previousStep - 1];
	const nextStepElement = steps[direction === 'next' ? currentStep : currentStep - 2];

	// Update current step
	if (direction === 'next') {
		if (currentStep === totalSteps) {
			validateSelections();
			// TODO: Update loading state
			showLoadingState();
			sendRecommendationRequest();
			return;
		} else {
			currentStep++;
		}
	} else {
		if (currentStep !== 1) {
			currentStep--;
		}
	}

	// Animate transition
	slidingBlind.style.height = '100%';

	setTimeout(() => {
		currentStepElement.classList.remove('active');
		currentStepElement.classList.add(direction === 'next' ? 'slide-out-left' : 'slide-out-right');

		nextStepElement.style.display = 'block';
		nextStepElement.classList.add('active');
		nextStepElement.classList.add(direction === 'next' ? 'slide-in-right' : 'slide-in-left');

		updateNavigationButtons();
		updateProgressIndicators();

		// Reset blind
		setTimeout(() => {
			slidingBlind.style.height = '0';
			currentStepElement.classList.remove('slide-out-left', 'slide-out-right');
			nextStepElement.classList.remove('slide-in-right', 'slide-in-left');
		}, 500);
	}, 250);
}

function updateNavigationButtons() {
	const backBtn = document.getElementById('backBtn');
	const nextBtn = document.getElementById('nextBtn');

	backBtn.style.display = currentStep === 1 ? 'block' : 'block';
	backBtn.style.visibility = currentStep === 1 ? 'hidden' : 'visible';
	nextBtn.textContent = currentStep === totalSteps ? 'Create Drinks' : 'Next';
}

function updateProgressIndicators() {
	// Update step indicators
	document.querySelectorAll('.step-indicator').forEach((indicator, index) => {
		if (index + 1 < currentStep) {
			indicator.classList.add('completed');
		} else if (index + 1 === currentStep) {
			indicator.classList.add('active');
		} else {
			indicator.classList.remove('active', 'completed');
		}
	});

	// Update progress bar
	const progress = ((currentStep - 1) / (totalSteps - 1)) * 100;
	document.querySelector('.progress-bar-fill').style.width = `${progress}%`;
}

function validateSelections() {
	if (userSelections.spirit.length === 0) {
		// showError('Please select at least one spirit');
		// return false;
		userSelections.spirit = ['any common spirit']
	}
	if (userSelections.flavors.length === 0) {
		// showError('Please select at least one flavor profile');
		// return false;
		userSelections.flavors = ['any flavor profile']
	}
	if (userSelections.preferences.length === 0) {
		userSelections.preferences = ['no preference']
	}
	if (userSelections.liqueurs.length === 0) {
		userSelections.liqueurs = ['no liqueur']
	}
	return true;
}

function showError(message) {
	const errorDiv = document.createElement('div');
	errorDiv.className = 'error-message';
	errorDiv.textContent = message;

	const currentStepElement = document.querySelector('.step.active');
	currentStepElement.appendChild(errorDiv);

	setTimeout(() => errorDiv.remove(), 3000);
}

function showLoadingState() {
	document.querySelector('.steps-container').style.display = 'none';
	document.querySelector('.navigation-buttons').style.display = 'none';
	document.getElementById('results-container').style.display = 'block';
}

function sendRecommendationRequest() {
	console.log('Sending selections:', {
		...userSelections,
		complexity: complexityMap[userSelections.complexity],
		strength: strengthMap[userSelections.strength]
	});

	fetch(`${BACKEND_URL}/recommend`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			spirits: userSelections.spirit,
			flavors: userSelections.flavors,
			complexity: complexityMap[userSelections.complexity],
			strength: strengthMap[userSelections.strength],
			liqueurs: userSelections.liqueurs,
			preferences: userSelections.preferences
		})
	})
		.then(response => response.json())
		.then(data => {
			const drinks = parseDrinks(data.drinks);
			showDrinkRecommendations(drinks);
		})
		.catch(error => {
			console.error('Error:', error);
			showError('Something went wrong. Please try again.');
		});
}

function parseDrinks(responseText) {
	const sections = responseText.split('[drink_name]');
	const drinks = [];

	sections.forEach((section, index) => {
		if (index === 0) return;

		const drink = {
			name: section.split('\n')[0].trim(),
			ingredients: section.substring(
				section.indexOf('[ingredients_and_measurements]') + '[ingredients_and_measurements]'.length,
				section.indexOf('[instructions]')
			).trim(),
			instructions: section.substring(
				section.indexOf('[instructions]') + '[instructions]'.length,
				section.indexOf('[strength]')
			).trim(),
			strength: section.substring(
				section.indexOf('[strength]') + '[strength]'.length,
				section.indexOf('[drink_category]')
			).trim(),
			category: section.substring(
				section.indexOf('[drink_category]') + '[drink_category]'.length,
				section.indexOf('[comments]')
			).trim(),
			comments: section.substring(
				section.indexOf('[comments]') + '[comments]'.length
			).trim()
		};

		drinks.push(drink);
	});

	return drinks;
}

function showDrinkRecommendations(drinks) {
	const container = document.getElementById('drink-recommendations');
	container.innerHTML = '';

	drinks.forEach((drink, index) => {
		const drinkCard = document.createElement('div');
		drinkCard.className = 'drink-card';
		drinkCard.style.animation = `fadeInUp ${0.3 + index * 0.1}s ease-out forwards`;

		drinkCard.innerHTML = `
			<div class="drink-header">
				<h3>${drink.name}</h3>
				<span class="strength-badge">${drink.strength}</span>
			</div>
			<div class="drink-image">
				<img src="assets/${drink.category.toLowerCase().replace(/[*\/\s]+-/g, '')}.jpg"
					 alt="${drink.name}"
					 onerror="this.src='assets/default-drink.jpg'">
			</div>
			<div class="drink-details">
				<h4>Ingredients</h4>
				<p>${drink.ingredients}</p>
				<h4>Instructions</h4>
				<p>${drink.instructions}</p>
				<div class="drink-notes">
					<p><em>${drink.comments}</em></p>
				</div>
			</div>
		`;

		container.appendChild(drinkCard);
	});

	// Add a "Start Over" button
	const startOverBtn = document.createElement('button');
	startOverBtn.className = 'start-over-btn';
	startOverBtn.textContent = 'Create Another Drink';
	startOverBtn.onclick = resetApp;
	container.appendChild(startOverBtn);
}

function resetApp() {
	currentStep = 1;
	userSelections.spirit = [];
	userSelections.flavors = [];
	userSelections.complexity = 2;
	userSelections.strength = 2;
	userSelections.liqueurs = [];

	// Reset UI
	document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
	document.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
	document.getElementById('complexitySlider').value = 2;
	document.getElementById('strengthSlider').value = 2;

	// Reset slider labels
	updateSliderLabel('complexity', 2);
	updateSliderLabel('strength', 2);

	// Show steps container
	document.querySelector('.steps-container').style.display = 'block';
	document.querySelector('.navigation-buttons').style.display = 'flex';
	document.getElementById('results-container').style.display = 'none';

	// Reset progress
	updateProgressIndicators();
	updateNavigationButtons();

	// Show first step
	document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
	document.getElementById('step1').classList.add('active');
}