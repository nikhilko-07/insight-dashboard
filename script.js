class InsightDashboard {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
        this.initialize3DMap();
        this.initializeCamera();
        this.currentMode = 'auto';
        this.currentView = 'map'; // 'map' or 'camera'
        this.cameraStream = null;
    }

    initializeElements() {
        // Mode buttons
        this.modeButtons = document.querySelectorAll('.mode-btn');
        this.autoBtn = document.querySelector('[data-mode="auto"]');
        this.manualBtn = document.querySelector('[data-mode="manual"]');

        // Action buttons
        this.initiateBtn = document.getElementById('initiateBtn');
        this.stopBtn = document.getElementById('stopBtn');

        // View toggle buttons
        this.mapViewBtn = document.getElementById('mapViewBtn');
        this.cameraViewBtn = document.getElementById('cameraViewBtn');

        // View containers
        this.mapView = document.getElementById('mapView');
        this.cameraView = document.getElementById('cameraView');

        // Camera elements
        this.cameraFeed = document.getElementById('cameraFeed');
        this.cameraPlaceholder = document.getElementById('cameraPlaceholder');
        this.takeSnapshotBtn = document.getElementById('takeSnapshotBtn');
        this.toggleCameraBtn = document.getElementById('toggleCameraBtn');
        this.cameraControls = document.getElementById('cameraControls');

        // Quick goal display
        this.quickGoalValue = document.querySelector('.quick-goal-value');

        // 3D canvas
        this.canvasContainer = document.getElementById('pointCloudCanvas');
    }

    initializeEventListeners() {
        // Mode switching
        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchMode(e));
        });

        // Action buttons
        this.initiateBtn.addEventListener('click', () => this.initiateMission());
        this.stopBtn.addEventListener('click', () => this.stopMission());

        // View toggle
        this.mapViewBtn.addEventListener('click', () => this.switchView('map'));
        this.cameraViewBtn.addEventListener('click', () => this.switchView('camera'));

        // Camera controls
        if (this.takeSnapshotBtn) {
            this.takeSnapshotBtn.addEventListener('click', () => this.takeSnapshot());
        }
        if (this.toggleCameraBtn) {
            this.toggleCameraBtn.addEventListener('click', () => this.toggleCameraDevice());
        }

        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    switchView(view) {
        this.currentView = view;

        // Update toggle buttons
        if (view === 'map') {
            this.mapViewBtn.classList.add('active');
            this.cameraViewBtn.classList.remove('active');
            this.mapView.classList.add('active');
            this.cameraView.classList.remove('active');
            this.cameraControls.style.display = 'none';

            // Resume 3D animation
            if (this.pointCloud) {
                this.isAnimating = true;
            }
        } else {
            this.cameraViewBtn.classList.add('active');
            this.mapViewBtn.classList.remove('active');
            this.cameraView.classList.add('active');
            this.mapView.classList.remove('active');
            this.cameraControls.style.display = 'flex';

            // Pause 3D animation to save resources
            this.isAnimating = false;

            // Start camera if not already active
            this.startCamera();
        }
    }

    switchMode(event) {
        const btn = event.currentTarget;

        // Remove active class from all buttons
        this.modeButtons.forEach(b => b.classList.remove('active'));

        // Add active class to clicked button
        btn.classList.add('active');

        // Update current mode
        this.currentMode = btn.dataset.mode;

        // Update quick goal value based on mode
        if (this.currentMode === 'auto') {
            this.quickGoalValue.textContent = '15';
            this.quickGoalValue.style.color = '#4a9eff';
        } else {
            this.quickGoalValue.textContent = '08';
            this.quickGoalValue.style.color = '#ffaa00';
        }

        this.showNotification(`Mode: ${this.currentMode.toUpperCase()}`);
    }

    // Camera Functions
    async initializeCamera() {
        // Check if camera is supported
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.cameraPlaceholder.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <p>Camera not supported</p>
            `;
            return;
        }
    }

    async startCamera(facingMode = 'environment') {
        try {
            if (this.cameraStream) {
                this.stopCamera();
            }

            this.cameraPlaceholder.style.display = 'flex';
            this.cameraFeed.style.display = 'none';

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });

            this.cameraStream = stream;
            this.cameraFeed.srcObject = stream;

            // Wait for video to be ready
            this.cameraFeed.onloadedmetadata = () => {
                this.cameraFeed.play();
                this.cameraFeed.style.display = 'block';
                this.cameraPlaceholder.style.display = 'none';
                this.showNotification('Camera feed active');
            };
        } catch (err) {
            console.error('Camera error:', err);
            this.cameraPlaceholder.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <p>Camera access denied</p>
            `;
        }
    }

    stopCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
        }
    }

    toggleCameraDevice() {
        // Toggle between front and back camera
        const currentFacing = this.cameraStream?.getVideoTracks()[0]?.getSettings().facingMode;
        const newFacing = currentFacing === 'environment' ? 'user' : 'environment';
        this.startCamera(newFacing);
    }

    takeSnapshot() {
        if (!this.cameraStream) return;

        // Create canvas and capture frame
        const canvas = document.createElement('canvas');
        canvas.width = this.cameraFeed.videoWidth;
        canvas.height = this.cameraFeed.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.cameraFeed, 0, 0, canvas.width, canvas.height);

        // Convert to image and download
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `snapshot-${Date.now()}.png`;
        link.href = image;
        link.click();

        this.showNotification('Snapshot saved!');
    }

    // 3D Map Functions
    initialize3DMap() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0c14);

        // Camera setup
        const width = this.canvasContainer.clientWidth;
        const height = this.canvasContainer.clientHeight;

        this.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        this.camera.position.set(5, 3, 8);
        this.camera.lookAt(0, 0, 0);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.canvasContainer.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0x404060);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 2, 1);
        this.scene.add(directionalLight);

        const backLight = new THREE.DirectionalLight(0x4466aa, 0.5);
        backLight.position.set(-1, -1, -1);
        this.scene.add(backLight);

        // Create terrain
        this.createTerrain();

        // Create point cloud
        this.createPointCloud();

        // Add axes helper
        const axesHelper = new THREE.AxesHelper(3);
        this.scene.add(axesHelper);

        // Start animation
        this.isAnimating = true;
        this.animate();
    }

    createTerrain() {
        // Grid ground
        const gridHelper = new THREE.GridHelper(15, 20, 0x4a9eff, 0x2a3a5a);
        gridHelper.position.y = -0.5;
        this.scene.add(gridHelper);

        // Random terrain features
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshStandardMaterial({ color: 0x4a9eff, emissive: 0x112233 });

        for (let i = 0; i < 20; i++) {
            const cube = new THREE.Mesh(geometry, material);
            const x = (Math.random() - 0.5) * 8;
            const z = (Math.random() - 0.5) * 8;
            cube.position.set(x, 0, z);
            cube.scale.set(1, Math.random() * 2 + 0.5, 1);
            this.scene.add(cube);
        }
    }

    createPointCloud() {
        const geometry = new THREE.BufferGeometry();
        const count = 2000;

        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            const r = 3 + Math.random() * 2;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta) * 0.5;
            const z = r * Math.cos(phi);

            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;

            const color = new THREE.Color();
            const hue = 0.6 + (y + 2) * 0.1;
            color.setHSL(hue, 0.8, 0.5);

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });

        this.pointCloud = new THREE.Points(geometry, material);
        this.scene.add(this.pointCloud);

        // Add wireframe sphere
        const sphereGeometry = new THREE.SphereGeometry(4, 16, 16);
        const sphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x4a9eff,
            wireframe: true,
            transparent: true,
            opacity: 0.1
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.y = 0;
        this.scene.add(sphere);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        // Only animate if map view is active
        if (this.isAnimating && this.pointCloud) {
            this.pointCloud.rotation.y += 0.001;
            this.pointCloud.rotation.x += 0.0005;
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    // Mission Controls
    initiateMission() {
        this.initiateBtn.classList.add('active');
        this.showNotification('Mission Initiated!');

        setTimeout(() => {
            this.initiateBtn.classList.remove('active');
        }, 1000);
    }

    stopMission() {
        this.showNotification('Mission Stopped!');
        this.quickGoalValue.textContent = '00';
    }

    handleResize() {
        if (!this.camera || !this.renderer) return;

        const width = this.canvasContainer.clientWidth;
        const height = this.canvasContainer.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.backgroundColor = '#4a9eff';
        notification.style.color = 'white';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '9999';
        notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.3)';

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 2000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new InsightDashboard();
});