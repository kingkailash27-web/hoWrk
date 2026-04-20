import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const UserIcon = L.divIcon({
    className: 'custom-user-icon',
    html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

const SOSIcon = L.divIcon({
    className: 'custom-sos-icon',
    html: `<div class="w-6 h-6 bg-red-600 rounded-full border-4 border-white shadow-2xl animate-ping"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
});

const ResourceIcon = L.divIcon({
    className: 'custom-resource-icon',
    html: `<div class="w-3 h-3 bg-black rounded-full border border-white shadow-md"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

// Helper to auto-center map when location updates
const RecenterMap = ({ lat, lng }: { lat: number, lng: number }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.panTo([lat, lng], { animate: true, duration: 1.5 });
        }
    }, [lat, lng, map]);
    return null;
};

interface LiveMapProps {
    isTracking: boolean;
    isSOS: boolean;
    resources: any[];
    path?: [number, number][];
    onLocationUpdate?: (lat: number, lng: number) => void;
}

// Helper to invalidate size when map becomes visible
const SizeInvalidator = () => {
    const map = useMap();
    useEffect(() => {
        setTimeout(() => {
            map.invalidateSize();
        }, 300);
    }, [map]);
    return null;
};

export const LiveMap = ({ isTracking, isSOS, resources, path, onLocationUpdate }: LiveMapProps) => {
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [accuracy, setAccuracy] = useState<number>(0);

    useEffect(() => {
        if (!isTracking && !isSOS) {
            setPosition(null);
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;
                setPosition([latitude, longitude]);
                setAccuracy(accuracy);
                if (onLocationUpdate) onLocationUpdate(latitude, longitude);
            },
            (err) => console.error('Map Tracking Error:', err),
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [isTracking, isSOS]);

    // Periodic 10-second polling when Safe Walk is active
    useEffect(() => {
        if (!isTracking) return;

        const interval = setInterval(() => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude, accuracy } = pos.coords;
                    setPosition([latitude, longitude]);
                    setAccuracy(accuracy);
                    if (onLocationUpdate) onLocationUpdate(latitude, longitude);
                    console.log(`[10s Poll] Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`);
                },
                (err) => console.warn('[10s Poll] Skipped (will retry):', err.message),
                { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }
            );
        }, 10000);

        return () => clearInterval(interval);
    }, [isTracking]);


    return (
        <div className="w-full h-full rounded-3xl overflow-hidden border border-black/5 shadow-inner bg-neutral-100 relative">
            {!position && (
                <div className="absolute inset-0 z-[1000] bg-white/40 backdrop-blur-sm flex items-center justify-center text-center p-6">
                    <p className="text-[10px] font-mono text-black/40 uppercase tracking-widest">
                        {isTracking || isSOS ? 'Initializing Secure Stream...' : 'Location Feed Offline'}
                    </p>
                </div>
            )}

            <MapContainer
                center={[0, 0]}
                zoom={18}
                style={{ height: '100%', width: '100%', background: '#f5f5f5' }}
                zoomControl={false}
                scrollWheelZoom={true}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                />

                <SizeInvalidator />

                {position && (
                    <>
                        <RecenterMap lat={position[0]} lng={position[1]} />
                        <Circle
                            center={position}
                            radius={accuracy}
                            pathOptions={{ fillColor: isSOS ? '#dc2626' : '#3b82f6', fillOpacity: 0.1, stroke: false }}
                        />
                        <Marker position={position} icon={isSOS ? SOSIcon : UserIcon}>
                            <Popup>
                                <div className="text-[10px] font-mono uppercase font-bold">
                                    {isSOS ? 'DISTRESS SIGNAL ACTIVE' : 'LIVE_NODE_POSITION'}
                                </div>
                            </Popup>
                        </Marker>
                    </>
                )}

                {path && path.length > 0 && (
                    <Polyline
                        positions={path}
                        pathOptions={{ color: '#3b82f6', weight: 4, opacity: 0.6, dashArray: '10, 10' }}
                    />
                )}

                {resources.map((res, i) => (
                    <Marker
                        key={res.id || i}
                        position={[res.lat || 0, res.lng || 0]}
                        icon={ResourceIcon}
                    >
                        <Popup>
                            <div className="p-1">
                                <div className="text-[10px] font-bold uppercase">{res.type}</div>
                                <div className="text-[9px] text-black/60 uppercase mt-1">{res.description}</div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            {/* Custom UI Overlays */}
            <div className="absolute bottom-4 right-4 z-[1000] flex flex-col gap-2">
                <button
                    onClick={() => {
                        if (position) {
                            // Manual recenter
                        }
                    }}
                    className="w-10 h-10 bg-white border border-black/5 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                >
                    <div className="w-2 h-2 rounded-full border-2 border-black" />
                </button>
            </div>
        </div>
    );
};
