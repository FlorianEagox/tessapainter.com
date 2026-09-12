<template>
	<footer>
		<div class="container">
			<div class="content">
				<p id="copy">
					<strong> <font-awesome-icon :icon="['far', 'copyright']" flip="horizontal" /> Tessa Painter - 2025</strong>
				</p>
				<ul id="other">
					<li>
						<nuxt-link id="resume" to="/resume">My Resume</nuxt-link>
					</li>
				</ul>
			</div>
			<div id="external">
				<p>Find me elsewhere</p>
				<nav>
					<ul>
						<li>
							<a href="https://github.com/TheFoxarmy">
								<font-awesome-icon :icon="['fab', 'github']" />
							</a>
						</li>
						<li>
							<a href="https://www.youtube.com/c/thefoxarmy11">
								<font-awesome-icon :icon="['fab', 'youtube']" />
							</a>
						</li>
						<li>
							<a href="mailto: tessa@tessapainter.com">
								<font-awesome-icon :icon="['fas', 'envelope']" />
							</a>
						</li>
						<li>
							<a href="https://www.upwork.com/o/profiles/users/_~01a3effb5d2b8cbd3a/">
								<span>
									<img src="~/assets/images/upwork.webp" alt="Upwork">
								</span>
							</a>
						</li>
						<li>
							<a href="https://www.deviantart.com/florianeagox">
								<font-awesome-icon :icon="['fab', 'deviantart']" />
							</a>
						</li>
						<li>
							<a href="https://twitter.com/FlorianEagox">
								<font-awesome-icon :icon="['fab', 'twitter']" />
							</a>
						</li>
					</ul>
				</nav>
			</div>
		</div>
		<div id="last-update">
			<strong>Site last updated</strong> <span id="updated-date">{{this.date}}</span>
		</div>
	</footer>
</template>

<script>
export default {
	name: 'Footer',
	data() {
		return {
			date: ''
		}
	},
	fetch() {
		this.date = new Date().toUTCString();
	}
};
</script>

<style scoped>
#last-update {
	position: absolute;
	bottom: 0;
	white-space: nowrap;
	left: 50%;
	transform: translateX(-50%);
	background: rgba(0, 0, 0, 0.2);
	font-size: 0.8em;
	display: inline-block;
}
footer {
	background: var(--dark-bkg);
	color: var(--white-txt);
	padding: 2.5em;
	position: relative;
}
.container {
	display: flex;
	justify-content: space-between;
}
.content {
	align-self: center;
	justify-content: space-around;
	flex-basis: 55%;
	display: flex;
	align-items: center;
}
.content a {
	padding: 0.1em;
	margin: 0.1em;
}
#resume {
	color: var(--accent-color);
	font-weight: bold;
}
#external {
	font-size: 1.25em;
	border-left: solid 1px white;
	padding-left: 2.5em;
	margin: auto;
	/* flex-basis: 40%; */
}
ul {
	list-style-type: none;
}
li {
	display: inline;
}
#external li {
	font-size: 1.5em;
	margin: auto 0.1em;
}
a {
	color: var(--white-txt);
}
#external a img {
	filter: invert(100%);
	width: 1em;
}
#external a img:hover {
	filter: invert(75%);
}
#external a:active,
#external a:hover {
	color: #aaa;
}
@media (max-width: 770px) {
	.container {
		text-align: center;
		flex-direction: column;
		width: 100%;
	}
	.content {
		border-bottom: 1px solid white;
		padding-bottom: 1em;
		margin-bottom: 1em;
		width: 100%;
	}
	#external {
		border: none;
		width: 100%;
		padding: 0;
	}
}
</style>
