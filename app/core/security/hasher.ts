import argon2, { argon2id } from "argon2";

export type Hasher = {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
};

let _hasher: Hasher | null = null;

export function getHasher(): Hasher {
  if (_hasher) return _hasher;

  const memoryCost = Number(process.env.ARGON2_MEMORY_COST ?? 19456); 
  const timeCost = Number(process.env.ARGON2_TIME_COST ?? 2);
  const parallelism = Number(process.env.ARGON2_PARALLELISM ?? 1);

  _hasher = {
    async hash(plain: string): Promise<string> {
      return argon2.hash(plain, {
        type: argon2id,      
        memoryCost,
        timeCost,
        parallelism,
      });
    },
    async compare(plain: string, hashed: string): Promise<boolean> {
      try {
        return await argon2.verify(hashed, plain);
      } catch {
        return false;
      }
    },
  };

  return _hasher;
}
