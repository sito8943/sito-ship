export const thrusterVertexShader = /* glsl */ `
attribute vec3 aSeed;
attribute float aSpawnPhase;
attribute float aLifetime;
attribute float aEmitterIndex;

uniform float uTime;
uniform vec3 uExhaustLocal[MAX_EXHAUSTS];
uniform int uExhaustCount;
uniform float uExhaustSpeed;
uniform float uJitter;
uniform float uSpawnSpread;
uniform float uSize;
uniform float uPixelRatio;

varying float vLife;

void main() {
  if (uExhaustCount <= 0) {
    vLife = 1.0;
    gl_PointSize = 0.0;
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    return;
  }

  float life = fract(uTime / aLifetime + aSpawnPhase);
  int idx = int(mod(aEmitterIndex, float(uExhaustCount)));
  vec3 origin = uExhaustLocal[idx];

  vec3 spread = (aSeed - 0.5) * uSpawnSpread;
  vec3 jitter = (fract(aSeed * 43.13 + aSeed.yzx * 17.7) - 0.5) * uJitter;
  vec3 dir = vec3(0.0, 0.0, 1.0);
  vec3 velocity = dir * uExhaustSpeed + jitter;

  vec3 local = origin + spread + velocity * (life * aLifetime);

  vec4 mvPosition = modelViewMatrix * vec4(local, 1.0);

  float grow = smoothstep(0.0, 0.18, life);
  float shrink = 1.0 - smoothstep(0.35, 1.0, life);
  float scale = mix(0.35, 1.75, grow) * mix(0.25, 1.0, shrink);
  scale *= 1.0 + 0.10 * sin(uTime * 22.0 + origin.x * 7.3 + origin.z * 4.1);

  vLife = life;
  gl_PointSize = uSize * scale * uPixelRatio * (320.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`

export const thrusterFragmentShader = /* glsl */ `
precision highp float;
uniform vec3 uCoreColor;
uniform vec3 uMidColor;
uniform vec3 uTailColor;
varying float vLife;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  float edge = smoothstep(0.5, 0.05, d);
  float core = smoothstep(0.32, 0.0, d);

  vec3 col = vLife < 0.5
    ? mix(uCoreColor, uMidColor, vLife * 2.0)
    : mix(uMidColor, uTailColor, (vLife - 0.5) * 2.0);

  col += core * uCoreColor * 0.9;

  float alpha = edge * (1.0 - vLife);
  alpha *= 0.55 + 0.45 * core;

  gl_FragColor = vec4(col, alpha);
}
`
