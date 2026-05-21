import CryptoJS
from "crypto-js";

const SECRET =
  "SHIL_V15_SECRET";

export function encryptData(
  data
) {

  return CryptoJS.AES.encrypt(
    JSON.stringify(data),
    SECRET
  ).toString();
}

export function decryptData(
  encrypted
) {

  const bytes =
    CryptoJS.AES.decrypt(
      encrypted,
      SECRET
    );

  return JSON.parse(
    bytes.toString(
      CryptoJS.enc.Utf8
    )
  );
}
