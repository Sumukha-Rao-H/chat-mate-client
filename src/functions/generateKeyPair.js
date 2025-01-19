// Generate RSA Key Pair (Client-Side)
async function generateKeyPair() {
    const keyPair = await window.crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
            hash: "SHA-256",
        },
        true, // Keys can be exported
        ["encrypt", "decrypt"]
    );

    // Export public and private keys
    const publicKey = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const privateKey = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    return {
        publicKey: btoa(String.fromCharCode(...new Uint8Array(publicKey))), // Base64 encode
        privateKey: btoa(String.fromCharCode(...new Uint8Array(privateKey))), // Base64 encode
    };
}

async function verifyOrGenerateKeysForUser(uid) {
    try {
        const privateKey = getPrivateKey(uid);
        if (privateKey) {
            return;
        }

        console.log("No private key found. Generating a new key pair...");
        const { privateKey: newPrivateKey, publicKey } = await generateKeyPair();

        // Store private key locally in localStorage
        storePrivateKey(uid, newPrivateKey);

        // Store public key on the server
        await storePublicKey(uid, publicKey);

        console.log("New key pair generated and stored.");
    } catch (error) {
        console.error("Error verifying or generating keys:", error);
    }
}

async function storePublicKey(uid, publicKey) {
    try {
        const response = await fetch(`${process.env.SERVER_URL}/api/storePublicKey`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ uid, publicKey }),
        });

        if (!response.ok) {
            throw new Error(`Failed to store public key: ${response.statusText}`);
        }
    } catch (error) {
        console.error("Error storing public key:", error);
    }
}

// Store private key in localStorage
function storePrivateKey(uid, privateKey) {
    try {
        // Store the private key in localStorage
        localStorage.setItem(`privateKey_${uid}`, privateKey);
    } catch (error) {
        console.error(`Error storing private key for user ${uid}: ${error}`);
    }
}

// Retrieve private key from localStorage
function getPrivateKey(uid) {
    try {
        const privateKey = localStorage.getItem(`privateKey_${uid}`);
        if (privateKey) {
            return privateKey;
        } else {
            throw new Error(`Private key not found for user: ${uid}`);
        }
    } catch (error) {
        console.error(`Error retrieving private key for user ${uid}: ${error}`);
    }
}

export { verifyOrGenerateKeysForUser, getPrivateKey };
