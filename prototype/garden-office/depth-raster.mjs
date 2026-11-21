function rgba(color) {
  const value = Number.parseInt(color.slice(1), 16);
  if (color.length === 9) return [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255];
  return [value >>> 16, (value >>> 8) & 255, value & 255, 255];
}

export function linearDepthFill(x, y, x2, y2, near, far) {
  const dx = x2 - x;
  const dy = y2 - y;
  const squaredLength = dx * dx + dy * dy;
  return {x, y, dx: dx / squaredLength, dy: dy / squaredLength, near: rgba(near), far: rgba(far)};
}

export function createDepthRaster(context) {
  let width, height, depth, colors;
  const translucent = [];
  const cache = new Map();

  function begin(nextWidth, nextHeight) {
    if (width !== nextWidth || height !== nextHeight) {
      width = nextWidth;
      height = nextHeight;
      depth = new Float32Array(width * height);
      colors = new Uint32Array(width * height);
    }
    depth.fill(-Infinity);
    translucent.length = 0;
  }

  function vertices(points, visit) {
    const [ox, oy, oz] = points[0];
    const [ax, ay, az] = points[1];
    let dx, dy;
    for (let i = 2; i < points.length; i++) {
      const [bx, by, bz] = points[i];
      const determinant = (ax - ox) * (by - oy) - (ay - oy) * (bx - ox);
      if (Math.abs(determinant) > 1e-9) {
        dx = ((az - oz) * (by - oy) - (ay - oy) * (bz - oz)) / determinant;
        dy = ((ax - ox) * (bz - oz) - (az - oz) * (bx - ox)) / determinant;
        break;
      }
    }
    if (dx === undefined) return;
    const top = Math.max(0, Math.ceil(Math.min(...points.map(point => point[1])) - .5));
    const bottom = Math.min(height, Math.ceil(Math.max(...points.map(point => point[1])) - .5));
    const cuts = [];
    for (let row = top; row < bottom; row++) {
      const y = row + .5;
      cuts.length = 0;
      for (let i = 0; i < points.length; i++) {
        const [x1, y1] = points[i];
        const [x2, y2] = points[(i + 1) % points.length];
        if ((y1 > y) !== (y2 > y)) cuts.push(x1 + (x2 - x1) * (y - y1) / (y2 - y1));
      }
      cuts.sort((a, b) => a - b);
      for (let cut = 0; cut + 1 < cuts.length; cut += 2) {
        const left = Math.max(0, Math.ceil(cuts[cut] - .5));
        const right = Math.min(width, Math.ceil(cuts[cut + 1] - .5));
        let z = oz + dx * (left + .5 - ox) + dy * (y - oy);
        let index = row * width + left;
        for (let x = left; x < right; x++, index++, z += dx) visit(index, x + .5, y, Math.fround(z));
      }
    }
  }

  function pack(red, green, blue) {
    return (Math.round(red) << 16) | (Math.round(green) << 8) | Math.round(blue);
  }

  function polygon(points, fill) {
    if (points.length < 3) return;
    let color;
    if (typeof fill === 'string') {
      if (!cache.has(fill)) cache.set(fill, rgba(fill));
      color = cache.get(fill);
      if (color[3] < 255) {
        translucent.push({points, color});
        return;
      }
    }
    const packed = color ? pack(...color) : 0;
    vertices(points, (index, x, y, z) => {
      if (z < depth[index]) return;
      let pixel = packed;
      if (!color) {
        const {x: startX, y: startY, dx, dy, near, far} = fill;
        const fraction = Math.max(0, Math.min(1, dx * (x - startX) + dy * (y - startY)));
        pixel = pack(near[0] + fraction * (far[0] - near[0]),
          near[1] + fraction * (far[1] - near[1]), near[2] + fraction * (far[2] - near[2]));
      }
      if (z > depth[index] || pixel < colors[index]) {
        depth[index] = z;
        colors[index] = pixel;
      }
    });
  }

  function present() {
    const image = context.getImageData(0, 0, width, height);
    const pixels = image.data;
    for (let i = 0; i < depth.length; i++) {
      if (depth[i] === -Infinity) continue;
      const pixel = colors[i];
      pixels[i * 4] = pixel >>> 16;
      pixels[i * 4 + 1] = (pixel >>> 8) & 255;
      pixels[i * 4 + 2] = pixel & 255;
      pixels[i * 4 + 3] = 255;
    }
    for (const {points, color} of translucent) {
      const alpha = color[3] / 255;
      vertices(points, (index, x, y, z) => {
        // Coplanar marks cover the surface without blocking sprites or other geometry.
        if (z < depth[index] - Math.max(1e-6, Math.abs(z) * 1e-7)) return;
        const offset = index * 4;
        const backgroundAlpha = pixels[offset + 3] / 255 * (1 - alpha);
        const total = alpha + backgroundAlpha;
        if (!total) return;
        for (let channel = 0; channel < 3; channel++) {
          pixels[offset + channel] = (color[channel] * alpha + pixels[offset + channel] * backgroundAlpha) / total;
        }
        pixels[offset + 3] = total * 255;
      });
    }
    context.putImageData(image, 0, 0);
  }

  return {
    begin, polygon, present,
    get depth() { return depth; },
    depthAt(x, y) {
      const column = Math.floor(x);
      const row = Math.floor(y);
      if (column < 0 || column >= width || row < 0 || row >= height) return -Infinity;
      return depth[row * width + column];
    }
  };
}
