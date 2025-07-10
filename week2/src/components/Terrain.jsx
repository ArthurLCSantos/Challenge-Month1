import React, { useRef, useState, useEffect, useMemo } from 'react'
import { BufferGeometry, BufferAttribute, DoubleSide } from 'three'
import { useFrame } from '@react-three/fiber'
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js'
import { hashCode, mulberry32 } from '../utils/hashUtils'

export default function Terrain({
  position, quantX, quantY, maxHeight, scale, color,
  wireframe, velX, velY, velZ, noiseList
}) {
  const positions = useRef()
  const meshRef = useRef()
  const [geometry, setGeometry] = useState(null)
  const xoffset = useRef(0), yoffset = useRef(0), zoffset = useRef(0)

  const simplexList = useMemo(() =>
    noiseList.map(n => {
      const random = mulberry32(hashCode(n.seed))
      return { simplex: new SimplexNoise({ random }), mod: n.mod }
    }),
  [noiseList])

  const sumNoises = (x, y) => simplexList.reduce((sum, {simplex, mod}) => {
    return sum + simplex.noise3d((x + xoffset.current) * 10 ** mod,
                                 (y + yoffset.current) * 10 ** mod,
                                      zoffset.current  * 10 ** mod) * maxHeight * scale
  }, 0)

  const createPositions = () => {
    positions.current = new Float32Array(quantX * quantY * 3)
    for (let y = 0; y < quantY; y++) {
      for (let x = 0; x < quantX; x++) {
        const i = (y * quantX + x) * 3
        positions.current[i] = (x - quantX / 2) * scale
        positions.current[i + 1] = sumNoises(x, y)
        positions.current[i + 2] = (y - quantY / 2) * scale
      }
    }
  }

  const createIndices = () => {
    const indices = []
    for (let y = 0; y < quantY - 1; y++) {
      for (let x = 0; x < quantX - 1; x++) {
        const i = y * quantX + x
        indices.push(i, i + 1, i + quantX + 1, i + quantX + 1, i + quantX, i)
      }
    }
    return indices
  }

  const createGeometry = () => {
    createPositions()
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(positions.current, 3))
    geo.setIndex(createIndices())
    geo.computeVertexNormals()
    return geo
  }

  const updateGeometry = () => {
    if (!meshRef.current) return
    const attr = meshRef.current.geometry.attributes.position
    for (let i = 0; i < quantX * quantY; i++) {
      const x = i % quantX
      const y = Math.floor(i / quantX)
      attr.array[i * 3 + 1] = sumNoises(x, y)
    }
    attr.needsUpdate = true
    meshRef.current.geometry.computeVertexNormals()
  }

  useEffect(() => {setGeometry(createGeometry())}, [quantX, quantY, scale])
  useEffect(() => {geometry && updateGeometry()}, [maxHeight, noiseList])

  useFrame(() => {
    if (!(velX || velY || velZ)) return undefined
    xoffset.current += 0.5 * velX
    yoffset.current += 0.5 * velY
    zoffset.current += 0.5 * velZ
    updateGeometry()
  })

  if (!geometry) return null

  return (
    <mesh ref={meshRef} geometry={geometry} position={position}>
      <meshStandardMaterial color={color} side={DoubleSide} wireframe={wireframe} />
    </mesh>
  )
}