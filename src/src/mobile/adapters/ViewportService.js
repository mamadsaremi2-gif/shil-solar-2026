export class ViewportService {
  constructor({ width = 390, height = 844, devicePixelRatio = 2 } = {}) {
    this.width = width;
    this.height = height;
    this.devicePixelRatio = devicePixelRatio;
  }

  getBreakpoint() {
    if (this.width < 480) return "mobile";
    if (this.width < 900) return "tablet";
    return "desktop";
  }

  isMobile() {
    return this.getBreakpoint() === "mobile";
  }

  getSafeAreaInsets() {
    return {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    };
  }

  describe() {
    return {
      width: this.width,
      height: this.height,
      devicePixelRatio: this.devicePixelRatio,
      breakpoint: this.getBreakpoint(),
      safeArea: this.getSafeAreaInsets()
    };
  }
}
