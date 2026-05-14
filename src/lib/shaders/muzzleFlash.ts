export const muzzleFlashVertexShader = /* glsl */ `
attribute float aLife;
uniform float uSize;
uniform float uPixelRatio;
varying float vLife;

void main() {
  vLife = clamp(aLife, 0.0, 1.0);

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float scale = mix(2.6, 0.5, vLife);
  gl_PointSize = uSize * scale * uPixelRatio * (320.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`

export const muzzleFlashFragmentShader = /* glsl */ `
precision highp float;

uniform vec3 uCoreColor;
uniform vec3 uEdgeColor;

varying float vLife;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  float core = smoothstep(0.35, 0.0, d);
  float ringFade = smoothstep(0.5, 0.0, d);

  float ax = smoothstep(0.5, 0.0, abs(uv.y) * 16.0);
  float ay = smoothstep(0.5, 0.0, abs(uv.x) * 16.0);
  float rays = (ax + ay) * ringFade;

  vec3 col = mix(uEdgeColor, uCoreColor, core);
  col += uCoreColor * (core * 1.2 + rays * 0.9);

  float alpha = (core + rays * 0.65) * (1.0 - vLife);
  alpha *= alpha;

  gl_FragColor = vec4(col, alpha);
}
`
