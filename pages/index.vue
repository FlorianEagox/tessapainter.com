<template>
	<main ref="main" class="container">
		<Greeter class="drop-shadow" />
		<featured-articles />
		<div class="seperator" id="projects-seperator">
			<h2 class="heading">Featured Projects</h2>
			<hr>
		</div>
		<div id="featured-projects">
			<ContentCard
				v-for="project in featuredProjects"
				:key="project.slug"
				:project="project"
				read-more="true"
			/>
		</div>
		<div class="seperator" id="projects-seperator">
			<h2 class="heading">View all my projects <nuxt-link to="/projects">Here</nuxt-link></h2>
			<hr>
		</div>
		<mailing-list />
	</main>
</template>

<script>
export default {
		async asyncData({ $content }) {
			const projects = await $content('projects').where({ featured: true }).fetch();
			return {
				featuredProjects: projects.sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
			};
		}
};
</script>

<style scoped>
main {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin: 1em auto;
}
#featured-projects {
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	max-width: 1800px;
	overflow: visible;
}
#featured-projects > .card {
	--gap-space: 4em;
	flex: 0 1 calc((100% - var(--gap-space)) / 2);
	margin: calc(var(--gap-space) / 2) 0;
	max-width: 800px;
}
@media (max-width: 767px) {
	#featured-projects {
		flex-direction: column;
		width: 85%;
		flex-wrap: unset;
	}
	#featured-projects .card {
		--gap-space: 1em;
	}
	#mailing-list {
		margin: 1em;
	}
}
</style>
