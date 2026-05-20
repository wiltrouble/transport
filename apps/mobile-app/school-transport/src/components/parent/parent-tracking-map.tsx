import { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, type Region } from "react-native-maps";
import type { GpsTrackingPoint } from "@school/types";

type ParentTrackingMapProps = {
  point: GpsTrackingPoint | null;
  vehiclePlate: string;
};

const DEFAULT_REGION: Region = {
  latitude: 14.6349,
  longitude: -90.5069,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export function ParentTrackingMap({ point, vehiclePlate }: ParentTrackingMapProps) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (!point || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: point.latitude,
        longitude: point.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      },
      600,
    );
  }, [point?.latitude, point?.longitude, point?.trackedAt]);

  const region = point
    ? {
        latitude: point.latitude,
        longitude: point.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
    : DEFAULT_REGION;

  return (
    <View className="h-72 overflow-hidden rounded-2xl border border-slate-200">
      <MapView ref={mapRef} style={styles.map} initialRegion={region} showsUserLocation>
        {point ? (
          <Marker
            coordinate={{ latitude: point.latitude, longitude: point.longitude }}
            title={vehiclePlate}
            description={`${(point.speed * 3.6).toFixed(0)} km/h`}
          />
        ) : null}
      </MapView>
      {!point ? (
        <View className="absolute inset-0 items-center justify-center bg-white/80 px-4">
          <Text className="text-center text-sm text-slate-600">
            Esperando la primera ubicación GPS del vehículo…
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, width: "100%", height: "100%" },
});
