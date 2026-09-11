import { ALLOWED_DOMAINS } from "../lib/supabase";

/**
 * Detects which college the user belongs to based on their email.
 * @param {string} email
 * @returns {"SSN" | "SNUC" | null}
 */
export function detectCollege(email) {
  if (!email || typeof email !== "string") return null;
  const domain = email.trim().toLowerCase().split("@")[1];
  if (domain === "ssn.edu.in") return "SSN";
  if (domain === "snuchennai.edu.in") return "SNUC";
  return null;
}

/**
 * Validates a UniHive username.
 * Rules: 3-20 chars, lowercase letters/numbers/underscores only,
 * cannot start with underscore or number.
 * @param {string} username
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validateUsername(username) {
  if (!username || username.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters." };
  }
  if (username.length > 20) {
    return { valid: false, error: "Username must be 20 characters or less." };
  }
  if (!/^[a-z][a-z0-9_]{2,19}$/.test(username)) {
    if (/^[_0-9]/.test(username)) {
      return { valid: false, error: "Username cannot start with a number or underscore." };
    }
    return { valid: false, error: "Only lowercase letters, numbers, and underscores allowed." };
  }
  return { valid: true, error: null };
}

/**
 * Validates an optional phone number (10 digits or empty).
 * @param {string} phone
 * @returns {{ valid: boolean, error: string | null }}
 */
export function validatePhone(phone) {
  if (!phone || phone.trim() === "") return { valid: true, error: null };
  if (!/^\d{10}$/.test(phone.trim())) {
    return { valid: false, error: "Phone number must be exactly 10 digits." };
  }
  return { valid: true, error: null };
}

/**
 * Formats a byte count as a human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
