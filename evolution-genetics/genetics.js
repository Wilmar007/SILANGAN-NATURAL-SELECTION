"use strict";

(() => {
  const TRAIT_RULES = {
    fur: {
      dominant: "B",
      recessive: "b",
      dominantPhenotype: "brown",
      recessivePhenotype: "white"
    },
    ears: {
      dominant: "E",
      recessive: "e",
      dominantPhenotype: "straight",
      recessivePhenotype: "floppy"
    },
    teeth: {
      dominant: "T",
      recessive: "t",
      dominantPhenotype: "long",
      recessivePhenotype: "short"
    }
  };

  const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

  const normalizeAlleles = (alleles) => [...alleles].sort((a, b) => {
    if (a === a.toUpperCase() && b === b.toLowerCase()) return -1;
    if (a === a.toLowerCase() && b === b.toUpperCase()) return 1;
    return a.localeCompare(b);
  });

  function allelePairToPhenotype(alleles, traitKey) {
    const rule = TRAIT_RULES[traitKey];
    const hasDominant = alleles.includes(rule.dominant);
    return hasDominant ? rule.dominantPhenotype : rule.recessivePhenotype;
  }

  class Rabbit {
    constructor({
      id,
      furAlleles,
      earAlleles,
      teethAlleles,
      parent1 = null,
      parent2 = null,
      alive = true
    }) {
      this.id = id;
      this.furAlleles = normalizeAlleles(furAlleles);
      this.earAlleles = normalizeAlleles(earAlleles);
      this.teethAlleles = normalizeAlleles(teethAlleles);

      this.parent1 = parent1;
      this.parent2 = parent2;
      this.alive = alive;

      this.phenotype = this.determinePhenotype();
    }

    determinePhenotype() {
      return {
        fur: allelePairToPhenotype(this.furAlleles, "fur"),
        ears: allelePairToPhenotype(this.earAlleles, "ears"),
        teeth: allelePairToPhenotype(this.teethAlleles, "teeth")
      };
    }

    mutate(probability = 0.01) {
      if (Math.random() > probability) return false;

      const traitKeys = ["fur", "ears", "teeth"];
      const trait = randomChoice(traitKeys);
      const traitAlleleField = `${trait.slice(0, -1)}Alleles`;
      const alleleIndex = Math.random() < 0.5 ? 0 : 1;
      const rule = TRAIT_RULES[trait];

      const current = this[traitAlleleField][alleleIndex];
      this[traitAlleleField][alleleIndex] = current === rule.dominant ? rule.recessive : rule.dominant;
      this[traitAlleleField] = normalizeAlleles(this[traitAlleleField]);

      this.phenotype = this.determinePhenotype();
      return true;
    }

    getGenotypeLabels() {
      return {
        fur: this.furAlleles.join(""),
        ears: this.earAlleles.join(""),
        teeth: this.teethAlleles.join("")
      };
    }
  }

  window.Genetics = {
    Rabbit,
    TRAIT_RULES,
    allelePairToPhenotype
  };
})();
