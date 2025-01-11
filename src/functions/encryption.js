async function encryptMessage(publicKey, message) {
    if (!publicKey) {
        console.error("Public key is undefined or null.");
        return;
    }
    
    const correctedPublicKey = correctBase64Padding(publicKey);
    
    const keyData = Uint8Array.from(atob(correctedPublicKey), (c) => c.charCodeAt(0)); // Decode Base64 public key
    const cryptoKey = await window.crypto.subtle.importKey(
        "spki", 
        keyData.buffer, 
        {
            name: "RSA-OAEP",
            hash: "SHA-256"
        },
        false, 
        ["encrypt"]
    );

    // Encrypt the message
    const encryptedMessage = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        cryptoKey,
        new TextEncoder().encode(message) // Encode message to Uint8Array
    );

    // Base64 encode the encrypted message
    const base64EncryptedMessage = btoa(String.fromCharCode(...new Uint8Array(encryptedMessage))); // Base64 encode

    return base64EncryptedMessage; // Convert to Base64 string
}

async function decryptMessage(privateKey, encryptedMessage) {
    
    if (!privateKey || !encryptedMessage) {
        console.error("Private key or encrypted message is undefined or null.");
        return;
    }
    
    const correctedPrivateKey = correctBase64Padding(privateKey);
    
    const keyData = Uint8Array.from(atob(correctedPrivateKey), (c) => c.charCodeAt(0)); // Decode Base64 private key
    const cryptoKey = await window.crypto.subtle.importKey(
        "pkcs8",
        keyData.buffer,
        {
            name: "RSA-OAEP",
            hash: "SHA-256"
        },
        false, 
        ["decrypt"]
    );

    // Base64 decode the encrypted message
    const correctedEncryptedMessage = correctBase64Padding(encryptedMessage);
    
    const encryptedArray = Uint8Array.from(atob(correctedEncryptedMessage), (c) => c.charCodeAt(0));

    // Decrypt the message
    const decryptedMessage = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        cryptoKey,
        encryptedArray.buffer // Decrypted buffer
    );

    // Decode the decrypted message to a string
    return new TextDecoder().decode(decryptedMessage);
}

function correctBase64Padding(base64String) {
    if (!base64String) {
        console.error("Base64 string is undefined or null.");
        return "";
    }
    
    return base64String.padEnd(base64String.length + (4 - base64String.length % 4) % 4, "=");
}



export { encryptMessage, decryptMessage };