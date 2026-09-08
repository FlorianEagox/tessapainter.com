import sharp from 'sharp'
import florianImages from '../assets/florianImages.json' with { type: "json" };
import crochetImages from '../assets/crochetImages.json' with { type: "json" };
import { mkdir } from 'fs/promises'

async function generateThumbnails(basePath = '', images, maxHeight = 250) {
	await mkdir(`${basePath}/thumbnails`, { recursive: true })
	images.forEach(image => {
			console.log(`${basePath}/${image}`)
			try {
				sharp(`${basePath}/${image}`)
					.resize(null, maxHeight)
					.toFile(`${basePath}/thumbnails/${image}`, )
					.catch(e => console.error(e));
			} catch (error) {
				console.log(`${error} Failed to generate for ${basePath}/${image}`)
			}
	});
}
generateThumbnails('static/images/florian', florianImages.map(image => image.path))
generateThumbnails('static/images/crochet', crochetImages.map(image => image.path))