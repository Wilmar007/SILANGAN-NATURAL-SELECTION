"use strict";

(() => {
  const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function assertGeneticsReady() {
    if (!window.Genetics || !window.Genetics.Rabbit) {
      throw new Error("Genetics module is required before reproduction module.");
    }
  }

  function createId(prefix = "rabbit") {
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function inheritAllelePair(parentAAlleles, parentBAlleles) {
    return [
      randomChoice(parentAAlleles),
      randomChoice(parentBAlleles)
    ];
  }

  function mate(parent1, parent2, options = {}) {
    assertGeneticsReady();

    const {
      mutationEnabled = false,
      mutationRate = 0.01,
      idFactory = createId
    } = options;

    const Rabbit = window.Genetics.Rabbit;

    const child = new Rabbit({
      id: idFactory("rabbit"),
      furAlleles: inheritAllelePair(parent1.furAlleles, parent2.furAlleles),
      earAlleles: inheritAllelePair(parent1.earAlleles, parent2.earAlleles),
      teethAlleles: inheritAllelePair(parent1.teethAlleles, parent2.teethAlleles),
      parent1: parent1.id,
      parent2: parent2.id,
      alive: true
    });

    if (mutationEnabled) {
      child.mutate(mutationRate);
    }

    return child;
  }

  function generateOffspring(parent1, parent2, count, options = {}) {
    const offspring = [];
    for (let i = 0; i < count; i++) {
      offspring.push(mate(parent1, parent2, options));
    }
    return offspring;
  }

  window.Reproduction = {
    mate,
    generateOffspring,
    inheritAllelePair
  };
})();
