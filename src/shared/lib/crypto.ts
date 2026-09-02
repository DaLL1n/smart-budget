export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateUserId(email: string): string {
  const cleanEmail = email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
  return `usr_${cleanEmail}`;
}
