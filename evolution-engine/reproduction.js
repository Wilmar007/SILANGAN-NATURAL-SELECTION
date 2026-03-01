import { Rabbit } from "./genetics.js";

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

function inheritTraitAlleles(parent1Alleles, parent2Alleles) {
	return [
		randomChoice(parent1Alleles),
		randomChoice(parent2Alleles)
	];
}

function generateOffspring(parent1, parent2, options = {}) {
	const {
		mutationModeEnabled = false,
		mutationProbability = 0.01,
		id = undefined
	} = options;

	const child = new Rabbit({
		id,
		furAlleles: inheritTraitAlleles(parent1.furAlleles, parent2.furAlleles),
		earAlleles: inheritTraitAlleles(parent1.earAlleles, parent2.earAlleles),
		teethAlleles: inheritTraitAlleles(parent1.teethAlleles, parent2.teethAlleles),
		parent1: parent1.id,
		parent2: parent2.id,
		alive: true
	});

	child.mutate(mutationProbability, mutationModeEnabled);
	return child;
}

function generateOffspringBatch(parent1, parent2, count, options = {}) {
	const offspring = [];
	for (let i = 0; i < count; i++) {
		offspring.push(generateOffspring(parent1, parent2, options));
	}
	return offspring;
}

export {
	inheritTraitAlleles,
	generateOffspring,
	generateOffspringBatch
};
