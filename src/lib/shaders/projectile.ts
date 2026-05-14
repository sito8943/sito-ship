export const projectileVertexShader = /* glsl */ `
varying vec3 vLocal;

void main() {
  vLocal = position;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
}
`

export const projectileFragmentShader = /* glsl */ `
precision highp float;

uniform float uTime;
uniform vec3 uCoreColor;
uniform vec3 uEdgeColor;
uniform float uSize;

varying vec3 vLocal;

void main() {
  float halfWidth = uSize * 0.22;
  float totalLength = uSize * 3.7;

  float vL = (vLocal.z + uSize * 3.2) / totalLength;
  vL = clamp(vL, 0.0, 1.0);

  float lateral = abs(vLocal.x) / max(halfWidth, 0.0001);
  lateral = clamp(lateral, 0.0, 1.0);

  float core = 1.0 - smoothstep(0.0, 0.65, lateral);
  float head = 1.0 - smoothstep(0.0, 0.45, vL);
  float energy = sin(vL * 28.0 - uTime * 36.0) * 0.5 + 0.5;
  float pulse = 0.75 + 0.25 * energy;

  vec3 col = mix(uEdgeColor, uCoreColor, core);
  col += uCoreColor * core * (0.7 + head * 0.8) * pulse;

  float alpha = (0.30 + 0.70 * core) * (1.0 - smoothstep(0.82, 1.0, vL));
  alpha *= 0.85 + 0.15 * energy;

  gl_FragColor = vec4(col, alpha);
}
`
