let userSelections = {
	spirit: [],
	strength: "",
	flavor: [],
	liqueurs: []
};

function goToStep(stepNumber) {
	console.log(stepNumber)
	collectSelections(stepNumber)
	// document.querySelectorAll(".step").forEach(step => step.style.display = "none");
	document.getElementById(`step${stepNumber}`).style.display = "flex";
	document.getElementById(`next-step${stepNumber}`).style.display = "none";

}

function collectSelections(step) {
	if (step === 2) {
		userSelections.spirit = Array.from(document.querySelectorAll("input[name='spirit']:checked")).map(el => el.value);
		console.log(userSelections.spirit)
	} else if (step === 3) {
		userSelections.strength = document.querySelector("input[name='strength']:checked")?.value || "";
		console.log(userSelections.strength)
	} else if (step === 4) {
		userSelections.spirit = Array.from(document.querySelectorAll("input[name='spirit']:checked")).map(el => el.value);
		userSelections.strength = document.querySelector("input[name='strength']:checked")?.value || "";
		userSelections.flavor = Array.from(document.querySelectorAll("input[name='flavor']:checked")).map(el => el.value);
		sendRecommendationRequest(); // Initial call after Step 3
		populateLiqueurs()
	} else if (step === 5) {
		userSelections.spirit = Array.from(document.querySelectorAll("input[name='spirit']:checked")).map(el => el.value);
		userSelections.strength = document.querySelector("input[name='strength']:checked")?.value || "";
		userSelections.flavor = Array.from(document.querySelectorAll("input[name='flavor']:checked")).map(el => el.value);
		userSelections.liqueurs = Array.from(document.querySelectorAll("input[name='liqueur']:checked")).map(el => el.value);
		sendRecommendationRequest(); // Update on liqueur selection
		populateLiqueurs()
	}
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
	// document.querySelectorAll("input[name='liqueur']").forEach(input => {
	// 	input.addEventListener("change", () => collectSelections(4));
	// });
}

function sendRecommendationRequest() {
	fetch("http://localhost:8000/recommend", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			spirits: userSelections.spirit,
			flavors: userSelections.flavor,
			strength: userSelections.strength,
			liqueurs: userSelections.liqueurs,
		}),
	})
		.then((response) => response.json())
		.then((data) => {
			// console.log(data)
			const drinks = parseDrinks(data.drinks);
			showDrinkRecommendations(drinks);
		})
		.catch((error) => console.error("Error fetching recommendation:", error));
}

function parseDrinks(responseText) {
	const sections = responseText.split('[drink_name]:');
	const drinks = [];

	sections.forEach((section, index) => {
		if (index === 0) return;

		const drink = {};
		drink.drink_name = section.split('\n')[0].trim();

		const ingredientsStart = section.indexOf('[ingredients_and_measurements]:') + '[ingredients_and_measurements]:'.length;
		const ingredientsEnd = section.indexOf('[instructions]:');
		drink.ingredients_and_measurements = section.substring(ingredientsStart, ingredientsEnd).trim();

		const instructionsStart = section.indexOf('[instructions]:') + '[instructions]:'.length;
		const instructionsEnd = section.indexOf('[strength]:');
		drink.instructions = section.substring(instructionsStart, instructionsEnd).trim();

		const strengthStart = section.indexOf('[strength]:') + '[strength]:'.length;
		const strengthEnd = section.indexOf('[drink_category]:');
		drink.strength = section.substring(strengthStart, strengthEnd).trim();

		const categoryStart = section.indexOf('[drink_category]:') + '[drink_category]:'.length;
		const categoryEnd = section.indexOf('[comments]:');
		drink.category = section.substring(categoryStart, categoryEnd).trim();

		const commentsStart = section.indexOf('[comments]:') + '[comments]:'.length;
		drink.comments = section.substring(commentsStart).trim();

		drinks.push(drink);
	});

	return drinks;
}

function showDrinkRecommendations(drinks) {
	const container = document.getElementById('drink-recommendations');
	container.innerHTML = '';
	container.style.display = 'flex';

	drinks.forEach((drink, index) => {
		const drinkDiv = document.createElement('div');
		drinkDiv.classList.add('drink-box');

		const imageContainer = document.createElement('div');
		imageContainer.classList.add('image-container');
		const categoryName = drink.category.toLowerCase().replace(/[*\/\s]+/g, '') + '.jpg';
		const imagePath = `assets/${categoryName}`;

		const img = document.createElement('img');
		img.src = imagePath;
		img.alt = `${drink.drink_name} image`;
		img.classList.add('drink-image');
		imageContainer.appendChild(img);
		drinkDiv.appendChild(imageContainer);

		const name = document.createElement('h2');
		name.classList.add('drink-name');
		name.innerText = `${drink.drink_name}`;
		drinkDiv.appendChild(name);

		const ingredients = document.createElement('p');
		ingredients.innerHTML = `<strong>Ingredients and Measurements:</strong> ${drink.ingredients_and_measurements}`;
		drinkDiv.appendChild(ingredients);

		const instructions = document.createElement('p');
		instructions.innerHTML = `<strong>Instructions:</strong> ${drink.instructions}`;
		drinkDiv.appendChild(instructions);

		const strength = document.createElement('p');
		strength.innerHTML = `<strong>Strength:</strong> ${drink.strength}`;
		drinkDiv.appendChild(strength);

		const comments = document.createElement('p');
		comments.innerHTML = `<strong>Comments:</strong> ${drink.comments}`;
		drinkDiv.appendChild(comments);

		container.appendChild(drinkDiv);
	});
}

// Event listeners for form submissions to trigger the next step
document.getElementById("flavorForm").addEventListener("submit", function (event) {
	event.preventDefault();
});