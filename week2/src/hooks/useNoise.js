import { randInt } from 'three/src/math/MathUtils.js'

export const createNoise = (id) => {
  const seed = randInt(0, 999999999).toString()
  return {
    id,
    nome: `layer ${id}`,
    seed,
    mod: -2,
  }
}