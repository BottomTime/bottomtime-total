<template>
  <div
    :id="id"
    ref="mapElement"
    class="w-full aspect-video"
    :data-testid="testId"
  ></div>
</template>

<script setup lang="ts">
import { DiveSiteDTO, GPSCoordinates, GpsCoordinates } from '@bottomtime/api';

import * as google from '@googlemaps/js-api-loader';

import { v4 as uuid } from 'uuid';
import { onBeforeMount, ref, watch } from 'vue';

import { Config } from '../../config';

type GoogleMapProps = {
  id?: string;
  center?: GpsCoordinates;
  disabled?: boolean;
  marker?: GpsCoordinates;
  sites?: DiveSiteDTO[];
  testId?: string;
};

const mapElement = ref<HTMLElement | null>(null);
let mapsLib: globalThis.google.maps.MapsLibrary;
let markersLib: globalThis.google.maps.MarkerLibrary;

let map: globalThis.google.maps.Map;
let markerElement: globalThis.google.maps.marker.AdvancedMarkerElement | null;
let siteMarkers: globalThis.google.maps.marker.AdvancedMarkerElement[];

// Toronto, Ontario... for now
const DefaultCenter = { lat: 43.70011, lon: -79.4163 };

const props = withDefaults(defineProps<GoogleMapProps>(), {
  disabled: false,
  sites: () => [],
});
const emit = defineEmits<{
  (e: 'click', location: GpsCoordinates): void;
  (e: 'site-selected', site: DiveSiteDTO): void;
}>();

const currentCenter = ref<GpsCoordinates>(
  props.center ?? props.marker ?? DefaultCenter,
);

function createSiteMarkers(sites: DiveSiteDTO[]) {
  if (map) {
    if (siteMarkers) siteMarkers.forEach((siteMarker) => siteMarker.remove());
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

onBeforeMount(async () => {
  // Only load the Google Maps API if we're not server-side rendering.
  // No need to pay Google $ for requests that the user will never see!
  if (!Config.isSSR) {
    // Initialize the map...
    const loader = new google.Loader({
      apiKey: Config.googleApiKey,
      version: 'weekly',
      libraries: ['maps'],
    });
    [mapsLib, markersLib] = await Promise.all([
      loader.importLibrary('maps'),
      loader.importLibrary('marker'),
    ]);
    map = new mapsLib.Map(mapElement.value!, {
      mapId: uuid(),
      center: { lat: currentCenter.value.lat, lng: currentCenter.value.lon },
      zoom: 5,
      streetViewControl: false,
      fullscreenControl: false,
    });

    // Add a click listener to the map
    map.addListener('click', onMapClick);

    if (!props.center && !props.marker && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          currentCenter.value = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
        },
        (error) => {
          /* eslint-disable-next-line no-console */
          console.error('Error getting current position', error);
        },
      );
    }

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

function moveCenter(newCenter: NonNullable<GPSCoordinates>) {
  currentCenter.value = newCenter;
  map.setCenter(
    new globalThis.google.maps.LatLng(newCenter.lat, newCenter.lon),
  );
}

watch(
  () => props.marker,
  (newMarker) => {
    if (map) {
      if (newMarker) {
        if (markerElement) markerElement.remove();
        markerElement = new markersLib.AdvancedMarkerElement({
          map,
          position: new globalThis.google.maps.LatLng(
            newMarker.lat,
            newMarker.lon,
          ),
        });
      } else {
        if (markerElement) markerElement.remove();
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

defineExpose({ moveCenter });
</script>
