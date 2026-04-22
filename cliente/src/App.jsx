import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'

const API = axios.create({ baseURL: '/api' })
const post = (msg) => {
  if (typeof msg === 'string') {
    return API.post('', JSON.stringify(msg), {
      headers: { 'Content-Type': 'application/json' }
    }).then(r => r.data)
  }
  return API.post('', msg).then(r => r.data)
}

const fmt = (s) => {
  if (!s && s !== 0) return '0:00'
  const m = Math.floor(s / 60), sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

// SVG Logo
const Logo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18.5" stroke="#c9a84c" strokeWidth="1"/>
    <rect x="9"  y="16" width="2.5" height="8"  rx="1.25" fill="#c9a84c"/>
    <rect x="13" y="12" width="2.5" height="16" rx="1.25" fill="#c9a84c"/>
    <rect x="17" y="9"  width="2.5" height="22" rx="1.25" fill="#e8c96e"/>
    <rect x="21" y="12" width="2.5" height="16" rx="1.25" fill="#c9a84c"/>
    <rect x="25" y="15" width="2.5" height="10" rx="1.25" fill="#c9a84c"/>
    <rect x="29" y="17" width="2.5" height="6"  rx="1.25" fill="#7a6128"/>
  </svg>
)

// Icon components
const IconSearch = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
  </svg>
)
const IconPlay = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,3 19,12 5,21"/>
  </svg>
)
const IconPause = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
  </svg>
)
const IconSkipBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="19,20 9,12 19,4"/><line x1="5" y1="19" x2="5" y2="5"/>
  </svg>
)
const IconSkipFwd = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5,4 15,12 5,20"/><line x1="19" y1="5" x2="19" y2="19"/>
  </svg>
)
const IconPlus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14"/>
  </svg>
)
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3,6 5,6 21,6"/><path d="M19,6l-1,14H6L5,6"/><path d="M10,11v6M14,11v6"/><path d="M9,6V4h6v2"/>
  </svg>
)
const IconList = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <circle cx="3" cy="6" r="1" fill="currentColor"/><circle cx="3" cy="12" r="1" fill="currentColor"/><circle cx="3" cy="18" r="1" fill="currentColor"/>
  </svg>
)
const IconNote = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
  </svg>
)
const IconSort = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M3 6h18M7 12h10M11 18h2"/>
  </svg>
)
const IconFilter = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/>
  </svg>
)
const IconChevronLeft = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15,18 9,12 15,6"/>
  </svg>
)
const IconX = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)

// Waveform visualizer
const Waveform = ({ active }) => {
  const bars = [3, 5, 8, 6, 4, 7, 9, 5, 3, 6]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 20 }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          width: 2, borderRadius: 1,
          background: active ? 'var(--gold)' : 'var(--muted2)',
          height: active ? h * 2 : 4,
          transition: `height ${0.3 + i * 0.05}s var(--ease-in-out)`,
          animation: active ? `wave ${0.6 + i * 0.1}s ease-in-out infinite alternate` : 'none',
          animationDelay: `${i * 0.07}s`,
        }} />
      ))}
      <style>{`@keyframes wave { from { transform: scaleY(0.4); } to { transform: scaleY(1); } }`}</style>
    </div>
  )
}

// Toast Notification
const Toast = ({ msg, tipo }) => (
  <div style={{
    position: 'fixed', top: 24, right: 24, zIndex: 999,
    background: tipo === 'error' ? '#1a0808' : '#0d120a',
    border: `1px solid ${tipo === 'error' ? 'var(--danger)' : 'var(--gold-dim)'}`,
    color: tipo === 'error' ? '#e87070' : 'var(--gold)',
    padding: '12px 20px', borderRadius: 4,
    fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.05em',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    animation: 'slideIn 0.3s var(--ease-out-expo)',
  }}>
    {msg}
    <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>
  </div>
)

// Main App
export default function App() {
  const [canciones, setCanciones] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [criterio, setCriterio] = useState('nombre')
  const [vista, setVista] = useState('canciones')
  const [playlistActiva, setPlaylistActiva] = useState(null)
  const [cancionesPlaylist, setCancionesPlaylist] = useState([])
  const [filtroPlaylist, setFiltroPlaylist] = useState('')
  const [nuevaPlaylist, setNuevaPlaylist] = useState('')
  const [mostrarAgregar, setMostrarAgregar] = useState(false)
  const [mostrarNuevaPlaylist, setMostrarNuevaPlaylist] = useState(false)
  const [formCancion, setFormCancion] = useState({ nombre: '', artista: '', album: '', duracion: '', url: '' })
  const [cancionActual, setCancionActual] = useState(null)
  const [reproduciendo, setReproduciendo] = useState(false)
  const [tiempoActual, setTiempoActual] = useState(0)
  const [duracion, setDuracion] = useState(0)
  const [progreso, setProgreso] = useState(0)
  const [notif, setNotif] = useState(null)
  const [hoverRow, setHoverRow] = useState(null)
  const audioRef = useRef(null)
  const notifRef = useRef(null)
  const progressRef = useRef(null)

  const toast = (msg, tipo = 'ok') => {
    setNotif({ msg, tipo })
    clearTimeout(notifRef.current)
    notifRef.current = setTimeout(() => setNotif(null), 3000)
  }

  const cargarTodas = useCallback(async () => {
    try { 
      const respuesta = await post("ObtenerTodas")
      console.log("📀 Canciones cargadas:", respuesta)
      setCanciones(respuesta.Canciones || [])
    } catch (error) {
      console.error("Error al cargar canciones:", error)
      toast('Error al cargar canciones', 'error')
    }
  }, [])

  const cargarPlaylists = useCallback(async () => {
    try { 
      const respuesta = await post("ObtenerPlaylists")
      console.log("📋 Playlists cargadas:", respuesta)
      setPlaylists(respuesta.Playlists || [])
    } catch (error) {
      console.error("Error al cargar playlists:", error)
    }
  }, [])

  useEffect(() => { 
    cargarTodas()
    cargarPlaylists()
  }, [cargarTodas, cargarPlaylists])

  const buscar = async () => {
    if (!busqueda.trim()) { 
      cargarTodas()
      return 
    }
    
    let comando
    if (criterio === 'nombre') {
      comando = { BuscarPorNombre: busqueda }
    } else if (criterio === 'artista') {
      comando = { BuscarPorArtista: busqueda }
    } else {
      comando = { BuscarPorAlbum: busqueda }
    }
    
    try { 
      const respuesta = await post(comando)
      console.log("🔍 Resultados búsqueda:", respuesta)
      setCanciones(respuesta.Canciones || [])
      if (respuesta.Canciones?.length === 0) {
        toast('No se encontraron canciones', 'error')
      }
    } catch (error) { 
      console.error("Error en búsqueda:", error)
      toast('Error en búsqueda', 'error')
    }
  }

  const limpiarBusqueda = () => {
    setBusqueda('')
    setCriterio('nombre')
    cargarTodas()
  }

  const reproducir = async (cancion) => {
    await post({ IniciarReproduccion: cancion.id }).catch(() => {})
    if (cancionActual?.id === cancion.id) {
      if (reproduciendo) { 
        audioRef.current.pause()
        setReproduciendo(false) 
      } else { 
        audioRef.current.play()
        setReproduciendo(true) 
      }
    } else {
      if (cancionActual) await post({ DetenerReproduccion: cancionActual.id }).catch(() => {})
      setCancionActual(cancion)
      setReproduciendo(true)
    }
  }

  useEffect(() => {
    if (cancionActual && audioRef.current) {
      audioRef.current.src = cancionActual.ruta
      audioRef.current.load()
      audioRef.current.play().catch(() => setReproduciendo(false))
    }
  }, [cancionActual])

  const adelantar = () => { 
    if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duracion) 
  }
  const retroceder = () => { 
    if (audioRef.current) audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0) 
  }

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    setTiempoActual(audioRef.current.currentTime)
    setProgreso(duracion ? (audioRef.current.currentTime / duracion) * 100 : 0)
  }

  const handleSeek = (e) => {
    if (!audioRef.current || !duracion) return
    const rect = progressRef.current.getBoundingClientRect()
    audioRef.current.currentTime = ((e.clientX - rect.left) / rect.width) * duracion
  }

  const crearPlaylist = async () => {
    if (!nuevaPlaylist.trim()) return
    try {
      await post({ CrearPlaylist: nuevaPlaylist })
      toast(`Playlist "${nuevaPlaylist}" creada`)
      setNuevaPlaylist('')
      setMostrarNuevaPlaylist(false)
      cargarPlaylists()
    } catch { 
      toast('Error al crear playlist', 'error') 
    }
  }

  const eliminarPlaylist = async (id, e) => {
    e.stopPropagation()
    if (!confirm('¿Eliminar esta playlist?')) return
    try {
      await post({ EliminarPlaylist: id })
      if (playlistActiva === id) { 
        setPlaylistActiva(null)
        setCancionesPlaylist([])
        setVista('canciones') 
      }
      cargarPlaylists()
      toast('Playlist eliminada')
    } catch { 
      toast('Error', 'error') 
    }
  }

  const verPlaylist = async (pid) => {
    try {
      const data = await post({ ObtenerCancionesDePlaylist: pid })
      setCancionesPlaylist(data.PlaylistCanciones || [])
      setPlaylistActiva(pid)
      setFiltroPlaylist('')
      setVista('playlist')
    } catch { 
      toast('Error al cargar playlist', 'error') 
    }
  }

  const agregarAPlaylist = async (playlistId, cancionId) => {
    try {
      await post({ AgregarAPlaylist: { playlist_id: playlistId, cancion_id: cancionId } })
      toast('Añadido a la playlist')
      if (playlistActiva === playlistId) verPlaylist(playlistId)
      cargarPlaylists()
    } catch { 
      toast('Error', 'error') 
    }
  }

  const eliminarDePlaylist = async (cid) => {
    try {
      await post({ EliminarDePlaylist: { playlist_id: playlistActiva, cancion_id: cid } })
      verPlaylist(playlistActiva)
      cargarPlaylists()
      toast('Eliminado de la playlist')
    } catch { 
      toast('Error', 'error') 
    }
  }

  const ordenarPlaylist = async (crit) => {
    try {
      await post({ OrdenarPlaylist: { playlist_id: playlistActiva, criterio: crit } })
      verPlaylist(playlistActiva)
      toast(`Ordenado por ${crit}`)
    } catch { 
      toast('Error', 'error') 
    }
  }

  const filtrarEnPlaylist = async () => {
    if (!filtroPlaylist.trim()) { 
      verPlaylist(playlistActiva)
      return 
    }
    try {
      const data = await post({ FiltrarEnPlaylist: { playlist_id: playlistActiva, termino: filtroPlaylist } })
      setCancionesPlaylist(data.PlaylistCanciones || [])
    } catch { 
      toast('Error', 'error') 
    }
  }

  const agregarCancion = async () => {
    if (!formCancion.nombre || !formCancion.artista || !formCancion.url) {
      toast('Nombre, artista y URL son requeridos', 'error')
      return
    }
    try {
      const cancion = {
        id: Math.random().toString(36).slice(2) + Date.now().toString(36),
        nombre: formCancion.nombre,
        artista: formCancion.artista,
        album: formCancion.album || 'Sin álbum',
        duracion: parseInt(formCancion.duracion) || 0,
        ruta: formCancion.url,
      }
      await post({ AgregarCancion: cancion })
      setFormCancion({ nombre: '', artista: '', album: '', duracion: '', url: '' })
      setMostrarAgregar(false)
      cargarTodas()
      toast('Canción agregada')
    } catch { 
      toast('Error al agregar', 'error') 
    }
  }

  const eliminarCancion = async (id, nombre, e) => {
    e.stopPropagation()
    if (!confirm(`¿Eliminar "${nombre}"?`)) return
    try {
      const data = await post({ EliminarCancion: id })
      if (data.Error) { 
        toast(data.Error, 'error')
        return 
      }
      cargarTodas()
      toast('Canción eliminada')
    } catch { 
      toast('Error', 'error') 
    }
  }

  const irATodasLasCanciones = async () => {
    console.log("🖱️ Click en Todas las canciones")
    setVista('canciones')
    setBusqueda('')
    setCriterio('nombre')
    setPlaylistActiva(null)
    await cargarTodas()
  }

  const playlistNombre = playlists.find(p => p.id === playlistActiva)?.nombre || ''

  // Styles
  const C = {
    shell: {
      display: 'grid',
      gridTemplateColumns: '260px 1fr',
      gridTemplateRows: '60px 1fr 100px',
      gridTemplateAreas: '"header header" "sidebar main" "player player"',
      minHeight: '100vh',
      background: 'var(--black)',
    },
    header: {
      gridArea: 'header',
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '0 28px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--black)',
    },
    brand: {
      display: 'flex', alignItems: 'center', gap: 10,
      fontFamily: 'var(--font-display)', fontWeight: 700,
      fontSize: 20, letterSpacing: '0.02em', color: 'var(--text)',
    },
    brandAccent: { color: 'var(--gold)', fontStyle: 'italic' },
    headerSpacer: { flex: 1 },
    headerTag: {
      fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em',
      color: 'var(--muted)', textTransform: 'uppercase', marginRight: 8,
    },

    sidebar: {
      gridArea: 'sidebar',
      borderRight: '1px solid var(--border)',
      background: 'var(--deep)',
      display: 'flex', flexDirection: 'column',
      padding: '24px 0',
      overflowY: 'auto',
    },
    sideSection: { padding: '0 20px', marginBottom: 32 },
    sideLabel: {
      fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em',
      color: 'var(--muted)', textTransform: 'uppercase',
      marginBottom: 12, paddingLeft: 4,
      borderLeft: '2px solid var(--gold-dim)', paddingLeft: 8,
    },
    navItem: (active) => ({
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '9px 12px', borderRadius: 3, cursor: 'pointer',
      fontSize: 13, fontWeight: active ? 500 : 300,
      color: active ? 'var(--gold)' : 'var(--text)',
      background: active ? 'rgba(201,168,76,0.08)' : 'transparent',
      transition: 'all 0.15s',
      marginBottom: 2,
      border: active ? '1px solid rgba(201,168,76,0.15)' : '1px solid transparent',
    }),
    plItem: (active) => ({
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '8px 10px', borderRadius: 3, cursor: 'pointer',
      fontSize: 12, fontWeight: active ? 500 : 300,
      color: active ? 'var(--gold)' : 'var(--muted)',
      background: active ? 'rgba(201,168,76,0.06)' : 'transparent',
      transition: 'all 0.15s', marginBottom: 1,
    }),
    plCount: {
      fontFamily: 'var(--font-mono)', fontSize: 9,
      color: 'var(--muted2)', letterSpacing: '0.05em',
    },
    addPlaylistBtn: {
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '8px 10px', cursor: 'pointer',
      fontSize: 11, color: 'var(--muted)',
      fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
      textTransform: 'uppercase',
      border: '1px dashed var(--border)', borderRadius: 3,
      background: 'transparent', width: '100%',
      transition: 'all 0.2s', marginBottom: 8,
    },

    main: {
      gridArea: 'main',
      overflowY: 'auto',
      padding: '32px 36px',
    },
    pageTitle: {
      fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900,
      color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.02em',
    },
    pageSub: {
      fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)',
      letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 28,
    },
    divider: { height: 1, background: 'var(--border)', marginBottom: 24 },

    searchBar: {
      display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 4, padding: '10px 14px',
    },
    searchInput: {
      flex: 1, background: 'none', border: 'none', outline: 'none',
      color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font-body)',
    },
    searchSelect: {
      background: 'none', border: 'none', outline: 'none',
      color: 'var(--muted)', fontSize: 11, cursor: 'pointer',
      fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
    },
    searchDivider: { width: 1, height: 18, background: 'var(--border2)' },

    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
      fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em',
      color: 'var(--muted)', textTransform: 'uppercase', textAlign: 'left',
      padding: '0 12px 12px', borderBottom: '1px solid var(--border)',
      fontWeight: 400,
    },
    tr: (hover, active) => ({
      cursor: 'pointer',
      background: active ? 'rgba(201,168,76,0.04)' : hover ? 'rgba(255,255,255,0.02)' : 'transparent',
      transition: 'background 0.12s',
      borderBottom: '1px solid rgba(42,42,42,0.6)',
    }),
    td: {
      padding: '13px 12px', fontSize: 13, verticalAlign: 'middle',
    },
    tdMono: {
      padding: '13px 12px', fontSize: 11, color: 'var(--muted)',
      fontFamily: 'var(--font-mono)', verticalAlign: 'middle',
    },
    songTitle: (active) => ({
      color: active ? 'var(--gold)' : 'var(--text)',
      fontWeight: active ? 500 : 300,
    }),
    songArtist: { fontSize: 11, color: 'var(--muted)', marginTop: 2 },

    rowActions: {
      display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end',
    },

    btnGold: {
      background: 'var(--gold)', color: 'var(--black)',
      border: 'none', borderRadius: 3, padding: '7px 14px',
      fontSize: 11, fontWeight: 600, cursor: 'pointer',
      fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
      textTransform: 'uppercase', transition: 'background 0.15s',
      display: 'flex', alignItems: 'center', gap: 6,
    },
    btnGhost: (active) => ({
      background: active ? 'rgba(201,168,76,0.12)' : 'transparent',
      color: active ? 'var(--gold)' : 'var(--muted)',
      border: `1px solid ${active ? 'rgba(201,168,76,0.3)' : 'var(--border)'}`,
      borderRadius: 3, padding: '6px 12px',
      fontSize: 10, cursor: 'pointer',
      fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
      textTransform: 'uppercase', transition: 'all 0.15s',
      display: 'flex', alignItems: 'center', gap: 5,
    }),
    btnDanger: {
      background: 'transparent', color: 'var(--danger)',
      border: '1px solid rgba(139,32,32,0.3)',
      borderRadius: 3, padding: '5px 8px',
      fontSize: 10, cursor: 'pointer',
      transition: 'all 0.15s',
      display: 'flex', alignItems: 'center',
    },
    btnIcon: {
      background: 'transparent', border: 'none',
      color: 'var(--gold)', cursor: 'pointer',
      width: 30, height: 30, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background 0.15s',
    },
    btnPlayMain: {
      background: 'var(--gold)', border: 'none',
      color: 'var(--black)', cursor: 'pointer',
      width: 42, height: 42, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'transform 0.15s, background 0.15s',
      flexShrink: 0,
    },

    input: {
      background: 'var(--raised)', border: '1px solid var(--border)',
      borderRadius: 3, padding: '9px 12px',
      color: 'var(--text)', fontSize: 12,
      fontFamily: 'var(--font-body)', outline: 'none',
      transition: 'border-color 0.2s',
      width: '100%',
    },
    formGrid: {
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 4, padding: 20, marginBottom: 20,
    },
    formLabel: {
      fontFamily: 'var(--font-mono)', fontSize: 9,
      color: 'var(--muted)', letterSpacing: '0.1em',
      textTransform: 'uppercase', display: 'block', marginBottom: 5,
    },

    player: {
      gridArea: 'player',
      background: 'var(--deep)',
      borderTop: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      padding: '0 32px', gap: 24,
      position: 'relative',
    },
    playerTrack: { flex: '0 0 240px', minWidth: 0 },
    playerTrackName: {
      fontWeight: 500, fontSize: 13, color: 'var(--text)',
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      marginBottom: 2,
    },
    playerTrackArtist: {
      fontSize: 11, color: 'var(--muted)',
      fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
    },
    playerControls: {
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 8,
    },
    playerBtns: { display: 'flex', alignItems: 'center', gap: 16 },
    progressWrap: {
      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    },
    progressTime: {
      fontFamily: 'var(--font-mono)', fontSize: 10,
      color: 'var(--muted)', minWidth: 36, textAlign: 'center',
    },
    progressBar: {
      flex: 1, height: 3, background: 'var(--border2)',
      borderRadius: 2, cursor: 'pointer', position: 'relative',
    },
    progressFill: {
      height: '100%', background: 'var(--gold)',
      borderRadius: 2, transition: 'width 0.1s linear',
      position: 'relative',
    },
    playerRight: { flex: '0 0 240px', display: 'flex', justifyContent: 'flex-end' },

    toolbar: {
      display: 'flex', alignItems: 'center', gap: 10,
      marginBottom: 20, flexWrap: 'wrap',
    },
    filterBar: {
      display: 'flex', gap: 0, flex: 1, maxWidth: 320,
      border: '1px solid var(--border)', borderRadius: 3, overflow: 'hidden',
      background: 'var(--surface)',
    },
    filterInput: {
      flex: 1, background: 'none', border: 'none', outline: 'none',
      color: 'var(--text)', fontSize: 12, fontFamily: 'var(--font-body)',
      padding: '8px 12px',
    },
    filterBtn: {
      background: 'var(--raised)', border: 'none', borderLeft: '1px solid var(--border)',
      color: 'var(--muted)', cursor: 'pointer', padding: '0 12px',
      display: 'flex', alignItems: 'center', gap: 5,
      fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
  }

  return (
    <div style={C.shell}>
      {/* Header */}
      <header style={C.header}>
        <div style={C.brand}>
          <Logo size={30} />
          <span>Spoti<span style={C.brandAccent}>Cry</span></span>
        </div>
        <div style={C.headerSpacer} />
        <span style={C.headerTag}>2026 · Melany & Edu</span>
      </header>

      {/* Sidebar */}
      <aside style={C.sidebar}>
        <div style={C.sideSection}>
          <div style={C.sideLabel}>Biblioteca</div>
          <div style={C.navItem(vista === 'canciones')} onClick={irATodasLasCanciones}>
            <IconNote />
            <span>Todas las canciones</span>
          </div>
        </div>

        <div style={{ ...C.sideSection, flex: 1 }}>
          <div style={C.sideLabel}>Playlists</div>

          <button style={C.addPlaylistBtn} onClick={() => setMostrarNuevaPlaylist(!mostrarNuevaPlaylist)}>
            <IconPlus /> Nueva playlist
          </button>

          {mostrarNuevaPlaylist && (
            <div style={{ marginBottom: 10 }}>
              <input style={{ ...C.input, marginBottom: 6 }}
                autoFocus
                placeholder="Nombre de la playlist..."
                value={nuevaPlaylist}
                onChange={e => setNuevaPlaylist(e.target.value)}
                onKeyDown={e => e.key === 'Enter' ? crearPlaylist() : e.key === 'Escape' && setMostrarNuevaPlaylist(false)} />
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={{ ...C.btnGold, flex: 1, justifyContent: 'center' }} onClick={crearPlaylist}>Crear</button>
                <button style={{ ...C.btnGhost(false), padding: '7px 10px' }} onClick={() => setMostrarNuevaPlaylist(false)}><IconX /></button>
              </div>
            </div>
          )}

          {playlists.length === 0 && (
            <p style={{ fontSize: 11, color: 'var(--muted2)', fontStyle: 'italic', padding: '8px 4px' }}>
              Sin playlists aún.
            </p>
          )}
          {playlists.map(p => (
            <div key={p.id}
              style={C.plItem(playlistActiva === p.id)}
              onClick={() => verPlaylist(p.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                <IconList />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                <span style={C.plCount}>{p.canciones_ids?.length || 0}</span>
                <button style={{ background: 'none', border: 'none', color: 'var(--muted2)', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center', opacity: 0.6 }}
                  onClick={e => eliminarPlaylist(p.id, e)}><IconX /></button>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Main content */}
      <main style={C.main}>
        {/* VISTA: TODAS LAS CANCIONES */}
        {vista === 'canciones' && <>
          <h1 style={C.pageTitle}>Canciones</h1>
          <p style={C.pageSub}>{canciones.length} pistas en biblioteca</p>

          {/* Search */}
          <div style={C.searchBar}>
            <IconSearch />
            <input style={C.searchInput}
              placeholder="Buscar en la biblioteca..."
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && buscar()} />
            <div style={C.searchDivider} />
            <select style={C.searchSelect} value={criterio} onChange={e => setCriterio(e.target.value)}>
              <option value="nombre">NOMBRE</option>
              <option value="artista">ARTISTA</option>
              <option value="album">ÁLBUM</option>
            </select>
            <div style={C.searchDivider} />
            <button style={{ ...C.btnGhost(false), border: 'none' }} onClick={buscar}><IconSearch /> Buscar</button>
            {busqueda && <button style={{ ...C.btnGhost(false), border: 'none' }} onClick={limpiarBusqueda}><IconX /> Limpiar</button>}
          </div>

          {/* Add song toggle */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button style={C.btnGold} onClick={() => setMostrarAgregar(!mostrarAgregar)}>
              {mostrarAgregar ? <><IconX /> Cancelar</> : <><IconPlus /> Agregar canción</>}
            </button>
          </div>

          {/* Add song form */}
          {mostrarAgregar && (
            <div style={C.formGrid}>
              {[
                ['nombre', 'Nombre *'], ['artista', 'Artista *'],
                ['album', 'Álbum'], ['duracion', 'Duración (segundos)'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label style={C.formLabel}>{label}</label>
                  <input style={C.input} placeholder={label}
                    value={formCancion[key]}
                    onChange={e => setFormCancion(f => ({ ...f, [key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ gridColumn: '1/-1' }}>
                <label style={C.formLabel}>URL del archivo de audio *</label>
                <input style={C.input} placeholder="https://..."
                  value={formCancion.url}
                  onChange={e => setFormCancion(f => ({ ...f, url: e.target.value }))} />
              </div>
              <div style={{ gridColumn: '1/-1', display: 'flex', justifyContent: 'flex-end' }}>
                <button style={C.btnGold} onClick={agregarCancion}>Guardar canción</button>
              </div>
            </div>
          )}

          <div style={C.divider} />

          {/* Songs table */}
          <table style={C.table}>
            <thead>
              <tr>
                <th style={{ ...C.th, width: 40 }}>#</th>
                <th style={C.th}>Título</th>
                <th style={C.th}>Artista</th>
                <th style={C.th}>Álbum</th>
                <th style={{ ...C.th, textAlign: 'right' }}>Dur.</th>
                <th style={{ ...C.th, width: 160 }}></th>
              </tr>
            </thead>
            <tbody>
              {canciones.map((c, i) => {
                const isActive = cancionActual?.id === c.id
                const isHover = hoverRow === c.id
                return (
                  <tr key={c.id}
                    style={C.tr(isHover, isActive)}
                    onMouseEnter={() => setHoverRow(c.id)}
                    onMouseLeave={() => setHoverRow(null)}
                    onClick={() => reproducir(c)}>
                    <td style={C.tdMono}>
                      {isActive
                        ? <Waveform active={reproduciendo} />
                        : isHover ? <div style={{ color: 'var(--gold)' }}><IconPlay /></div>
                        : <span style={{ opacity: 0.4 }}>{i + 1}</span>}
                    </td>
                    <td style={C.td}>
                      <div style={C.songTitle(isActive)}>{c.nombre}</div>
                    </td>
                    <td style={C.tdMono}>{c.artista}</td>
                    <td style={{ ...C.tdMono, color: 'var(--muted2)' }}>{c.album}</td>
                    <td style={{ ...C.tdMono, textAlign: 'right' }}>{fmt(c.duracion)}</td>
                    <td style={C.td} onClick={e => e.stopPropagation()}>
                      <div style={C.rowActions}>
                        {(isHover || isActive) && <>
                          <select style={{ ...C.searchSelect, background: 'var(--raised)', border: '1px solid var(--border)', borderRadius: 3, padding: '5px 8px', color: 'var(--muted)' }}
                            defaultValue=""
                            onChange={e => { if (e.target.value) { agregarAPlaylist(e.target.value, c.id); e.target.value = '' } }}>
                            <option value="" disabled>+ Playlist</option>
                            {playlists.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                          </select>
                          <button style={C.btnDanger} onClick={e => eliminarCancion(c.id, c.nombre, e)} title="Eliminar">
                            <IconTrash />
                          </button>
                        </>}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {canciones.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted2)' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8 }}>Sin resultados</p>
              <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>Intenta con otro criterio de búsqueda</p>
            </div>
          )}
        </>}

        {/* VISTA: PLAYLIST */}
        {vista === 'playlist' && playlistActiva && <>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 4 }}>
            <button style={{ ...C.btnGhost(false), marginTop: 6 }} onClick={() => setVista('canciones')}>
              <IconChevronLeft /> Volver
            </button>
            <div>
              <h1 style={{ ...C.pageTitle }}>{playlistNombre}</h1>
              <p style={C.pageSub}>{cancionesPlaylist.length} canciones</p>
            </div>
          </div>

          {/* Toolbar */}
          <div style={C.toolbar}>
            <div style={C.filterBar}>
              <input style={C.filterInput}
                placeholder="Filtrar en esta playlist..."
                value={filtroPlaylist}
                onChange={e => setFiltroPlaylist(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && filtrarEnPlaylist()} />
              <button style={C.filterBtn} onClick={filtrarEnPlaylist}><IconFilter /> Filtrar</button>
              {filtroPlaylist && <button style={{ ...C.filterBtn, borderLeft: '1px solid var(--border)' }} onClick={() => { setFiltroPlaylist(''); verPlaylist(playlistActiva) }}><IconX /></button>}
            </div>
            <button style={C.btnGhost(false)} onClick={() => ordenarPlaylist('nombre')}>
              <IconSort /> Nombre
            </button>
            <button style={C.btnGhost(false)} onClick={() => ordenarPlaylist('artista')}>
              <IconSort /> Artista
            </button>
          </div>

          <div style={C.divider} />

          <table style={C.table}>
            <thead>
              <tr>
                <th style={{ ...C.th, width: 40 }}>#</th>
                <th style={C.th}>Título</th>
                <th style={C.th}>Artista</th>
                <th style={C.th}>Álbum</th>
                <th style={{ ...C.th, textAlign: 'right' }}>Dur.</th>
                <th style={{ ...C.th, width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {cancionesPlaylist.map((c, i) => {
                const isActive = cancionActual?.id === c.id
                const isHover = hoverRow === c.id
                return (
                  <tr key={c.id}
                    style={C.tr(isHover, isActive)}
                    onMouseEnter={() => setHoverRow(c.id)}
                    onMouseLeave={() => setHoverRow(null)}
                    onClick={() => reproducir(c)}>
                    <td style={C.tdMono}>
                      {isActive ? <Waveform active={reproduciendo} />
                        : isHover ? <div style={{ color: 'var(--gold)' }}><IconPlay /></div>
                        : <span style={{ opacity: 0.4 }}>{i + 1}</span>}
                    </td>
                    <td style={C.td}><div style={C.songTitle(isActive)}>{c.nombre}</div></td>
                    <td style={C.tdMono}>{c.artista}</td>
                    <td style={{ ...C.tdMono, color: 'var(--muted2)' }}>{c.album}</td>
                    <td style={{ ...C.tdMono, textAlign: 'right' }}>{fmt(c.duracion)}</td>
                    <td style={C.td} onClick={e => e.stopPropagation()}>
                      {(isHover || isActive) && (
                        <div style={C.rowActions}>
                          <button style={C.btnDanger} onClick={() => eliminarDePlaylist(c.id)} title="Quitar de playlist">
                            <IconX />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {cancionesPlaylist.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted2)' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 8 }}>Playlist vacía</p>
              <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>Agrega canciones desde la biblioteca</p>
            </div>
          )}
        </>}
      </main>

      {/* Player bar */}
      <div style={C.player}>
        <audio ref={audioRef}
          onTimeUpdate={handleTimeUpdate}
          onDurationChange={e => setDuracion(e.target.duration || 0)}
          onEnded={() => { setReproduciendo(false); if (cancionActual) post({ DetenerReproduccion: cancionActual.id }).catch(() => {}) }}
          onPlay={() => setReproduciendo(true)}
          onPause={() => setReproduciendo(false)} />

        {/* Track info */}
        <div style={C.playerTrack}>
          {cancionActual ? <>
            <div style={C.playerTrackName}>{cancionActual.nombre}</div>
            <div style={C.playerTrackArtist}>{cancionActual.artista}</div>
          </> : (
            <div style={{ color: 'var(--muted2)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
              Sin reproducción activa
            </div>
          )}
        </div>

        {/* Controls + progress */}
        <div style={C.playerControls}>
          <div style={C.playerBtns}>
            <button style={C.btnIcon} onClick={retroceder} title="-10s"><IconSkipBack /></button>
            <button style={C.btnPlayMain}
              onClick={() => cancionActual && reproducir(cancionActual)}
              disabled={!cancionActual}>
              {reproduciendo ? <IconPause /> : <IconPlay />}
            </button>
            <button style={C.btnIcon} onClick={adelantar} title="+10s"><IconSkipFwd /></button>
          </div>
          <div style={C.progressWrap}>
            <span style={C.progressTime}>{fmt(tiempoActual)}</span>
            <div ref={progressRef} style={C.progressBar} onClick={handleSeek}>
              <div style={{ ...C.progressFill, width: `${progreso}%` }} />
            </div>
            <span style={C.progressTime}>{fmt(duracion)}</span>
          </div>
        </div>

        {/* Right side */}
        <div style={C.playerRight}>
          <Waveform active={reproduciendo} />
        </div>
      </div>

      {/* Toast */}
      {notif && <Toast msg={notif.msg} tipo={notif.tipo} />}
    </div>
  )
}