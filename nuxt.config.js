// this example declares the function at the top of the nuxt.config.js file
const fs = require('fs').promises;
const path = require('path');
// const deployPath = '/home/tessa/www/tessapainter.com';
const deployPath = 'generated';
const name = 'Tessa Painter';

// Generate RSS FEED
const constructFeedItem = async (article, dir, hostname) => {  
	// note the path used here, we are using a dummy page with an empty layout in order to not send that data along with our other content
	const content = await fs.readFile(path.join(deployPath, `rss/${article.slug}/index.html`), 'utf8');
	const url = encodeURI(`${hostname}/${dir}/${article.slug}`);
	return {
		title: article.title,
		id: url,
		link: url,
		description: article.description,
		published: new Date(article.createdAt),
		content: content
	}
}
const create = async (feed, args) => {
	const [filePath, ext] = args;  
	const hostname = 'https://tessapainter.com'
	feed.options = {
		title: "Tessa's Tales",
		description: "Tech, Blindness, and everything Tessa",
		language: 'en',
		author: name,
		link: `${hostname}/feed.${ext}`
	}
	const { $content } = require('@nuxt/content')
	const articles = await $content(filePath).where({ hidden: { $ne: true } }).sortBy('createdAt', 'desc').fetch();

	for (const article of articles) {
		feed.addItem(await constructFeedItem(article, filePath, hostname));
	}
	return feed;
}

// NUXT CONFIGURATION
const description = `${name}'s personal website for software development. Home to all my projects, portfolio, tutorials, and writtings about the software world.`
const siteTitle = `${name} | Software Development projects, tutorials, and more!`
export default {
	target: 'static',
	components: true,
	head: {
		title: `${name} | Software Development Projects, Tutorials, and more!`,
		meta: [
			{ charset: 'utf-8' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ hid: 'description', name: 'description', content: description },
			{ hid: 'og:description', name: 'og:description', content: description },
			{ hid: 'og:title', name: 'og:title', content: siteTitle},
			{ hid: 'og:url', name: 'og:url', content: 'https://tessapainter.com' },
			{ hid: 'og:image', name: 'og:image', content: '/logo.png' },
			{ hid: 'twitter:site', name: 'og:site', content: '@FlorianEagox' },
			{ hid: 'twitter:card', name: 'twitter:card', content: 'summary_large_image' },
			{ name: 'msapplication-TileColor', content: '#00aba9' },
			{ name: 'theme-color', content: '#ffffff' }
		],
		htmlAttrs: {
			lang: 'en'
		},
		link: [
			{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
			{ rel: 'alternate icon', href: '/favicon.ico' },
			{ rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
			{ rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
			{ rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
			{ rel: 'manifest', href: '/site.webmanifest' },
			{ rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#5bbad5' }
		]
	},
	plugins: ['~plugins/vue-scrollto.js', '~plugins/fontawesome.js', '~plugins/poemProcessor.js'],
	loading: { color: '#fff' },

	buildModules: [
		// '@nuxtjs/eslint-module',
		// '@aceforth/nuxt-optimized-images',
		['@nuxtjs/robots', {
			UserAgent: '*',
			Allow: '/',
			Sitemap: 'https://tessapainter.com/sitemap.xml'
		}
		],
		['nuxt-compress', {
			gzip: {
				cache: true
			},
			brotli: {
				threshold: 10240
			}
		}
		],
		'@nuxtjs/sitemap'
	],
	// optimizedImages: {
	// 	optimizeImages: true
	// },
	modules: [
		// ['nuxt-fontawesome', {
		// 	imports: [
		// 		{
		// 			set: '@fortawesome/free-solid-svg-icons',
		// 			icons: ['fas']
		// 		},
		// 		{
		// 			set: '@fortawesome/free-brands-svg-icons',
		// 			icons: ['fab']
		// 		},
		// 		{
		// 			set: '@fortawesome/free-regular-svg-icons',
		// 			icons: ['far']
		// 		}
		// 	]
		// }],
		['@nuxt/content', {
			liveEdit: true
		}],
		'@nuxtjs/feed'
	],
	sitemap: {
		hostname: 'https://tessapainter.com',
		gzip: true,
		async routes() {
			const { $content } = require('@nuxt/content')
			const contentRoutes = (await $content('/', {deep: true}).only(['dir', 'slug']).where({dir: {$ne: '/site'}}).fetch()).map(item => encodeURI(`${item.dir}/${item.slug}`))
			return [...contentRoutes, '/businesscardparser', '/quizletquery', '/contribeautiful']
		}
	},
	server: {
		host: 'tessapainter.com'
	},
	generate: {
		async routes() {
			const { $content } = require('@nuxt/content')
			return (await $content('blog').only(['slug']).fetch()).map(item => encodeURI(`rss/${item.slug}`))
		},
		dir: deployPath
	},
	feed: [
		{
			path: '/feed.xml',
			create,
			cacheTime: 1000 * 60 * 1,
			type: 'rss2',
			data: ['blog', 'xml']
		},
	],
	content: {
		markdown: {
			prism: {
				theme: 'prism-themes/themes/prism-material-oceanic.css'
			}
		}
	},
	css: [
		'@fortawesome/fontawesome-svg-core/styles.css'
	]
}
