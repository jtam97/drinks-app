const BACKEND_URL = "https://cocktail-ai-819618430368.us-east1.run.app"
// const BACKEND_URL = "http://localhost:8000"

let userSelections = {
	spirit: [],
	strength: "",
	flavor: [],
	liqueurs: []
};

function goToStep(stepNumber) {
	console.log("Going to step " + stepNumber);

	// Special handling for step 5 (loading state)
	if (stepNumber === 5) {
		if (!collectSelections(4)) { // Validate step 4 first
			return false;
		}
		// Minimize step 4
		minimizeStep(4);
		// Show loading state and trigger recommendations
		showLoadingState();
		sendRecommendationRequest();

		// Show recalculate button
		const step5 = document.getElementById('step5');
		if (step5) {
			step5.style.display = "block";
			step5.classList.remove('minimized');
		}
		return true;
	}

	// Regular step validation and progression
	const currentStepNumber = stepNumber - 1;
	if (currentStepNumber > 0) {
		if (!collectSelections(currentStepNumber)) {
			console.log("Cannot proceed: current step not valid");
			return false;
		}
	}

	// Only proceed if validation passed
	const previousStep = document.getElementById(`step${stepNumber - 1}`);
	if (previousStep) {
		minimizeStep(stepNumber - 1);
	}

	// Show current step
	const currentStep = document.getElementById(`step${stepNumber}`);
	if (currentStep) {
		currentStep.style.display = "block";
		currentStep.classList.remove('minimized');
	}

	return true;
}

function resetToStep1() {
	console.log("Resetting...")
	resetCheckmarks()
	document.getElementById(`nonalcoholic`).style.display = "none";
	document.getElementById(`step1`).style.display = "block";
	document.getElementById(`next-step2`).style.display = "block";
}

function collectSelections(step) {
	let shouldProgress = false;
	const errorMessage = document.getElementById(`error-step${step}`);

	if (step === 1) {
		userSelections.spirit = Array.from(document.querySelectorAll("input[name='spirit']:checked")).map(el => el.value);
		shouldProgress = userSelections.spirit.length > 0;

		if (!shouldProgress && errorMessage) {
			errorMessage.style.display = 'block';
			return false;
		}

		if (shouldProgress && userSelections.spirit.includes("nonalcoholic")) {
			document.getElementById(`nonalcoholic`).style.display = "flex";
			document.getElementById(`step${1}`).style.display = "none";
			document.getElementById(`step${2}`).style.display = "none";
			return false;
		}
	}
	else if (step === 2) {
		userSelections.strength = document.querySelector("input[name='strength']:checked")?.value || "";
		shouldProgress = userSelections.strength !== "";

		if (!shouldProgress && errorMessage) {
			errorMessage.style.display = 'block';
			return false;
		}
	}
	else if (step === 3) {
		userSelections.flavor = Array.from(document.querySelectorAll("input[name='flavor']:checked")).map(el => el.value);
		shouldProgress = userSelections.flavor.length > 0;

		if (!shouldProgress && errorMessage) {
			errorMessage.style.display = 'block';
			return false;
		}

		if (shouldProgress) {
			populateLiqueurs();
		}
	}
	else if (step === 4) {
		userSelections.liqueurs = Array.from(document.querySelectorAll("input[name='liqueur']:checked")).map(el => el.value);
		shouldProgress = true; // Liqueurs are optional
		sendRecommendationRequest();
	}

	// Hide error message if validation passed
	if (errorMessage) {
		errorMessage.style.display = 'none';
	}

	return shouldProgress;
}

function populateLiqueurs() {
	const liqueurOptions = {
		fruity: ["Peach Schnapps", "Triple Sec", "Midori"],
		smoky: ["Mezcal", "Laphroaig"],
		chocolatey: ["Crème de Cacao", "Godiva"],
		herbal: ["Chartreuse", "Benedictine"],
	};

	const liqueurContainer = document.getElementById("liqueur-options");
	liqueurContainer.innerHTML = "";
	userSelections.flavor.forEach(flavor => {
		if (liqueurOptions[flavor]) {
			liqueurOptions[flavor].forEach(liqueur => {
				const label = document.createElement("label");
				label.innerHTML = `<input type="checkbox" name="liqueur" value="${liqueur}"> ${liqueur}`;
				liqueurContainer.appendChild(label);
			});
		}
	});
}

function sendRecommendationRequest() {
	console.log("Sending recommendation request...")
	fetch(`${BACKEND_URL}/recommend`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			spirits: userSelections.spirit,
			flavors: userSelections.flavor,
			strength: userSelections.strength,
			liqueurs: userSelections.liqueurs,
		}),
	})
		.then((response) => {
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
			return response.json();
		})
		.then((data) => {
			const drinks = parseDrinks(data.drinks);
			showDrinkRecommendations(drinks);
		})
		.catch((error) => {
			console.error("Error fetching recommendation:", error);
			// Show user-friendly error message
			const container = document.getElementById('drink-recommendations');
			container.innerHTML = `
			<div style="text-align: center; color: #ff4444;">
				<p>Sorry, something went wrong. Please try again later.</p>
			</div>
		`;
		});
}

function parseDrinks(responseText) {
	console.log("Drinks received. Parsing...")
	const sections = responseText.split('[drink_name]');
	console.log(sections)
	const drinks = [];

	sections.forEach((section, index) => {
		if (index === 0) return;

		const drink = {};
		drink.drink_name = section.split('\n')[0].trim();

		const ingredientsStart = section.indexOf('[ingredients_and_measurements]') + '[ingredients_and_measurements]'.length;
		const ingredientsEnd = section.indexOf('[instructions]');
		drink.ingredients_and_measurements = section.substring(ingredientsStart, ingredientsEnd).trim();

		const instructionsStart = section.indexOf('[instructions]') + '[instructions]'.length;
		const instructionsEnd = section.indexOf('[strength]');
		drink.instructions = section.substring(instructionsStart, instructionsEnd).trim();

		const strengthStart = section.indexOf('[strength]') + '[strength]'.length;
		const strengthEnd = section.indexOf('[drink_category]');
		drink.strength = section.substring(strengthStart, strengthEnd).trim();

		const categoryStart = section.indexOf('[drink_category]') + '[drink_category]'.length;
		const categoryEnd = section.indexOf('[comments]');
		drink.category = section.substring(categoryStart, categoryEnd).trim();

		const commentsStart = section.indexOf('[comments]') + '[comments]'.length;
		drink.comments = section.substring(commentsStart).trim();

		drinks.push(drink);
	});
	console.log(drinks)

	return drinks;
}

function showDrinkRecommendations(drinks) {
	console.log("Showing drink recommendations.")
	const container = document.getElementById('drink-recommendations');
	container.innerHTML = '';
	container.style.display = 'grid';

	// Show the recalculate button after recommendations are loaded
	const step5 = document.getElementById('step5');
	if (step5) {
		step5.style.display = "block";
		step5.classList.remove('minimized');
	}

	drinks.forEach((drink) => {
		const drinkDiv = document.createElement('div');
		drinkDiv.classList.add('drink-box');

		const imageContainer = document.createElement('div');
		imageContainer.classList.add('image-container');

		const categoryName = drink.category.toLowerCase().replace(/[*\/\s]+-/g, '') + '.jpg';
		const imagePath = `assets/${categoryName}`;
		console.log('Loading image:', imagePath, 'for category:', drink.category);

		const img = document.createElement('img');
		img.src = imagePath;
		img.alt = `${drink.drink_name} image`;
		img.classList.add('drink-image');

		// Add error handling for images
		img.onerror = function () {
			console.log('Image failed to load:', imagePath);
			this.src = 'assets/default-drink.jpg'; // Fallback image
			this.alt = 'Default drink image';
		};

		imageContainer.appendChild(img);
		drinkDiv.appendChild(imageContainer);

		const contentDiv = document.createElement('div');
		contentDiv.classList.add('drink-content');

		const name = document.createElement('h2');
		name.classList.add('drink-name');
		name.innerText = drink.drink_name;
		contentDiv.appendChild(name);

		// Add other drink details to contentDiv
		['ingredients_and_measurements', 'instructions', 'strength', 'comments'].forEach(prop => {
			const p = document.createElement('p');
			p.innerHTML = `<strong>${prop.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> ${drink[prop]}`;
			contentDiv.appendChild(p);
		});

		drinkDiv.appendChild(contentDiv);
		container.appendChild(drinkDiv);
	});
}

function resetCheckmarks() {
	// Select all checkboxes in the form
	const checkboxes = document.querySelectorAll('input[type="checkbox"]');

	// Uncheck each checkbox
	checkboxes.forEach(checkbox => checkbox.checked = false);
}

function minimizeStep(stepNumber) {
	const step = document.getElementById(`step${stepNumber}`);
	if (!step) return;

	step.classList.add('minimized');
	step.style.display = "block";

	// Add click handler to maximize
	step.onclick = () => maximizeStep(stepNumber + 1);
}

function maximizeStep(stepNumber) {
	// Don't allow maximizing if we're in loading/results state
	if (stepNumber === 5) return;

	// Minimize all steps
	document.querySelectorAll('.step').forEach(step => {
		step.classList.add('minimized');
		step.onclick = () => maximizeStep(parseInt(step.id.replace('step', '')));
	});

	// Then maximize the clicked step
	const step = document.getElementById(`step${stepNumber}`);
	step.classList.remove('minimized');
	step.onclick = null;
}

// Add event listeners to hide error messages when user makes a selection
function addSelectionListeners() {
	document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(input => {
		input.addEventListener('change', () => {
			const stepNumber = parseInt(input.closest('.step').id.replace('step', ''));
			const errorMessage = document.getElementById(`error-step${stepNumber}`);
			if (errorMessage) {
				errorMessage.style.display = 'none';
			}
		});
	});
}

// Add this function to handle container clicks
function setupStepContainerClicks() {
	document.querySelectorAll('.step').forEach(step => {
		step.addEventListener('click', (event) => {
			// Don't handle clicks on inputs, labels, or buttons
			if (event.target.tagName === 'INPUT' ||
				event.target.tagName === 'LABEL' ||
				event.target.tagName === 'BUTTON' ||
				event.target.closest('label') ||
				event.target.closest('button')) {
				return;
			}

			// Don't handle step 5 (results)
			if (step.id === 'step5') {
				return;
			}

			const stepNumber = parseInt(step.id.replace('step', ''));

			if (step.classList.contains('minimized')) {
				// Maximize this step
				step.classList.remove('minimized');
				step.style.display = "block";
			} else {
				// Minimize this step
				step.classList.add('minimized');
				step.style.display = "block";
			}

			// Keep step5 visible if recommendations are showing
			const recommendationsContainer = document.getElementById('drink-recommendations');
			if (recommendationsContainer.children.length > 0) {
				const step5 = document.getElementById('step5');
				if (step5) {
					step5.style.display = "block";
					step5.classList.remove('minimized');
				}
			}
		});
	});
}

// Call this when the page loads
document.addEventListener('DOMContentLoaded', () => {
	addSelectionListeners();
	setupStepContainerClicks();
});

function showLoadingState() {
	const container = document.getElementById('drink-recommendations');
	container.innerHTML = `
        <div style="text-align: center;">
            <div class="loading-spinner"></div>
            <div class="loading-text">Mixing your perfect drinks...</div>
        </div>
    `;
	container.style.display = 'block';

	const spinner = container.querySelector('.loading-spinner');
	if (spinner) {
		spinner.style.display = 'block';
	}
}