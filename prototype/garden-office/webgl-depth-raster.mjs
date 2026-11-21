const vertexSource = `#version 300 es
layout(location=0) in vec3 point;
layout(location=1) in vec4 nearColor;
layout(location=2) in vec3 farColor;
layout(location=3) in float fraction;
uniform vec4 bounds;
out vec4 nearFill;
out vec3 farFill;
out float gradient;
out float sceneDepth;
void main() {
  vec2 screen = point.xy / bounds.xy * 2.0 - 1.0;
  float z = (point.z - bounds.z) / bounds.w;
  gl_Position = vec4(screen.x, -screen.y, z * 2.0 - 1.0, 1.0);
  nearFill = nearColor;
  farFill = farColor;
  gradient = fraction;
  sceneDepth = point.z;
}`;

const fragmentSource = `#version 300 es
precision highp float;
precision highp int;
in vec4 nearFill;
in vec3 farFill;
in float gradient;
in float sceneDepth;
layout(location=0) out vec4 color;
layout(location=1) out uvec4 packedDepth;
void main() {
  color = vec4(mix(nearFill.rgb, farFill, clamp(gradient, 0.0, 1.0)), nearFill.a);
  uint depth = floatBitsToUint(sceneDepth);
  packedDepth = (uvec4(depth) >> uvec4(0, 8, 16, 24)) & 255u;
}`;

function programFor(gl) {
  const program = gl.createProgram();
  for (const [type, source] of [[gl.VERTEX_SHADER, vertexSource], [gl.FRAGMENT_SHADER, fragmentSource]]) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null;
    gl.attachShader(program, shader);
    gl.deleteShader(shader);
  }
  gl.linkProgram(program);
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
}

function cross(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
}

function triangles(points) {
  const remaining = points.slice();
  const result = [];
  const area = points.reduce((sum, point, index) => sum + cross(points[0], point,
    points[(index + 1) % points.length]), 0);
  if (Math.abs(area) < 1e-9) return result;
  const sign = Math.sign(area);
  while (remaining.length > 3) {
    const ear = remaining.findIndex((b, i) => {
      const a = remaining[(i + remaining.length - 1) % remaining.length];
      const c = remaining[(i + 1) % remaining.length];
      return cross(a, b, c) * sign > 0 && !remaining.some(point =>
        point !== a && point !== b && point !== c && cross(a, b, point) * sign >= 0 &&
        cross(b, c, point) * sign >= 0 && cross(c, a, point) * sign >= 0);
    });
    if (ear < 0) return null;
    result.push(remaining[(ear + remaining.length - 1) % remaining.length], remaining[ear],
      remaining[(ear + 1) % remaining.length]);
    remaining.splice(ear, 1);
  }
  return result.concat(remaining);
}

export function createWebGlDepthRaster(context, onContextLost) {
  const canvas = context.canvas.ownerDocument.createElement('canvas');
  const gl = canvas.getContext('webgl2', {antialias: false, powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: true, preserveDrawingBuffer: true});
  if (!gl) return null;
  const program = programFor(gl);
  if (!program) return null;
  canvas.addEventListener('webglcontextlost', () => onContextLost?.());
  const framebuffer = gl.createFramebuffer();
  const attachments = [gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.DEPTH_ATTACHMENT];
  const formats = [gl.RGBA8, gl.RGBA8UI, gl.DEPTH_COMPONENT24];
  const targets = attachments.map(() => gl.createRenderbuffer());
  const buffer = gl.createBuffer();
  const bounds = gl.getUniformLocation(program, 'bounds');
  const opaque = [];
  const translucent = [];
  let width, height, pixels, depthView, unsupported, min, max;

  function begin(nextWidth, nextHeight) {
    width = nextWidth;
    height = nextHeight;
    opaque.length = translucent.length = 0;
    min = Infinity;
    max = -Infinity;
    unsupported = false;
  }

  function polygon(points, fill) {
    if (points.length < 3 || unsupported) return;
    let near, far;
    const solid = typeof fill === 'string';
    if (solid && /^#[\da-f]{6}([\da-f]{2})?$/i.test(fill)) {
      near = (fill.slice(1).padEnd(8, 'f').match(/../g)).map(hex => parseInt(hex, 16));
      far = near;
    } else if (fill?.near?.length === 4 && fill?.far?.length === 4 && fill.near[3] === 255 &&
      fill.far[3] === 255 && [fill.x, fill.y, fill.dx, fill.dy, ...fill.near, ...fill.far].every(Number.isFinite)) {
      ({near, far} = fill);
    } else {
      unsupported = true;
      return;
    }
    const mesh = points.every(point => point.length === 3 && point.every(Number.isFinite)) && triangles(points);
    if (!mesh) {
      unsupported = true;
      return;
    }
    const vertices = [];
    for (const [x, y, z] of mesh) {
      min = Math.min(min, z);
      max = Math.max(max, z);
      const fraction = solid ? 0 : (x - fill.x) * fill.dx + (y - fill.y) * fill.dy;
      vertices.push(x, y, z, ...near.map(channel => channel / 255),
        ...far.slice(0, 3).map(channel => channel / 255), fraction);
    }
    const list = near[3] === 255 ? opaque : translucent;
    list.push({vertices, color: (near[0] << 16) | (near[1] << 8) | near[2]});
  }

  function draw(polygons) {
    const data = new Float32Array(polygons.flatMap(polygon => polygon.vertices));
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STREAM_DRAW);
    gl.drawArrays(gl.TRIANGLES, 0, data.length / 11);
  }

  function present() {
    if (unsupported || gl.isContextLost()) return false;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    if (!pixels || canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      for (let i = 0; i < targets.length; i++) {
        gl.bindRenderbuffer(gl.RENDERBUFFER, targets[i]);
        gl.renderbufferStorage(gl.RENDERBUFFER, formats[i], width, height);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachments[i], gl.RENDERBUFFER, targets[i]);
      }
      pixels = new Uint8Array(width * height * 4);
      depthView = new DataView(pixels.buffer);
    }
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) return false;
    gl.viewport(0, 0, width, height);
    gl.clearBufferfv(gl.COLOR, 0, [0, 0, 0, 0]);
    gl.clearBufferuiv(gl.COLOR, 1, [0, 0, 128, 255]); // Float32 negative infinity.
    gl.clearBufferfv(gl.DEPTH, 0, [0]);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.GEQUAL);
    gl.disable(gl.DITHER);
    gl.useProgram(program);
    gl.uniform4f(bounds, width, height, Number.isFinite(min) ? min - 1 : 0,
      Number.isFinite(max) ? max - min + 2 : 2);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    for (const [index, size, offset] of [[0, 3, 0], [1, 4, 12], [2, 3, 28], [3, 1, 40]]) {
      gl.enableVertexAttribArray(index);
      gl.vertexAttribPointer(index, size, gl.FLOAT, false, 44, offset);
    }
    draw(opaque.sort((a, b) => b.color - a.color));
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.NONE]);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(0, 2);
    draw(translucent);
    gl.disable(gl.POLYGON_OFFSET_FILL);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    gl.readBuffer(gl.COLOR_ATTACHMENT1);
    gl.readPixels(0, 0, width, height, gl.RGBA_INTEGER, gl.UNSIGNED_BYTE, pixels);
    gl.readBuffer(gl.COLOR_ATTACHMENT0);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    if (gl.getError() !== gl.NO_ERROR || gl.isContextLost()) return false;
    context.drawImage(canvas, 0, 0);
    return true;
  }

  return {begin, polygon, present, depthAt(x, y) {
    const column = Math.floor(x);
    const row = Math.floor(y);
    if (!pixels || column < 0 || column >= width || row < 0 || row >= height) return -Infinity;
    const index = (height - 1 - row) * width + column;
    return depthView.getFloat32(index * 4, true);
  }};
}
