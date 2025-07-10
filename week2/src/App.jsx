import { useState, useRef, useEffect } from 'react'
import Scene from './components/Scene'
import { createNoise } from './hooks/useNoise'
import { useCheckboxStyle } from './hooks/useCheckboxStyle'
import './App.css'

function App() {
  //comentário para atualizar o gh Pages 1
  const [page, setPage] = useState(0)
  const pagesRefs = [useRef(), useRef(), useRef(), useRef()]

  useEffect(() => {
    pagesRefs.forEach((ref, i) => {
      if (ref.current) ref.current.style.display = i === page ? 'block' : 'none'
    })
  }, [page])

  // Light settings
  const [directionalLightIntensity, setDirectionalLightIntensity] = useState(2.0)
  const [directionalLightDirection, setDirectionalLightDirection] = useState(1)
  const [directionalLightColor, setDirectionalLightColor] = useState('white')
  const [directionalLightHelper, setDirectionalLightHelper] = useState(false)
  const [ambientLightIntensity, setAmbientLightIntensity] = useState(1.0)
  const [ambientLightColor, setAmbientLightColor] = useState('white')

  const lightHelperInput = useRef()

  // Terrain settings
  const [quantX, setQuantX] = useState(300)
  const [quantY, setQuantY] = useState(300)
  const [maxHeight, setMaxHeight] = useState(10)
  const [scale, setScale] = useState(50)
  const [terrainColor, setTerrainColor] = useState('green')
  const [wireframe, setWireframe] = useState(false)

  const wireframeInput = useRef()

  // Animation
  const [velocityX, setVelocityX] = useState(10)
  const [velocityY, setVelocityY] = useState(0)
  const [velocityZ, setVelocityZ] = useState(0)

  // Noise layers
  const nextNoiseId = useRef(0)
  const [noiseList, setNoiseList] = useState([])
  const [noiseSelected, setNoiseSelected] = useState(false)

  const nomeInput = useRef()
  const seedInput = useRef()
  const modInput = useRef()

  const [editNome, setEditNome] = useState('')
  const [editSeed, setEditSeed] = useState('')
  const [editMod, setEditMod] = useState(-2)

  function handleCreateNoise() {
    const id = nextNoiseId.current++
    const newNoise = createNoise(id)
    setNoiseList(prev => [...prev, newNoise])
    setNoiseSelected(newNoise.id)
  }

  function handleUpdateNoise() {
    if (!editNome || !editSeed || !editMod) return

    const updated = {
      id: noiseSelected,
      nome: editNome,
      seed: editSeed,
      mod: parseFloat(editMod),
    }

    setNoiseList(list =>
      list.map(noise => (noise.id === noiseSelected ? updated : noise))
    )
  }

  function handleDeleteNoise(e, id) {
    e.stopPropagation()
    const selected = noiseList.find((n)=>n.id===id)
    setNoiseList(noises => noises.filter(n => n.id !== id))
    if (noiseList.length === 1 || id === selected.id) setNoiseSelected(false)
  }

  function syncInputFields(nome, seed, mod) {
    if (nomeInput.current) nomeInput.current.value = nome
    if (seedInput.current) seedInput.current.value = seed
    if (modInput.current) modInput.current.value = mod
    setEditNome(nome)
    setEditSeed(seed)
    setEditMod(mod)
  }

  useEffect(() => {
    if (noiseSelected !== false) {
      const selected = noiseList.find(n => n.id === noiseSelected)
      if (selected) syncInputFields(selected.nome, selected.seed, selected.mod)
    } else {
      syncInputFields('', '', 0)
    }
  }, [noiseSelected])

  useEffect(() => {
    handleUpdateNoise()
  }, [editNome, editSeed, editMod])

  useEffect(()=> {
    useCheckboxStyle(lightHelperInput, directionalLightHelper)
  }, [directionalLightHelper])

  useEffect(()=> {
    useCheckboxStyle(wireframeInput, wireframe)
  }, [wireframe])

  useEffect(()=>{
    createNoise()
  }, [])

  return (
    <div className="flex w-full h-full bg-blue-950 p-10">
      {/* 3D Scene */}
      <Scene
        directionalLightIntensity={directionalLightIntensity}
        directionalLightDirection={directionalLightDirection}
        directionalLightColor={directionalLightColor}
        directionalLightHelper={directionalLightHelper}
        ambientLightIntensity={ambientLightIntensity}
        ambientLightColor={ambientLightColor}
        quantX={quantX}
        quantY={quantY}
        maxHeight={maxHeight}
        scale={scale}
        terrainColor={terrainColor}
        wireframe={wireframe}
        velX={velocityX}
        velY={velocityY}
        velZ={velocityZ}
        noiseList={noiseList}
      />

      {/* UI Controls - você pode separar futuramente em um componente <Sidebar /> */}
      <div className="rounded-r-4xl flex flex-col gap-4 w-xl h-full text-white" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}>
        {/* Menu de páginas */}
        <div className='bg-black flex w-full h-1/12 rounded-tr-4xl'>
          {['Lights', 'Terrain', 'Noise', 'Animation'].map((name, i) => (
            <label key={i} className={`w-full h-full flex justify-center items-center border-1 border-gray-600 hover:bg-blue-900 ${i === 3 ? 'rounded-tr-4xl' : ''}`}>
              <input type='radio' name='pages' className='hidden' onChange={() => setPage(i)} />
              <p className='text-xl font-bold'>{name}</p>
            </label>
          ))}
        </div>

        {/* Conteúdo de cada aba (em refs) */}
        <div ref={pagesRefs[0]} className="hidden p-4 rounded-4xl">
          {/* DIRECTIONAL LIGHT */}
          {/* DIRECTIONAL LIGHT INTENSITY */}
          <h1 className='font-bold text-2xl'>Directional Light</h1>
          <p className="text-xl">Light intensity</p>
          <div className="flex flex-col gap-1.5 rounded-full w-1/3">
            <input
              type="range"
              value={directionalLightIntensity}
              min={0}
              max={20}
              step={0.1}
              className="range-thumb"
              onChange={(e) =>
                setDirectionalLightIntensity(parseFloat(e.target.value))
              }
            />
            <p>{directionalLightIntensity}</p>
          </div>
          
          {/* DIRECTIONAL LIGHT DIRECTION */}
          <p className="text-xl">Light direction</p>
          <div className="flex flex-col gap-1.5 rounded-full w-1/3">
            <input
              type="range"
              value={directionalLightDirection}
              min={0}
              max={360}
              step={1}
              className="range-thumb"
              onChange={(e) =>
                setDirectionalLightDirection(parseInt(e.target.value))
              }
            />
            <p>{directionalLightDirection}</p>
          </div>
          
          <div className='flex items-center justify-between'>
            {/* DIRECTIONAL LIGHT COLOR */}
            <div>
              <p className="text-xl">Color</p>
              <div className='w-30 h-30 rounded-4xl border-2 border-blue-200' style={{backgroundColor: directionalLightColor}}>
                <input type="color" className='opacity-0 w-full h-full' onChange={(e)=>setDirectionalLightColor(e.target.value)} />
              </div>
            </div>

            {/* DIRECTIONAL LIGHT HELPER */}
            <div className='flex items-center gap-5'>
              <p className="text-xl">helper</p>
              <div ref={lightHelperInput} className='w-10 h-10 border-2 rounded-xl'>
                <input type='checkbox' className='opacity-0 w-full h-full' onClick={()=>setDirectionalLightHelper((h)=>!h)}/>
              </div>
            </div>
          </div>

          <hr className='opacity-50 w-3/4 mt-5'></hr>

          <h1 className='font-bold text-2xl'>Ambient Light</h1>
          {/* AMBIENT LIGHT */}
          <p className="text-xl">Ambient light intensity</p>
          <div className="flex flex-col gap-1.5 rounded-full w-1/3">
            <input
              type="range"
              value={ambientLightIntensity}
              min={0}
              max={20}
              step={0.1}
              className="range-thumb"
              onChange={(e) =>
                setAmbientLightIntensity(parseFloat(e.target.value))
              }
            />
            <p>{ambientLightIntensity}</p>
          </div>

          <p className="text-xl">Color</p>
          <div className='w-30 h-30 rounded-4xl border-2 border-blue-200' style={{backgroundColor: ambientLightColor}}>
            <input type="color" className='opacity-0 w-full h-full' onChange={(e)=>setAmbientLightColor(e.target.value)} />
          </div>
        </div>
        <div ref={pagesRefs[1]} className="hidden p-4 rounded-4xl"> 
            <h1 className='font-bold text-2xl'>Terrain size</h1>
          <div className='flex w-full items-center gap-5'>
            {/* TERRAIN WIDTH */}
            <div className="flex flex-col gap-1.5 w-full">
              <p className="text-xl">Width</p>
              <input
                type="range"
                value={quantX}
                min={0}
                max={500}
                step={1}
                className="range-thumb"
                onChange={(e)=> setQuantX(parseInt(e.target.value))}
              />
              <p>{quantX}</p>
            </div>

            {/* TERRAIN DEPTH */}
            <div className='flex flex-col gap-1.5 w-full'>
              <p className="text-xl">Depth</p>
              <div className="flex flex-col gap-1.5 rounded-full w-full">
                <input
                  type="range"
                  value={quantY}
                  min={0}
                  max={500}
                  step={1}
                  className="range-thumb"
                  onChange={(e)=> setQuantY(parseInt(e.target.value))}
                />
                <p>{quantY}</p>            
              </div>
            </div>

            {/* TERRAIN HEIGHT */}
            <div className='flex flex-col gap-1.5 w-full'>
              <p className="text-xl">Height</p>
              <div className="flex flex-col gap-1.5 rounded-full w-full">
                <input
                  type="range"
                  value={maxHeight}
                  min={0}
                  max={100}
                  step={0.1}
                  className="range-thumb"
                  onChange={(e)=> setMaxHeight(parseFloat(e.target.value))}
                />
                <p>{maxHeight}</p>
              </div>
            </div>
          </div>

          {/* TERRAIN SCALE */}
          <div className='flex flex-col gap-1.5 w-1/2'>
            <p className="text-xl">Scale</p>
            <div className="flex flex-col gap-1.5 rounded-full w-full">
              <input
                type="range"
                value={scale}
                min={0}
                max={100}
                step={0.01}
                className="range-thumb"
                onChange={(e)=> setScale(parseFloat(e.target.value))}
              />
              <p>{scale}</p>
            </div>
          </div>

          <hr className='opacity-50 w-3/4 mt-5'></hr>
          
          {/* TERRAIN VISUAL */}
          <h1 className='font-bold text-2xl'>Terrain visual</h1>
          <div className='flex items-center justify-between'>
            {/* TERRAIN COLOR */}
            <div>
              <p className="text-xl">Color</p>
              <div className='w-30 h-30 rounded-4xl border-2 border-blue-200' style={{backgroundColor: terrainColor}}>
                <input type="color" className='opacity-0 w-full h-full' onChange={(e)=>setTerrainColor(e.target.value)} />
              </div>
            </div>
            {/* TERRAIN WIREFRAME */}
            <div className='flex items-center gap-5'>
              <p className="text-xl">wireframe</p>
              <div ref={wireframeInput} className='w-10 h-10 border-2 rounded-xl'>
                <input type='checkbox' className='opacity-0 w-full h-full' onClick={()=>setWireframe((w)=>!w)} />
              </div>
            </div>
          </div>
        </div>
        <div ref={pagesRefs[2]} className="hidden p-4 rounded-4xl h-full overflow-y-scroll">
          {noiseList.length > 0 ? <div className='flex flex-col gap-5'>
            {/* NOISE NAME */}
            <div className='flex flex-col'>
              <p>Name</p>
              <input disabled={noiseSelected === false ? true : false} ref={nomeInput} type='text' onChange={(e)=> setEditNome(e.target.value)} className='w-full h-10 border-2 border-gray-50 rounded-lg'></input>
            </div>
            
            {/* NOISE SEED */}
            <div>
              <p>Seed</p>
              <div className='flex items-center justify-center gap-5'>
                <input disabled={noiseSelected === false ? true : false} ref={seedInput} type='text' onChange={(e)=> setEditSeed(e.target.value)} className='w-full h-10 border-2 border-gray-50 rounded-lg'></input>
                <button disabled={noiseSelected === false ? true : false} className='bg-gray-50 rounded-lg text-black' onClick={()=>changeValues(editNome, randInt(0,999999).toString(), editMod)}>Random Seed</button>
              </div>
            </div>
            
            {/* NOISE SMOOTHNESS */}
            <p className="text-xl">Noise smoothness</p>
            <div className="flex flex-col gap-1.5 rounded-full w-1/3">
              <input
                disabled={noiseSelected === false ? true : false}
                ref={modInput}
                type="range"
                value={editMod}
                min={-3}
                max={0.25}
                step={0.01}
                className="range-thumb"
                onChange={(e) => {setEditMod(e.target.value)}}
              />
              <p>{editMod}</p>
            </div>
            </div> : <></>}
            
            <div className='flex flex-col h-full gap-5'>
                {/* NOISE CREATE */}
                <div className='flex justify-center items-center w-full h-20 bg-green-800 rounded-xl p-2 hover:cursor-pointer' onClick={handleCreateNoise}>
                  <p className='text-white text-4xl'> Create </p>
                </div>

                {noiseList.map((noise)=>{
                return <div key={noise.id} className='flex justify-between w-full bg-gray-800 rounded-xl p-2' style={{backgroundColor: noiseSelected === noise.id ? '#1c398e' : '#1e2939'}} onClick={()=>{noise.id === noiseSelected ? setNoiseSelected(false) : setNoiseSelected(noise.id)}}>
                          <div className='block w-full mr-2'>
                            <h1 className='font-bold'>{noise.nome}</h1>
                            <div className='flex gap-5 opacity-80 justify-between'>
                              <p>seed:{noise.seed}</p>
                              <p>smoothness:{noise.mod}</p>
                            </div>
                          </div>

                        <div className='flex'>
                          <div className='w-15 h-full bg-rose-950 hover:cursor-pointer' onClick={(e)=>handleDeleteNoise(e,noise.id)}></div>
                        </div>
                      </div>
                })}
              </div>
        </div>
        <div ref={pagesRefs[3]} className="hidden p-4 rounded-4xl">
          {/* TERRAIN VELOCITY X */}
          <div className='w-full'>
            <p className="text-xl">Velocity X</p>
            <div className="flex flex-col gap-1.5 rounded-full w-1/2">
              <input
                type="range"
                value={velocityX}
                min={-20}
                max={20}
                step={1}
                className="range-thumb"
                onChange={(e)=> setVelocityX(parseInt(e.target.value))}
              />
              <p>{velocityX}x</p>
            </div>
          </div>

          {/* TERRAIN VELOCITY Y */}
          <div className='w-full'>
            <p className="text-xl">Velocity Y</p>
            <div className="flex flex-col gap-1.5 rounded-full w-1/2">
              <input
                type="range"
                value={velocityY}
                min={-20}
                max={20}
                step={1}
                className="range-thumb"
                onChange={(e)=> setVelocityY(parseInt(e.target.value))}
              />
              <p>{velocityY}x</p>
            </div>
          </div>

          {/* TERRAIN VELOCITY Z */}
          <div className='w-full'>
            <p className="text-xl">Velocity Z</p>
            <div className="flex flex-col gap-1.5 rounded-full w-1/2">
              <input
                type="range"
                value={velocityZ}
                min={-20}
                max={20}
                step={1}
                className="range-thumb"
                onChange={(e)=> setVelocityZ(parseInt(e.target.value))}
              />
              <p>{velocityZ}x</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App