const blendConfigs = {
    amber: {
        primary: "#d59639",
        secondary: "#f0bf68",
        deep: "#140d08",
        tea: "#8a461e",
        pieces: ["leaf", "stick", "pod", "peel", "spark"]
    },
    mint: {
        primary: "#6da36c",
        secondary: "#a8d9b8",
        deep: "#071512",
        tea: "#7fae75",
        pieces: ["mint", "leaf", "peel", "seed", "spark"]
    },
    cinnamon: {
        primary: "#a86636",
        secondary: "#d9a66b",
        deep: "#140b08",
        tea: "#7a351c",
        pieces: ["stick", "vanilla", "cacao", "peel", "spark"]
    },
    rose: {
        primary: "#b46975",
        secondary: "#e1a7ad",
        deep: "#160b11",
        tea: "#ad6671",
        pieces: ["petal", "flower", "leaf", "apple", "spark"]
    }
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.addEventListener("DOMContentLoaded", () => {
    initDetailHeader();
    initDetailReveals();
    initDetailCart();
    initDetailCanvas();
});

function initDetailHeader() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    const update = () => {
        header.classList.toggle("is-scrolled", window.scrollY > 24);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
}

function initDetailReveals() {
    const nodes = Array.from(document.querySelectorAll(".reveal"));
    if (!nodes.length) return;

    if (!("IntersectionObserver" in window)) {
        nodes.forEach((node) => node.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });

    nodes.forEach((node) => observer.observe(node));
}

function initDetailCart() {
    const button = document.querySelector(".detail-cart");
    if (!button) return;

    const original = button.textContent;
    button.addEventListener("click", () => {
        button.textContent = "Added to Cart";
        button.classList.add("added");
        window.setTimeout(() => {
            button.textContent = original;
            button.classList.remove("added");
        }, 1800);
    });
}

function initDetailCanvas() {
    const canvas = document.getElementById("detailCanvas");
    if (!canvas) return;

    const blend = document.body.dataset.blend || "amber";
    const config = blendConfigs[blend] || blendConfigs.amber;
    new BlendCanvas(canvas, config).start();
}

class BlendCanvas {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.config = config;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.items = [];
        this.time = 0;
        this.resize = this.resize.bind(this);
        this.animate = this.animate.bind(this);
    }

    start() {
        this.resize();
        window.addEventListener("resize", this.resize);
        if (reduceMotion) {
            this.draw(0);
            return;
        }
        requestAnimationFrame(this.animate);
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.width = Math.max(1, rect.width);
        this.height = Math.max(1, rect.height);
        this.canvas.width = Math.round(this.width * this.dpr);
        this.canvas.height = Math.round(this.height * this.dpr);
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.createItems();
        this.draw(this.time);
    }

    createItems() {
        const count = this.width < 600 ? 28 : 46;
        this.items = Array.from({ length: count }, (_, index) => {
            const type = this.config.pieces[index % this.config.pieces.length];
            return {
                type,
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                radius: 18 + Math.random() * 170,
                size: 0.65 + Math.random() * 1.55,
                speed: 0.22 + Math.random() * 0.65,
                phase: Math.random() * Math.PI * 2,
                tilt: Math.random() * Math.PI
            };
        });
    }

    animate(now) {
        this.time = now * 0.001;
        this.draw(this.time);
        requestAnimationFrame(this.animate);
    }

    draw(time) {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);
        this.drawBackground(ctx, time);
        this.drawLightRings(ctx, time);
        this.items.forEach((item, index) => this.drawItem(ctx, item, index, time));
        this.drawForegroundGlow(ctx, time);
    }

    drawBackground(ctx, time) {
        const gradient = ctx.createLinearGradient(0, 0, this.width, this.height);
        gradient.addColorStop(0, this.config.deep);
        gradient.addColorStop(0.52, "#080908");
        gradient.addColorStop(1, "#020303");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);

        const glow = ctx.createRadialGradient(
            this.width * 0.58,
            this.height * 0.34,
            0,
            this.width * 0.58,
            this.height * 0.34,
            this.width * 0.62
        );
        glow.addColorStop(0, hexToRgba(this.config.secondary, 0.3 + Math.sin(time) * 0.04));
        glow.addColorStop(0.38, hexToRgba(this.config.primary, 0.12));
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    drawLightRings(ctx, time) {
        ctx.save();
        ctx.translate(this.width * 0.55, this.height * 0.55);
        ctx.rotate(Math.sin(time * 0.25) * 0.12);
        for (let i = 0; i < 4; i += 1) {
            ctx.beginPath();
            ctx.ellipse(0, 0, 180 + i * 62, 54 + i * 20, 0, 0, Math.PI * 2);
            ctx.strokeStyle = hexToRgba(this.config.secondary, 0.1 - i * 0.015);
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        ctx.restore();
    }

    drawItem(ctx, item, index, time) {
        const drift = time * item.speed + item.phase;
        const x = item.x + Math.cos(drift) * item.radius * 0.34;
        const y = item.y + Math.sin(drift * 0.8) * item.radius * 0.22 - (time * 8 * item.speed) % (this.height + 160);
        const wrappedY = ((y + 180) % (this.height + 180)) - 80;
        const alpha = 0.32 + Math.sin(drift + index) * 0.18;
        const rotation = item.tilt + time * (0.18 + index * 0.002);

        ctx.save();
        ctx.translate(x, wrappedY);
        ctx.rotate(rotation);
        ctx.globalAlpha = Math.max(0.12, alpha);
        ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
        ctx.shadowBlur = 18;
        ctx.shadowOffsetY = 12;

        if (item.type === "stick") this.drawStick(ctx, item.size);
        if (item.type === "vanilla") this.drawVanilla(ctx, item.size);
        if (item.type === "pod") this.drawPod(ctx, item.size);
        if (item.type === "peel") this.drawPeel(ctx, item.size);
        if (item.type === "mint" || item.type === "leaf") this.drawLeaf(ctx, item.size, item.type === "mint");
        if (item.type === "petal") this.drawPetal(ctx, item.size);
        if (item.type === "flower") this.drawFlower(ctx, item.size);
        if (item.type === "apple") this.drawApple(ctx, item.size);
        if (item.type === "seed") this.drawSeed(ctx, item.size);
        if (item.type === "cacao") this.drawCacao(ctx, item.size);
        if (item.type === "spark") this.drawSpark(ctx, item.size);

        ctx.restore();
    }

    drawStick(ctx, scale) {
        const w = 12 * scale;
        const h = 76 * scale;
        const gradient = ctx.createLinearGradient(-w, 0, w, 0);
        gradient.addColorStop(0, "#3b1b12");
        gradient.addColorStop(0.5, "#b56f38");
        gradient.addColorStop(1, "#4a2114");
        ctx.fillStyle = gradient;
        roundedRect(ctx, -w / 2, -h / 2, w, h, w / 2);
        ctx.fill();
    }

    drawVanilla(ctx, scale) {
        const w = 9 * scale;
        const h = 84 * scale;
        const gradient = ctx.createLinearGradient(-w, 0, w, 0);
        gradient.addColorStop(0, "#160c09");
        gradient.addColorStop(0.5, "#65402d");
        gradient.addColorStop(1, "#0b0504");
        ctx.fillStyle = gradient;
        roundedRect(ctx, -w / 2, -h / 2, w, h, w / 2);
        ctx.fill();
    }

    drawPod(ctx, scale) {
        ctx.fillStyle = "#a9ad73";
        ctx.beginPath();
        ctx.ellipse(0, 0, 21 * scale, 13 * scale, 0.12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.24)";
        ctx.stroke();
    }

    drawPeel(ctx, scale) {
        ctx.strokeStyle = this.config.secondary;
        ctx.lineWidth = 6 * scale;
        ctx.beginPath();
        ctx.arc(0, 0, 22 * scale, Math.PI * 0.1, Math.PI * 0.9);
        ctx.stroke();
    }

    drawLeaf(ctx, scale, mint) {
        ctx.fillStyle = mint ? "#9fd3a4" : "#7f9f61";
        ctx.beginPath();
        ctx.ellipse(0, 0, 30 * scale, 12 * scale, -0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.26)";
        ctx.beginPath();
        ctx.moveTo(-22 * scale, 0);
        ctx.lineTo(24 * scale, 0);
        ctx.stroke();
    }

    drawPetal(ctx, scale) {
        ctx.fillStyle = "#d8919a";
        ctx.beginPath();
        ctx.ellipse(0, 0, 26 * scale, 14 * scale, -0.2, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFlower(ctx, scale) {
        for (let i = 0; i < 10; i += 1) {
            ctx.save();
            ctx.rotate((Math.PI * 2 * i) / 10);
            ctx.fillStyle = "#eadbc3";
            ctx.beginPath();
            ctx.ellipse(12 * scale, 0, 12 * scale, 5 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        ctx.fillStyle = "#d3a844";
        ctx.beginPath();
        ctx.arc(0, 0, 8 * scale, 0, Math.PI * 2);
        ctx.fill();
    }

    drawApple(ctx, scale) {
        ctx.fillStyle = "#d6a48b";
        ctx.beginPath();
        ctx.arc(0, 0, 15 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        ctx.beginPath();
        ctx.arc(-5 * scale, -5 * scale, 4 * scale, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSeed(ctx, scale) {
        ctx.fillStyle = "#c9b17d";
        ctx.beginPath();
        ctx.ellipse(0, 0, 13 * scale, 7 * scale, 0.3, 0, Math.PI * 2);
        ctx.fill();
    }

    drawCacao(ctx, scale) {
        ctx.fillStyle = "#5f3323";
        ctx.beginPath();
        ctx.ellipse(0, 0, 18 * scale, 12 * scale, -0.15, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSpark(ctx, scale) {
        const radius = 4 * scale;
        const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 6);
        glow.addColorStop(0, hexToRgba(this.config.secondary, 0.95));
        glow.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.config.secondary;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    drawForegroundGlow(ctx, time) {
        const glow = ctx.createRadialGradient(
            this.width * 0.6,
            this.height * 0.78,
            0,
            this.width * 0.6,
            this.height * 0.78,
            this.width * 0.38
        );
        glow.addColorStop(0, hexToRgba(this.config.primary, 0.18 + Math.sin(time * 1.4) * 0.04));
        glow.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, this.width, this.height);
    }
}

function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
}

function hexToRgba(hex, alpha) {
    const value = hex.replace("#", "");
    const bigint = parseInt(value, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
