/**
  * @author Lianna Eeftinck / https://github.com/Leeft
  */

SCMAP.Renderer = function ( map ) {
   this.map = map;

   this.composer = null;
   this.FXAA = null;
   this.camera = null;

   this.textureManager = new SCMAP.TextureManager();
   
   this.width = window.innerWidth;
   this.height = window.innerHeight;

   this.resize  = this._resize.bind( this );
   this.animate = this._animate.bind( this );
   this.render  = this._render.bind( this );

   this.dpr = 1;
   if ( window.devicePixelRatio !== undefined ) {
      this.dpr = window.devicePixelRatio;
   }

   var container = $('#sc-map-webgl-container')[0];

   this.camera = new THREE.PerspectiveCamera( 45, this.width / this.height, 10, 1600 );
   this.camera.position.copy( SCMAP.settings.camera.camera );
   this.camera.setViewOffset( this.width, this.height, -( $('#sc-map-interface .sc-map-ui-padding').width() / 2 ), 0, this.width, this.height );

   this.controls = new SCMAP.OrbitControls( this, container );
   this.controls.target.copy( SCMAP.settings.camera.target );
   this.controls.rotateSpeed = $('#sc-map-configuration').data('rotateSpeed');
   this.controls.zoomSpeed = $('#sc-map-configuration').data('zoomSpeed');
   this.controls.panSpeed = $('#sc-map-configuration').data('panSpeed');
   this.controls.noRotate = SCMAP.settings.control.rotationLocked;

   this.threeRenderer = new THREE.WebGLRenderer( { antialias: true } );
   if ( ! SCMAP.settings.effect.Antialias ) {
      this.threeRenderer.autoClear = false;
   }
   this.threeRenderer.setClearColor( 0x000000, 1 );
   this.threeRenderer.setSize( this.width, this.height );

   container.appendChild( this.threeRenderer.domElement );

   var renderer = this;

   // Stats

   this.stats = new Stats();
   this.stats.domElement.style.position = 'absolute';
   this.stats.domElement.style.top = '0px';
   this.stats.domElement.style.right = '0px';
   this.stats.domElement.style.display = 'none';
   this.stats.domElement.style.zIndex = '100';
   container.appendChild( this.stats.domElement );
   if ( SCMAP.settings.renderer.Stats ) {
      $('#stats').show();
   }

   if ( hasLocalStorage() ) {
      storage = window.localStorage;
   }

   // Event handlers

   window.addEventListener( 'resize', this.resize, false );
   document.addEventListener( 'change', this.render, false );

   if ( ! SCMAP.settings.effect.Antialias )
   {
      var renderModel = new THREE.RenderPass( this.map.scene, this.camera );

      this.FXAA = new THREE.ShaderPass( THREE.FXAAShader );
      this.FXAA.uniforms.resolution.value.set( 1 / (this.width * this.dpr), 1 / (this.height * this.dpr) );
      this.FXAA.enabled = SCMAP.settings.effect.FXAA;

      var effectBloom = new THREE.BloomPass( 0.6 );
      effectBloom.enabled = SCMAP.settings.effect.Bloom;

      var effectCopy = new THREE.ShaderPass( THREE.CopyShader );
      effectCopy.renderToScreen = true;

      this.composer = new THREE.EffectComposer( this.threeRenderer );
      this.composer.setSize( this.width * this.dpr, this.height * this.dpr );
      this.composer.addPass( renderModel );
      this.composer.addPass( this.FXAA );
      this.composer.addPass( effectBloom );
      this.composer.addPass( effectCopy );
   }

   this.animate();
};

SCMAP.Renderer.prototype = {
   constructor: SCMAP.Renderer,

   cameraRotationMatrix: function cameraRotationMatrix() {
      var euler = new THREE.Euler( this.camera.userData.phi + Math.PI / 2, this.camera.userData.theta, 0, 'YXZ' );
      return new THREE.Matrix4().makeRotationFromEuler( euler );
   },

   _resize: function _resize() {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.camera.aspect = this.width / this.height;
      this.camera.setViewOffset( this.width, this.height, -( $('#sc-map-interface .sc-map-ui-padding').width() / 2 ), 0, this.width, this.height );
      this.camera.updateProjectionMatrix();

      if ( this.FXAA ) {
         this.FXAA.uniforms.resolution.value.set( 1 / (this.width * this.dpr), 1 / (this.height * this.dpr) );
      }

      this.threeRenderer.setSize( this.width, this.height );
      if ( this.composer ) {
         this.composer.reset();
      }

      window.ui.updateHeight();
   },

   _animate: function _animate() {
      requestAnimationFrame( this.animate );
      TWEEN.update();
      this.controls.update();
      //if ( editor !== undefined ) {
      //   editor.update();
      //}
      this.map.animate();
      this.stats.update();
      this.render();
   },

   _render: function _render() {
      if ( this.composer ) {
         this.threeRenderer.clear();
         this.composer.render();
      } else {
         this.threeRenderer.render( this.map.scene, this.camera );
      }
   }
};

function buildGalaxy() {

    /*
     * Generate a procedural Galaxy (https://github.com/robertkleffner/html5-galaxy)
     * Code updated for THREE r68
     */
    var outerRing = new THREE.Geometry();
    var outerClouds = new THREE.Geometry();
    var innerRing = new THREE.Geometry();
    var innerClouds = new THREE.Geometry();
    var outerStars = new THREE.Geometry();
    var starMaterial = new THREE.PointCloudMaterial({
        size: 20,
        map: THREE.ImageUtils.loadTexture(
            "images/galactic_stars.png"
        ),
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        transparent: true,
        depthTest: false
    });
    starMaterial.color.setHSL(1.0, 0.0, 1.0);
    var cloudMaterial = new THREE.PointCloudMaterial({
        size: 300,
        map: THREE.ImageUtils.loadTexture(
            "images/galactic_clouds.png"
        ),
        blending: THREE.AdditiveBlending,
        vertexColors: true,
        transparent: true,
        depthTest: false
    });
    // Creating individual particles
    var color = [];
    for (var p = 0; p < 1800; p++) {
        var angle = Math.random() * Math.PI * 2;
        var radius = Math.random() * 200 + 400;
        var pX = Math.cos(angle) * radius,
            pY = Math.random() * 70 - 35,
            pZ = Math.sin(angle) * radius,
            skparticle = new THREE.Vector3(pX, pY, pZ);
        outerRing.vertices.push(skparticle);

        var h = Math.random() * (291 - 185) + 185,
            s = Math.random() * (66 - 34) + 34,
            v = Math.random() * (100 - 72) + 72;
        color[p] = new THREE.Color(0xffffff);
        color[p].setHSL(h / 360, s / 100, v / 100);
    }
    outerRing.colors = color;

    color = [];
    for (var sk1 = 0; sk1 < 5000; sk1++) {
        var angle1 = Math.random() * Math.PI * 2;
        var radius1 = Math.random() * 350 + 1;
        var pX1 = Math.cos(angle1) * radius1,
            pY1 = Math.random() * 200 * (1 / radius1) * (Math.random() > 0.5 ? 1 : -1),
            pZ1 = Math.sin(angle1) * radius1,
            skparticle1 = new THREE.Vector3(pX1, pY1, pZ1);
        innerRing.vertices.push(skparticle1);

        var h1 = Math.random() * (291 - 185) + 185,
            s1 = Math.random() * (66 - 34) + 34,
            v1 = Math.random() * (100 - 72) + 72;
        color[sk1] = new THREE.Color(0xffffff);
        color[sk1].setHSL(h1 / 360, s1 / 100, v1 / 100);
    }
    innerRing.colors = color;

    color = [];
    for (var sk2 = 0; sk2 < 200; sk2++) {
        var angle2 = Math.random() * Math.PI * 2;
        var radius2 = Math.random() * 350 + 1;
        var pX2 = Math.cos(angle2) * radius2,
            pY2 = Math.random() * 200 * (1 / radius2) * (Math.random() > 0.5 ? 1 : -1),
            pZ2 = Math.sin(angle2) * radius2,
            skparticle2 = new THREE.Vector3(pX2, pY2, pZ2);
        innerClouds.vertices.push(skparticle2);

        var h2 = Math.random() * (291 - 185) + 185,
            s2 = Math.random() * (66 - 34) + 34,
            v2 = Math.random() * (100 - 72) + 72;
        color[sk2] = new THREE.Color(0xffffff);
        color[sk2].setHSL(h2 / 360, s2 / 100, v2 / 100);
    }
    innerClouds.colors = color;

    color = [];
    for (var sk3 = 0; sk3 < 200; sk3++) {
        var angle3 = Math.random() * Math.PI * 2;
        var radius3 = Math.random() * 200 + 400;
        var pX3 = Math.cos(angle3) * radius3,
            pY3 = Math.random() * 70 - 35,
            pZ3 = Math.sin(angle3) * radius3,
            skparticle3 = new THREE.Vector3(pX3, pY3, pZ3);
        outerClouds.vertices.push(skparticle3);

        var h3 = Math.random() * (291 - 185) + 185,
            s3 = Math.random() * (66 - 34) + 34,
            v3 = Math.random() * (100 - 72) + 72;
        color[sk3] = new THREE.Color(0xffffff);
        color[sk3].setHSL(h3 / 360, s3 / 100, v3 / 100);
    }
    outerClouds.colors = color;

    color = [];
    for (var sk4 = 0; sk4 < 1000; sk4++) {

        var radius5 = Math.random() * 1000 + 1000;
        var z = Math.random() * (2 * radius5) - radius5;
        var phi = Math.random() * Math.PI * 2;
        var theta = Math.asin(z / radius5);

        var pX5 = Math.cos(theta) * Math.cos(phi) * radius5,
            pY5 = Math.cos(theta) * Math.sin(phi) * radius5,
            pZ5 = z,
            skparticle4 = new THREE.Vector3(pX5, pY5, pZ5);
        outerStars.vertices.push(skparticle4);

        color[sk4] = new THREE.Color(0xffffff);
    }
    outerStars.colors = color;

    var outerSystem = new THREE.PointCloud(outerRing, starMaterial);
    var innerSystem = new THREE.PointCloud(innerRing, starMaterial);
    var cloudSystem = new THREE.PointCloud(innerClouds, cloudMaterial);
    var cloudSystem2 = new THREE.PointCloud(outerClouds, cloudMaterial);
    var starSystem = new THREE.PointCloud(outerStars, starMaterial);

    scene.add(outerSystem);
    scene.add(innerSystem);
    scene.add(cloudSystem);
    scene.add(cloudSystem2);
    scene.add(starSystem);
}

function smokeTest () {
   var smokeParticles = new THREE.Geometry();
   for (i = 0; i < 25; i++) {
       var particle = new THREE.Vector3( Math.random() * 8, Math.random() * 10 + 5, Math.random() * 8 );
       smokeParticles.vertices.push( particle );
   }
   var smokeTexture = THREE.ImageUtils.loadTexture('images/smoke.png');
   var smokeMaterial = new THREE.ParticleBasicMaterial({
      map: smokeTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      size: 25,
      color: 0x111111
   });
   
   var smoke = new THREE.ParticleSystem(smokeParticles, smokeMaterial);
   smoke.sortParticles = true;
   smoke.position.x = 10;
   
   scene.add(smoke);
}

function buildCross () {
   var material = new THREE.MeshBasicMaterial( { wireframe: true, color: 0xFF0000, linewidth: 1 } );
   var group = new THREE.Object3D();
   var geo = new THREE.Geometry();
   geo.vertices.push( new THREE.Vector3( -50, 1, 0 ) );
   geo.vertices.push( new THREE.Vector3( 50, 1, 0 ) );
   var cross = new THREE.Line( geo, material );
   group.add( cross );
   geo = new THREE.Geometry();
   var material2 = new THREE.MeshBasicMaterial( { wireframe: true, color: 0xF0F000, linewidth: 1 } );
   geo.vertices.push( new THREE.Vector3( 0, 1, -50 ) );
   geo.vertices.push( new THREE.Vector3( 0, 1, 50 ) );
   cross = new THREE.Line( geo, material2 );
   group.add( cross );
   var material3 = new THREE.MeshBasicMaterial( { wireframe: true, color: 0x0000F0, linewidth: 1 } );
   geo = new THREE.Geometry();
   geo.vertices.push( new THREE.Vector3( 0, -50, 0 ) );
   geo.vertices.push( new THREE.Vector3( 0, 50, 0 ) );
   cross = new THREE.Line( geo, material3 );
   group.add( cross );
   return group;
}

//

// End of file
