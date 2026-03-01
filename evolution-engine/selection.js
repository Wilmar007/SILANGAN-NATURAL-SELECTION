function clamp(value, min, max) {
	return Math.max(min, Math.min(max, value));
}

function calculateSurvivalProbability(rabbit, environment = {}) {
	const {
		wolvesEnabled = false,
		toughFoodEnabled = false,
		limitedFoodEnabled = false
	} = environment;

	let probability = 1;

	if (wolvesEnabled) {
		probability *= rabbit.phenotype.fur === "brown" ? 0.8 : 0.45;
	}

	if (toughFoodEnabled) {
		probability *= rabbit.phenotype.teeth === "long" ? 0.85 : 0.4;
	}

	if (limitedFoodEnabled) {
		probability *= 0.72;
	}

	return clamp(probability, 0.02, 0.98);
}

function applySelection(population, environment = {}) {
	const survivors = [];
	const deceased = [];

	for (const rabbit of population) {
		const survivalChance = calculateSurvivalProbability(rabbit, environment);
		const survives = Math.random() < survivalChance;

		rabbit.alive = survives;

		if (survives) survivors.push(rabbit);
		else deceased.push(rabbit);
	}

	return { survivors, deceased };
}

export {
	calculateSurvivalProbability,
	applySelection
};
