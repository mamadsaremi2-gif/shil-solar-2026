import { Device } from "@capacitor/device";
import { Network } from "@capacitor/network";

export async function getNativeDeviceInfo() {

  const info =
    await Device.getInfo();

  return info;
}

export async function getNetworkStatus() {

  const status =
    await Network.getStatus();

  return status;
}
