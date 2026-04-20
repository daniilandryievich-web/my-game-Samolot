const STATE = {
    mode: 'MENU', // MENU, PLAYING, GAMEOVER
    score: 0,
    health: 100,
    speed: 100, // Z jaką prędkością wszystko leci w naszą stronę
    level: 1,
    levelTime: 0,
    bossActive: false,
    bossMaxHp: 500,
    bossHp: 0,
    powerups: { shield: 0, weapon: 0 }
};

const uiStart = document.getElementById('start-screen');
const uiHUD = document.getElementById('hud');
const uiGameOver = document.getElementById('game-over-screen');
const scoreVal = document.getElementById('score-val');
const healthVal = document.getElementById('health-val');
const finalScore = document.getElementById('final-score');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const levelVal = document.getElementById('level-val');
const powerupsContainer = document.getElementById('powerups-container');
const bossHpContainer = document.getElementById('boss-hp-container');
const bossHpVal = document.getElementById('boss-hp-val');

// --- AUDIO SYSTEM ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playTone(freq, type, duration, vol=0.1) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(vol, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

const sfx = {
    shoot: () => playTone(880, 'square', 0.1, 0.02),
    explosion: () => playTone(100, 'sawtooth', 0.5, 0.1),
    powerup: () => { playTone(440, 'sine', 0.1, 0.05); setTimeout(()=>playTone(660, 'sine', 0.2, 0.05), 100); },
    bossHit: () => playTone(150, 'square', 0.1, 0.1),
    levelUp: () => { playTone(523.25, 'square', 0.2, 0.05); setTimeout(()=>playTone(659.25, 'square', 0.4, 0.05), 200); }
};

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

let cameraShake = 0;
const defaultCameraPos = new THREE.Vector3(0, 15, 30);

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

// Śmigło
const propGeo = new THREE.CylinderGeometry(0.2, 0.2, 8, 8);
propGeo.rotateZ(Math.PI / 2);
const propMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
const propeller = new THREE.Mesh(propGeo, propMat);
propeller.position.set(0, 0, -5);
airplaneGroup.add(propeller);

scene.add(airplaneGroup);

// Podłoga / Środowisko - Neonowy Grid
const gridHelper = new THREE.GridHelper(400, 40, 0x45a29e, 0x1f2833);
gridHelper.position.y = -10;
scene.add(gridHelper);

// Gwiazdy
const starsGeo = new THREE.BufferGeometry();
const starsVerts = [];
for(let i=0; i<1000; i++) {
    starsVerts.push((Math.random()-0.5)*1000, (Math.random()-0.5)*1000, -Math.random()*1000);
}
starsGeo.setAttribute('position', new THREE.Float32BufferAttribute(starsVerts, 3));
const starsMat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.5 });
const stars = new THREE.Points(starsGeo, starsMat);
scene.add(stars);

// System Cząsteczek
const particlesArray = [];
function spawnExplosion(pos, colorHex) {
    sfx.explosion();
    const count = 30;
    const geom = new THREE.BufferGeometry();
    const posArray = new Float32Array(count * 3);
    const velArray = [];
    for(let i=0; i<count; i++) {
        posArray[i*3] = pos.x;
        posArray[i*3+1] = pos.y;
        posArray[i*3+2] = pos.z;
        velArray.push((Math.random()-0.5)*2, (Math.random()-0.5)*2, (Math.random()-0.5)*2);
    }
    geom.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const mat = new THREE.PointsMaterial({ color: colorHex, size: 2, transparent: true, opacity: 1 });
    const points = new THREE.Points(geom, mat);
    scene.add(points);
    particlesArray.push({ mesh: points, velocities: velArray, life: 1.0 });
}

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
    STATE.level = 1;
    STATE.levelTime = 0;
    STATE.bossActive = false;
    STATE.bossHp = 0;
    STATE.powerups = { shield: 0, weapon: 0 };
    
    startBtn.blur();
    restartBtn.blur();
    
    // Zaktualizuj UI
    uiStart.classList.add('hidden');
    uiGameOver.classList.add('hidden');
    uiHUD.classList.remove('hidden');
    bossHpContainer.classList.add('hidden');
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
    levelVal.innerText = STATE.level;
    healthVal.style.width = Math.max(0, STATE.health) + '%';
    if(STATE.health < 30) healthVal.style.backgroundColor = '#ff003c';
    else healthVal.style.backgroundColor = '#66fcf1';
    
    powerupsContainer.innerHTML = '';
    if (STATE.powerups.shield > 0) {
        powerupsContainer.innerHTML += '<div class="powerup-indicator powerup-shield">SHIELD ACTIVE</div>';
    }
    if (STATE.powerups.weapon > 0) {
        powerupsContainer.innerHTML += '<div class="powerup-indicator powerup-weapon">WEAPON UPGRADE</div>';
    }
    
    if (STATE.bossActive) {
        bossHpVal.style.width = Math.max(0, (STATE.bossHp / STATE.bossMaxHp) * 100) + '%';
    }
}

function shootBullet() {
    sfx.shoot();
    const geo = new THREE.SphereGeometry(0.5, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color: 0x66fcf1 });
    
    const createBullet = (offX) => {
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(airplaneGroup.position);
        mesh.position.x += offX;
        mesh.position.z -= 4; // Start z nosa samolotu
        scene.add(mesh);
        bullets.push({ mesh, active: true });
    };

    if (STATE.powerups.weapon > 0) {
        createBullet(-2);
        createBullet(0);
        createBullet(2);
    } else {
        createBullet(0);
    }
}

function spawnObstacle() {
    if (STATE.bossActive) return;

    const r = Math.random();
    let isEnemy = false;
    let isPowerup = false;
    let type = 'wall';
    
    if (r < 0.1) {
        isPowerup = true;
        type = Math.random() < 0.33 ? 'health' : (Math.random() < 0.5 ? 'shield' : 'weapon');
    } else if (r < 0.6) {
        isEnemy = true;
        type = 'enemy';
    }

    let geo, mat, radius;
    
    if (isPowerup) {
        geo = new THREE.OctahedronGeometry(2);
        radius = 2;
        let color = type === 'health' ? 0x00ff00 : (type === 'shield' ? 0x66fcf1 : 0xffd700);
        mat = new THREE.MeshBasicMaterial({ color: color, wireframe: true });
    } else {
        const fastEnemy = isEnemy && Math.random() < 0.3;
        if (fastEnemy) type = 'fast_enemy';
        
        geo = isEnemy ? (fastEnemy ? new THREE.TetrahedronGeometry(2) : new THREE.DodecahedronGeometry(3)) : new THREE.BoxGeometry(4, 8, 4);
        mat = new THREE.MeshStandardMaterial({ 
            color: isEnemy ? 0xff003c : 0xffa500,
            flatShading: true,
            emissive: isEnemy ? 0x550011 : 0x000000 
        });
        radius = isEnemy ? (fastEnemy ? 2 : 3) : 4;
    }
    
    const mesh = new THREE.Mesh(geo, mat);
    
    const x = (Math.random() - 0.5) * 60;
    const y = (Math.random() - 0.5) * 20 + 5;
    const z = -300;
    mesh.position.set(x, y, z);
    
    scene.add(mesh);
    obstacles.push({ mesh, active: true, radius: radius, type: type });
}

// --- Faza 6: Pętla Główna & QA OPTYMALIZACJA ---
let lastObstacleSpawn = 0;
const clock = new THREE.Clock();

// Globals for boss
let bossGroup = null;
const bossBullets = [];
let bossMoveTime = 0;
let lastBossShootTime = 0;

function spawnBoss() {
    STATE.bossActive = true;
    STATE.bossMaxHp = 500 * STATE.level;
    STATE.bossHp = STATE.bossMaxHp;
    
    bossHpContainer.classList.remove('hidden');
    updateUI();
    
    if (bossGroup) scene.remove(bossGroup);
    
    bossGroup = new THREE.Group();
    const coreMat = new THREE.MeshStandardMaterial({ color: 0xff003c, emissive: 0x550011, flatShading: true });
    const hullMat = new THREE.MeshStandardMaterial({ color: 0x333333, flatShading: true });
    
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(8), coreMat);
    bossGroup.add(core);
    
    const wingsGeo = new THREE.BoxGeometry(40, 2, 8);
    const wings = new THREE.Mesh(wingsGeo, hullMat);
    bossGroup.add(wings);
    
    bossGroup.position.set(0, 10, -250);
    scene.add(bossGroup);
}

function shootBossBullet(angleOff=0) {
    const geo = new THREE.SphereGeometry(1.5, 4, 4);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff003c });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(bossGroup.position);
    scene.add(mesh);
    
    const dir = new THREE.Vector3(0, 0, 1);
    dir.applyAxisAngle(new THREE.Vector3(0,1,0), angleOff);
    dir.normalize().multiplyScalar(150 + (STATE.level * 20));
    
    bossBullets.push({ mesh, active: true, velocity: dir });
}

function update(dt) {
    stars.rotation.z += 0.05 * dt;
    
    if (STATE.mode !== 'PLAYING') {
        airplaneGroup.position.y = Math.sin(clock.elapsedTime * 2) * 2;
        propeller.rotation.z += 2 * dt;
        return;
    }

    // Powerups timers
    let uiNeedsUpdate = false;
    if (STATE.powerups.shield > 0) {
        STATE.powerups.shield -= dt;
        if (STATE.powerups.shield <= 0) uiNeedsUpdate = true;
    }
    if (STATE.powerups.weapon > 0) {
        STATE.powerups.weapon -= dt;
        if (STATE.powerups.weapon <= 0) uiNeedsUpdate = true;
    }
    if (uiNeedsUpdate) updateUI();

    // Level progression
    if (!STATE.bossActive) {
        STATE.levelTime += dt;
        if (STATE.levelTime > 60) {
            spawnBoss();
        }
    }

    // Camera shake
    if (cameraShake > 0) {
        cameraShake -= dt;
        camera.position.x = defaultCameraPos.x + (Math.random() - 0.5) * 2;
        camera.position.y = defaultCameraPos.y + (Math.random() - 0.5) * 2;
    } else {
        camera.position.copy(defaultCameraPos);
    }

    // Particles update
    for (let i = particlesArray.length - 1; i >= 0; i--) {
        const p = particlesArray[i];
        p.life -= dt;
        if (p.life <= 0) {
            scene.remove(p.mesh);
            particlesArray.splice(i, 1);
            continue;
        }
        p.mesh.material.opacity = p.life;
        const positions = p.mesh.geometry.attributes.position.array;
        for (let j = 0; j < positions.length; j += 3) {
            positions[j] += p.velocities[j] * 20 * dt;
            positions[j+1] += p.velocities[j+1] * 20 * dt;
            positions[j+2] += p.velocities[j+2] * 20 * dt;
        }
        p.mesh.geometry.attributes.position.needsUpdate = true;
    }

    propeller.rotation.z += 20 * dt;

    const moveSpeed = 50 * dt;
    if (keys.w) airplaneGroup.position.y += moveSpeed;
    if (keys.s) airplaneGroup.position.y -= moveSpeed;
    if (keys.a) airplaneGroup.position.x -= moveSpeed;
    if (keys.d) airplaneGroup.position.x += moveSpeed;

    airplaneGroup.position.x = Math.max(-35, Math.min(35, airplaneGroup.position.x));
    airplaneGroup.position.y = Math.max(-8, Math.min(25, airplaneGroup.position.y));

    const targetRoll = (keys.d ? -0.5 : 0) + (keys.a ? 0.5 : 0);
    const targetPitch = (keys.w ? 0.2 : 0) + (keys.s ? -0.2 : 0);
    airplaneGroup.rotation.z += (targetRoll - airplaneGroup.rotation.z) * 0.1;
    airplaneGroup.rotation.x += (targetPitch - airplaneGroup.rotation.x) * 0.1;

    gridHelper.position.z += STATE.speed * dt;
    if (gridHelper.position.z > 40) gridHelper.position.z -= 40;
    STATE.speed += 0.5 * dt;

    if (!STATE.bossActive && clock.elapsedTime - lastObstacleSpawn > Math.max(0.1, 0.4 - (STATE.level * 0.02))) {
        spawnObstacle();
        lastObstacleSpawn = clock.elapsedTime;
    }

    // Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        if (!b.active) continue;
        b.mesh.position.z -= 300 * dt;
        if (b.mesh.position.z < -400) {
            scene.remove(b.mesh);
            bullets.splice(i, 1);
        }
    }

    // Boss Logic
    if (STATE.bossActive && bossGroup) {
        bossGroup.position.z += ( -100 - bossGroup.position.z ) * 2 * dt;
        bossMoveTime += dt;
        bossGroup.position.x = Math.sin(bossMoveTime * 1.5) * 20;
        
        bossGroup.rotation.z = Math.sin(bossMoveTime * 2) * 0.2;
        
        if (clock.elapsedTime - lastBossShootTime > (Math.max(0.2, 0.8 - STATE.level*0.1))) {
            sfx.shoot();
            const pattern = Math.floor(Math.random() * 3);
            if (pattern === 0) {
                shootBossBullet(0); 
            } else if (pattern === 1) {
                shootBossBullet(-0.2);
                shootBossBullet(0);
                shootBossBullet(0.2);
            } else {
                for(let a = -0.5; a <= 0.5; a += 0.25) shootBossBullet(a);
            }
            lastBossShootTime = clock.elapsedTime;
        }

        // Boss vs Bullets collision
        for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            if (!b.active) continue;
            
            if (bossGroup.position.distanceTo(b.mesh.position) < 10) {
                sfx.bossHit();
                spawnExplosion(b.mesh.position, 0xffff00);
                STATE.score += 50;
                STATE.bossHp -= 10;
                if (STATE.bossHp <= 0) {
                    sfx.levelUp();
                    spawnExplosion(bossGroup.position, 0xff003c);
                    scene.remove(bossGroup);
                    STATE.bossActive = false;
                    STATE.level++;
                    STATE.levelTime = 0;
                    STATE.score += 5000;
                    STATE.health = 100;
                    bossHpContainer.classList.add('hidden');
                }
                updateUI();
                
                scene.remove(b.mesh);
                bullets.splice(j, 1);
            }
        }
    }
    
    // Boss Bullets
    for (let i = bossBullets.length - 1; i >= 0; i--) {
        const b = bossBullets[i];
        if (!b.active) continue;
        b.mesh.position.addScaledVector(b.velocity, dt);
        
        if (b.mesh.position.z > 50) {
            scene.remove(b.mesh);
            bossBullets.splice(i, 1);
            continue;
        }

        if (STATE.powerups.shield <= 0 && b.mesh.position.distanceTo(airplaneGroup.position) < 2.5) {
            STATE.health -= 20;
            cameraShake = 0.3;
            sfx.explosion();
            updateUI();
            scene.remove(b.mesh);
            bossBullets.splice(i, 1);
            if (STATE.health <= 0) gameOver();
        }
    }

    // Normal Obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        if (!obs.active) continue;
        
        let moveZ = STATE.speed * dt;
        if (obs.type === 'fast_enemy') moveZ *= 1.5;
        obs.mesh.position.z += moveZ;
        
        obs.mesh.rotation.x += dt;
        obs.mesh.rotation.y += dt;

        const distToPlayer = obs.mesh.position.distanceTo(airplaneGroup.position);
        if (distToPlayer < (obs.radius + 2)) {
            if (obs.type === 'health') {
                STATE.health = Math.min(100, STATE.health + 30);
                sfx.powerup();
            } else if (obs.type === 'shield') {
                STATE.powerups.shield = 5;
                sfx.powerup();
            } else if (obs.type === 'weapon') {
                STATE.powerups.weapon = 5;
                sfx.powerup();
            } else {
                if (STATE.powerups.shield <= 0) {
                    STATE.health -= obs.type.includes('enemy') ? 25 : 50; 
                    cameraShake = 0.5;
                    sfx.explosion();
                }
            }
            updateUI();
            spawnExplosion(obs.mesh.position, obs.mesh.material.color.getHex());
            
            scene.remove(obs.mesh);
            obstacles.splice(i, 1);
            
            if (STATE.health <= 0) gameOver();
            continue;
        }

        let bulletHit = false;
        for (let j = bullets.length - 1; j >= 0; j--) {
            const b = bullets[j];
            if (!b.active) continue;
            
            const distToBullet = obs.mesh.position.distanceTo(b.mesh.position);
            // Powerupy niszczymy kulką - czy tak chcemy? Powiedzmy że dajemy za to mały bonus punktów, ew. zbierze.
            // Zróbmy tak, że kulki przelatują przez powerupy, by gracz mógł je zebrać ciałem.
            if (!['health', 'shield', 'weapon'].includes(obs.type) && distToBullet < obs.radius + 2) {
                STATE.score += obs.type.includes('enemy') ? 100 : 200;
                updateUI();
                
                spawnExplosion(obs.mesh.position, obs.mesh.material.color.getHex());
                
                scene.remove(obs.mesh);
                obstacles.splice(i, 1);
                
                scene.remove(b.mesh);
                bullets.splice(j, 1);
                
                bulletHit = true;
                break;
            }
        }
        if (bulletHit) continue;
        
        if (obs.mesh.position.z > 20) {
            scene.remove(obs.mesh);
            obstacles.splice(i, 1);
        }
    }

    STATE.score += 20 * dt;
    if (Math.random() < 0.05) updateUI();
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
