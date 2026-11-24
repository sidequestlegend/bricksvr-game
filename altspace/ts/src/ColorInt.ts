// ColorInt.cs: a colour packed as ARGB in one int (ColorInt.cs:19,53-76), plus the two Unity colour conversions the
// picker's sliders use (Color.RGBToHSV at BrickPickerManager.cs:203; Color.HSVToRGB behind the HSV sliders) and
// BrickAttach.HoverColor (BrickAttach.cs:27-41). On the wire the port keeps only RGB: every brick colour upstream has
// alpha 255 (the picker never changes alpha).

export interface Color32 {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** Unity Color (floats 0..1). */
export interface ColorF {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** ColorInt.IntToColor32. */
export function IntToColor32(color: number): Color32 {
  return { a: (color >> 24) & 0xff, r: (color >> 16) & 0xff, g: (color >> 8) & 0xff, b: color & 0xff };
}

/** ColorInt.Color32ToInt (a signed 32-bit int, as C#). */
export function Color32ToInt(c: Color32): number {
  return ((c.a & 0xff) << 24) | ((c.r & 0xff) << 16) | ((c.g & 0xff) << 8) | (c.b & 0xff);
}

/** C#'s `(byte)(f * 255)`: truncation toward zero, then wrapped to 0..255. */
function toByte(f: number): number {
  const v = Math.trunc(Math.fround(Math.fround(f) * 255));
  return ((v % 256) + 256) % 256;
}

/** ColorInt.ColorToInt. */
export function ColorToInt(c: ColorF): number {
  return ((toByte(c.a) & 0xff) << 24) | ((toByte(c.r) & 0xff) << 16) | ((toByte(c.g) & 0xff) << 8) | (toByte(c.b) & 0xff);
}

/** 0xRRGGBB, the wire form. */
export function rgbOf(color: number): number {
  return color & 0xffffff;
}

/** The ARGB int of a wire colour (alpha 255). */
export function argbOf(rgb: number): number {
  return (0xff << 24) | (rgb & 0xffffff);
}

/** BrickAttach.HoverColor: 20 lighter, or 20 darker when r + g + b > 300. */
export function HoverColor(c: Color32): Color32 {
  const d = c.r + c.g + c.b > 300 ? -20 : 20;
  const clamp = (v: number) => Math.max(0, Math.min(255, v));
  return { r: clamp(c.r + d), g: clamp(c.g + d), b: clamp(c.b + d), a: clamp(c.a) };
}

/** UnityEngine.Color.HSVToRGB(h, s, v, hdr: false). */
export function HSVToRGB(H: number, S: number, V: number): ColorF {
  const white = { r: 1, g: 1, b: 1, a: 1 };
  if (S === 0) return { r: V, g: V, b: V, a: 1 };
  if (V === 0) return { r: 0, g: 0, b: 0, a: 1 };
  const out = { ...white };
  const hToFloor = H * 6;
  const temp = Math.floor(hToFloor);
  const t = hToFloor - temp;
  const var1 = V * (1 - S);
  const var2 = V * (1 - S * t);
  const var3 = V * (1 - S * (1 - t));
  switch (temp) {
    case 0: out.r = V; out.g = var3; out.b = var1; break;
    case 1: out.r = var2; out.g = V; out.b = var1; break;
    case 2: out.r = var1; out.g = V; out.b = var3; break;
    case 3: out.r = var1; out.g = var2; out.b = V; break;
    case 4: out.r = var3; out.g = var1; out.b = V; break;
    case 5: out.r = V; out.g = var1; out.b = var2; break;
    case 6: out.r = V; out.g = var3; out.b = var1; break;
    case -1: out.r = V; out.g = var1; out.b = var2; break;
  }
  out.r = Math.max(0, Math.min(1, out.r));
  out.g = Math.max(0, Math.min(1, out.g));
  out.b = Math.max(0, Math.min(1, out.b));
  return out;
}

/** UnityEngine.Color.RGBToHSV. */
export function RGBToHSV(c: ColorF): { h: number; s: number; v: number } {
  const helper = (offset: number, dominant: number, a: number, b: number) => {
    if (dominant !== 0) {
      const diff = dominant - (a > b ? b : a);
      const s = diff / dominant;
      let h = diff !== 0 ? offset + (a - b) / diff : offset;
      h /= 6;
      if (h < 0) h += 1;
      return { h, s, v: dominant };
    }
    return { h: 0, s: 0, v: 0 };
  };
  if (c.b > c.g && c.b > c.r) return helper(4, c.b, c.r, c.g);
  if (c.g > c.r) return helper(2, c.g, c.b, c.r);
  return helper(0, c.r, c.g, c.b);
}

/** The colour a brick of a picker colour gets: HSV sliders to the ARGB int the brick stores (BrickPickerBrick.cs:88). */
export function colorFromSliders(h: number, s: number, v: number): number {
  return ColorToInt(HSVToRGB(h, s, v));
}
