# SHIL Orientation Upload Frame Update

This update improves the Environmental Conditions installation upload section.

## Added
- Engineering frame around the compass/orientation preview.
- North, East, South, West labels with 0/90/180/270 degree references.
- Full image preview using `object-fit: contain` instead of crop behavior.
- Full preview cards for site installation photos.
- Engineering note explaining that the image is shown without cropping for installation-direction comparison.

## Updated files
- `src/pages/project/Environment.jsx`
- `src/styles/shil-ui.css`

## Design rule
All orientation and site images must show 100% of the uploaded image so the user can compare installation direction, access direction, obstacles, and panel alignment without hidden cropped areas.
