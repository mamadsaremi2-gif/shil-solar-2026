import * as React from "react";

import Cropper
from "react-easy-crop";

export default function ImageCropper() {

  const [crop, setCrop] =
    React.useState({ x: 0, y: 0 });

  const [zoom, setZoom] =
    React.useState(1);

  return (

    <div className="cropper-v15">

      <Cropper
        image="https://picsum.photos/800"
        crop={crop}
        zoom={zoom}
        onCropChange={setCrop}
        onZoomChange={setZoom}
      />

    </div>

  );
}
