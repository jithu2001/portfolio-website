// ============================================
// 🌲 IMMERSIVE 3D FOREST — GAME-LIKE SCENE 🌲
// ============================================
let scene, camera, renderer, clock;
let trees = [], fireflies = [], mountains = [];
let campfireLight, campfireLight2;
let leaves = [], birds = [];
let riverMesh, mistParticles;
let targetCamX = 0, targetCamY = 8, camRotX = 0, camRotY = 0;
let keys = {};
let isExploring = false;

function init() {
  clock = new THREE.Clock();
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050d08);
  scene.fog = new THREE.FogExp2(0x071510, 0.014);

  camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 1000);
  camera.position.set(0, 6, 28);
  camera.lookAt(0, 4, 0);

  const canvas = document.getElementById('scene-canvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;

  createLighting();
  createSky();
  createMountains();
  createGround();
  createRiver();
  createTrees();
  createCampfire();
  createFireflies();
  createFallingLeaves();
  createGroundMist();
  createBirds();
  createGodRays();

  addEventListener('resize', onResize);
  addEventListener('mousemove', onMouseMove);
  addEventListener('scroll', onScroll);
  addEventListener('keydown', e => { keys[e.key.toLowerCase()] = true; isExploring = true; });
  addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

  animate();
}

// ---- LIGHTING ----
function createLighting() {
  scene.add(new THREE.AmbientLight(0x0a1f14, 1.5));

  const moonDir = new THREE.DirectionalLight(0x6699cc, 0.7);
  moonDir.position.set(20, 40, -30);
  moonDir.castShadow = true;
  moonDir.shadow.mapSize.set(2048, 2048);
  moonDir.shadow.camera.near = 1;
  moonDir.shadow.camera.far = 100;
  moonDir.shadow.camera.left = -40;
  moonDir.shadow.camera.right = 40;
  moonDir.shadow.camera.top = 40;
  moonDir.shadow.camera.bottom = -10;
  scene.add(moonDir);

  scene.add(new THREE.HemisphereLight(0x1a3a2a, 0x050d08, 1.0));

  // Campfire lights (animated in render loop)
  campfireLight = new THREE.PointLight(0xff6622, 3, 25, 2);
  campfireLight.position.set(0, 1.5, 8);
  campfireLight.castShadow = true;
  scene.add(campfireLight);

  campfireLight2 = new THREE.PointLight(0xff4400, 1.5, 15, 2);
  campfireLight2.position.set(0.5, 2, 7.5);
  scene.add(campfireLight2);
}

// ---- SKY WITH MILKY WAY ----
function createSky() {
  const starCount = 1500;
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);
  for (let i = 0; i < starCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 300;
    positions[i * 3 + 1] = Math.random() * 100 + 15;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 300 - 50;
    // Tint some stars blue/amber
    const tint = Math.random();
    if (tint > 0.85) { colors[i * 3] = 0.6; colors[i * 3 + 1] = 0.7; colors[i * 3 + 2] = 1; }
    else if (tint > 0.7) { colors[i * 3] = 1; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 0.6; }
    else { colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1; }
    sizes[i] = 0.08 + Math.random() * 0.2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
  const mat = new THREE.PointsMaterial({ size: 0.18, vertexColors: true, transparent: true, opacity: 0.85 });
  scene.add(new THREE.Points(geo, mat));

  // Moon with craters
  const moonGroup = new THREE.Group();
  const moonMat = new THREE.MeshStandardMaterial({ color: 0xe8e8e0, emissive: 0xbbbbbb, emissiveIntensity: 0.4 });
  const moon = new THREE.Mesh(new THREE.SphereGeometry(4, 48, 48), moonMat);
  moonGroup.add(moon);
  // Craters
  for (let i = 0; i < 6; i++) {
    const c = new THREE.Mesh(
      new THREE.SphereGeometry(0.3 + Math.random() * 0.6, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xccccbb, emissive: 0x888888, emissiveIntensity: 0.2 })
    );
    const theta = Math.random() * Math.PI * 2, phi = Math.random() * Math.PI;
    c.position.set(3.8 * Math.sin(phi) * Math.cos(theta), 3.8 * Math.sin(phi) * Math.sin(theta), 3.8 * Math.cos(phi));
    c.scale.set(1, 1, 0.3);
    c.lookAt(0, 0, 0);
    moonGroup.add(c);
  }
  // Glow rings
  for (let r = 5; r <= 9; r += 2) {
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(r, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0x8ab4f8, transparent: true, opacity: 0.03 })
    );
    moonGroup.add(glow);
  }
  moonGroup.position.set(30, 40, -80);
  scene.add(moonGroup);
}

// ---- SNOW-CAPPED MOUNTAINS ----
function createMountains() {
  const layers = [
    { z: -80, h: 35, color: 0x060e08, snow: true, pts: 30 },
    { z: -60, h: 25, color: 0x081510, snow: true, pts: 25 },
    { z: -42, h: 18, color: 0x0a1d14, snow: false, pts: 22 },
    { z: -28, h: 12, color: 0x0d2518, snow: false, pts: 20 },
  ];

  layers.forEach(L => {
    const w = 160;
    // Mountain body
    const shape = new THREE.Shape();
    shape.moveTo(-w, 0);
    const peaks = [];
    for (let x = -w; x <= w; x += w * 2 / L.pts) {
      const n = Math.sin(x * 0.06) * 0.5 + Math.sin(x * 0.12 + 1.5) * 0.3 + Math.sin(x * 0.03 + 4) * 0.2;
      const h = n * L.h * 0.6 + L.h * 0.4 + Math.random() * L.h * 0.1;
      shape.lineTo(x, Math.max(h, 1));
      peaks.push({ x, h: Math.max(h, 1) });
    }
    shape.lineTo(w, 0);
    shape.closePath();
    const mesh = new THREE.Mesh(
      new THREE.ShapeGeometry(shape),
      new THREE.MeshStandardMaterial({ color: L.color, side: THREE.DoubleSide, flatShading: true })
    );
    mesh.position.set(0, 0, L.z);
    scene.add(mesh);
    mountains.push(mesh);

    // Snow caps
    if (L.snow) {
      peaks.forEach(p => {
        if (p.h > L.h * 0.65) {
          const snowH = 2 + Math.random() * 2;
          const sShape = new THREE.Shape();
          sShape.moveTo(p.x - 3, p.h - 1);
          sShape.lineTo(p.x, p.h + snowH);
          sShape.lineTo(p.x + 3, p.h - 1);
          sShape.closePath();
          const sMesh = new THREE.Mesh(
            new THREE.ShapeGeometry(sShape),
            new THREE.MeshStandardMaterial({ color: 0xddeeff, emissive: 0x334455, emissiveIntensity: 0.15 })
          );
          sMesh.position.z = L.z + 0.1;
          scene.add(sMesh);
        }
      });
    }
  });
}

// ---- TEXTURED GROUND ----
function createGround() {
  const geo = new THREE.PlaneGeometry(250, 120, 100, 50);
  const pos = geo.attributes.position.array;
  for (let i = 0; i < pos.length; i += 3) {
    pos[i + 2] += (Math.random() - 0.5) * 0.6;
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({
    color: 0x0a1d12, roughness: 0.95, metalness: 0.05, flatShading: true
  });
  const ground = new THREE.Mesh(geo, mat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.5;
  ground.receiveShadow = true;
  scene.add(ground);

  // Grass patches (small green triangles)
  for (let i = 0; i < 200; i++) {
    const gx = (Math.random() - 0.5) * 80, gz = Math.random() * 30 - 5;
    const gh = 0.3 + Math.random() * 0.5;
    const grass = new THREE.Mesh(
      new THREE.ConeGeometry(0.05, gh, 4),
      new THREE.MeshStandardMaterial({ color: 0x1a5a2a + Math.floor(Math.random() * 0x0a2010), flatShading: true })
    );
    grass.position.set(gx, -0.5 + gh / 2, gz);
    grass.rotation.z = (Math.random() - 0.5) * 0.3;
    scene.add(grass);
  }
}

// ---- ANIMATED RIVER ----
function createRiver() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-60, -0.3, -5),
    new THREE.Vector3(-30, -0.3, -2),
    new THREE.Vector3(-10, -0.3, 3),
    new THREE.Vector3(5, -0.3, 5),
    new THREE.Vector3(25, -0.3, 2),
    new THREE.Vector3(50, -0.3, -3),
    new THREE.Vector3(70, -0.3, -6),
  ]);
  const points = curve.getPoints(100);
  // Create river as a tube-like flat ribbon
  const riverGeo = new THREE.BufferGeometry();
  const verts = [], uvs = [], indices = [];
  const width = 2.5;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const t = i / (points.length - 1);
    const tangent = curve.getTangent(t);
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    verts.push(p.x + normal.x * width, -0.35, p.z + normal.z * width);
    verts.push(p.x - normal.x * width, -0.35, p.z - normal.z * width);
    uvs.push(t * 8, 0, t * 8, 1);
    if (i < points.length - 1) {
      const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  riverGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(verts), 3));
  riverGeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
  riverGeo.setIndex(indices);
  riverGeo.computeVertexNormals();

  const riverMat = new THREE.MeshStandardMaterial({
    color: 0x1a4a5a, transparent: true, opacity: 0.6,
    roughness: 0.1, metalness: 0.4, flatShading: false
  });
  riverMesh = new THREE.Mesh(riverGeo, riverMat);
  riverMesh.receiveShadow = true;
  scene.add(riverMesh);

  // River glow
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x22aacc, transparent: true, opacity: 0.08 });
  const glowMesh = new THREE.Mesh(riverGeo.clone(), glowMat);
  glowMesh.position.y = 0.01;
  scene.add(glowMesh);
}

// ---- TREES (MORE VARIETY) ----
function createTree(x, y, z, scale, type) {
  const group = new THREE.Group();
  const trunkH = (type === 'tall' ? 2.5 : 1.5) * scale;
  const trunkGeo = new THREE.CylinderGeometry(0.08 * scale, 0.14 * scale, trunkH, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: type === 'dead' ? 0x2a1a0a : 0x3d2817, flatShading: true });
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  group.add(trunk);

  if (type !== 'dead') {
    const foliageColors = [0x0d4a22, 0x0f5a28, 0x116830, 0x0a3a1a, 0x1a6a34];
    const layerCount = type === 'tall' ? 4 : 3;
    for (let i = 0; i < layerCount; i++) {
      const r = (1.4 - i * 0.3) * scale;
      const h = (2.0 - i * 0.3) * scale;
      const yy = trunkH + i * h * 0.5;
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(r, h, 7 + Math.floor(Math.random() * 3)),
        new THREE.MeshStandardMaterial({ color: foliageColors[i % foliageColors.length], flatShading: true })
      );
      cone.position.y = yy;
      cone.castShadow = true;
      cone.rotation.y = Math.random() * Math.PI;
      group.add(cone);
    }
  } else {
    // Dead tree: bare branches
    for (let i = 0; i < 4; i++) {
      const branch = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02 * scale, 0.04 * scale, 1.2 * scale, 4),
        trunkMat
      );
      branch.position.y = trunkH * 0.7;
      branch.rotation.z = 0.5 + Math.random() * 0.8;
      branch.rotation.y = i * Math.PI / 2;
      group.add(branch);
    }
  }

  group.position.set(x, y, z);
  group.rotation.y = Math.random() * Math.PI * 2;
  scene.add(group);
  trees.push(group);
}

function createTrees() {
  const types = ['normal', 'normal', 'normal', 'tall', 'tall', 'dead'];
  for (let i = 0; i < 80; i++) {
    const x = (Math.random() - 0.5) * 100;
    const z = Math.random() * -35 + 8;
    const scale = 0.5 + Math.random() * 1.3;
    if (Math.abs(x) < 5 && z > 2 && z < 12) continue; // Clear campfire area
    const type = types[Math.floor(Math.random() * types.length)];
    createTree(x, -0.5, z, scale, type);
  }
  // Dense foreground edges
  for (let i = 0; i < 15; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    createTree(side * (18 + Math.random() * 35), -0.5, 8 + Math.random() * 18, 1 + Math.random() * 0.8, 'tall');
  }
}

// ---- CAMPFIRE ----
function createCampfire() {
  const fireGroup = new THREE.Group();
  fireGroup.position.set(0, -0.5, 8);

  // Stone ring
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const stone = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.25 + Math.random() * 0.15, 0),
      new THREE.MeshStandardMaterial({ color: 0x444444 + Math.floor(Math.random() * 0x222222), flatShading: true, roughness: 0.9 })
    );
    stone.position.set(Math.cos(angle) * 1.2, 0.1, Math.sin(angle) * 1.2);
    stone.rotation.set(Math.random(), Math.random(), Math.random());
    fireGroup.add(stone);
  }

  // Logs
  for (let i = 0; i < 3; i++) {
    const log = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.1, 1.2, 6),
      new THREE.MeshStandardMaterial({ color: 0x3d2010, flatShading: true })
    );
    log.rotation.z = Math.PI / 2;
    log.rotation.y = i * Math.PI / 3;
    log.position.y = 0.15;
    fireGroup.add(log);
  }

  // Fire particles (animated cones)
  for (let i = 0; i < 12; i++) {
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.12 + Math.random() * 0.15, 0.5 + Math.random() * 0.8, 5),
      new THREE.MeshBasicMaterial({
        color: i < 4 ? 0xff2200 : (i < 8 ? 0xff6600 : 0xffaa00),
        transparent: true, opacity: 0.7
      })
    );
    flame.position.set((Math.random() - 0.5) * 0.5, 0.4 + Math.random() * 0.3, (Math.random() - 0.5) * 0.5);
    flame.userData = { baseY: flame.position.y, speed: 2 + Math.random() * 3, phase: Math.random() * Math.PI * 2 };
    fireGroup.add(flame);
  }

  // Embers (tiny particles rising)
  const emberCount = 40;
  const emberGeo = new THREE.BufferGeometry();
  const ePos = new Float32Array(emberCount * 3);
  for (let i = 0; i < emberCount; i++) {
    ePos[i * 3] = (Math.random() - 0.5) * 1;
    ePos[i * 3 + 1] = Math.random() * 3;
    ePos[i * 3 + 2] = (Math.random() - 0.5) * 1;
  }
  emberGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
  const emberMat = new THREE.PointsMaterial({ color: 0xff6600, size: 0.08, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending });
  const embers = new THREE.Points(emberGeo, emberMat);
  embers.position.set(0, 0.5, 0);
  fireGroup.add(embers);
  fireGroup.userData.embers = embers;
  fireGroup.userData.flames = fireGroup.children.filter(c => c.userData && c.userData.baseY);

  scene.add(fireGroup);
  trees.push(fireGroup); // For animation reference
  scene.userData.campfire = fireGroup;
}

// ---- FIREFLIES (MORE, WITH GLOW) ----
function createFireflies() {
  const count = 150;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const ffData = [];
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 80;
    const y = Math.random() * 15 + 0.5;
    const z = (Math.random() - 0.5) * 50;
    positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
    ffData.push({ x, y, z, speed: 0.2 + Math.random() * 0.6, phase: Math.random() * Math.PI * 2, brightness: Math.random() });
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.6, map: createGlowTexture(180, 255, 100), transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false, color: 0xaaff66
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);
  fireflies.push({ mesh: points, data: ffData });
}

function createGlowTexture(r, g, b) {
  const c = document.createElement('canvas');
  c.width = 64; c.height = 64;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, `rgba(${r},${g},${b},1)`);
  grad.addColorStop(0.2, `rgba(${r},${g},${b},0.6)`);
  grad.addColorStop(0.5, `rgba(${Math.floor(r * 0.5)},${Math.floor(g * 0.5)},${Math.floor(b * 0.3)},0.2)`);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

// ---- FALLING LEAVES ----
function createFallingLeaves() {
  const count = 60;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const leafData = [];
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 60;
    const y = Math.random() * 25 + 10;
    const z = (Math.random() - 0.5) * 40;
    positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
    leafData.push({
      x, y, z,
      fallSpeed: 0.3 + Math.random() * 0.5,
      swaySpeed: 0.5 + Math.random() * 1,
      swayAmp: 1 + Math.random() * 3,
      phase: Math.random() * Math.PI * 2
    });
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const colors = [0x8B4513, 0xD2691E, 0xCD853F, 0x228B22, 0x556B2F];
  const mat = new THREE.PointsMaterial({
    size: 0.35, color: 0xCD853F, transparent: true, opacity: 0.8
  });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  leaves.push({ mesh: pts, data: leafData });
}

// ---- GROUND MIST ----
function createGroundMist() {
  const count = 200;
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 100;
    positions[i * 3 + 1] = Math.random() * 1.5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    size: 4, map: createGlowTexture(80, 120, 80), transparent: true, opacity: 0.15,
    blending: THREE.AdditiveBlending, depthWrite: false, color: 0x88aa88
  });
  mistParticles = new THREE.Points(geo, mat);
  scene.add(mistParticles);
}

// ---- FLYING BIRDS ----
function createBirds() {
  for (let i = 0; i < 5; i++) {
    const bird = new THREE.Group();
    // Simple V-shape wings
    const wingGeo = new THREE.BufferGeometry();
    const wingVerts = new Float32Array([
      -1, 0, 0, -0.3, 0.2, 0.1, 0, 0, 0, 0, 0, 0, 0.3, 0.2, 0.1, 1, 0, 0
    ]);
    wingGeo.setAttribute('position', new THREE.BufferAttribute(wingVerts, 3));
    const wingMat = new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.DoubleSide });
    const wings = new THREE.Mesh(wingGeo, wingMat);
    wings.scale.set(0.5, 0.5, 0.5);
    bird.add(wings);

    bird.position.set(
      (Math.random() - 0.5) * 40,
      20 + Math.random() * 15,
      (Math.random() - 0.5) * 40 - 20
    );
    bird.userData = {
      speed: 3 + Math.random() * 2,
      radius: 15 + Math.random() * 20,
      height: bird.position.y,
      phase: Math.random() * Math.PI * 2,
      wingPhase: Math.random() * Math.PI * 2,
      center: { x: bird.position.x, z: bird.position.z }
    };
    scene.add(bird);
    birds.push(bird);
  }
}

// ---- GOD RAYS (VOLUMETRIC LIGHT SHAFTS) ----
function createGodRays() {
  for (let i = 0; i < 6; i++) {
    const rayH = 15 + Math.random() * 20;
    const geo = new THREE.CylinderGeometry(0, 2 + Math.random() * 3, rayH, 4, 1, true);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x8ab4f8, transparent: true, opacity: 0.015 + Math.random() * 0.01,
      side: THREE.DoubleSide, blending: THREE.AdditiveBlending
    });
    const ray = new THREE.Mesh(geo, mat);
    ray.position.set(
      25 + (Math.random() - 0.5) * 15,
      rayH / 2 + 5,
      -40 + (Math.random() - 0.5) * 20
    );
    ray.rotation.z = (Math.random() - 0.5) * 0.2;
    scene.add(ray);
  }
}

// ---- INPUT ----
let mouseX = 0, mouseY = 0;
function onMouseMove(e) {
  mouseX = (e.clientX / innerWidth - 0.5) * 2;
  mouseY = (e.clientY / innerHeight - 0.5) * 2;
}

function onScroll() {
  if (isExploring) return;
  const progress = scrollY / (document.body.scrollHeight - innerHeight);
  targetCamY = 8 - progress * 5;
  camera.position.z = 28 - progress * 10;
}

function onResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}

// ---- WASD CAMERA CONTROLS ----
function handleKeys() {
  const speed = 0.15;
  if (keys['w'] || keys['arrowup']) camera.position.z -= speed;
  if (keys['s'] || keys['arrowdown']) camera.position.z += speed;
  if (keys['a'] || keys['arrowleft']) camera.position.x -= speed;
  if (keys['d'] || keys['arrowright']) camera.position.x += speed;
  if (keys['q']) camera.position.y += speed * 0.5;
  if (keys['e']) camera.position.y -= speed * 0.5;
}

// ---- ANIMATION LOOP ----
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  handleKeys();

  // Smooth camera parallax
  if (!isExploring) {
    camera.position.x += (mouseX * 3 - camera.position.x) * 0.015;
    camera.position.y += (targetCamY - camera.position.y) * 0.02;
  }
  camera.rotation.x += (-mouseY * 0.04 - camera.rotation.x) * 0.015;

  // Campfire animation
  const cf = scene.userData.campfire;
  if (cf) {
    cf.userData.flames.forEach(f => {
      f.position.y = f.userData.baseY + Math.sin(t * f.userData.speed + f.userData.phase) * 0.2;
      f.scale.y = 0.8 + Math.sin(t * f.userData.speed * 1.5 + f.userData.phase) * 0.3;
      f.scale.x = 0.9 + Math.sin(t * f.userData.speed * 0.8) * 0.15;
      f.material.opacity = 0.5 + Math.sin(t * f.userData.speed) * 0.3;
    });
    // Embers rise
    const ep = cf.userData.embers.geometry.attributes.position.array;
    for (let i = 0; i < ep.length; i += 3) {
      ep[i + 1] += 0.02 + Math.random() * 0.02;
      ep[i] += (Math.random() - 0.5) * 0.01;
      if (ep[i + 1] > 4) { ep[i + 1] = 0; ep[i] = (Math.random() - 0.5) * 0.8; ep[i + 2] = (Math.random() - 0.5) * 0.8; }
    }
    cf.userData.embers.geometry.attributes.position.needsUpdate = true;
  }

  // Campfire light flicker
  campfireLight.intensity = 2.5 + Math.sin(t * 8) * 0.5 + Math.sin(t * 13) * 0.3 + Math.random() * 0.3;
  campfireLight2.intensity = 1.2 + Math.sin(t * 10 + 1) * 0.4 + Math.random() * 0.2;
  campfireLight.color.setHSL(0.06 + Math.sin(t * 5) * 0.02, 1, 0.5);

  // Fireflies
  fireflies.forEach(ff => {
    const pos = ff.mesh.geometry.attributes.position.array;
    ff.data.forEach((d, i) => {
      pos[i * 3] = d.x + Math.sin(t * d.speed + d.phase) * 2;
      pos[i * 3 + 1] = d.y + Math.sin(t * d.speed * 0.6 + d.phase + 1) * 1.2;
      pos[i * 3 + 2] = d.z + Math.cos(t * d.speed * 0.4 + d.phase) * 1.5;
    });
    ff.mesh.geometry.attributes.position.needsUpdate = true;
    ff.mesh.material.opacity = 0.4 + Math.sin(t * 1.5) * 0.3;
  });

  // Falling leaves
  leaves.forEach(lf => {
    const pos = lf.mesh.geometry.attributes.position.array;
    lf.data.forEach((d, i) => {
      d.y -= d.fallSpeed * 0.016;
      pos[i * 3] = d.x + Math.sin(t * d.swaySpeed + d.phase) * d.swayAmp;
      pos[i * 3 + 1] = d.y;
      pos[i * 3 + 2] = d.z + Math.cos(t * d.swaySpeed * 0.7 + d.phase) * d.swayAmp * 0.5;
      if (d.y < -1) { d.y = 20 + Math.random() * 10; d.x = (Math.random() - 0.5) * 60; d.z = (Math.random() - 0.5) * 40; }
    });
    lf.mesh.geometry.attributes.position.needsUpdate = true;
  });

  // Tree sway
  trees.forEach((tree, i) => {
    if (tree !== cf) tree.rotation.z = Math.sin(t * 0.25 + i * 0.4) * 0.02;
  });

  // Birds
  birds.forEach(b => {
    const d = b.userData;
    b.position.x = d.center.x + Math.cos(t * 0.3 * d.speed / 5 + d.phase) * d.radius;
    b.position.z = d.center.z + Math.sin(t * 0.3 * d.speed / 5 + d.phase) * d.radius;
    b.position.y = d.height + Math.sin(t * 0.5 + d.phase) * 2;
    b.rotation.y = -t * 0.3 * d.speed / 5 - d.phase + Math.PI / 2;
    // Wing flap
    const wing = b.children[0];
    if (wing) {
      const flapAngle = Math.sin(t * d.speed + d.wingPhase) * 0.3;
      wing.rotation.x = flapAngle;
    }
  });

  // Ground mist drift
  if (mistParticles) {
    const mp = mistParticles.geometry.attributes.position.array;
    for (let i = 0; i < mp.length; i += 3) {
      mp[i] += Math.sin(t * 0.1 + i) * 0.005;
      mp[i + 1] = Math.sin(t * 0.3 + i * 0.1) * 0.5 + 0.5;
    }
    mistParticles.geometry.attributes.position.needsUpdate = true;
    mistParticles.material.opacity = 0.1 + Math.sin(t * 0.2) * 0.05;
  }

  renderer.render(scene, camera);
}

// ---- SCROLL REVEAL ----
function setupReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal, .timeline-item').forEach(el => obs.observe(el));
}

function setupMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (toggle) toggle.checked = false;
      const target = document.querySelector(link.getAttribute('href'));
      if (!target) return;
      isExploring = false;
      const start = window.scrollY;
      const end = target.offsetTop - 70;
      const distance = end - start;
      const duration = 1000;
      let startTime = null;
      function ease(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      }
      function step(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        window.scrollTo(0, start + distance * ease(progress));
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  init();
  setupReveal();
  setupMobileNav();
  const form = document.getElementById('contactForm');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    alert('Thank you for your message! I will get back to you soon.');
    form.reset();
  });
});
