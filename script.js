const frameCount = 160;
const framePath = (index) => `./frames/ezgif-frame-${String(index).padStart(3, "0")}.png`;
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

document.addEventListener("DOMContentLoaded", () => {
    initHeaderState();
    initScrollButtons();
    initReveals();
    initTiltCards();
    initProductCardNavigation();
    initCartButtons();
    initNewsletter();
    initFrameReel();
    initGsapTouches();
    if (!document.getElementById("homeFrameCanvas")) {
        initHeroScene();
    }
});

function hideLoadingOverlay() {
    const overlay = document.getElementById("loadingOverlay");
    if (!overlay) return;

    window.setTimeout(() => {
        overlay.classList.add("hidden");
    }, 350);
}

function initHeaderState() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    const update = () => {
        header.classList.toggle("is-scrolled", window.scrollY > 24);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
}

function initScrollButtons() {
    document.querySelectorAll("[data-scroll]").forEach((button) => {
        button.addEventListener("click", () => {
            const target = document.querySelector(button.dataset.scroll);
            if (!target) return;
            target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "start" });
        });
    });
}

function initReveals() {
    const revealEls = Array.from(document.querySelectorAll(".reveal"));
    if (!revealEls.length) return;

    if (!("IntersectionObserver" in window)) {
        revealEls.forEach((el) => el.classList.add("is-visible"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, {
        threshold: 0.14,
        rootMargin: "0px 0px -8% 0px"
    });

    revealEls.forEach((el) => observer.observe(el));
}

function initTiltCards() {
    if (prefersReducedMotion || !window.matchMedia("(pointer: fine)").matches) return;

    document.querySelectorAll(".tilt-card").forEach((card) => {
        card.addEventListener("pointermove", (event) => {
            const rect = card.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width - 0.5;
            const y = (event.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `rotateX(${(-y * 8).toFixed(2)}deg) rotateY(${(x * 9).toFixed(2)}deg) translateY(-6px)`;
        });

        card.addEventListener("pointerleave", () => {
            card.style.transform = "";
        });
    });
}

function initProductCardNavigation() {
    document.querySelectorAll(".product-card[data-href]").forEach((card) => {
        const go = () => {
            window.location.href = card.dataset.href;
        };

        card.addEventListener("click", (event) => {
            if (event.target.closest("a, button")) return;
            go();
        });

        card.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") return;
            if (event.target.closest("a, button")) return;
            event.preventDefault();
            go();
        });
    });
}

function initCartButtons() {
    const buttons = document.querySelectorAll(".product-button");
    buttons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.stopPropagation();
            const card = button.closest(".product-card");
            const productName = card?.dataset.product || "Tea";
            const original = button.textContent;

            button.textContent = `${productName} Added`;
            button.classList.add("added");
            button.setAttribute("aria-live", "polite");

            window.setTimeout(() => {
                button.textContent = original;
                button.classList.remove("added");
            }, 1900);
        });
    });
}

function initNewsletter() {
    const form = document.querySelector(".newsletter");
    if (!form) return;

    const input = form.querySelector("input");
    const status = form.querySelector(".form-status");

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const email = input.value.trim();

        if (!email || !email.includes("@")) {
            status.textContent = "Please enter a valid email address.";
            status.style.color = "#f0bf68";
            return;
        }

        status.textContent = "You are on the LUXTEA list.";
        status.style.color = "#9ac7a6";
        input.value = "";
    });
}

function initFrameReel() {
    const homeCanvas = document.getElementById("homeFrameCanvas");
    if (homeCanvas) {
        const homeReel = new TeaFrameReel(homeCanvas, {
            speed: 58,
            scrollInfluence: 0.008,
            onFirstFrame: hideLoadingOverlay
        });
        homeReel.start();
        window.setTimeout(() => {
            if (!homeReel.firstFrameReady) hideLoadingOverlay();
        }, 2500);
    }

    const blendCanvas = document.getElementById("blendCanvas");
    if (blendCanvas) {
        new TeaFrameReel(blendCanvas, { speed: 80, scrollInfluence: 0.018 }).start();
    }
}

function initGsapTouches() {
    if (!window.gsap || !window.ScrollTrigger || prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    gsap.to(".hero-copy", {
        yPercent: -8,
        ease: "none",
        scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });

    gsap.to(".hero-panel", {
        yPercent: -18,
        ease: "none",
        scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true
        }
    });

    gsap.to(".ritual-table", {
        rotateZ: -4,
        ease: "none",
        scrollTrigger: {
            trigger: ".ritual",
            start: "top bottom",
            end: "bottom top",
            scrub: true
        }
    });
}

async function initHeroScene() {
    const canvas = document.getElementById("heroScene");
    if (!canvas || prefersReducedMotion) {
        document.body.classList.add("three-fallback");
        hideLoadingOverlay();
        return;
    }

    try {
        const THREE = await withTimeout(
            import("https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js"),
            3600,
            "Three.js import timed out"
        );

        const scene = new LuxTeaHeroScene(THREE, canvas);
        scene.start();
        window.luxTeaHeroScene = scene;
    } catch (error) {
        console.warn("Three.js scene unavailable, using CSS fallback.", error);
        document.body.classList.add("three-fallback");
    } finally {
        hideLoadingOverlay();
    }
}

function withTimeout(promise, ms, message) {
    let timeoutId;
    const timeout = new Promise((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error(message)), ms);
    });

    return Promise.race([promise, timeout]).finally(() => {
        window.clearTimeout(timeoutId);
    });
}

class TeaFrameReel {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.options = {
            speed: options.speed || 80,
            scrollInfluence: options.scrollInfluence || 0,
            onFirstFrame: options.onFirstFrame || null
        };
        this.firstFrameReady = false;
        this.images = [];
        this.loaded = 0;
        this.currentFrame = 0;
        this.lastDrawnFrame = -1;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.startTime = performance.now();
        this.resize = this.resize.bind(this);
        this.animate = this.animate.bind(this);
    }

    start() {
        this.resize();
        this.drawPlaceholder();
        this.loadFrames();
        window.addEventListener("resize", this.resize);
        requestAnimationFrame(this.animate);
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        const width = Math.max(1, rect.width);
        const height = Math.max(1, rect.height);
        this.canvas.width = Math.round(width * this.dpr);
        this.canvas.height = Math.round(height * this.dpr);
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
        this.drawFrame(this.currentFrame);
    }

    loadFrames() {
        for (let index = 1; index <= frameCount; index += 1) {
            const image = new Image();
            image.decoding = "async";
            image.onload = () => {
                this.images[index - 1] = image;
                this.loaded += 1;
                if (this.loaded === 1) {
                    this.drawFrame(index - 1);
                    this.firstFrameReady = true;
                    if (typeof this.options.onFirstFrame === "function") {
                        this.options.onFirstFrame();
                    }
                }
            };
            image.onerror = () => {
                this.images[index - 1] = null;
            };
            image.src = framePath(index);
        }
    }

    animate(now) {
        const elapsed = now - this.startTime;
        const scrollInfluence = window.scrollY * this.options.scrollInfluence;
        this.currentFrame = Math.floor(((elapsed / this.options.speed) + scrollInfluence) % frameCount);
        this.drawFrame(this.currentFrame);
        requestAnimationFrame(this.animate);
    }

    drawPlaceholder() {
        const width = this.canvas.clientWidth || 520;
        const height = this.canvas.clientHeight || 500;
        this.ctx.clearRect(0, 0, width, height);
        const gradient = this.ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, "#101412");
        gradient.addColorStop(1, "#2b1c10");
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);
        this.ctx.fillStyle = "rgba(247, 239, 226, 0.8)";
        this.ctx.font = "700 13px system-ui, sans-serif";
        this.ctx.letterSpacing = "1px";
        this.ctx.fillText("LOADING TEA MOTION", 24, height - 34);
    }

    drawFrame(frameIndex) {
        if (frameIndex === this.lastDrawnFrame && this.images[frameIndex]) return;

        let image = this.images[frameIndex];
        if (!image) {
            image = this.findNearestLoaded(frameIndex);
        }

        if (!image) {
            this.drawPlaceholder();
            return;
        }

        this.lastDrawnFrame = frameIndex;
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        const canvasAspect = width / height;
        const imageAspect = image.width / image.height;
        let drawWidth = width;
        let drawHeight = height;

        if (imageAspect > canvasAspect) {
            drawHeight = width / imageAspect;
        } else {
            drawWidth = height * imageAspect;
        }

        const x = (width - drawWidth) / 2;
        const y = (height - drawHeight) / 2;

        this.ctx.clearRect(0, 0, width, height);
        this.ctx.fillStyle = "#080a09";
        this.ctx.fillRect(0, 0, width, height);
        this.ctx.drawImage(image, x, y, drawWidth, drawHeight);
    }

    findNearestLoaded(frameIndex) {
        for (let offset = 1; offset < 16; offset += 1) {
            const backward = this.images[frameIndex - offset];
            const forward = this.images[frameIndex + offset];
            if (backward) return backward;
            if (forward) return forward;
        }
        return this.images.find(Boolean);
    }
}

class LuxTeaHeroScene {
    constructor(THREE, canvas) {
        this.THREE = THREE;
        this.canvas = canvas;
        this.pointer = { x: 0, y: 0 };
        this.clock = new THREE.Clock();
        this.steam = [];
        this.leaves = [];
        this.spice = [];
        this.resize = this.resize.bind(this);
        this.animate = this.animate.bind(this);
        this.handlePointer = this.handlePointer.bind(this);
        this.init();
    }

    init() {
        const THREE = this.THREE;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
        this.camera.position.set(0.25, 1.45, 7.2);

        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.root = new THREE.Group();
        this.root.position.set(1.25, -0.1, 0);
        this.scene.add(this.root);

        this.addLights();
        this.addStage();
        this.addCup();
        this.addTeaBox();
        this.addSteam();
        this.addBotanicals();

        window.addEventListener("resize", this.resize);
        window.addEventListener("pointermove", this.handlePointer, { passive: true });
        this.resize();
    }

    addLights() {
        const THREE = this.THREE;
        const ambient = new THREE.AmbientLight(0xf7efe2, 1.4);
        const key = new THREE.DirectionalLight(0xffdfa6, 3.3);
        key.position.set(3.8, 5.4, 4.8);
        key.castShadow = true;
        key.shadow.mapSize.set(1024, 1024);

        const rim = new THREE.PointLight(0x6ab4a8, 9, 12);
        rim.position.set(-3.4, 1.2, 2.4);

        const glow = new THREE.PointLight(0xd59639, 6, 11);
        glow.position.set(1.6, 0.2, 1.8);

        this.scene.add(ambient, key, rim, glow);
    }

    addStage() {
        const THREE = this.THREE;
        const material = new THREE.MeshStandardMaterial({
            color: 0x30221a,
            roughness: 0.78,
            metalness: 0.06
        });

        const platform = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.85, 0.18, 96), material);
        platform.position.y = -1.42;
        platform.receiveShadow = true;
        this.root.add(platform);

        const backDisk = new THREE.Mesh(
            new THREE.TorusGeometry(2.48, 0.015, 10, 120),
            new THREE.MeshBasicMaterial({ color: 0xf0bf68, transparent: true, opacity: 0.2 })
        );
        backDisk.position.set(0.05, 0.55, -1.25);
        backDisk.rotation.x = Math.PI / 2.7;
        this.root.add(backDisk);
    }

    addCup() {
        const THREE = this.THREE;
        const porcelain = new THREE.MeshStandardMaterial({
            color: 0xf3eadb,
            roughness: 0.43,
            metalness: 0.02
        });
        const tea = new THREE.MeshStandardMaterial({
            color: 0x9a5624,
            roughness: 0.24,
            metalness: 0.02,
            emissive: 0x3d1808,
            emissiveIntensity: 0.25
        });

        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.58, 0.72, 96, 1, true), porcelain);
        cup.position.set(-1.0, -0.86, 0.25);
        cup.castShadow = true;
        cup.receiveShadow = true;

        const teaSurface = new THREE.Mesh(new THREE.CylinderGeometry(0.71, 0.71, 0.025, 96), tea);
        teaSurface.position.set(-1.0, -0.49, 0.25);

        const saucer = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.18, 0.12, 96), porcelain);
        saucer.position.set(-1.0, -1.27, 0.25);
        saucer.castShadow = true;
        saucer.receiveShadow = true;

        const handle = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.045, 18, 64), porcelain);
        handle.position.set(-0.28, -0.83, 0.25);
        handle.rotation.y = Math.PI / 2;
        handle.scale.y = 1.22;
        handle.castShadow = true;

        this.cupGroup = new THREE.Group();
        this.cupGroup.add(cup, teaSurface, saucer, handle);
        this.root.add(this.cupGroup);
    }

    addTeaBox() {
        const THREE = this.THREE;
        const texture = this.createPackTexture();
        const sideMaterial = new THREE.MeshStandardMaterial({ color: 0x244239, roughness: 0.68, metalness: 0.05 });
        const topMaterial = new THREE.MeshStandardMaterial({ color: 0xd59639, roughness: 0.56, metalness: 0.08 });
        const frontMaterial = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.52, metalness: 0.03 });

        this.teaBox = new THREE.Mesh(
            new THREE.BoxGeometry(1.45, 2.18, 0.62),
            [sideMaterial, sideMaterial, topMaterial, sideMaterial, frontMaterial, sideMaterial]
        );
        this.teaBox.position.set(0.62, -0.25, -0.2);
        this.teaBox.rotation.set(-0.08, -0.42, 0.05);
        this.teaBox.castShadow = true;
        this.teaBox.receiveShadow = true;
        this.root.add(this.teaBox);
    }

    createPackTexture() {
        const THREE = this.THREE;
        const canvas = document.createElement("canvas");
        canvas.width = 768;
        canvas.height = 1024;
        const ctx = canvas.getContext("2d");

        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, "#17352f");
        gradient.addColorStop(0.54, "#b66e2a");
        gradient.addColorStop(1, "#1b1110");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = "rgba(247, 239, 226, 0.34)";
        ctx.lineWidth = 6;
        ctx.strokeRect(56, 56, canvas.width - 112, canvas.height - 112);

        ctx.beginPath();
        ctx.arc(canvas.width / 2, 266, 112, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(247, 239, 226, 0.46)";
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = "#f7efe2";
        ctx.textAlign = "center";
        ctx.font = "800 62px Arial, sans-serif";
        ctx.fillText("LUXTEA", canvas.width / 2, 286);

        ctx.font = "700 52px Arial, sans-serif";
        ctx.fillText("AMBER", canvas.width / 2, 680);
        ctx.fillText("CALM", canvas.width / 2, 748);

        ctx.fillStyle = "rgba(247, 239, 226, 0.78)";
        ctx.font = "600 28px Arial, sans-serif";
        ctx.fillText("CINNAMON BLACK TEA", canvas.width / 2, 810);
        ctx.fillText("WHOLE LEAF BLEND", canvas.width / 2, 866);

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        return texture;
    }

    addSteam() {
        const THREE = this.THREE;
        const material = new THREE.MeshBasicMaterial({
            color: 0xf7efe2,
            transparent: true,
            opacity: 0.18,
            depthWrite: false
        });

        for (let i = 0; i < 7; i += 1) {
            const x = -1.28 + i * 0.1;
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(x, -0.42, 0.25),
                new THREE.Vector3(x + 0.08, 0.04, 0.22 + i * 0.015),
                new THREE.Vector3(x - 0.12, 0.54, 0.32),
                new THREE.Vector3(x + 0.1, 1.0, 0.18)
            ]);
            const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 44, 0.012, 8, false), material.clone());
            tube.userData.phase = i * 0.65;
            this.steam.push(tube);
            this.root.add(tube);
        }
    }

    addBotanicals() {
        const THREE = this.THREE;
        const leafMaterial = new THREE.MeshStandardMaterial({
            color: 0x8fae6f,
            roughness: 0.62,
            metalness: 0.02,
            side: THREE.DoubleSide
        });
        const roseMaterial = new THREE.MeshStandardMaterial({
            color: 0xb46975,
            roughness: 0.7,
            side: THREE.DoubleSide
        });
        const spiceMaterial = new THREE.MeshStandardMaterial({
            color: 0xa45d2f,
            roughness: 0.68
        });

        const leafShape = new THREE.Shape();
        leafShape.absellipse(0, 0, 0.18, 0.065, 0, Math.PI * 2, false, 0.3);
        const leafGeometry = new THREE.ShapeGeometry(leafShape);

        for (let i = 0; i < 34; i += 1) {
            const material = i % 8 === 0 ? roseMaterial : leafMaterial;
            const leaf = new THREE.Mesh(leafGeometry, material);
            const angle = (i / 34) * Math.PI * 2;
            const radius = 1.75 + (i % 5) * 0.11;
            leaf.position.set(Math.cos(angle) * radius, -0.1 + Math.sin(i * 1.7) * 0.9, Math.sin(angle) * 0.8);
            leaf.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            leaf.scale.setScalar(0.8 + Math.random() * 0.8);
            leaf.userData.angle = angle;
            leaf.userData.radius = radius;
            leaf.userData.speed = 0.08 + Math.random() * 0.12;
            leaf.castShadow = true;
            this.leaves.push(leaf);
            this.root.add(leaf);
        }

        for (let i = 0; i < 5; i += 1) {
            const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.72, 18), spiceMaterial);
            stick.position.set(0.95 + i * 0.09, -1.08, 0.34 + i * 0.06);
            stick.rotation.set(1.08, 0.25 + i * 0.18, 0.7);
            stick.castShadow = true;
            this.spice.push(stick);
            this.root.add(stick);
        }
    }

    handlePointer(event) {
        this.pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
        this.pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
    }

    resize() {
        const width = this.canvas.clientWidth || window.innerWidth;
        const height = this.canvas.clientHeight || window.innerHeight;
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height, false);
    }

    start() {
        this.animate();
    }

    animate() {
        const t = this.clock.getElapsedTime();
        const scroll = window.scrollY || 0;

        this.root.rotation.y = -0.18 + this.pointer.x * 0.14 + Math.sin(t * 0.24) * 0.04 + scroll * 0.00008;
        this.root.rotation.x = this.pointer.y * 0.045;
        this.root.position.y = -0.08 + Math.sin(t * 0.5) * 0.035;

        if (this.teaBox) {
            this.teaBox.rotation.y = -0.42 + Math.sin(t * 0.62) * 0.08;
            this.teaBox.position.y = -0.25 + Math.sin(t * 0.85) * 0.055;
        }

        if (this.cupGroup) {
            this.cupGroup.rotation.y = Math.sin(t * 0.55) * 0.04;
        }

        this.steam.forEach((line, index) => {
            const phase = t * 1.1 + line.userData.phase;
            line.material.opacity = 0.08 + Math.max(0, Math.sin(phase)) * 0.22;
            line.position.y = Math.sin(phase) * 0.08;
            line.rotation.z = Math.sin(phase * 0.7) * 0.08;
            line.scale.y = 0.92 + Math.sin(phase) * 0.1;
            line.scale.x = 1 + Math.sin(phase + index) * 0.08;
        });

        this.leaves.forEach((leaf, index) => {
            const angle = leaf.userData.angle + t * leaf.userData.speed;
            leaf.position.x = Math.cos(angle) * leaf.userData.radius;
            leaf.position.z = Math.sin(angle) * 0.88;
            leaf.position.y += Math.sin(t * 1.2 + index) * 0.0017;
            leaf.rotation.x += 0.004 + index * 0.00005;
            leaf.rotation.z += 0.006;
        });

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(this.animate);
    }
}
