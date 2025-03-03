<template>
  <div
    :id="id"
    ref="mapElement"
    class="w-full aspect-video shadow-md shadow-grey-900 rounded-sm"
    :data-testid="testId"
  ></div>
</template>

<script setup lang="ts">
import { DiveSiteDTO, GpsCoordinates, OperatorDTO } from '@bottomtime/api';

import { v7 as uuid } from 'uuid';
import { onBeforeMount, ref, watch } from 'vue';

import { useGoogle } from '../../google-loader';

type GoogleMapProps = {
  id?: string;
  center?: GpsCoordinates;
  disabled?: boolean;
  divePath?: GpsCoordinates[];
  marker?: GpsCoordinates;
  sites?: DiveSiteDTO[];
  operators?: OperatorDTO[];
  testId?: string;
  zoom?: number;
};

const mapElement = ref<HTMLElement | null>(null);
let mapsLib: globalThis.google.maps.MapsLibrary;
let markersLib: globalThis.google.maps.MarkerLibrary;

let map: globalThis.google.maps.Map;

let markerElement: globalThis.google.maps.marker.AdvancedMarkerElement | null;
let siteMarkers: globalThis.google.maps.marker.AdvancedMarkerElement[];
let operatorMarkers: globalThis.google.maps.marker.AdvancedMarkerElement[];
let divePathPoly: globalThis.google.maps.Polyline | null;

// Toronto, Ontario... for now
const DefaultCenter = { lat: 43.70011, lon: -79.4163 };

const props = withDefaults(defineProps<GoogleMapProps>(), {
  disabled: false,
  sites: () => [],
  operators: () => [],
  zoom: 5,
});
const emit = defineEmits<{
  (e: 'click', location: GpsCoordinates): void;
  (e: 'site-selected', site: DiveSiteDTO): void;
  (e: 'operator-selected', site: OperatorDTO): void;
}>();

const currentCenter = ref<GpsCoordinates>(
  props.center ?? props.marker ?? DefaultCenter,
);

function createSiteMarkers(sites: DiveSiteDTO[]) {
  if (map) {
    siteMarkers?.forEach((siteMarker) => {
      siteMarker.map = null;
    });
    siteMarkers = sites
      .filter((site) => !!site.gps)
      .map((site) => {
        const content = document.createElement('div');
        content.classList.add(
          'flex',
          'items-center',
          'space-x-1',
          'pr-0',
          'z-10',
          'hover:z-30',
          'hover:pr-1',
          'rounded-md',
          'h-[16px]',
          'shadow-sm',
          'bg-grey-200',
          'group',
        );
        const img = document.createElement('img');
        img.src = '/img/flag-marker.svg';
        img.alt = site.name;
        img.classList.add(
          'w-[16px]',
          'h-[16px]',
          'rounded-md',
          'shadow-sm',
          'shadow-danger-hover',
        );

        const span = document.createElement('span');
        span.classList.add(
          'hidden',
          'group-hover:block',
          'text-grey-950',
          'text-xs',
          'capitalize',
        );
        span.textContent = site.name;

        content.appendChild(img);
        content.appendChild(span);

        const marker = new markersLib.AdvancedMarkerElement({
          map,
          position: new globalThis.google.maps.LatLng(
            site.gps!.lat,
            site.gps!.lon,
          ),
          title: site.name,
          content,
          gmpClickable: true,
        });

        marker.addListener('click', () => {
          emit('site-selected', site);
        });
        return marker;
      });
  }
}

function createOperatorMarkers(operators: OperatorDTO[]) {
  if (map) {
    operatorMarkers?.forEach((operatorMarker) => {
      operatorMarker.map = null;
    });
    operatorMarkers = operators
      .filter((operator) => !!operator.gps)
      .map((operator) => {
        const content = document.createElement('div');
        content.classList.add(
          'flex',
          'items-center',
          'space-x-1',
          'pr-0',
          'z-10',
          'hover:z-30',
          'hover:pr-1',
          'rounded-md',
          'h-[16px]',
          'shadow-sm',
          'bg-grey-200',
          'group',
        );
        const img = document.createElement('img');
        img.src = '/img/shop.svg';
        img.alt = operator.name;
        img.classList.add(
          'w-[16px]',
          'h-[16px]',
          'rounded-md',
          'shadow-sm',
          'shadow-danger-hover',
        );

        const span = document.createElement('span');
        span.classList.add(
          'hidden',
          'group-hover:block',
          'text-grey-950',
          'text-xs',
          'capitalize',
        );
        span.textContent = operator.name;

        content.appendChild(img);
        content.appendChild(span);

        const marker = new markersLib.AdvancedMarkerElement({
          map,
          position: new globalThis.google.maps.LatLng(
            operator.gps!.lat,
            operator.gps!.lon,
          ),
          title: operator.name,
          content,
          gmpClickable: true,
        });

        marker.addListener('click', () => {
          emit('operator-selected', operator);
        });
        return marker;
      });
  }
}

onBeforeMount(async () => {
  const loader = useGoogle();

  [mapsLib, markersLib] = await Promise.all([
    loader.importLibrary('maps'),
    loader.importLibrary('marker'),
  ]);
  map = new mapsLib.Map(mapElement.value!, {
    mapId: uuid(),
    center: { lat: currentCenter.value.lat, lng: currentCenter.value.lon },
    zoom: props.zoom,
    streetViewControl: false,
    fullscreenControl: false,
  });

  // Add a click listener to the map
  map.addListener('click', onMapClick);

  if (props.marker) {
    markerElement = new markersLib.AdvancedMarkerElement({
      map,
      position: new globalThis.google.maps.LatLng(
        props.marker.lat,
        props.marker.lon,
      ),
    });
  } else {
    markerElement = null;
  }

  createSiteMarkers(props.sites);

  if (props.divePath) {
    divePathPoly = new mapsLib.Polyline({
      geodesic: true,
      strokeColor: '#FF0000',
      visible: true,
      map,
      path: props.divePath.map((point) => ({
        lat: point.lat,
        lng: point.lon,
      })),
    });
  } else {
    divePathPoly = null;
  }
});

function onMapClick(event: globalThis.google.maps.MapMouseEvent) {
  if (event.latLng && !props.disabled) {
    emit('click', {
      lat: event.latLng.lat(),
      lon: event.latLng.lng(),
    });
  }
}

function moveCenter(newCenter: NonNullable<GpsCoordinates>) {
  currentCenter.value = newCenter;
  map.setCenter(
    new globalThis.google.maps.LatLng(newCenter.lat, newCenter.lon),
  );
}

watch(
  () => props.marker,
  (newMarker) => {
    if (markerElement) {
      markerElement.map = null;
    }

    if (map) {
      if (newMarker) {
        markerElement = new markersLib.AdvancedMarkerElement({
          map,
          position: new globalThis.google.maps.LatLng(
            newMarker.lat,
            newMarker.lon,
          ),
        });
      } else {
        markerElement = null;
      }
    }
  },
);

watch(
  () => props.center,
  (newCenter) => {
    if (map && newCenter) {
      moveCenter(newCenter);
    }
  },
);

watch(
  () => props.sites,
  (newSites) => {
    createSiteMarkers(newSites);
  },
);

watch(
  () => props.operators,
  (newOperators) => {
    createOperatorMarkers(newOperators);
  },
);

watch(
  () => props.zoom,
  (newZoom) => {
    if (map) {
      map.setZoom(newZoom);
    }
  },
);

watch(
  () => props.divePath,
  (path) => {
    if (divePathPoly) {
      divePathPoly.setMap(null);
    }

    if (path) {
      divePathPoly = new mapsLib.Polyline({
        geodesic: true,
        strokeColor: '#FF0000',
        visible: true,
        map,
        path: path.map((point) => ({
          lat: point.lat,
          lng: point.lon,
        })),
      });
    } else {
      divePathPoly = null;
    }
  },
);
</script>
