import sharp from 'sharp'
import florianImages from '../assets/florianImages.json' with { type: "json" };
import crochetImages from '../assets/crochetImages.json' with { type: "json" };
import { mkdir } from 'fs/promises'

async function generateThumbnails(basePath = '', images, maxHeight = 250) {
	const outputDir = `${basePath}/thumbnails`
	await mkdir(outputDir, { recursive: true })

	await Promise.allSettled(images.map(async (image) => {
		const inputPath = `${basePath}/${image}`
		const outputPath = `${outputDir}/${image}`
		console.log(`Generating thumbnail for ${inputPath}`)
		await sharp(inputPath)
			.resize(null, maxHeight)
			.toFile(outputPath)
	}))
}

await generateThumbnails('static/images/florian', florianImages.map(image => image.path))
await generateThumbnails('static/images/crochet', crochetImages.map(image => image.path))