const rand = (min, max) => min + Math.random() * (max - min);

class EvolutionAnimator {
	constructor() {
		this.canvas = null;
		this.ctx = null;
		this.populationVisuals = new Map();
		this.groundY = 0;
		this.lastFrame = 0;
		this.statusNode = null;
		this.furSelect = null;
		this.earsSelect = null;
		this.teethSelect = null;
		this.showLabels = true;
	}

	loadLabelPreference() {
		const raw = window.localStorage.getItem("evolutionEngine.showLabels");
		if (raw === null) return;
		this.showLabels = raw === "true";
	}

	saveLabelPreference() {
		window.localStorage.setItem("evolutionEngine.showLabels", String(this.showLabels));
	}

	init() {
		if (!window.EvolutionEngine) {
			console.warn("EvolutionEngine not found. Ensure main.js is loaded before animation.js.");
			return;
		}

		this.buildInterface();
		this.syncFromEngine();

		window.EvolutionEngine.onUpdate(() => {
			this.syncFromEngine();
		});

		window.requestAnimationFrame(this.loop);
	}

	buildInterface() {
		this.loadLabelPreference();

		const root = document.createElement("div");
		root.style.maxWidth = "1100px";
		root.style.margin = "0 auto";
		root.style.padding = "16px";
		root.style.fontFamily = "Segoe UI, sans-serif";

		const title = document.createElement("h2");
		title.textContent = "Evolution Engine - Animation View";
		title.style.margin = "0 0 10px";

		const toolbar = document.createElement("div");
		toolbar.style.display = "flex";
		toolbar.style.gap = "8px";
		toolbar.style.alignItems = "center";
		toolbar.style.marginBottom = "10px";

		const mkBtn = (label, onClick) => {
			const btn = document.createElement("button");
			btn.textContent = label;
			btn.style.padding = "6px 12px";
			btn.style.border = "1px solid #cbd5e1";
			btn.style.borderRadius = "8px";
			btn.style.background = "#fff";
			btn.style.cursor = "pointer";
			btn.addEventListener("click", onClick);
			return btn;
		};

		toolbar.appendChild(mkBtn("Play", () => window.EvolutionEngine.play()));
		toolbar.appendChild(mkBtn("Pause", () => window.EvolutionEngine.pause()));
		toolbar.appendChild(mkBtn("Reset", () => window.EvolutionEngine.reset()));

		const labelsBtn = mkBtn("Hide Labels", () => {
			this.showLabels = !this.showLabels;
			labelsBtn.textContent = this.showLabels ? "Hide Labels" : "Show Labels";
			this.saveLabelPreference();
		});
		labelsBtn.textContent = this.showLabels ? "Hide Labels" : "Show Labels";
		toolbar.appendChild(labelsBtn);

		const envWrap = document.createElement("div");
		envWrap.style.display = "flex";
		envWrap.style.gap = "10px";
		envWrap.style.marginLeft = "8px";

		const mkToggle = (label, key) => {
			const wrapper = document.createElement("label");
			wrapper.style.display = "flex";
			wrapper.style.alignItems = "center";
			wrapper.style.gap = "4px";

			const input = document.createElement("input");
			input.type = "checkbox";
			input.addEventListener("change", () => {
				window.EvolutionEngine.setEnvironment({ [key]: input.checked });
			});

			wrapper.appendChild(input);
			wrapper.appendChild(document.createTextNode(label));
			envWrap.appendChild(wrapper);
		};

		mkToggle("Wolves", "wolvesEnabled");
		mkToggle("Tough Food", "toughFoodEnabled");
		mkToggle("Limited Food", "limitedFoodEnabled");

		toolbar.appendChild(envWrap);

		const mateWrap = document.createElement("div");
		mateWrap.style.display = "grid";
		mateWrap.style.gridTemplateColumns = "repeat(4, auto)";
		mateWrap.style.gap = "8px";
		mateWrap.style.alignItems = "center";
		mateWrap.style.marginBottom = "10px";

		const buildSelect = (labelText, options) => {
			const wrap = document.createElement("label");
			wrap.style.display = "grid";
			wrap.style.gap = "4px";
			wrap.style.fontSize = "12px";
			wrap.style.color = "#334155";
			wrap.textContent = labelText;

			const select = document.createElement("select");
			select.style.padding = "5px 8px";
			select.style.border = "1px solid #cbd5e1";
			select.style.borderRadius = "8px";
			for (const opt of options) {
				const o = document.createElement("option");
				o.value = opt.value;
				o.textContent = opt.label;
				select.appendChild(o);
			}

			wrap.appendChild(select);
			return { wrap, select };
		};

		const fur = buildSelect("Fur", [
			{ value: "brown", label: "Brown" },
			{ value: "white", label: "White" }
		]);
		this.furSelect = fur.select;

		const ears = buildSelect("Ears", [
			{ value: "straight", label: "Straight" },
			{ value: "floppy", label: "Floppy" }
		]);
		this.earsSelect = ears.select;

		const teeth = buildSelect("Teeth", [
			{ value: "long", label: "Long" },
			{ value: "short", label: "Short" }
		]);
		this.teethSelect = teeth.select;

		const addMateBtn = mkBtn("Add Mate", () => {
			window.EvolutionEngine.addMate({
				fur: this.furSelect?.value ?? "brown",
				ears: this.earsSelect?.value ?? "straight",
				teeth: this.teethSelect?.value ?? "long"
			});
		});

		mateWrap.appendChild(fur.wrap);
		mateWrap.appendChild(ears.wrap);
		mateWrap.appendChild(teeth.wrap);
		mateWrap.appendChild(addMateBtn);

		this.statusNode = document.createElement("div");
		this.statusNode.style.marginBottom = "10px";
		this.statusNode.style.color = "#475569";

		this.canvas = document.createElement("canvas");
		this.canvas.width = 1000;
		this.canvas.height = 420;
		this.canvas.style.width = "100%";
		this.canvas.style.border = "1px solid #dbe3ef";
		this.canvas.style.borderRadius = "10px";
		this.canvas.style.background = "#eef8f1";
		this.ctx = this.canvas.getContext("2d");
		this.groundY = this.canvas.height - 28;

		root.appendChild(title);
		root.appendChild(toolbar);
		root.appendChild(mateWrap);
		root.appendChild(this.statusNode);
		root.appendChild(this.canvas);

		document.body.appendChild(root);
	}

	syncFromEngine() {
		const state = window.EvolutionEngine.getState();
		const population = window.EvolutionEngine.engine.population;

		this.statusNode.textContent = `Generation: ${state.generation} | Population: ${state.populationSize} | ${state.message || ""}`;

		const incoming = new Set();
		const densityScale = Math.max(0.45, 1 - population.length / 260);

		for (const rabbit of population) {
			incoming.add(rabbit.id);
			const genotype = {
				fur: (rabbit.furAlleles || []).join(""),
				ears: (rabbit.earAlleles || []).join(""),
				teeth: (rabbit.teethAlleles || []).join("")
			};
			const phenotype = rabbit.phenotype || {};
			if (!this.populationVisuals.has(rabbit.id)) {
				this.populationVisuals.set(rabbit.id, {
					id: rabbit.id,
					x: rand(20, this.canvas.width - 20),
					y: this.groundY,
					vx: (Math.random() < 0.5 ? -1 : 1) * rand(0.8, 1.8),
					vy: 0,
					gravity: 0.36,
					size: rand(7, 11) * densityScale,
					fur: phenotype.fur,
					ears: phenotype.ears,
					teeth: phenotype.teeth,
					genotype
				});
			} else {
				const visual = this.populationVisuals.get(rabbit.id);
				visual.fur = phenotype.fur;
				visual.ears = phenotype.ears;
				visual.teeth = phenotype.teeth;
				visual.genotype = genotype;
				visual.size = rand(7, 11) * densityScale;
			}
		}

		for (const id of this.populationVisuals.keys()) {
			if (!incoming.has(id)) this.populationVisuals.delete(id);
		}
	}

	updateVisual(v, dt) {
		v.x += v.vx * dt * 60;
		if (Math.random() < 0.01) v.vx *= -1;
		if (Math.random() < 0.004 && v.y >= this.groundY - 0.2) v.vy = -4.8;

		v.vy += v.gravity * dt * 60;
		v.y += v.vy * dt * 60;

		if (v.y > this.groundY) {
			v.y = this.groundY;
			v.vy = 0;
		}

		if (v.x < v.size) {
			v.x = v.size;
			v.vx = Math.abs(v.vx);
		}
		if (v.x > this.canvas.width - v.size) {
			v.x = this.canvas.width - v.size;
			v.vx = -Math.abs(v.vx);
		}
	}

	drawRabbit(v) {
		const ctx = this.ctx;
		const body = v.fur === "brown" ? "#7c5a45" : "#f2ebe0";
		const earLen = v.ears === "floppy" ? v.size * 0.45 : v.size * 0.72;

		ctx.save();
		ctx.translate(v.x, v.y);

		ctx.fillStyle = "rgba(15,23,42,0.15)";
		ctx.beginPath();
		ctx.ellipse(0, v.size * 0.78, v.size * 1.2, v.size * 0.3, 0, 0, Math.PI * 2);
		ctx.fill();

		ctx.fillStyle = body;
		ctx.beginPath();
		ctx.arc(0, 0, v.size, 0, Math.PI * 2);
		ctx.fill();

		ctx.beginPath();
		ctx.ellipse(-v.size * 0.35, -v.size * 1.05, v.size * 0.24, earLen, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.beginPath();
		ctx.ellipse(v.size * 0.05, -v.size * 1.08, v.size * 0.24, earLen, 0, 0, Math.PI * 2);
		ctx.fill();

		ctx.fillStyle = "#111827";
		ctx.beginPath();
		ctx.arc(v.size * 0.35, -v.size * 0.2, 1.2, 0, Math.PI * 2);
		ctx.fill();

		if (this.showLabels) {
			ctx.fillStyle = "#0f172a";
			ctx.font = "10px Segoe UI";
			ctx.textAlign = "center";
			const genotypeLabel = `${v.genotype?.fur || "??"}/${v.genotype?.ears || "??"}/${v.genotype?.teeth || "??"}`;
			const phenotypeLabel = `${v.fur || "?"}, ${v.ears || "?"}, ${v.teeth || "?"}`;
			ctx.fillText(genotypeLabel, 0, -v.size - 16);
			ctx.fillText(phenotypeLabel, 0, -v.size - 5);
			ctx.textAlign = "start";
		}
		ctx.restore();
	}

	drawBackground() {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.fillStyle = "#e8f6e9";
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		this.ctx.beginPath();
		this.ctx.moveTo(0, this.groundY + 10);
		this.ctx.lineTo(this.canvas.width, this.groundY + 10);
		this.ctx.strokeStyle = "rgba(21, 128, 61, 0.5)";
		this.ctx.lineWidth = 2;
		this.ctx.stroke();
	}

	loop = (ts) => {
		if (!this.lastFrame) this.lastFrame = ts;
		const dt = Math.min(0.05, (ts - this.lastFrame) / 1000);
		this.lastFrame = ts;

		this.drawBackground();
		for (const v of this.populationVisuals.values()) {
			this.updateVisual(v, dt);
			this.drawRabbit(v);
		}

		window.requestAnimationFrame(this.loop);
	};
}

const animator = new EvolutionAnimator();
window.addEventListener("DOMContentLoaded", () => {
	animator.init();
});
