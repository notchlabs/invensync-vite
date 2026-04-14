import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import {
  Search,
  MapPin,
  Save,
  CheckCircle,
  AlertCircle,
  Clock,
  Navigation,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Skeleton from 'react-loading-skeleton'
import { PageHeader } from '../../components/common/PageHeader'
import { CustomSelect } from '../../components/common/CustomSelect'
import { MultiSelectUser, type SelectedUser } from '../../components/common/MultiSelectUser'
import { ApiService } from '../../services/common/apiService'
import { SitesService, type SiteCreatePayload, type SiteUpdatePayload } from '../../services/sitesService'
import { useGoogleMaps } from '../../hooks/useGoogleMaps'

const PROJECT_TYPES = [
  { value: 'RESIDENTIAL', label: 'Residential' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'INDUSTRIAL', label: 'Infrastructure' },
]

const INDIA_CENTER = { lat: 20.5937, lng: 78.9629 }

interface AddressInfo {
  fullAddress: string
  city: string
  state: string
  country: string
  zipCode: string
  lat: number | null
  lng: number | null
}

const EMPTY_ADDRESS: AddressInfo = {
  fullAddress: '',
  city: '',
  state: '',
  country: '',
  zipCode: '',
  lat: null,
  lng: null,
}

function extractAddressComponents(components: any[], formattedAddress = ''): Partial<AddressInfo> {
  let city = '', state = '', country = '', zipCode = ''
  components.forEach((c: any) => {
    if (c.types.includes('locality')) city = c.long_name
    if (c.types.includes('administrative_area_level_1')) state = c.long_name
    if (c.types.includes('country')) country = c.long_name
    if (c.types.includes('postal_code') || c.types.includes('postal_code_prefix')) zipCode = c.long_name
  })
  // Fallback: extract 6-digit Indian PIN code from the formatted address string
  if (!zipCode && formattedAddress) {
    const match = /\b\d{6}\b/.exec(formattedAddress)
    if (match) zipCode = match[0]
  }
  return { city, state, country, zipCode }
}

function toDateInput(iso: string | null): string {
  if (!iso) return ''
  return iso.split('T')[0]
}

function plural(n: number, word: string) {
  return `${n} ${word}${n !== 1 ? 's' : ''}`
}

function formatDuration(startStr: string, endStr: string, inProgress: boolean): string | null {
  if (!startStr) return null
  const start = new Date(startStr)
  const end = !inProgress && endStr ? new Date(endStr) : new Date()
  const totalDays = Math.floor((end.getTime() - start.getTime()) / 86_400_000)
  if (totalDays <= 0) return null

  const years = Math.floor(totalDays / 365)
  if (years >= 1) {
    const rem = totalDays - years * 365
    return [plural(years, 'year'), rem > 0 ? plural(rem, 'day') : ''].filter(Boolean).join(' ')
  }

  const weeks = Math.floor(totalDays / 7)
  if (weeks >= 1) {
    const rem = totalDays % 7
    return [plural(weeks, 'week'), rem > 0 ? plural(rem, 'day') : ''].filter(Boolean).join(' ')
  }

  return plural(totalDays, 'day')
}

export default function SiteFormPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const isEdit = location.pathname.includes('/edit')
  const editName = searchParams.get('name') || ''
  const existingSiteId = useRef<number | null>(null)

  // Google Maps
  const mapsReady = useGoogleMaps()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const autocompleteRef = useRef<HTMLInputElement>(null)
  const autocompleteInstanceRef = useRef<any>(null)
  const didInitialCenter = useRef(false)
  const [placeSearch, setPlaceSearch] = useState('')

  // Address state
  const [address, setAddress] = useState<AddressInfo>(EMPTY_ADDRESS)

  // Form state
  const [siteName, setSiteName] = useState('')
  const [projectType, setProjectType] = useState('COMMERCIAL')
  const [managers, setManagers] = useState<SelectedUser[]>([])
  const [consumers, setConsumers] = useState<SelectedUser[]>([])
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState('')
  const [isInProgress, setIsInProgress] = useState(true)

  // Name exists check
  const [nameExists, setNameExists] = useState<boolean | null>(null)
  const [isCheckingName, setIsCheckingName] = useState(false)
  const nameCheckTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Page loading / saving
  const [isLoadingSite, setIsLoadingSite] = useState(isEdit)
  const [isSaving, setIsSaving] = useState(false)

  // ─── Map helpers ────────────────────────────────────────────────────────────

  const centerMapAt = useCallback((lat: number, lng: number, zoom = 15) => {
    const g = (window as any).google
    if (mapRef.current) {
      mapRef.current.setCenter({ lat, lng })
      mapRef.current.setZoom(zoom)
    }
    if (markerRef.current && g) {
      markerRef.current.position = new g.maps.LatLng(lat, lng)
    }
  }, [])

  const applyPlace = useCallback((place: any, lat: number, lng: number) => {
    const extracted = extractAddressComponents(place.address_components || [])
    setAddress({
      fullAddress: place.formatted_address || '',
      city: extracted.city || '',
      state: extracted.state || '',
      country: extracted.country || '',
      zipCode: extracted.zipCode || '',
      lat,
      lng,
    })
    setPlaceSearch(place.formatted_address || '')
  }, [])

  // ─── Init Google Map ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapsReady || !mapContainerRef.current || mapRef.current) return
    const g = (window as any).google

    const map = new g.maps.Map(mapContainerRef.current, {
      center: INDIA_CENTER,
      zoom: 5,
      mapId: 'invensync-site-map',
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    })
    mapRef.current = map

    const marker = new g.maps.marker.AdvancedMarkerElement({
      map,
      position: INDIA_CENTER,
      gmpDraggable: true,
    })
    markerRef.current = marker

    // Reverse geocode on drag
    marker.addListener('dragend', () => {
      const pos = marker.position
      const lat = typeof pos.lat === 'function' ? pos.lat() : pos.lat
      const lng = typeof pos.lng === 'function' ? pos.lng() : pos.lng
      const geocoder = new g.maps.Geocoder()
      geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          applyPlace(results[0], lat, lng)
        }
      })
    })

    // Autocomplete on the search input
    if (autocompleteRef.current) {
      const ac = new g.maps.places.Autocomplete(autocompleteRef.current, {
        fields: ['geometry', 'formatted_address', 'address_components'],
      })
      autocompleteInstanceRef.current = ac
      ac.addListener('place_changed', () => {
        const place = ac.getPlace()
        if (!place.geometry?.location) return
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        applyPlace(place, lat, lng)
        centerMapAt(lat, lng)
      })
    }
  }, [mapsReady, applyPlace, centerMapAt])

  // Center map once initial edit address is available
  useEffect(() => {
    if (!mapsReady || !mapRef.current || !address.lat || !address.lng || didInitialCenter.current) return
    centerMapAt(address.lat, address.lng)
    didInitialCenter.current = true
  }, [mapsReady, address.lat, address.lng, centerMapAt])

  // ─── Load existing site data ─────────────────────────────────────────────────

  useEffect(() => {
    if (!isEdit || !editName) return
    SitesService.getSiteByName(editName)
      .then(async res => {
        const s = res.data
        existingSiteId.current = s.id
        setSiteName(s.name)
        setProjectType(s.projectType)
        setIsInProgress(s.status === 'INPROGRESS')
        setStartDate(toDateInput(s.startDate))
        setEndDate(toDateInput(s.endDate))
        setAddress({
          fullAddress: s.address,
          city: s.city,
          state: s.state,
          country: s.country,
          zipCode: String(s.zipCode),
          lat: s.gpsLat,
          lng: s.gpsLng,
        })
        setPlaceSearch(s.address)

        // Match managerNames against Graph users to get full user objects
        if (s.managerNames?.length > 0) {
          try {
            const graphData = await ApiService.get<{ value: any[] }>(
              'https://graph.microsoft.com/v1.0/users?$select=displayName,id,mail,mobilePhone&$top=100'
            )
            const matched: SelectedUser[] = (graphData.value || [])
              .filter(u => s.managerNames.includes(u.displayName))
              .map(u => ({
                id: u.id,
                name: u.displayName,
                email: u.mail || '',
                phone: u.mobilePhone || '',
              }))
            setManagers(matched)
          } catch {
            // non-fatal — managers just won't be pre-selected
          }
        }

        // Map inventoryConsumers if the API returns full objects
        if (s.inventoryConsumers?.length > 0) {
          const mapped: SelectedUser[] = s.inventoryConsumers
            .filter((c: any) => c.id)
            .map((c: any) => ({
              id: c.id,
              name: c.name || c.displayName || '',
              email: c.email || c.mail || '',
              phone: c.phone || c.mobilePhone || '',
            }))
          setConsumers(mapped)
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingSite(false))
  }, [isEdit, editName])

  // ─── Site name exists check (create mode only) ───────────────────────────────

  useEffect(() => {
    if (isEdit || !siteName.trim()) {
      setNameExists(null)
      return
    }
    if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current)
    setIsCheckingName(true)
    nameCheckTimer.current = setTimeout(() => {
      SitesService.checkExists(siteName.trim())
        .then(res => setNameExists(res.data))
        .catch(() => setNameExists(null))
        .finally(() => setIsCheckingName(false))
    }, 500)
    return () => {
      if (nameCheckTimer.current) clearTimeout(nameCheckTimer.current)
    }
  }, [siteName, isEdit])

  // ─── Duration ────────────────────────────────────────────────────────────────

  const duration = formatDuration(startDate, endDate, isInProgress)

  // ─── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!siteName.trim()) { toast.error('Site name is required'); return }
    if (!address.fullAddress) { toast.error('Please select a location on the map'); return }
    if (!startDate) { toast.error('Start date is required'); return }

    setIsSaving(true)
    try {
      const commonFields = {
        name: siteName.trim(),
        projectType,
        address: address.fullAddress,
        city: address.city,
        state: address.state,
        country: address.country,
        gpsLat: address.lat,
        gpsLng: address.lng,
        startDate: startDate ? `${startDate}T00:00:00.000Z` : null,
        endDate: !isInProgress && endDate ? `${endDate}T00:00:00.000Z` : null,
        manager: managers,
        inventoryConsumers: consumers,
      }

      let siteId: number | null = null

      if (isEdit && existingSiteId.current) {
        const updatePayload: SiteUpdatePayload = {
          ...commonFields,
          id: existingSiteId.current,
          zipCode: Number(address.zipCode) || 0,
        }
        await SitesService.updateSite(updatePayload)
        siteId = existingSiteId.current
      } else {
        const createPayload: SiteCreatePayload = {
          ...commonFields,
          id: null,
          zipCode: address.zipCode,
        }
        const res = await SitesService.createSite(createPayload)
        siteId = res.data?.id ?? null
      }

      if (managers.length > 0 && siteId) {
        await SitesService.assignManagers(siteId, managers)
      }

      toast.success(isEdit ? 'Site updated successfully' : 'Site created successfully')
      navigate('/app/panel/sites')
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save site')
    } finally {
      setIsSaving(false)
    }
  }

  const hasAddress = !!(address.city || address.state || address.fullAddress)

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (isLoadingSite) {
    return (
      <div className="p-4 md:p-6 max-w-[1500px] mx-auto w-full flex flex-col overflow-y-auto h-full">
        {/* Header skeleton */}
        <div className="flex items-start justify-between mb-6 shrink-0">
          <div className="flex flex-col gap-2">
            <Skeleton width={160} height={28} borderRadius={8} />
            <Skeleton width={220} height={14} borderRadius={4} />
          </div>
          <Skeleton width={130} height={40} borderRadius={12} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-6">
          {/* Left column skeleton */}
          <div className="flex flex-col gap-4">
            {/* Map card */}
            <div className="bg-card border border-border-main rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <Skeleton width="50%" height={16} borderRadius={6} />
              <Skeleton width="80%" height={12} borderRadius={4} />
              <Skeleton height={38} borderRadius={8} />
              <Skeleton height={300} borderRadius={12} />
            </div>
            {/* Address card */}
            <div className="bg-card border border-border-main rounded-2xl p-4 shadow-sm flex flex-col gap-3">
              <Skeleton width="40%" height={16} borderRadius={6} />
              <Skeleton height={54} borderRadius={12} />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton height={52} borderRadius={12} />
                <Skeleton height={52} borderRadius={12} />
                <Skeleton height={52} borderRadius={12} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Skeleton height={52} borderRadius={12} />
                <Skeleton height={52} borderRadius={12} />
                <Skeleton height={52} borderRadius={12} />
              </div>
            </div>
          </div>

          {/* Right column skeleton */}
          <div className="flex flex-col gap-4">
            {/* Site Information card */}
            <div className="bg-card border border-border-main rounded-2xl p-5 shadow-sm flex flex-col gap-5">
              <Skeleton width="45%" height={16} borderRadius={6} />
              <div className="flex flex-col gap-1.5">
                <Skeleton width="25%" height={12} borderRadius={4} />
                <Skeleton height={42} borderRadius={8} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Skeleton width="25%" height={12} borderRadius={4} />
                <Skeleton height={42} borderRadius={8} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Skeleton width="35%" height={12} borderRadius={4} />
                <Skeleton height={42} borderRadius={8} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Skeleton width="45%" height={12} borderRadius={4} />
                <Skeleton height={42} borderRadius={8} />
              </div>
            </div>
            {/* Project Timeline card */}
            <div className="bg-card border border-border-main rounded-2xl p-5 shadow-sm flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <Skeleton width="40%" height={16} borderRadius={6} />
                <Skeleton width="60%" height={12} borderRadius={4} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Skeleton width="20%" height={12} borderRadius={4} />
                <Skeleton height={42} borderRadius={8} />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton width={20} height={20} borderRadius={6} />
                <Skeleton width={160} height={14} borderRadius={4} />
              </div>
              <Skeleton height={44} borderRadius={12} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-[1500px] mx-auto w-full flex flex-col overflow-y-auto h-full">
      {/* Page Header */}
      <div className="flex items-start justify-between mb-6 shrink-0">
        <PageHeader
          title={isEdit ? `Edit Site` : 'Create Site'}
          description={isEdit ? `Editing "${editName}"` : 'Add a new site to your portfolio'}
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[13px] font-bold rounded-xl hover:opacity-90 transition-opacity shrink-0 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          <Save size={14} />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pb-6">

        {/* ── Left: Map + Address ──────────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Map Card */}
          <div className="bg-card border border-border-main rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-border-main/50">
              <h2 className="text-[14px] font-bold text-primary-text">Enter Nearest Landmark</h2>
              <p className="text-[12px] text-muted-text mt-0.5">
                Search an address or drag the marker to set the exact location
              </p>
            </div>

            {/* Search */}
            <div className="p-4 pb-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-text" />
                <input
                  ref={autocompleteRef}
                  type="text"
                  value={placeSearch}
                  onChange={e => setPlaceSearch(e.target.value)}
                  placeholder={mapsReady ? 'Start typing to search address using Google Maps...' : 'Loading Google Maps...'}
                  disabled={!mapsReady}
                  className="w-full h-[38px] pl-9 pr-4 bg-surface border border-border-main rounded-lg text-[12px] font-semibold text-primary-text outline-none focus:border-secondary-text transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Map container */}
            <div className="px-4 pb-4">
              <div
                ref={mapContainerRef}
                className="w-full rounded-xl border border-border-main/50 overflow-hidden bg-surface"
                style={{ height: 300 }}
              >
                {!mapsReady && (
                  <div className="w-full h-full flex items-center justify-center gap-2 text-muted-text">
                    <div className="w-5 h-5 border-2 border-muted-text border-t-transparent rounded-full animate-spin" />
                    <span className="text-[12px] font-medium">Loading map...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Address Details Info Card */}
          {hasAddress && (
            <div className="bg-card border border-border-main rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Navigation size={14} className="text-muted-text" />
                <h2 className="text-[14px] font-bold text-primary-text">Address Details</h2>
              </div>

              <div className="flex flex-col gap-2">
                {address.fullAddress && (
                  <div className="flex items-start gap-2.5 p-3 bg-surface rounded-xl border border-border-main/50">
                    <MapPin size={13} className="text-muted-text shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-muted-text uppercase tracking-wider mb-0.5">
                        Full Address
                      </p>
                      <p className="text-[12px] font-semibold text-primary-text leading-relaxed">
                        {address.fullAddress}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'City', value: address.city },
                    { label: 'State', value: address.state },
                    { label: 'Country', value: address.country },
                  ].map(({ label, value }) =>
                    value ? (
                      <div
                        key={label}
                        className="p-2.5 bg-surface rounded-xl border border-border-main/50"
                      >
                        <p className="text-[9px] font-bold text-muted-text uppercase tracking-wider">
                          {label}
                        </p>
                        <p className="text-[12px] font-bold text-primary-text mt-0.5 truncate">{value}</p>
                      </div>
                    ) : null
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 bg-surface rounded-xl border border-border-main/50">
                    <p className="text-[9px] font-bold text-muted-text uppercase tracking-wider mb-0.5">
                      Zip Code
                    </p>
                    <input
                      type="text"
                      value={address.zipCode}
                      onChange={e => setAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                      placeholder="e.g. 768105"
                      className="w-full bg-transparent text-[12px] font-bold text-primary-text outline-none placeholder:text-muted-text/50"
                    />
                  </div>
                  {address.lat != null && (
                    <div className="p-2.5 bg-surface rounded-xl border border-border-main/50">
                      <p className="text-[9px] font-bold text-muted-text uppercase tracking-wider">
                        Latitude
                      </p>
                      <p className="text-[12px] font-bold text-primary-text mt-0.5">
                        {address.lat.toFixed(6)}
                      </p>
                    </div>
                  )}
                  {address.lng != null && (
                    <div className="p-2.5 bg-surface rounded-xl border border-border-main/50">
                      <p className="text-[9px] font-bold text-muted-text uppercase tracking-wider">
                        Longitude
                      </p>
                      <p className="text-[12px] font-bold text-primary-text mt-0.5">
                        {address.lng.toFixed(6)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Form ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-4">

          {/* Site Information */}
          <div className="bg-card border border-border-main rounded-2xl p-5 shadow-sm flex flex-col gap-5">
            <h2 className="text-[14px] font-bold text-primary-text">Site Information</h2>

            {/* Site Name */}
            <div>
              <label htmlFor="site-name" className="block text-[12px] font-semibold text-secondary-text mb-1.5">
                Site Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="site-name"
                  type="text"
                  value={siteName}
                  onChange={e => setSiteName(e.target.value)}
                  placeholder="Enter site name here"
                  className="w-full h-[42px] px-4 pr-10 bg-surface border border-border-main rounded-lg text-[13px] font-semibold text-primary-text outline-none focus:border-secondary-text focus:ring-2 focus:ring-accent/5 transition-all"
                />
                {!isEdit && siteName.trim() && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isCheckingName ? (
                      <div className="w-4 h-4 border-2 border-muted-text border-t-transparent rounded-full animate-spin" />
                    ) : nameExists === true ? (
                      <AlertCircle size={16} className="text-amber-500" />
                    ) : nameExists === false ? (
                      <CheckCircle size={16} className="text-emerald-500" />
                    ) : null}
                  </div>
                )}
              </div>
              {!isEdit && nameExists === true && (
                <p className="text-[11px] text-amber-500 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle size={11} />
                  A site with this name already exists.
                </p>
              )}
              {!isEdit && nameExists === false && siteName.trim() && (
                <p className="text-[11px] text-emerald-500 font-semibold mt-1.5 flex items-center gap-1">
                  <CheckCircle size={11} />
                  Name is available.
                </p>
              )}
            </div>

            {/* Project Type */}
            <div>
              <p className="block text-[12px] font-semibold text-secondary-text mb-1.5">
                Project Type
              </p>
              <div className="h-[42px] border border-border-main rounded-lg">
                <CustomSelect
                  placeholder="Select project type"
                  options={PROJECT_TYPES}
                  value={projectType}
                  onChange={setProjectType}
                  className="h-[42px] rounded-lg border-none"
                />
              </div>
            </div>

            {/* Select Managers */}
            <div>
              <p className="text-[12px] font-semibold text-secondary-text mb-1.5">
                Select Manager(s)
              </p>
              <MultiSelectUser
                placeholder="Select one or more managers..."
                selectedUsers={managers}
                onChange={setManagers}
              />
            </div>

            {/* Inventory Consumers */}
            <div>
              <p className="text-[12px] font-semibold text-secondary-text mb-1.5">
                Select Inventory Consumers
              </p>
              <MultiSelectUser
                placeholder="Select users who will be inventory consumers (daily usage)..."
                selectedUsers={consumers}
                onChange={setConsumers}
              />
            </div>
          </div>

          {/* Project Timeline */}
          <div className="bg-card border border-border-main rounded-2xl p-5 shadow-sm flex flex-col gap-5">
            <div>
              <h2 className="text-[14px] font-bold text-primary-text">Project Timeline</h2>
              <p className="text-[12px] text-muted-text mt-0.5">Set the timeline for the project</p>
            </div>

            {/* Start Date */}
            <div>
              <label htmlFor="start-date" className="block text-[12px] font-semibold text-secondary-text mb-1.5">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full h-[42px] px-4 bg-surface border border-border-main rounded-lg text-[13px] font-semibold text-primary-text outline-none focus:border-secondary-text focus:ring-2 focus:ring-accent/5 transition-all"
              />
            </div>

            {/* In Progress Checkbox */}
            <label className="flex items-center gap-3 cursor-pointer select-none group">
              <div className="relative shrink-0">
                <input
                  type="checkbox"
                  checked={isInProgress}
                  onChange={e => {
                    setIsInProgress(e.target.checked)
                    if (e.target.checked) setEndDate('')
                  }}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                    isInProgress
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-border-main bg-surface group-hover:border-secondary-text'
                  }`}
                >
                  {isInProgress && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path
                        d="M1 4L3.5 6.5L9 1"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-[13px] font-semibold text-primary-text">Project is in progress</span>
            </label>

            {/* End Date — only when not in progress */}
            {!isInProgress && (
              <div>
                <label htmlFor="end-date" className="block text-[12px] font-semibold text-secondary-text mb-1.5">
                  End Date
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full h-[42px] px-4 bg-surface border border-border-main rounded-lg text-[13px] font-semibold text-primary-text outline-none focus:border-secondary-text focus:ring-2 focus:ring-accent/5 transition-all"
                />
              </div>
            )}

            {/* Duration display */}
            {duration && (
              <div className="flex items-center gap-2.5 px-4 py-3 bg-surface rounded-xl border border-border-main/50">
                <Clock size={14} className="text-muted-text shrink-0" />
                <span className="text-[12px] font-semibold text-secondary-text">
                  Duration:{' '}
                  <span className="text-primary-text">{duration}</span>
                </span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
