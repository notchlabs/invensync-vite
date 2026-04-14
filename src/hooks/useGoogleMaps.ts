const API_KEY = 'AIzaSyBtqAPYV_xdqGjcYSYTuZ3VjMHwenaV8EM'

let _loaded = false
let _loading = false
const _callbacks: Array<() => void> = []

import { useEffect, useState } from 'react'

export function useGoogleMaps(): boolean {
  const [ready, setReady] = useState(_loaded)

  useEffect(() => {
    if (_loaded) return

    _callbacks.push(() => setReady(true))

    if (!_loading) {
      _loading = true
      ;(window as unknown as { __gmapsInit: () => void }).__gmapsInit = () => {
        _loaded = true
        _loading = false
        _callbacks.forEach(cb => cb())
        _callbacks.length = 0
      }
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places,marker&v=beta&callback=__gmapsInit`
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }
  }, [])

  return ready
}
