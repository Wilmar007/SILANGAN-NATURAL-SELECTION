export class Rabbit {
  constructor({
    id,
    furAlleles = ["B", "b"],
    earAlleles = ["E", "e"],
    teethAlleles = ["T", "t"],
    parent1 = null,
    parent2 = null,
    alive = true
  } = {}) {
    this.id = id ?? Rabbit.generateId();

    this.furAlleles = Rabbit.normalizeAlleles(furAlleles);
    this.earAlleles = Rabbit.normalizeAlleles(earAlleles);
    this.teethAlleles = Rabbit.normalizeAlleles(teethAlleles);

    this.parent1 = parent1;
    this.parent2 = parent2;
    this.alive = alive;

    this.phenotype = this.determinePhenotype();
  }

  static generateId() {
    return `rabbit-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  static normalizeAlleles(alleles) {
    return [...alleles].sort((a, b) => {
      const aUpper = a === a.toUpperCase();
      const bUpper = b === b.toUpperCase();
      if (aUpper && !bUpper) return -1;
      if (!aUpper && bUpper) return 1;
      return a.localeCompare(b);
    });
  }

  determinePhenotype() {
    const fur = this.furAlleles.includes("B") ? "brown" : "white";
    const ears = this.earAlleles.includes("E") ? "straight" : "floppy";
    const teeth = this.teethAlleles.includes("T") ? "long" : "short";

    this.phenotype = { fur, ears, teeth };
    return this.phenotype;
  }

  mutate(probability = 0.01, mutationModeEnabled = false) {
    if (!mutationModeEnabled || Math.random() > probability) {
      return false;
    }

    const traitKeys = ["furAlleles", "earAlleles", "teethAlleles"];
    const selectedTrait = traitKeys[Math.floor(Math.random() * traitKeys.length)];
    const alleleIndex = Math.random() < 0.5 ? 0 : 1;

    const current = this[selectedTrait][alleleIndex];
    const mutated = current === current.toUpperCase() ? current.toLowerCase() : current.toUpperCase();

    this[selectedTrait][alleleIndex] = mutated;
    this[selectedTrait] = Rabbit.normalizeAlleles(this[selectedTrait]);
    this.determinePhenotype();

    return true;
  }
}
