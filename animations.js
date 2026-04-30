/**
 * animations.js — WebGL + GSAP + Interactive Animations
 * Jithu J George Portfolio
 *
 * Modules
 *  1. WebGL Hero    — Three.js particle field (GLSL shaders)
 *  2. Custom Cursor — dot + lagged ring, hover / click states
 *  3. GSAP Scroll   — hero parallax, smooth anchor navigation
 *  4. 3D Card Tilt  — perspective tilt + gloss spotlight on hover
 *  5. Magnetic CTA  — primary buttons pulled toward the cursor
 *  6. Stat Counters — numbers count up on scroll into view
 *  7. Name Fly      — hero letters break apart & orbit the cursor
 */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════════════════
     0.  ENVIRONMENT DETECTION
  ═══════════════════════════════════════════════════════════════ */
  var IS_MOBILE = window.innerWidth < 768;
  var IS_TOUCH  = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  var REDUCED   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (REDUCED) {
    var nb = document.getElementById('navbar');
    if (nb) nb.style.opacity = '1';
    return;
  }


  /* ═══════════════════════════════════════════════════════════════
     1.  WebGL HERO — Three.js Particle Field
  ═══════════════════════════════════════════════════════════════ */
  function initHeroWebGL() {
    if (typeof THREE === 'undefined') return;
    var hero = document.getElementById('hero');
    if (!hero) return;

    var canvas = document.createElement('canvas');
    canvas.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;' +
      'pointer-events:none;z-index:0;display:block;';
    hero.insertBefore(canvas, hero.firstChild);

    var renderer = new THREE.WebGLRenderer({
      canvas: canvas, alpha: true, antialias: false,
      powerPreference: IS_MOBILE ? 'low-power' : 'high-performance',
    });
    renderer.setPixelRatio(IS_MOBILE ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    var scene  = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(55, 1, 0.1, 200);
    camera.position.set(0, 0, IS_MOBILE ? 8 : 5.2);

    function onResize() {
      var w = hero.offsetWidth, h = hero.offsetHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    onResize();
    window.addEventListener('resize', onResize, { passive: true });

    var COUNT = IS_MOBILE ? 150 : 1600;
    var pos   = new Float32Array(COUNT * 3);
    var sc    = new Float32Array(COUNT);
    var ph    = new Float32Array(COUNT);

    for (var i = 0; i < COUNT; i++) {
      var r = Math.pow(Math.random(), 0.38) * 3.8 + 0.15;
      var theta = Math.random() * Math.PI * 2;
      var phi   = Math.acos(2 * Math.random() - 1);
      pos[i*3]   =  r * Math.sin(phi) * Math.cos(theta);
      pos[i*3+1] =  r * Math.sin(phi) * Math.sin(theta) * 0.52;
      pos[i*3+2] =  r * Math.cos(phi) - 0.9;
      sc[i] = 0.45 + Math.random() * 2.6;
      ph[i] = Math.random() * Math.PI * 2;
    }

    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aScale',   new THREE.BufferAttribute(sc,  1));
    geo.setAttribute('aPhase',   new THREE.BufferAttribute(ph,  1));

    var POINT_MUL = IS_MOBILE ? 120.0 : 180.0;
    var uniforms = { uTime:{value:0}, uMouseX:{value:0}, uMouseY:{value:0} };
    var mat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader:[
        'attribute float aScale;attribute float aPhase;',
        'uniform float uTime,uMouseX,uMouseY;',
        'void main(){vec3 p=position;float t=uTime*0.058;',
        'p.x+=sin(t+p.y*1.5+aPhase)*0.075;',
        'p.y+=cos(t+p.x*1.3+aPhase)*0.060;',
        'p.z+=sin(t*0.9+aPhase*1.6)*0.040;',
        'float d=clamp(1.7-abs(p.z)*0.22,0.2,1.7);',
        'p.x+=uMouseX*0.22*d;p.y+=uMouseY*0.22*d;',
        'vec4 mv=modelViewMatrix*vec4(p,1.0);',
        'gl_PointSize=aScale*(' + POINT_MUL.toFixed(1) + '/-mv.z);gl_Position=projectionMatrix*mv;}',
      ].join(''),
      fragmentShader:[
        'void main(){float d=length(gl_PointCoord-vec2(0.5));if(d>0.5)discard;',
        'float a=1.0-smoothstep(0.08,0.50,d);',
        'gl_FragColor=vec4(0.639,0.820,0.710,a*0.18);}',
      ].join(''),
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    });

    var points = new THREE.Points(geo, mat);
    scene.add(points);

    var mouse = { x:0, y:0, tx:0, ty:0 };
    window.addEventListener('mousemove', function(e) {
      mouse.tx =  (e.clientX/window.innerWidth  - 0.5)*2;
      mouse.ty = -(e.clientY/window.innerHeight - 0.5)*2;
    }, { passive:true });

    var running = true;
    new IntersectionObserver(function(en){ running = en[0].isIntersecting; },{ threshold:0 })
      .observe(hero);

    var clk = 0;
    (function loop(){
      requestAnimationFrame(loop);
      if (!running) return;
      clk += 0.016;
      mouse.x += (mouse.tx - mouse.x)*0.038;
      mouse.y += (mouse.ty - mouse.y)*0.038;
      uniforms.uTime.value   = clk;
      uniforms.uMouseX.value = mouse.x;
      uniforms.uMouseY.value = mouse.y;
      points.rotation.y = clk*0.020;
      points.rotation.x = Math.sin(clk*0.007)*0.095;
      renderer.render(scene, camera);
    }());
  }


  /* ═══════════════════════════════════════════════════════════════
     2.  CUSTOM CURSOR
  ═══════════════════════════════════════════════════════════════ */
  function initCursor() {
    var dot  = document.createElement('div'); dot.id  = 'c-dot';
    var ring = document.createElement('div'); ring.id = 'c-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.documentElement.classList.add('has-custom-cursor');

    var mx=-300, my=-300, rx=-300, ry=-300, dotH=3, ringH=16, vis=false;

    document.addEventListener('mousemove', function(e){
      mx=e.clientX; my=e.clientY;
      if(!vis){ vis=true; dot.style.opacity=ring.style.opacity='1'; }
    },{passive:true});
    document.addEventListener('mouseleave', function(){
      vis=false; dot.style.opacity=ring.style.opacity='0';
    });

    var HSEL='a,button,[role="button"],.project-card,.skill-tag,.edu-card,.name-char';
    document.addEventListener('mouseover',function(e){
      if(e.target.closest(HSEL)&&(!e.relatedTarget||!e.relatedTarget.closest(HSEL))){
        dot.classList.add('c-hover'); ring.classList.add('c-hover'); dotH=2; ringH=24;
      }
    },{passive:true});
    document.addEventListener('mouseout',function(e){
      if(e.target.closest(HSEL)&&(!e.relatedTarget||!e.relatedTarget.closest(HSEL))){
        dot.classList.remove('c-hover'); ring.classList.remove('c-hover'); dotH=3; ringH=16;
      }
    },{passive:true});
    document.addEventListener('mousedown',function(){ ring.classList.add('c-click'); });
    document.addEventListener('mouseup',  function(){ ring.classList.remove('c-click'); });

    (function tick(){
      requestAnimationFrame(tick);
      dot.style.transform  = 'translate('+(mx-dotH)+'px,'+(my-dotH)+'px)';
      rx+=(mx-rx)*0.13; ry+=(my-ry)*0.13;
      ring.style.transform = 'translate('+(rx-ringH)+'px,'+(ry-ringH)+'px)';
    }());
  }


  /* ═══════════════════════════════════════════════════════════════
     3.  GSAP SCROLL + SMOOTH ANCHOR
  ═══════════════════════════════════════════════════════════════ */
  function initGSAP() {
    document.querySelectorAll('a[href^="#"]').forEach(function(link){
      link.addEventListener('click',function(e){
        var href=link.getAttribute('href');
        if(!href||href==='#') return;
        var t=document.querySelector(href);
        if(!t) return;
        e.preventDefault();
        window.scrollTo({top:t.getBoundingClientRect().top+window.scrollY-100, behavior:'smooth'});
      });
    });

    if(typeof gsap==='undefined'||typeof ScrollTrigger==='undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    /* ── Floating navbar entrance ── */
    gsap.fromTo('#navbar',
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.3 }
    );

    var hc = document.querySelector('#hero .max-w-7xl');
    if(hc) gsap.to(hc,{y:IS_MOBILE?-48:-88,ease:'none',
      scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:1.4}});

    document.querySelectorAll('.hero-glow').forEach(function(g,idx){
      gsap.to(g,{y:idx===0?-70:90,ease:'none',
        scrollTrigger:{trigger:'#hero',start:'top top',end:'bottom top',scrub:2.2}});
    });

    var si=document.querySelector('.scroll-indicator');
    if(si) gsap.to(si,{opacity:0,y:-20,ease:'none',
      scrollTrigger:{trigger:'#hero',start:'top top',end:'15% top',scrub:true}});
  }


  /* ═══════════════════════════════════════════════════════════════
     4.  3D CARD TILT + GLOSS
  ═══════════════════════════════════════════════════════════════ */
  function initCardTilt() {
    if (IS_TOUCH) return;
    var MAX=13;
    document.querySelectorAll('.project-card').forEach(function(card){
      var gloss=document.createElement('div'); gloss.className='card-gloss';
      card.appendChild(gloss);
      var tX=0,tY=0,cX=0,cY=0,raf=null,active=false;
      function loop(){
        cX+=(tX-cX)*0.085; cY+=(tY-cY)*0.085;
        card.style.transform='perspective(960px) rotateX('+cY+'deg) rotateY('+cX+'deg) translateY(-7px) scale(1.013)';
        raf=(Math.abs(cX-tX)>0.01||Math.abs(cY-tY)>0.01)?requestAnimationFrame(loop):null;
      }
      card.addEventListener('mouseenter',function(){
        active=true; card.style.transition='box-shadow 0.4s ease'; gloss.style.opacity='1';
        if(!raf) raf=requestAnimationFrame(loop);
      });
      card.addEventListener('mousemove',function(e){
        if(!active) return;
        var r=card.getBoundingClientRect();
        var px=(e.clientX-r.left)/r.width, py=(e.clientY-r.top)/r.height;
        tX=(px-0.5)*MAX*2; tY=-(py-0.5)*MAX*2;
        gloss.style.background='radial-gradient(circle at '+(px*100)+'% '+(py*100)+'%,rgba(163,209,181,0.14) 0%,rgba(163,209,181,0.04) 38%,transparent 68%)';
        if(!raf) raf=requestAnimationFrame(loop);
      });
      card.addEventListener('mouseleave',function(){
        active=false; tX=0; tY=0;
        card.style.transition='transform 0.62s cubic-bezier(0.16,1,0.3,1),box-shadow 0.62s ease';
        card.style.transform=''; gloss.style.opacity='0';
        setTimeout(function(){ if(raf){cancelAnimationFrame(raf);raf=null;} cX=cY=0; },680);
      });
    });
  }


  /* ═══════════════════════════════════════════════════════════════
     5.  MAGNETIC BUTTONS
  ═══════════════════════════════════════════════════════════════ */
  function initMagnetic() {
    if (IS_TOUCH) return;
    document.querySelectorAll('a.bg-primary').forEach(function(btn){
      var pend=false;
      btn.addEventListener('mouseenter',function(){ btn.style.transition='transform 0.38s cubic-bezier(0.16,1,0.3,1)'; });
      btn.addEventListener('mousemove',function(e){
        if(pend) return; pend=true;
        requestAnimationFrame(function(){
          var r=btn.getBoundingClientRect();
          btn.style.transform='translate('+((e.clientX-(r.left+r.width/2))*0.38)+'px,'+((e.clientY-(r.top+r.height/2))*0.38)+'px)';
          pend=false;
        });
      });
      btn.addEventListener('mouseleave',function(){
        btn.style.transition='transform 0.55s cubic-bezier(0.16,1,0.3,1)'; btn.style.transform='';
      });
    });
  }


  /* ═══════════════════════════════════════════════════════════════
     6.  STAT COUNTERS
  ═══════════════════════════════════════════════════════════════ */
  function initCounters() {
    var grid=document.querySelector('#expertise .grid.grid-cols-2');
    if(!grid) return;
    var items=[];
    grid.querySelectorAll('.text-primary.font-headline').forEach(function(el){
      var m=el.textContent.trim().match(/^(\d+)(\+?)$/);
      if(!m) return;
      items.push({el:el,end:+m[1],sfx:m[2]});
      el.textContent='0'+m[2];
    });
    if(!items.length) return;
    new IntersectionObserver(function(en){
      if(!en[0].isIntersecting) return;
      items.forEach(function(it,i){
        setTimeout(function(){
          var t0=performance.now(),dur=1350;
          (function s(n){ var p=Math.min((n-t0)/dur,1);
            it.el.textContent=Math.round((1-Math.pow(1-p,3))*it.end)+it.sfx;
            if(p<1) requestAnimationFrame(s);
          }(performance.now()));
        },i*130);
      });
    },{threshold:0.65}).observe(grid);
  }


  /* ═══════════════════════════════════════════════════════════════
     7.  NAME FLY — Letters break apart & orbit the cursor
     ─────────────────────────────────────────────────────────────
     Each character of "JITHU J / GEORGE" is a separate <span>.
     State machine per letter:

       REST ──(cursor within CAPTURE_R of rest pos)──► ORBIT
               letter swings into circular orbit around cursor;
               angle advances each frame; transforms lerp to target.

       ORBIT ──(cursor leaves RELEASE_R or hero)──────► HOMING
               spring physics pulls letter back to (tx=0, ty=0).
               Spring is underdamped → natural overshoot / juggle.

       HOMING ──(position settled < 0.4 px)──────────► REST

     Visual changes while ORBIT:
       • color  : on-background (#e5e2e1) → primary (#a3d1b5)
       • scale  : 1.0 → 0.88
       • shadow : soft sage-green glow

     Rest positions are cached once the reveal animation finishes
     (1 s timeout) and refreshed on resize.
  ═══════════════════════════════════════════════════════════════ */
  function initNameEffect() {
    var h1 = document.querySelector('#hero h1');
    if (!h1) return;

    /* ── 1. Split h1 into character <span>s ── */
    var charSpans = [];
    var newNodes  = [];

    Array.from(h1.childNodes).forEach(function (node) {
      if (node.nodeType === Node.TEXT_NODE) {
        var text = node.textContent.replace(/^\s+|\s+$/g, '');
        if (!text) return;
        text.split('').forEach(function (ch) {
          var span = document.createElement('span');
          span.className   = 'name-char';
          span.textContent = ch === ' ' ? '\u00A0' : ch;
          charSpans.push(span);
          newNodes.push(span);
        });
      } else if (node.nodeName === 'BR') {
        newNodes.push(document.createElement('br'));
      }
    });

    h1.innerHTML = '';
    newNodes.forEach(function (n) { h1.appendChild(n); });

    if (!charSpans.length) return;

    /* ── 2. State constants ── */
    var S_REST   = 0;
    var S_ORBIT  = 1;
    var S_HOMING = 2;

    /* Physics */
    var SPRING_K  = 0.095; /* spring stiffness  */
    var SPRING_D  = 0.68;  /* damping  <1 = bouncy overshoot */

    /* Interaction distances */
    var CAPTURE_R = IS_MOBILE ? 60 : 90;   /* px — rest→orbit  */
    var RELEASE_R = IS_MOBILE ? 140 : 200; /* px — orbit→home  */

    /* Colour lerp: on-background → primary */
    var C0 = [229, 226, 225]; /* #e5e2e1 */
    var C1 = [163, 209, 181]; /* #a3d1b5 */

    /* ── 3. Per-character state objects ── */
    var chars = charSpans.map(function () {
      return {
        /* Rest position in viewport (recached on resize) */
        restX: 0,
        restY: 0,
        /* Current transform offset from natural position */
        tx: 0, ty: 0,
        /* Velocity for HOMING spring */
        vx: 0, vy: 0,
        /* FSM */
        state: S_REST,
        /* Orbit params — re-randomised on each capture */
        angle:    Math.random() * Math.PI * 2,
        orbitR:   60 + Math.random() * 80,
        orbitSpd: (0.028 + Math.random() * 0.038) * (Math.random() > 0.5 ? 1 : -1),
        /* Visual accumulators */
        scale:  1.0,
        colorT: 0.0,   /* 0 = white, 1 = sage-green */
      };
    });

    /* ── 4. Rest-position caching ── */
    var cachePending = false;

    function cachePositions() {
      if (cachePending) return;
      cachePending = true;

      requestAnimationFrame(function () {
        /* Clear all transforms so getBCR reads natural positions */
        charSpans.forEach(function (sp) {
          sp.style.transform = '';
          sp.style.color     = '';
          sp.style.textShadow = '';
        });

        /* getBoundingClientRect forces a synchronous layout — accurate */
        charSpans.forEach(function (sp, i) {
          var r = sp.getBoundingClientRect();
          chars[i].restX = r.left + window.scrollX + r.width  / 2;
          chars[i].restY = r.top  + window.scrollY + r.height / 2;
          /* Reset to REST */
          chars[i].state  = S_REST;
          chars[i].tx = 0; chars[i].ty = 0;
          chars[i].vx = 0; chars[i].vy = 0;
          chars[i].scale  = 1.0;
          chars[i].colorT = 0.0;
        });

        cachePending = false;
      });
    }

    /* Cache 1 s after load (reveal animation ~0.75 s) */
    setTimeout(cachePositions, 1000);

    /* Re-cache on resize (layout shifts) */
    window.addEventListener('resize', function () {
      setTimeout(cachePositions, 200);
    }, { passive: true });

    /* ── 5. Cursor tracking ── */
    var cursor = { x: -9999, y: -9999, inHero: false };
    var hero   = document.getElementById('hero');

    hero.addEventListener('mousemove', function (e) {
      cursor.x      = e.clientX;
      cursor.y      = e.clientY;
      cursor.inHero = true;
    }, { passive: true });

    hero.addEventListener('mouseleave', function () {
      cursor.inHero = false;
    });

    /* Touch support: treat touchmove as cursor */
    if (IS_TOUCH) {
      hero.addEventListener('touchmove', function (e) {
        var t = e.touches[0];
        cursor.x      = t.clientX;
        cursor.y      = t.clientY;
        cursor.inHero = true;
      }, { passive: true });
      hero.addEventListener('touchend', function () {
        cursor.inHero = false;
      }, { passive: true });
    }

    /* ── 6. Main animation loop ── */
    var heroVisible = true;
    new IntersectionObserver(function(en){ heroVisible = en[0].isIntersecting; },{ threshold:0 })
      .observe(hero);

    (function loop() {
      requestAnimationFrame(loop);

      /* Skip when hero is off-screen or re-caching */
      if (!heroVisible || cachePending) return;

      var cx = cursor.x + window.scrollX;
      var cy = cursor.y + window.scrollY;

      chars.forEach(function (ch, i) {
        var sp = ch.span || charSpans[i]; /* guard */

        /* Vector from char's REST position to cursor */
        var dxR  = cx - ch.restX;
        var dyR  = cy - ch.restY;
        var distR = Math.sqrt(dxR * dxR + dyR * dyR);

        /* ── State transitions ───────────────────────────── */

        /* REST or HOMING → ORBIT when cursor close enough */
        if (ch.state !== S_ORBIT && cursor.inHero && distR < CAPTURE_R) {
          ch.state = S_ORBIT;

          /* Re-randomise orbit so each capture feels fresh */
          ch.orbitR   = 50 + Math.random() * 95;
          ch.orbitSpd = (0.025 + Math.random() * 0.045) * (Math.random() > 0.5 ? 1 : -1);

          /* Start angle pointing away from cursor (letter "deflects" outward) */
          ch.angle = Math.atan2(ch.restY - cy, ch.restX - cx);

          /* Visual flash: briefly scale up then settle */
          ch.scale = 1.30;
        }

        /* ORBIT → HOMING when cursor leaves or exits hero */
        if (ch.state === S_ORBIT && (!cursor.inHero || distR > RELEASE_R)) {
          ch.state = S_HOMING;

          /* Seed velocity from the current orbit tangent for a smooth exit arc */
          var speed = ch.orbitR * Math.abs(ch.orbitSpd);
          ch.vx = -Math.sin(ch.angle) * speed * 0.55;
          ch.vy =  Math.cos(ch.angle) * speed * 0.55;
        }

        /* ── Physics ─────────────────────────────────────── */

        if (ch.state === S_ORBIT) {
          /* Advance orbit angle */
          ch.angle += ch.orbitSpd;

          /* Target transform: orbit position relative to char's rest pos */
          var targetTX = dxR + Math.cos(ch.angle) * ch.orbitR;
          var targetTY = dyR + Math.sin(ch.angle) * ch.orbitR;

          /* Smooth lerp toward orbit target (creates the "pulled-in" arc) */
          ch.tx += (targetTX - ch.tx) * 0.10;
          ch.ty += (targetTY - ch.ty) * 0.10;
        }

        if (ch.state === S_HOMING) {
          /* Underdamped spring toward (0, 0) — the rest transform */
          var ax = (0 - ch.tx) * SPRING_K;
          var ay = (0 - ch.ty) * SPRING_K;
          ch.vx  = (ch.vx + ax) * SPRING_D;
          ch.vy  = (ch.vy + ay) * SPRING_D;
          ch.tx += ch.vx;
          ch.ty += ch.vy;

          /* Settle check */
          if (Math.abs(ch.tx) < 0.35 && Math.abs(ch.ty) < 0.35 &&
              Math.abs(ch.vx) < 0.08  && Math.abs(ch.vy) < 0.08) {
            ch.state = S_REST;
            ch.tx = 0; ch.ty = 0;
            ch.vx = 0; ch.vy = 0;
          }
        }

        /* ── Visual accumulators ──────────────────────────── */

        /* Scale: flash to 1.30 on capture → settle to 0.88 in orbit → return to 1 */
        var scaleTgt = (ch.state === S_ORBIT) ? 0.88 : 1.0;
        ch.scale += (scaleTgt - ch.scale) * 0.09;

        /* Colour lerp: 0 = on-background, 1 = sage-green */
        var colorTgt = (ch.state === S_ORBIT) ? 1.0 : 0.0;
        ch.colorT   += (colorTgt - ch.colorT) * 0.07;

        /* ── Apply to DOM ─────────────────────────────────── */
        sp.style.transform =
          'translate(' + ch.tx.toFixed(2) + 'px,' + ch.ty.toFixed(2) + 'px)' +
          ' scale('    + ch.scale.toFixed(3) + ')';

        var t  = ch.colorT;
        var cr = Math.round(C0[0] + (C1[0] - C0[0]) * t);
        var cg = Math.round(C0[1] + (C1[1] - C0[1]) * t);
        var cb = Math.round(C0[2] + (C1[2] - C0[2]) * t);
        sp.style.color = 'rgb(' + cr + ',' + cg + ',' + cb + ')';

        /* Glow: present only while orbiting */
        sp.style.textShadow = t > 0.05
          ? '0 0 ' + Math.round(t * 28) + 'px rgba(163,209,181,' + (t * 0.6).toFixed(2) + ')'
          : '';
      });
    }());
  }


  /* ═══════════════════════════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', function () {
    initHeroWebGL();
    if (!IS_TOUCH) initCursor();
    initGSAP();
    if (!IS_TOUCH) initCardTilt();
    if (!IS_TOUCH) initMagnetic();
    initCounters();
    if (!IS_MOBILE && !IS_TOUCH) initNameEffect();
  });

}());
