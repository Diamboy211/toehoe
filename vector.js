let clamp = (t, a, b) => Math.max(a, Math.min(t, b));
let mix = (a, b, t) => a * (1 - t) + b * t;
// let length2 = a => Math.sqrt(a[0] * a[0] + a[1] * a[1]);
let length2 = a => Math.hypot(a[0], a[1]);
let add2 = (out, a, b) => {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
};
let sub2 = (out, a, b) => {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
};
let mul2 = (out, a, m) => {
  out[0] = a[0] * m;
  out[1] = a[1] * m;
};
let div2 = (out, a, m) => {
  out[0] = a[0] / m;
  out[1] = a[1] / m;
};
let normalize2 = (out, a) => {
  let l = Math.sqrt(a[0] * a[0] + a[1] * a[1]);
  out[0] = a[0] / l;
  out[1] = a[1] / l;
};
let max2 = (out, a, b) => {
  out[0] = Math.max(a[0], b[0]);
  out[1] = Math.max(a[1], b[1]);
};
let abs2 = (out, a) => {
  out[0] = Math.abs(a[0]);
  out[1] = Math.abs(a[1]);
};
let copy2 = (out, a) => {
  out[0] = a[0];
  out[1] = a[1];
};
let dot2 = (a, b) => a[0] * b[0] + a[1] * b[1];