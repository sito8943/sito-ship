export const thrusterVertexShader = /* glsl */ `
attribute float aLife;
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
varying float vLife;

void main() {
  vLife = clamp(aLife, 0.0, 1.0);

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);

  float grow = smoothstep(0.0, 0.18, vLife);
  float shrink = 1.0 - smoothstep(0.35, 1.0, vLife);
  float scale = mix(0.35, 1.75, grow) * mix(0.25, 1.0, shrink);
  scale *= 1.0 + 0.10 * sin(uTime * 22.0 + position.x * 7.3 + position.z * 4.1);

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
