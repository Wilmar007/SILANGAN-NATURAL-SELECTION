import { Rabbit } from "./genetics.js";
import { generateOffspring } from "./reproduction.js";
import { applySelection } from "./selection.js";

const DEFAULTS = {
	initialPopulationSize: 1,
	maxPopulationSize: 200,
	offspringPerGeneration: 2,
	generationIntervalMs: 2000,
	mutationEnabled: false,
	mutationProbability: 0.01,
	environment: {
		wolvesEnabled: false,
		toughFoodEnabled: false,
		limitedFoodEnabled: false
	}
};

const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

class SimulationEngine {
	constructor(config = {}) {
		this.config = {
			...DEFAULTS,
			...config,
			environment: {
				...DEFAULTS.environment,
				...(config.environment || {})
			}
		};

		this.generation = 0;
		this.population = [];
		this.intervalId = null;
		this.listeners = new Set();
		this.lastMessage = "";

		this.initializePopulation();
	}

	initializePopulation() {
		this.population = [new Rabbit({})];
		this.generation = 0;
		this.lastMessage = "Generation 0: One rabbit initialized. Add a mate to begin reproduction.";
		this.emitUpdate("reset");
	}

	onUpdate(listener) {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	emitUpdate(type) {
		const payload = {
			type,
			generation: this.generation,
			populationSize: this.population.length,
			population: this.population,
			message: this.lastMessage
		};
		for (const listener of this.listeners) {
			listener(payload);
		}
	}

	setMessage(message) {
		this.lastMessage = message;
	}

	setEnvironment(environmentPatch) {
		this.config.environment = {
			...this.config.environment,
			...environmentPatch
		};
	}

	setMutation(enabled, probability = this.config.mutationProbability) {
		this.config.mutationEnabled = enabled;
		this.config.mutationProbability = probability;
	}

	createRabbitFromSelected(selected = {}) {
		const mapTraitToAlleles = (trait, value) => {
			if (Array.isArray(value) && value.length === 2) return value;

			if (trait === "fur") {
				if (value === "brown" || value === "dark") return ["B", "B"];
				if (value === "white" || value === "light") return ["b", "b"];
				return ["B", "b"];
			}

			if (trait === "ears") {
				if (value === "straight") return ["E", "E"];
				if (value === "floppy") return ["e", "e"];
				return ["E", "e"];
			}

			if (trait === "teeth") {
				if (value === "long") return ["T", "T"];
				if (value === "short") return ["t", "t"];
				return ["T", "t"];
			}

			return undefined;
		};

		return new Rabbit({
			furAlleles: mapTraitToAlleles("fur", selected.fur ?? selected.furAlleles),
			earAlleles: mapTraitToAlleles("ears", selected.ears ?? selected.earAlleles),
			teethAlleles: mapTraitToAlleles("teeth", selected.teeth ?? selected.teethAlleles)
		});
	}

	addMate(selectedGenotypeOrTraits = {}) {
		if (this.population.length >= this.config.maxPopulationSize) {
			this.setMessage("Population cap reached.");
			this.emitUpdate("mate-blocked");
			return null;
		}

		const mate = this.createRabbitFromSelected(selectedGenotypeOrTraits);
		this.population.push(mate);
		this.setMessage("Mate added. Press Play to begin reproduction.");
		this.emitUpdate("mate-added");
		return mate;
	}

	stepGeneration() {
		if (this.population.length < 2) {
			this.setMessage("Add a mate to begin reproduction.");
			this.emitUpdate("generation-blocked");
			return;
		}

		const { survivors } = applySelection(this.population, this.config.environment);
		if (survivors.length < 2) {
			this.population = survivors.length > 0 ? survivors : [randomChoice(this.population)];
			this.generation += 1;
			this.pause();
			this.setMessage("Population dropped below two breeders. Add a mate to continue.");
			this.emitUpdate("generation");
			return;
		}

		const nextPopulation = [...survivors];
		const offspringTarget = Math.min(
			this.config.maxPopulationSize,
			survivors.length + this.config.offspringPerGeneration
		);

		while (nextPopulation.length < offspringTarget) {
			const parent1 = randomChoice(survivors);
			const parent2 = randomChoice(survivors);

			const child = generateOffspring(parent1, parent2, {
				mutationModeEnabled: this.config.mutationEnabled,
				mutationProbability: this.config.mutationProbability
			});

			nextPopulation.push(child);
		}

		this.population = nextPopulation;
		this.generation += 1;
		this.setMessage("Generation advanced.");
		this.emitUpdate("generation");
	}

	play() {
		if (this.intervalId) return;
		if (this.population.length < 2) {
			this.setMessage("Add a mate to begin reproduction.");
			window.alert("Add a mate to begin reproduction.");
			this.emitUpdate("play-blocked");
			return;
		}

		this.intervalId = window.setInterval(() => {
			this.stepGeneration();
		}, this.config.generationIntervalMs);
		this.setMessage("Simulation running.");
		this.emitUpdate("play");
	}

	pause() {
		if (!this.intervalId) return;
		window.clearInterval(this.intervalId);
		this.intervalId = null;
		this.setMessage("Simulation paused.");
		this.emitUpdate("pause");
	}

	reset() {
		this.pause();
		this.initializePopulation();
	}

	getState() {
		return {
			generation: this.generation,
			populationSize: this.population.length,
			message: this.lastMessage,
			environment: { ...this.config.environment },
			mutationEnabled: this.config.mutationEnabled,
			mutationProbability: this.config.mutationProbability
		};
	}
}

const engine = new SimulationEngine();

window.EvolutionEngine = {
	engine,
	play: () => engine.play(),
	pause: () => engine.pause(),
	reset: () => engine.reset(),
	step: () => engine.stepGeneration(),
	onUpdate: (listener) => engine.onUpdate(listener),
	setEnvironment: (patch) => engine.setEnvironment(patch),
	setMutation: (enabled, probability) => engine.setMutation(enabled, probability),
	addMate: (selected) => engine.addMate(selected),
	getState: () => engine.getState()
};

window.EvolutionEngine.onUpdate((event) => {
	console.log(
		`[EvolutionEngine] ${event.type} | Gen ${event.generation} | Population ${event.populationSize}`
	);
});
