export const starFieldVertexShader = /* glsl */ `
attribute vec3 aSeed;

uniform float uTime;
uniform float uTravelSpeed;
uniform float uLateralOffset;
uniform float uCameraZ;
uniform float uZPeriod;
uniform float uZBaseOffset;
uniform float uZSpawnRange;
uniform float uMinRadius;
uniform float uMaxRadius;
uniform float uVerticalSquash;
uniform float uSize;
uniform float uPixelRatio;
uniform float uFadeNear;
uniform float uFadeFar;

varying float vFade;

void main() {
  float angle = aSeed.x * 6.2831853;
  float radius = mix(uMinRadius, uMaxRadius, aSeed.y);

  float spawnExtra = fract(aSeed.z * 73.31 + aSeed.x * 19.7);
  float perStarBase = uZBaseOffset + spawnExtra * uZSpawnRange;

  float zOff = mod(aSeed.z * uZPeriod + uTime * uTravelSpeed, uZPeriod);
  float z = uCameraZ + perStarBase + zOff;

  float x = cos(angle) * radius + uLateralOffset;
  float y = sin(angle) * radius * uVerticalSquash;

  vec4 mvPosition = modelViewMatrix * vec4(x, y, z, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  float depth = -mvPosition.z;
  float pointSize = uSize * uPixelRatio * (320.0 / max(depth, 0.001));
  gl_PointSize = max(pointSize, 1.5 * uPixelRatio);

  vFade = 1.0 - smoothstep(uFadeNear, uFadeFar, depth);
}
`

export const starFieldFragmentShader = /* glsl */ `
precision highp float;

uniform vec3 uColor;
uniform float uOpacity;

varying float vFade;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float fall = smoothstep(0.5, 0.0, d);
  gl_FragColor = vec4(uColor, fall * uOpacity * vFade);
}
`
