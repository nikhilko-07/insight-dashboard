class InsightDashboard {
    constructor() {
        this.initializeElements();
        this.initializeEventListeners();
        this.initialize3DMap();
        this.initializeCamera();
        this.initializeTimeUpdate();
        this.currentMode = 'auto';
        this.cameraStream = null;
        this.isSwapped = false; // false = MAP main, CAMERA pip
    }

    initializeElements() {
        // Mode buttons
        this.modeButtons = document.querySelectorAll('.mode-btn');

        // Drive controls
        this.forwardBtn = document.getElementById('forwardBtn');
        this.backwardBtn = document.getElementById('backwardBtn');
        this.leftBtn = document.getElementById('leftBtn');
        this.rightBtn = document.getElementById('rightBtn');
        this.stopBtn = document.getElementById('stopBtn');

        // Action buttons
        this.initiateBtn = document.getElementById('initiateBtn');
        this.emergencyBtn = document.getElementById('emergencyBtn');

        // View elements
        this.viewMain = document.getElementById('viewMain');
        this.viewPip = document.getElementById('viewPip');
        this.mainTitle = document.getElementById('mainTitle');
        this.pipTitle = document.getElementById('pipTitle');
        this.mainBadge = document.getElementById('mainBadge');

        // Camera elements
        this.cameraFeed = document.getElementById('cameraFeed');
        this.cameraPlaceholder = document.getElementById('cameraPlaceholder');
        this.snapshotBtn = document.getElementById('snapshotBtn');
        this.toggleCameraBtn = document.getElementById('toggleCameraBtn');
        this.cameraTime = document.getElementById('cameraTime');

        // Quick goal
        this.quickGoalValue = document.querySelector('.quick-goal-value');

        // Center panel
        this.centerPanel = document.getElementById('centerPanel');

        // Content containers (important)
        this.mainContent = document.querySelector('.view-main .view-content');
        this.pipContent = document.querySelector('.view-pip .pip-content');
    }

    initializeEventListeners() {
        // Mode switching
        this.modeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchMode(e));
        });

        // Drive controls
        this.forwardBtn?.addEventListener('click', () => this.moveCar('forward'));
        this.backwardBtn?.addEventListener('click', () => this.moveCar('backward'));
        this.leftBtn?.addEventListener('click', () => this.moveCar('left'));
        this.rightBtn?.addEventListener('click', () => this.moveCar('right'));
        this.stopBtn?.addEventListener('click', () => this.stopCar());

        // Action buttons
        this.initiateBtn?.addEventListener('click', () => this.initiateMission());
        this.emergencyBtn?.addEventListener('click', () => this.emergencyStop());

        // Camera controls
        this.snapshotBtn?.addEventListener('click', () => this.takeSnapshot());
        this.toggleCameraBtn?.addEventListener('click', () => this.toggleCamera());

        // Click to swap views (main aur pip dono par)
        this.viewMain.addEventListener('click', (e) => {
            e.stopPropagation();
            this.swapViews();
        });

        this.viewPip.addEventListener('click', (e) => {
            e.stopPropagation();
            this.swapViews();
        });

        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    // =========================
    // PIP / MAIN SWAP LOGIC - PERFECT FIX
    // =========================
    swapViews() {
        // flip state
        this.isSwapped = !this.isSwapped;

        if (!this.renderer || !this.cameraFeed) return;

        const mapCanvas = this.renderer.domElement;

        // Clear both containers completely
        this.mainContent.innerHTML = '';
        this.pipContent.innerHTML = '';

        if (this.isSwapped) {
            // MAIN = CAMERA (full), PIP = MAP
            this.mainTitle.innerHTML = '<i class="fas fa-video"></i> Camera View';
            this.pipTitle.innerHTML = '<i class="fas fa-map"></i> Map View';
            this.mainBadge.textContent = 'CAMERA';

            // Camera ko main me daalo (bada)
            this.mainContent.appendChild(this.cameraFeed);
            this.cameraFeed.style.display = 'block';
            this.cameraFeed.style.width = '100%';
            this.cameraFeed.style.height = '100%';
            this.cameraFeed.style.objectFit = 'cover';

            // Camera overlay for main
            const mainOverlay = document.createElement('div');
            mainOverlay.className = 'pip-overlay';
            mainOverlay.id = 'mainCameraOverlay';
            mainOverlay.innerHTML = `
                <span class="recording-dot"></span>
                <span class="pip-time" id="cameraTime"></span>
            `;
            this.mainContent.appendChild(mainOverlay);
            this.cameraTime = document.getElementById('cameraTime');

            // Map ko pip me daalo (chhota)
            this.pipContent.appendChild(mapCanvas);
            mapCanvas.style.width = '100%';
            mapCanvas.style.height = '100%';
            mapCanvas.style.objectFit = 'cover';

            // Map overlay for pip
            const pipOverlay = document.createElement('div');
            pipOverlay.className = 'pip-overlay';
            pipOverlay.id = 'pipMapOverlay';
            pipOverlay.style.backgroundColor = 'rgba(74, 158, 255, 0.9)';
            pipOverlay.style.borderColor = '#4a9eff';
            pipOverlay.style.color = 'white';
            pipOverlay.innerHTML = 'MAP';
            this.pipContent.appendChild(pipOverlay);

        } else {
            // MAIN = MAP (full), PIP = CAMERA
            this.mainTitle.innerHTML = '<i class="fas fa-map"></i> Map View';
            this.pipTitle.innerHTML = '<i class="fas fa-video"></i> Camera View';
            this.mainBadge.textContent = 'MAP';

            // Map ko main me daalo (bada)
            this.mainContent.appendChild(mapCanvas);
            mapCanvas.style.width = '100%';
            mapCanvas.style.height = '100%';
            mapCanvas.style.objectFit = 'cover';

            // Camera ko pip me daalo (chhota)
            this.pipContent.appendChild(this.cameraFeed);
            this.cameraFeed.style.display = 'block';
            this.cameraFeed.style.width = '100%';
            this.cameraFeed.style.height = '100%';
            this.cameraFeed.style.objectFit = 'cover';

            // Camera overlay for pip
            const pipOverlay = document.createElement('div');
            pipOverlay.className = 'pip-overlay';
            pipOverlay.id = 'pipCameraOverlay';
            pipOverlay.innerHTML = `
                <span class="recording-dot"></span>
                <span class="pip-time" id="cameraTime"></span>
            `;
            this.pipContent.appendChild(pipOverlay);
            this.cameraTime = document.getElementById('cameraTime');
        }

        // styling flags
        if (this.isSwapped) {
            this.viewMain.classList.add('swapped');
            this.viewPip.classList.add('swapped');
        } else {
            this.viewMain.classList.remove('swapped');
            this.viewPip.classList.remove('swapped');
        }

        // Resize map canvas after layout change
        setTimeout(() => this.handleResize(), 100);
        setTimeout(() => this.handleResize(), 300);

        // Force camera to play
        if (this.cameraStream) {
            this.cameraFeed.play().catch(e => console.log('Play error:', e));
        }

        this.showNotification(`Swapped to ${this.isSwapped ? 'CAMERA' : 'MAP'} view`);
    }

    switchMode(event) {
        const btn = event.currentTarget;
        this.modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentMode = btn.dataset.mode;

        this.quickGoalValue.textContent = this.currentMode === 'auto' ? '15' : '08';
        this.quickGoalValue.style.color = this.currentMode === 'auto' ? '#4a9eff' : '#ffaa00';

        this.showNotification(`Mode: ${this.currentMode.toUpperCase()}`);
    }

    // =========================
    // Camera Functions
    // =========================
    async initializeCamera() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.showCameraError('Camera not supported');
            return;
        }

        // Auto-start camera
        setTimeout(() => this.startCamera(), 1000);
    }

    async startCamera(facingMode = 'environment') {
        try {
            if (this.cameraStream) {
                this.stopCamera();
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });

            this.cameraStream = stream;
            this.cameraFeed.srcObject = stream;

            this.cameraFeed.onloadedmetadata = () => {
                this.cameraFeed.play()
                    .then(() => {
                        this.cameraFeed.style.display = 'block';
                        if (this.cameraPlaceholder) {
                            this.cameraPlaceholder.style.display = 'none';
                        }
                        this.showNotification('Camera ready');
                    })
                    .catch(err => {
                        console.error('Play error:', err);
                        this.showCameraError('Camera play failed');
                    });
            };
        } catch (err) {
            console.error('Camera error:', err);
            this.showCameraError('Camera access denied');
        }
    }

    showCameraError(message) {
        if (this.cameraPlaceholder) {
            this.cameraPlaceholder.innerHTML = `
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
            `;
            this.cameraPlaceholder.style.display = 'flex';
        }
    }

    stopCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => {
                track.stop();
                track.enabled = false;
            });
            this.cameraStream = null;
        }
    }

    toggleCamera() {
        const currentFacing = this.cameraStream?.getVideoTracks()[0]?.getSettings().facingMode;
        const newFacing = currentFacing === 'environment' ? 'user' : 'environment';
        this.startCamera(newFacing);
    }

    takeSnapshot() {
        if (!this.cameraStream || !this.cameraFeed.videoWidth) {
            this.showNotification('Camera not ready');
            return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = this.cameraFeed.videoWidth;
        canvas.height = this.cameraFeed.videoHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(this.cameraFeed, 0, 0, canvas.width, canvas.height);

        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `car-cam-${Date.now()}.png`;
        link.href = image;
        link.click();

        this.showNotification('📸 Snapshot saved!');
    }

    initializeTimeUpdate() {
        setInterval(() => {
            if (this.cameraTime) {
                const now = new Date();
                this.cameraTime.textContent = now.toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
            }
        }, 1000);
    }

    // =========================
    // 3D Map Functions
    // =========================
    initialize3DMap() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0c14);

        // Camera
        const width = this.mainContent.clientWidth || 800;
        const height = this.mainContent.clientHeight || 450;

        this.mapCamera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
        this.mapCamera.position.set(10, 8, 15);
        this.mapCamera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.mainContent.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0x404060);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 10, 7);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        const backLight = new THREE.DirectionalLight(0x4466aa, 0.5);
        backLight.position.set(-5, 5, -5);
        this.scene.add(backLight);

        // Environment
        this.createGround();
        this.createRoad();
        this.createBuildings();
        this.createCar();

        // Start animation
        this.animate();

        // Ensure correct initial sizing once layout is stable
        setTimeout(() => this.handleResize(), 0);
    }

    createGround() {
        const gridHelper = new THREE.GridHelper(30, 30, 0x4a9eff, 0x2a3a5a);
        gridHelper.position.y = -0.01;
        this.scene.add(gridHelper);

        const groundGeometry = new THREE.PlaneGeometry(30, 30);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1e2a,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 0;
        ground.receiveShadow = true;
        this.scene.add(ground);
    }

    createRoad() {
        const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2f3a });

        const road = new THREE.Mesh(
            new THREE.PlaneGeometry(8, 30),
            roadMaterial
        );
        road.rotation.x = -Math.PI / 2;
        road.position.y = 0.01;
        road.receiveShadow = true;
        this.scene.add(road);

        const lineMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa00 });
        for (let i = -14; i <= 14; i += 4) {
            const line = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.05, 2),
                lineMaterial
            );
            line.position.set(0, 0.02, i);
            line.receiveShadow = true;
            this.scene.add(line);
        }
    }

    createBuildings() {
        const buildingColors = [0x4a9eff, 0xffaa00, 0x44aa88, 0xaa66cc];

        for (let i = 0; i < 10; i++) {
            const width = 1 + Math.random() * 2;
            const depth = 1 + Math.random() * 2;
            const height = 2 + Math.random() * 4;

            const building = new THREE.Mesh(
                new THREE.BoxGeometry(width, height, depth),
                new THREE.MeshStandardMaterial({
                    color: buildingColors[Math.floor(Math.random() * buildingColors.length)],
                    emissive: 0x112233
                })
            );

            const x = (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 3);
            const z = (Math.random() - 0.5) * 20;

            building.position.set(x, height / 2, z);
            building.castShadow = true;
            building.receiveShadow = true;
            this.scene.add(building);
        }
    }

    createCar() {
        const bodyGeo = new THREE.BoxGeometry(2, 0.8, 4);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff4a4a, emissive: 0x331100 });
        this.carBody = new THREE.Mesh(bodyGeo, bodyMat);
        this.carBody.position.set(0, 0.4, 0);
        this.carBody.castShadow = true;
        this.carBody.receiveShadow = true;
        this.scene.add(this.carBody);

        const roofGeo = new THREE.BoxGeometry(1.2, 0.4, 2);
        const roofMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        this.carRoof = new THREE.Mesh(roofGeo, roofMat);
        this.carRoof.position.set(0, 1.0, -0.2);
        this.carRoof.castShadow = true;
        this.carRoof.receiveShadow = true;
        this.scene.add(this.carRoof);

        const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.5, 16);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x333333 });

        this.wheels = [];
        const wheelPositions = [
            [-1, 0.3, -1.2], [1, 0.3, -1.2],
            [-1, 0.3, 1.2], [1, 0.3, 1.2]
        ];

        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(pos[0], pos[1], pos[2]);
            wheel.castShadow = true;
            wheel.receiveShadow = true;
            this.scene.add(wheel);
            this.wheels.push(wheel);
        });

        this.carGroup = new THREE.Group();
        this.carGroup.add(this.carBody);
        this.carGroup.add(this.carRoof);
        this.wheels.forEach(wheel => this.carGroup.add(wheel));

        this.scene.add(this.carGroup);
    }

    moveCar(direction) {
        const speed = 0.5;

        switch (direction) {
            case 'forward':
                this.carGroup.position.z -= speed;
                break;
            case 'backward':
                this.carGroup.position.z += speed;
                break;
            case 'left':
                this.carGroup.position.x -= speed;
                break;
            case 'right':
                this.carGroup.position.x += speed;
                break;
        }

        this.wheels.forEach(wheel => {
            wheel.rotation.x += 0.2;
        });

        this.showNotification(`Car moving ${direction}`);
    }

    stopCar() {
        this.showNotification('Car stopped');
    }

    initiateMission() {
        this.initiateBtn.classList.add('active');
        this.showNotification('🚗 Mission started!');
        setTimeout(() => {
            this.initiateBtn.classList.remove('active');
        }, 1000);
    }

    emergencyStop() {
        this.emergencyBtn.classList.add('active');
        this.showNotification('⚠️ EMERGENCY STOP!');
        setTimeout(() => {
            this.emergencyBtn.classList.remove('active');
        }, 1000);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.currentMode === 'auto' && this.carGroup) {
            this.carGroup.position.z -= 0.02;

            if (this.carGroup.position.z < -15) {
                this.carGroup.position.z = 15;
            }

            this.wheels.forEach(wheel => {
                wheel.rotation.x += 0.05;
            });
        }

        if (this.renderer && this.scene && this.mapCamera) {
            this.renderer.render(this.scene, this.mapCamera);
        }
    }

    handleResize() {
        if (!this.mapCamera || !this.renderer) return;

        const canvas = this.renderer.domElement;
        const parent = canvas.parentElement;
        if (!parent) return;

        const width = parent.clientWidth;
        const height = parent.clientHeight;

        if (width <= 0 || height <= 0) return;

        this.mapCamera.aspect = width / height;
        this.mapCamera.updateProjectionMatrix();
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
        notification.style.padding = '12px 24px';
        notification.style.borderRadius = '30px';
        notification.style.zIndex = '9999';
        notification.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
        notification.style.fontWeight = 'bold';
        notification.style.animation = 'slideDown 0.3s ease';

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new InsightDashboard();

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from { transform: translate(-50%, -100%); opacity: 0; }
            to { transform: translate(-50%, 0); opacity: 1; }
        }
        @keyframes slideUp {
            from { transform: translate(-50%, 0); opacity: 1; }
            to { transform: translate(-50%, -100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
});