
export function updateShilMapPin(container, xPercent, yPercent, label='') {
  if (!container) return;
  let pin = container.querySelector('.shil-map-pin');
  if (!pin) {
    pin = document.createElement('div');
    pin.className = 'shil-map-pin';
    pin.innerHTML = '<div class="pin-core"></div>';
    container.appendChild(pin);
  }
  pin.style.left = `${xPercent}%`;
  pin.style.top = `${yPercent}%`;
  pin.setAttribute('data-label', label || '');
}
