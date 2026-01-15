// ============================================
// THREE.JS WEBGL SLIDER
// ============================================

class WebGLSlider {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            precision: 'highp'
        });
        
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x0a0e27, 0);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
        
        container.appendChild(this.renderer.domElement);
        
        this.camera.position.z = 5;
        
        this.slides = [];
        this.currentSlide = 0;
        this.isTransitioning = false;
        this.time = 0;
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.setupLights();
        this.createSlides();
        this.setupEventListeners();
        this.animate();
    }
    
    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const pointLight = new THREE.PointLight(0x667eea, 1, 100);
        pointLight.position.set(10, 10, 10);
        pointLight.castShadow = true;
        this.scene.add(pointLight);
        
        const pointLight2 = new THREE.PointLight(0xf093fb, 0.8, 100);
        pointLight2.position.set(-10, -10, 10);
        this.scene.add(pointLight2);
    }
    
    createSlides() {
        const slides = [
            {
                color: 0x667eea,
                emissive: 0x667eea,
                rotation: { x: 0.3, y: 0.5, z: 0 }
            },
            {
                color: 0xf093fb,
                emissive: 0xf093fb,
                rotation: { x: -0.2, y: 0.3, z: 0.1 }
            },
            {
                color: 0x764ba2,
                emissive: 0x764ba2,
                rotation: { x: 0.1, y: -0.4, z: 0.2 }
            },
            {
                color: 0xfed6e3,
                emissive: 0xfed6e3,
                rotation: { x: 0.4, y: 0.6, z: -0.1 }
            },
            {
                color: 0x4facfe,
                emissive: 0x4facfe,
                rotation: { x: -0.3, y: 0, z: 0.3 }
            }
        ];
        
        slides.forEach((slideData, index) => {
            const geometry = new THREE.IcosahedronGeometry(3, 4);
            const material = new THREE.MeshPhongMaterial({
                color: slideData.color,
                emissive: slideData.emissive,
                emissiveIntensity: 0.2,
                wireframe: false,
                shininess: 100
            });
            
            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x = slideData.rotation.x;
            mesh.rotation.y = slideData.rotation.y;
            mesh.rotation.z = slideData.rotation.z;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.position.z = index === 0 ? 0 : 100;
            mesh.scale.set(0, 0, 0);
            
            mesh.userData = {
                rotationVelocity: {
                    x: (Math.random() - 0.5) * 0.01,
                    y: (Math.random() - 0.5) * 0.01,
                    z: (Math.random() - 0.5) * 0.01
                },
                targetRotation: slideData.rotation
            };
            
            this.scene.add(mesh);
            this.slides.push(mesh);
        });
        
        // Show first slide
        if (this.slides[0]) {
            gsap.to(this.slides[0].scale, { x: 1, y: 1, z: 1, duration: 0.8, ease: 'back.out' });
        }
    }
    
    nextSlide() {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
        
        const currentMesh = this.slides[this.currentSlide];
        this.currentSlide = (this.currentSlide + 1) % this.slides.length;
        const nextMesh = this.slides[this.currentSlide];
        
        // Animate out current slide
        gsap.to(currentMesh.scale, {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.6,
            ease: 'back.in'
        });
        
        gsap.to(currentMesh.rotation, {
            x: currentMesh.rotation.x + Math.PI * 2,
            y: currentMesh.rotation.y + Math.PI * 2,
            z: currentMesh.rotation.z + Math.PI,
            duration: 0.6,
            ease: 'power2.inOut'
        });
        
        // Animate in next slide
        gsap.to(nextMesh.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.8,
            ease: 'back.out',
            onComplete: () => {
                this.isTransitioning = false;
            }
        });
        
        gsap.to(nextMesh.rotation, {
            x: nextMesh.userData.targetRotation.x,
            y: nextMesh.userData.targetRotation.y,
            z: nextMesh.userData.targetRotation.z,
            duration: 0.8,
            ease: 'power2.out'
        });
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => this.onWindowResize());
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('wheel', (e) => {
            if (e.deltaY > 0) this.nextSlide();
        }, { passive: true });
        
        // Touch swipe support
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchStartX - touchEndX;
            const diffY = Math.abs(touchStartY - touchEndY);
            
            if (diffX > 50 && diffY < 50) {
                this.nextSlide();
            }
        });
    }
    
    onMouseMove(event) {
        this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    }
    
    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.time += 0.016;
        
        // Update current slide
        const currentMesh = this.slides[this.currentSlide];
        if (currentMesh && currentMesh.scale.x > 0.1) {
            // Apply rotation velocity
            currentMesh.rotation.x += currentMesh.userData.rotationVelocity.x;
            currentMesh.rotation.y += currentMesh.userData.rotationVelocity.y;
            currentMesh.rotation.z += currentMesh.userData.rotationVelocity.z;
            
            // Mouse distortion effect
            currentMesh.position.x = this.mouseX * 0.3;
            currentMesh.position.y = this.mouseY * 0.3;
            
            // Subtle bob animation
            currentMesh.position.z = Math.sin(this.time * 0.5) * 0.3;
        }
        
        // Update scale for off-screen slides for smooth transition
        this.slides.forEach((mesh) => {
            if (mesh.scale.x < 0.01) {
                mesh.position.z = 100;
            }
        });
        
        this.renderer.render(this.scene, this.camera);
    }
}

// ============================================
// NAVIGATION & SCROLL INTERACTIONS
// ============================================

class Navigation {
    constructor() {
        this.navLinks = document.querySelectorAll('.nav-link');
        this.currentSection = 'home';
        this.mobileMenu = null;
        this.hamburger = null;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const href = link.getAttribute('href');
                const targetSection = document.querySelector(href);
                
                if (targetSection) {
                    this.setActive(link);
                    // Close mobile menu if open
                    const mobileMenu = document.querySelector('.nav-menu');
                    const hamburger = document.querySelector('.hamburger');
                    if (mobileMenu && hamburger) {
                        mobileMenu.style.display = 'none';
                        hamburger.classList.remove('active');
                    }
                    // Smooth scroll to section
                    targetSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
        
        window.addEventListener('scroll', () => this.updateActiveLink());
    }
    
    setActive(link) {
        this.navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    }
    
    updateActiveLink() {
        const sections = document.querySelectorAll('section');
        const scrollPosition = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                const link = document.querySelector(`a[href="#${section.id}"]`);
                if (link) {
                    this.setActive(link);
                    this.currentSection = section.id;
                }
            }
        });
    }
}

// ============================================
// SCROLL ANIMATIONS
// ============================================

class ScrollAnimations {
    constructor() {
        gsap.registerPlugin(ScrollTrigger);
        this.setupAnimations();
    }
    
    setupAnimations() {
        // About section animations
        gsap.to('.about-text', {
            scrollTrigger: {
                trigger: '.about',
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            opacity: 1,
            x: 0,
            duration: 0.8,
            delay: 0.2
        });
        
        gsap.to('.stat-card', {
            scrollTrigger: {
                trigger: '.about-stats',
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.2
        });
        
        // Work section animations
        gsap.to('.work-card', {
            scrollTrigger: {
                trigger: '.work',
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.15
        });
        
        // Skills section animations
        gsap.to('.skill-category', {
            scrollTrigger: {
                trigger: '.skills',
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.1
        });
        
        // Contact section animation
        gsap.to('.contact-form', {
            scrollTrigger: {
                trigger: '.contact',
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            opacity: 1,
            y: 0,
            duration: 0.8
        });
    }
}

// ============================================
// INTERACTIVE HOVER EFFECTS
// ============================================

class InteractiveEffects {
    constructor() {
        this.setupWorkCardHovers();
        this.setupSkillTagHovers();
        this.setupButtonEffects();
    }
    
    setupWorkCardHovers() {
        const workCards = document.querySelectorAll('.work-card');
        
        workCards.forEach(card => {
            card.addEventListener('mouseenter', (e) => {
                gsap.to(card, {
                    y: -10,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });
            
            card.addEventListener('mouseleave', (e) => {
                gsap.to(card, {
                    y: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            });
            
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                
                gsap.to(card, {
                    rotationX: y * 5,
                    rotationY: x * 5,
                    duration: 0.3
                });
            });
        });
    }
    
    setupSkillTagHovers() {
        const skillTags = document.querySelectorAll('.skill-tag');
        
        skillTags.forEach(tag => {
            tag.addEventListener('mouseenter', () => {
                gsap.to(tag, {
                    scale: 1.1,
                    duration: 0.2
                });
            });
            
            tag.addEventListener('mouseleave', () => {
                gsap.to(tag, {
                    scale: 1,
                    duration: 0.2
                });
            });
        });
    }
    
    setupButtonEffects() {
        const buttons = document.querySelectorAll('.btn');
        
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                gsap.to(btn, {
                    scale: 1.05,
                    duration: 0.2
                });
            });
            
            btn.addEventListener('mouseleave', () => {
                gsap.to(btn, {
                    scale: 1,
                    duration: 0.2
                });
            });
        });
    }
}

// ============================================
// FORM HANDLING
// ============================================

class FormHandler {
    constructor() {
        this.form = document.getElementById('contactForm');
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }
    
    handleSubmit(e) {
        e.preventDefault();
        
        // Get form values
        const inputs = this.form.querySelectorAll('input[type="text"], input[type="email"], textarea');
        let formData = {};
        inputs.forEach(input => {
            formData[input.placeholder] = input.value;
        });
        
        // Create WhatsApp message
        const name = formData['Your Name'] || 'Guest';
        const email = formData['Your Email'] || 'No email provided';
        const message = formData['Your Message'] || 'No message';
        
        const whatsappMessage = `Hello! I'm ${name}%0AEmail: ${email}%0A%0AMessage: ${message}`;
        const whatsappLink = `https://wa.me/6361757910?text=${encodeURIComponent(whatsappMessage)}`;
        
        // Button feedback
        const button = this.form.querySelector('button[type="submit"]');
        const originalText = button.textContent;
        
        gsap.to(button, {
            scale: 0.95,
            duration: 0.2
        });
        
        button.textContent = 'Opening WhatsApp...';
        button.disabled = true;
        
        // Open WhatsApp after a short delay
        setTimeout(() => {
            window.open(whatsappLink, '_blank');
            
            button.textContent = 'Message Sent! ✓';
            
            setTimeout(() => {
                this.form.reset();
                button.textContent = originalText;
                button.disabled = false;
                gsap.to(button, {
                    scale: 1,
                    duration: 0.2
                });
            }, 1500);
        }, 500);
    }
}

// ============================================
// PERFORMANCE MONITOR
// ============================================

class PerformanceMonitor {
    constructor() {
        this.fps = 60;
        this.lastTime = Date.now();
        this.frameCount = 0;
        this.monitorPerformance();
    }
    
    monitorPerformance() {
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastTime;
        
        this.frameCount++;
        
        if (deltaTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = currentTime;
            
            // Log FPS in development
            if (window.location.hostname === 'localhost') {
                console.log('FPS:', this.fps);
            }
        }
        
        requestAnimationFrame(() => this.monitorPerformance());
    }
}

// ============================================
// MOBILE MENU
// ============================================

class MobileMenu {
    constructor() {
        this.hamburger = document.querySelector('.hamburger');
        this.navMenu = document.querySelector('.nav-menu');
        this.isMenuOpen = false;
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        if (this.hamburger) {
            this.hamburger.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleMenu();
            });
        }
        
        // Close menu when clicking a link
        if (this.navMenu) {
            this.navMenu.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', (e) => {
                    this.closeMenu();
                });
            });
        }
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isMenuOpen && 
                this.navMenu && 
                !this.navMenu.contains(e.target) && 
                !this.hamburger.contains(e.target)) {
                this.closeMenu();
            }
        });
    }
    
    toggleMenu() {
        if (this.isMenuOpen) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }
    
    openMenu() {
        if (this.navMenu && !this.isMenuOpen) {
            this.isMenuOpen = true;
            this.navMenu.classList.add('show');
            this.hamburger.classList.add('active');
        }
    }
    
    closeMenu() {
        if (this.navMenu && this.isMenuOpen) {
            this.isMenuOpen = false;
            this.navMenu.classList.remove('show');
            this.hamburger.classList.remove('active');
        }
    }
}
}
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize WebGL Slider
    const webglContainer = document.getElementById('webglContainer');
    if (webglContainer) {
        new WebGLSlider(webglContainer);
    }
    
    // Initialize Navigation
    new Navigation();
    
    // Initialize Scroll Animations
    new ScrollAnimations();
    
    // Initialize Interactive Effects
    new InteractiveEffects();
    
    // Initialize Form Handler
    new FormHandler();
    
    // Initialize Mobile Menu
    new MobileMenu();
    
    // Initialize Performance Monitor (optional)
    // new PerformanceMonitor();
    
    // Add smooth initial animations
    gsap.from('.hero-content', {
        opacity: 0,
        y: 50,
        duration: 1,
        ease: 'power2.out'
    });
    
    gsap.from('.scroll-indicator', {
        opacity: 0,
        y: 20,
        duration: 1,
        delay: 0.5,
        ease: 'power2.out'
    });
});

// Cleanup on page unload for performance
window.addEventListener('beforeunload', () => {
    gsap.killTweensOf('*');
});
