<template>
	<button
		v-show="visible"
		id="elevator" class="base-border drop-shadow" 
		ref="elevator"
		v-scroll-to="pageTitle ? '.title' : 'body'"
		@click="ding()">
		<font-awesome-icon :icon="['fas', 'chevron-up']" size="lg" />
	</button>
</template>

<script>
export default {
	data() {
		return { visible: false, pageTitle: false }
	},
	mounted() {
		this.pageTitle = Boolean(document.querySelector('.title'));
		this.btnSound = new Audio('/audio/sfx/elevator.mp3')
		document.addEventListener('scroll', () => {
			this.visible = (window.scrollY > window.innerHeight);
			this.btnSound.currentTime = 0
		});
		window.addEventListener('resize', this.setBuffer);
		this.setBuffer();
	},
	methods: {
		setBuffer() {
			if(document.querySelector('article'))
				this.$refs.elevator.style.left = window.innerWidth >= 1750 ? document.querySelector('article').getBoundingClientRect().right + 32 + 'px' : 'revert'
		},
		ding() {
			this.btnSound.play();
		}
	}
}
</script>

<style>
	#elevator {
		position: fixed;
		bottom: 1em;
		right: 1em;
		padding: 1em;
		border: none;
		max-width: 100px;
		color: var(--main-color);
		background: var(--main-bkg);
	}
</style>

