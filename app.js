// --- FAZA 1 & 3: STAN APLIKACJI I ELEMENTY UI ---
const STATE = {
    mode: 'MENU', // MENU, PLAYING, GAMEOVER
    score: 0,
    health: 100,
    speed: 100, // Z jaką prędkością wszystko leci w naszą stronę
};

const uiStart = document.getElementById('start-screen');
const uiHUD = document.getElementById('hud');
const uiGameOver = document.getElementById('game-over-screen');
const scoreVal = document.getElementById('score-val');
const healthVal = document.getElementById('health-val');
const finalScore = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// --- FAZA 2: SCENA, KAMERA I SILNIK RENDEROWANIA ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0c10); // Ciemne tło
scene.fog = new THREE.Fog(0x0b0c10, 50, 300); // Mgła by przeszkody pojawiały się płynnie

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
// Kamera ustawiona lekko za graczem, nad nim
camera.position.set(0, 15, 30);
camera.lookAt(0, 0, -20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0x66fcf1, 0.8);
dirLight.position.set(100, 200, 50);
scene.add(dirLight);

// --- FAZA 4: ŚRODOWISKO I MODELE (ASSETS & VISUALS) ---
// Grupa zawierająca samolot gracza (łączymy kilka prymitywów w jedną bryłę)
const airplaneGroup = new THREE.Group();

const bodyMat = new THREE.MeshStandardMaterial({ color: 0xc5c6c7, flatShading: true });
const wingMat = new THREE.MeshStandardMaterial({ color: 0x45a29e, flatShading: true });

// Kadłub
const bodyGeo = new THREE.ConeGeometry(2, 8, 8);
bodyGeo.rotateX(Math.PI / 2);
const body = new THREE.Mesh(bodyGeo, bodyMat);
airplaneGroup.add(body);

// Główne skrzydła
const wingGeo = new THREE.BoxGeometry(12, 0.5, 3);
const wings = new THREE.Mesh(wingGeo, wingMat);
wings.position.set(0, 0, 1);
airplaneGroup.add(wings);

// Spoilery poziome
const tailGeo = new THREE.BoxGeometry(4, 0.5, 2);
const tail = new THREE.Mesh(tailGeo, wingMat);
tail.position.set(0, 0, 3.5);
airplaneGroup.add(tail);

// Spoiler pionowy
const finGeo = new THREE.BoxGeometry(0.5, 3, 2);
const fin = new THREE.Mesh(finGeo, wingMat);
fin.position.set(0, 1.5, 3.5);
airplaneGroup.add(fin);

scene.add(airplaneGroup);

// Podłoga / Środowisko - Neonowy Grid
const gridHelper = new THREE.GridHelper(400, 40, 0x45a29e, 0x1f2833);
gridHelper.position.y = -10;
scene.add(gridHelper);

// --- FAZA 3: MECHANIKA (STEROWANIE, STRZELANIE, KOLIZJE) ---
const keys = { w: false, a: false, s: false, d: false, space: false };
const obstacles = [];
const bullets = [];

// Nasłuchiwanie klawiszy
window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.w = true;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.a = true;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.s = true;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = true;
    if (e.code === 'Space') {
        if (!keys.space && STATE.mode === 'PLAYING') {
            shootBullet();
        }
        keys.space = true;
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyW' || e.code === 'ArrowUp') keys.w = false;
    if (e.code === 'KeyA' || e.code === 'ArrowLeft') keys.a = false;
    if (e.code === 'KeyS' || e.code === 'ArrowDown') keys.s = false;
    if (e.code === 'KeyD' || e.code === 'ArrowRight') keys.d = false;
    if (e.code === 'Space') keys.space = false;
});

// UI Event Listenery
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

function startGame() {
    STATE.mode = 'PLAYING';
    STATE.score = 0;
    STATE.health = 100;
    STATE.speed = 100;
    
    startBtn.blur();
    restartBtn.blur();
    
    // Zaktualizuj UI
    uiStart.classList.add('hidden');
    uiGameOver.classList.add('hidden');
    uiHUD.classList.remove('hidden');
    updateUI();

    // Reset statyczności statku
    airplaneGroup.position.set(0, 0, 0);
    airplaneGroup.rotation.set(0, 0, 0);

    // Czyszczenie środowiska
    obstacles.forEach(o => scene.remove(o.mesh));
    obstacles.length = 0;
    bullets.forEach(b => scene.remove(b.mesh));
    bullets.length = 0;
}

function gameOver() {
    STATE.mode = 'GAMEOVER';
    uiHUD.classList.add('hidden');
    uiGameOver.classList.remove('hidden');
    finalScore.innerText = Math.floor(STATE.score);
}

function updateUI() {
    scoreVal.innerText = Math.floor(STATE.score);
    healthVal.style.width = Math.max(0, STATE.health) + '%';
    if(STATE.health < 30) healthVal.style.backgroundColor = '#ff003c';
    else healthVal.style.backgroundColor = '#66fcf1';
}

function shootBullet() {
    const geo = new THREE.SphereGeometry(0.5, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0x66fcf1 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(airplaneGroup.position);
    mesh.position.z -= 4; // Start z nosa samolotu
    scene.add(mesh);
    bullets.push({ mesh, active: true });
}

function spawnObstacle() {
    // Określamy czy to twarda bryła wróg (Dodecahedron) czy przeszkoda (Box)
    const isEnemy = Math.random() > 0.5;
    const geo = isEnemy ? new THREE.DodecahedronGeometry(3) : new THREE.BoxGeometry(4, 8, 4);
    const mat = new THREE.MeshStandardMaterial({ 
        color: isEnemy ? 0xff003c : 0xffa500, // Czerwony wróg / Pomarańczowa wiekowość
        flatShading: true,
        emissive: isEnemy ? 0x550011 : 0x000000 
    });
    const mesh = new THREE.Mesh(geo, mat);
    
    // Spawn daleko przed graczem na losowej osi X i Y
    const x = (Math.random() - 0.5) * 60;
    const y = (Math.random() - 0.5) * 20 + 5; // Nad siatką
    const z = -300;
    mesh.position.set(x, y, z);
    
    scene.add(mesh);
    obstacles.push({ mesh, active: true, radius: isEnemy ? 3 : 4, type: isEnemy ? 'enemy' : 'wall' });
}

// --- Faza 6: Pętla Główna & QA OPTYMALIZACJA ---
let lastObstacleSpawn = 0;
const clock = new THREE.Clock();

function update(dt) {
    if (STATE.mode !== 'PLAYING') {
        // Idle animation w menu
        airplaneGroup.position.y = Math.sin(clock.elapsedTime * 2) * 2;
        return;
    }

    // Ruch Gracza i granice przestrzeni
    const moveSpeed = 50 * dt;
    if (keys.w) airplaneGroup.position.y += moveSpeed;
    if (keys.s) airplaneGroup.position.y -= moveSpeed;
    if (keys.a) airplaneGroup.position.x -= moveSpeed;
    if (keys.d) airplaneGroup.position.x += moveSpeed;

    airplaneGroup.position.x = Math.max(-35, Math.min(35, airplaneGroup.position.x));
    airplaneGroup.position.y = Math.max(-8, Math.min(25, airplaneGroup.position.y));

    // Płynne pochylanie się statku (Banking) - odczucie lotu
    const targetRoll = (keys.d ? -0.5 : 0) + (keys.a ? 0.5 : 0);
    const targetPitch = (keys.w ? 0.2 : 0) + (keys.s ? -0.2 : 0);
    airplaneGroup.rotation.z += (targetRoll - airplaneGroup.rotation.z) * 0.1;
    airplaneGroup.rotation.x += (targetPitch - airplaneGroup.rotation.x) * 0.1;

    // Przewijanie środowiska (wrażenie lotu naprzód z zawrotną prędkością)
    gridHelper.position.z += STATE.speed * dt;
    if (gridHelper.position.z > 40) gridHelper.position.z -= 40; // Iluzja ciągłości pętli
    STATE.speed += 1 * dt; // Delikatne przyspieszanie gry w czasie

    // Wypuszczanie przeszkód
    if (clock.elapsedTime - lastObstacleSpawn > 0.4) {
        spawnObstacle();
        lastObstacleSpawn = clock.elapsedTime;
    }

    // Matematyka Kul - lot
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (!b.active) continue;
        b.mesh.position.z -= 300 * dt; // Pocisk 3x szybszy
        if (b.mesh.position.z < -400) {
            scene.remove(b.mesh);
            bullets.splice(i, 1);
        }
    }

    // Matematyka Przeszkód i Kolizje (QA: usuwanie zbędnych z pamięci)
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        if (!obs.active) continue;
        
        obs.mesh.position.z += STATE.speed * dt;
        obs.mesh.rotation.x += dt;
        obs.mesh.rotation.y += dt;

        // Kolizja: Statek <-> Przeszkoda
        const distToPlayer = obs.mesh.position.distanceTo(airplaneGroup.position);
        if (distToPlayer < (obs.radius + 2)) {
            // Trafienie!
            STATE.health -= obs.type === 'enemy' ? 25 : 50; 
            updateUI();
            
            // Usunięcie po uderzeniu
            scene.remove(obs.mesh);
            obstacles.splice(i, 1);
            
            if (STATE.health <= 0) {
                gameOver();
            }
            continue;
        }

        // Kolizja: Pocisk <-> Przeszkoda
        let bulletHit = false;
        for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            if (!b.active) continue;
            
            const distToBullet = obs.mesh.position.distanceTo(b.mesh.position);
            if (distToBullet < obs.radius + 2) {
                // Pocisk trafił przeszkodę
                STATE.score += obs.type === 'enemy' ? 100 : 200;
                updateUI();
                
                scene.remove(obs.mesh);
                obstacles.splice(i, 1);
                
                scene.remove(b.mesh);
                bullets.splice(j, 1);
                
                bulletHit = true;
                break;
            }
        }
        if (bulletHit) continue;
        
        // Zwalnianie zasobów minionych przeszkód by zapobiec Frame-Dropom
        if (obs.mesh.position.z > 20) {
            scene.remove(obs.mesh);
            obstacles.splice(i, 1);
        }
    }

    // Bezpieczne naliczanie punktów za przetrwanie i uaktualnianie HUD co chwilę
    STATE.score += 20 * dt;
    if (Math.random() < 0.1) updateUI(); // Optymalizacja QA (UI render drop)
}

function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    // Nakładamy sztywny limit FPS dla stabilności na słabym sprzęcie
    if(dt > 0.1) return;
    
    update(dt);
    renderer.render(scene, camera);
}

// Responsywność
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Rozruch!
animate();
