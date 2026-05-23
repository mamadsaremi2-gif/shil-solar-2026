import React from "react";

import Map, {
  Marker
} from "react-map-gl";

import "maplibre-gl/dist/maplibre-gl.css";

export default function SHILMap() {

  return (

    <div className="map-v15">

      <Map
        initialViewState={{
          longitude: 51.389,
          latitude: 35.6892,
          zoom: 9,
        }}

        style={{
          width: "100%",
          height: 320,
        }}

        mapStyle="https://demotiles.maplibre.org/style.json"
      >

        <Marker
          longitude={51.389}
          latitude={35.6892}
        />

      </Map>

    </div>

  );
}
