import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import {
  TRINIDAD_BOUNDS,
  TRINIDAD_CENTER,
  isWithinTrinidadBounds,
} from "./accommodationHelpers";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function LocationPicker({ canSelect, location, onSelect }) {
  const map = useMap();

  useEffect(() => {
    if (!location?.lat || !location?.lng) return;
    map.flyTo([location.lat, location.lng], Math.max(map.getZoom(), 14), {
      duration: 0.65,
    });
  }, [location, map]);

  useMapEvents({
    click(event) {
      if (!canSelect) return;

      const nextLocation = {
        lat: Number(event.latlng.lat.toFixed(6)),
        lng: Number(event.latlng.lng.toFixed(6)),
      };

      if (!isWithinTrinidadBounds(nextLocation)) return;

      onSelect(nextLocation);
    },
  });

  return null;
}

export default function TrinidadLocationMap({
  location,
  onSelect,
  canSelect = true,
  height = 360,
  minZoom = 11,
  zoom = 13,
}) {
  const center =
    location?.lat && location?.lng
      ? [location.lat, location.lng]
      : TRINIDAD_CENTER;

  return (
    <div className="listing-map-shell" style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={minZoom}
        maxBounds={TRINIDAD_BOUNDS}
        maxBoundsViscosity={1}
        scrollWheelZoom={canSelect}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationPicker canSelect={canSelect} location={location} onSelect={onSelect} />
        {location?.lat && location?.lng ? (
          <Marker position={[location.lat, location.lng]} />
        ) : null}
      </MapContainer>
    </div>
  );
}
