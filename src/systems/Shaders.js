// Optional WebGL shader effects (toggle with V, or in the menu / pause screen).
//   - CRT post-process on the game camera: scanlines, a little colour
//     fringing, vignette and a faint flicker.
//   - Glow on special things: runes, the bonus portal, bosses.
// Everything quietly does nothing if the browser falls back to Canvas.

const CRT_FRAG = `
#define SHADER_NAME AG1_CRT
precision mediump float;
uniform sampler2D uMainSampler;
uniform vec2 uResolution;
uniform float uTime;
varying vec2 outTexCoord;

void main() {
  vec2 uv = outTexCoord;
  vec2 px = 1.0 / uResolution;
  vec4 base = texture2D(uMainSampler, uv);
  float r = texture2D(uMainSampler, uv + vec2(px.x * 0.7, 0.0)).r;
  float b = texture2D(uMainSampler, uv - vec2(px.x * 0.7, 0.0)).b;
  vec3 col = vec3(r, base.g, b);

  // Every other pixel row is slightly darker.
  col *= 0.93 + 0.07 * sin(uv.y * uResolution.y * 3.14159);

  vec2 d = uv - 0.5;
  float vig = smoothstep(0.82, 0.3, length(d * vec2(1.05, 1.0)));
  col *= mix(0.68, 1.0, vig);
  col *= 1.0 + 0.015 * sin(uTime * 9.0);
  gl_FragColor = vec4(col, base.a);
}
`;

class CRTPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game) {
    super({ game, name: 'CRT', fragShader: CRT_FRAG });
  }

  onPreRender() {
    this.set1f('uTime', this.game.loop.time / 1000);
    this.set2f('uResolution', this.renderer.width, this.renderer.height);
  }
}

const Shaders = {
  supported(game) {
    return !!game.renderer && game.renderer.type === Phaser.WEBGL;
  },

  enabled(game) {
    return this.supported(game) && Profile.get().shaders;
  },

  register(game) {
    if (this.supported(game)) game.renderer.pipelines.addPostPipeline('CRT', CRTPipeline);
  },

  toggle() {
    const p = Profile.get();
    p.shaders = !p.shaders;
    Profile.save();
    return p.shaders;
  },

  // Turn the CRT effect on or off for a scene's main camera.
  apply(scene) {
    if (!this.supported(scene.game)) return;
    const cam = scene.cameras.main;
    cam.resetPostPipeline();
    if (Profile.get().shaders) cam.setPostPipeline(CRTPipeline);
  },

  glow(obj, color, strength = 3) {
    if (!this.enabled(obj.scene.game) || !obj.preFX) return;
    obj.preFX.setPadding(4);
    obj.preFX.addGlow(color, strength, 0, false, 0.1, 10);
  },

  label() {
    return 'SHADERS: ' + (Profile.get().shaders ? 'ON' : 'OFF');
  },
};
