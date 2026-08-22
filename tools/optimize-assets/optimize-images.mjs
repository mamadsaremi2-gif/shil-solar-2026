import imagemin from "imagemin";
import webp from "imagemin-webp";
import mozjpeg from "imagemin-mozjpeg";
import pngquant from "imagemin-pngquant";

const files = ["public/assets/**/*.{jpg,jpeg,png,webp}"];

await imagemin(files, {
  destination: "public-optimized",
  plugins: [
    mozjpeg({ quality: 70 }),
    pngquant({ quality: [0.6, 0.8] }),
    webp({ quality: 70 }),
  ],
});

console.log("SHIL assets optimized.");
