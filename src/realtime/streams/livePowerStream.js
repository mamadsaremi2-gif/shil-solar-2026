const createLivePowerPayload = () => ({
  pvPower: Math.floor(4000 + Math.random() * 4000),
  batterySOC: Math.floor(70 + Math.random() * 30),
  loadPower: Math.floor(1500 + Math.random() * 2500),
  grid: Math.random() > 0.5 ? "ONLINE" : "OFFLINE",
  timestamp: Date.now(),
});

export const livePowerStream = {
  subscribe(callback) {
    if (typeof callback !== "function") {
      return { unsubscribe() {} };
    }

    callback(createLivePowerPayload());

    const timer = window.setInterval(() => {
      callback(createLivePowerPayload());
    }, 2000);

    return {
      unsubscribe() {
        window.clearInterval(timer);
      },
    };
  },
};
