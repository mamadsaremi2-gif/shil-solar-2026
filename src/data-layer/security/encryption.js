import CryptoJS from "crypto-js";

const SECRET_KEY = "SHIL_V15_LOCAL_SECRET";

export function encryptPayload(data) {
  return CryptoJS.AES.encrypt(
    JSON.stringify(data),
    SECRET_KEY
  ).toString();
}

export function decryptPayload(cipherText) {
  const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
  const text = bytes.toString(CryptoJS.enc.Utf8);

  return JSON.parse(text);
}
