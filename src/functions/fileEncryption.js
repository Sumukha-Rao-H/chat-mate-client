async function generateAESKey() {
  return await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // extractable
    ["encrypt", "decrypt"]
  );
}

async function encryptFileWithAES(file, aesKey) {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // Initialization vector
  const fileBuffer = await file.arrayBuffer();

  const encryptedContent = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    aesKey,
    fileBuffer
  );

  return { encryptedContent, iv };
}

async function exportAESKey(aesKey) {
  const rawKey = await crypto.subtle.exportKey("raw", aesKey);
  return rawKey;
}

async function encryptAESKeyWithRSA(receiverPublicKeyPem, rawAesKey) {
  // Convert PEM to CryptoKey
  const keyBuffer = str2ab(
    atob(
      receiverPublicKeyPem.replace(/-----[^-]+-----/g, "").replace(/\n/g, "")
    )
  );

  const cryptoKey = await crypto.subtle.importKey(
    "spki",
    keyBuffer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["encrypt"]
  );

  return await crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    cryptoKey,
    rawAesKey
  );
}

function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function createEncryptedBlob(encryptedContent) {
  return new Blob([new Uint8Array(encryptedContent)]);
}

async function importRSAPrivateKey(pem) {
  // Remove header, footer, and line breaks
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = pem
    .replace(pemHeader, "")
    .replace(pemFooter, "")
    .replace(/\s/g, "");

  const binaryDerString = atob(pemContents);
  const binaryDer = str2ab(binaryDerString);

  return window.crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );

  function str2ab(str) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }
}

export {
  generateAESKey,
  encryptFileWithAES,
  exportAESKey,
  encryptAESKeyWithRSA,
  createEncryptedBlob,
  importRSAPrivateKey,
};
