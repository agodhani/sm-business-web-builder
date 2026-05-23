import path from "node:path";
import type { GallerySection } from "../../../lib/types/page-data";

type GallerySectionProps = {
  section: GallerySection;
  assetBasePath?: string;
};

function resolveImageSource(imagePath: string, assetBasePath?: string) {
  if (!assetBasePath || imagePath.startsWith("/") || imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }
  const imageName = path.basename(imagePath);
  if (assetBasePath.includes("?asset=")) {
    return `${assetBasePath}${encodeURIComponent(imageName)}`;
  }
  return `${assetBasePath.replace(/\/$/, "")}/${imageName}`;
}

export function GallerySectionView({ section, assetBasePath }: GallerySectionProps) {
  return (
    <section data-section="gallery">
      <h2>{section.title}</h2>
      <div>
        {section.images.map((image) => (
          <figure key={`${image.path}-${image.alt}`}>
            <img src={resolveImageSource(image.path, assetBasePath)} alt={image.alt} />
          </figure>
        ))}
      </div>
    </section>
  );
}
