---
title: Make a simple, lightweight progress bar with Fetch and a single request.
description: A tutorial about making a simple progress bar with Express that requires no additional server infrastructure.
categories: programming
createdAt: 2021-08-02T11:02:11.000Z
updatedAt: 2023-10-06T20:42:32.000Z
---

## [Ttl;dr Show me The Code](#implementation)

Progress bars are an important part of dynamic software. They give the user a visual and concrete assurance that the work they requested is being done as well as provide a symbolic estimate of time they can expect to wait. Recently while working on my project [Contribeautiful](https://sethpainter.com/project/contribeautiful), I came up with a new and easy way to report progress without much additional overhead.

## The conventional progress bar
Most designs for web progress bars work like this: When the user makes the initial request (maybe a file upload, processing an effect for a video, starting up a server, or some other long-running asynchronous task), the server starts their work or queues their task, and responds back with a unique identifier (or stores it in a database associated with that user). The client can then send subsequent requests inquiring about the progress of the work at an interval. Sometimes instead of requests at a fixed interval, the architecture will use [long-polling](https://en.wikipedia.org/wiki/Push_technology#Long_polling) to send a new request every time progress is send back.

### Advantages
This method is great because it's highly reliable. It uses multiple small requests, and if the connection is interrupted or the user closes the site, it can always be recovered later. This method is great if the tasks can take longer than a minute and there's a reasonable expectation that the user might leave and come back later. This design might also allow you the flexibility to implement two-way communication. So if the user would like additional changes to be made to their task while it's in progress or to cancel it, the client can send a new request with that information.

### Disadvantages
While this method is highly reliable, it also requires much more overhead. If progress bars are an afterthought, you may have to restructure a significant portion of your design and the way your requests are made. You'll have to implement a system that keeps track of tasks, you'll have to make routes on the server to report progress, and you'll have to set up client-side code to send requests on an interval. If your current architecture is simply: request -> wait... -> response, you'll have your work cut out for you.

### Websockets
You could also do this using WebSockets. They're designed for real-time, two-way communication between clients and a server, but if you're not already using them in the first place, it seems like a bunch of extra work to include them for this one part of your site, and this also might incur infrastructural changes.

## My new design
Instead of multiple small requests checking progress, I use a single response and write to its stream. Although HTTP is typically thought of as a stateless request/response system, you can actually stream a response with a process called [chunked encoding](https://en.wikipedia.org/wiki/Chunked_transfer_encoding). Instead of receiving the request, and immediately returning the response, the server can hold the request indefinitely and respond when it's done. During that time, however, the server can actually send data to the client in the form of a chunked response. This is typically used for streaming data or sending large bits of data over time (like a big file). This design was inspired by a website I came across recently called AlbeOnion, a real-time chat website on the deep web that uses no javascript. (Though there is a lot of bad stuff on here, so I would not recommend visiting it.) Your HTTP client (fetch, XHR, Axios, etc) can read the chunks of this response stream and update the app's progress bar in real-time.

## Implementation
### On the server
With this design, you can use your existing routes and architecture and make a few small modifications to report progress. This example will simulate a long-running task (waiting 5 seconds), and push small updates until the request has resolved.
#### An example of streaming a chunked response
```javascript
app.get('/test', (req, res) => {
	// Fetch & XHR will not stream the response body in chunks without this.
    res.setHeader('Content-Type', 'text/html');
    let num = 0;
    let interval = setInterval(() => {
		res.write(num++ + ' ') // send a chunk of data to the client
	}, 300);
    setTimeout(() => {
        clearInterval(interval);
        res.end(); // close the request
    }, 5000);
});
```
This route will send the updated version of num to the client every 300 milliseconds.

You can check out the response with

```shell
curl localhost:[yourServerPort]/test -N
```
The `-N` is the cURL flag for no buffering. You should see the next number appear every 300ms and the request end after 5 seconds. You should also see the numbers load in on the page slowly in chrome. Firefox, for some reason, buffers the whole webpage.

The key thing that makes this work is the `res.write([string])` This function writes to the response body and sends the result to the client.
The `Content-Type` is also important. By default, express will respond with `text/plain` or `application/json`, however, fetch and XHR behave strangely with this. I spent several hours trying to figure out why `fetch` in Chrome would work with this, but not in Firefox, and XHR would work with this in Firefox, but not in chrome. Setting the content type to `text/html` seems to work just dandy on both with no issues. I spent several hours trying to figure this out and ended up creating [This StackOverflow question](https://stackoverflow.com/questions/68496222/).



#### An example for a progress bar
```js{1,3-5}[server.js]
// A typical express route
app.get('/test', async (req, res) => {
	res.setHeader('Content-Type', 'text/html'); // Required for data streaming with fetch & XHR
    let progress = [0]; // Using an array for pass by reference
	let totalTasks = 15;
	res.write(`total ${totalTasks}`); // Tell the client the total for the progress bar
	// set up an interval every 100 milliseconds to send progress to the client
    let updateProgressInterval = setInterval(() => {
		res.write(progress[0].toString()); // This will send a chunk of data before the request has completed
	}, 100);
	await longRunningTask(progress);
	clearInterval(updateProgressInterval);
	res.end() // close the request
});
// simulate a long running task (You don't have to use interval, it's just an easy example)
function longRunningTask(progress, total) { // We will modify the first index of progress to use pass by reference
	return new Promise((resolve, reject) => { // You could also just use a callback, you don't have to promisify it
		let interval = setInterval(() => {
			progress[0]++;
			if(progress >= total) { // At the end of the long running task
				clearInterval(interval);
				resolve();
			}
		}, 1000);
	}
}
```

### On the client
Both fetch and XHR provide methods for consuming chunked responses. Here is an exmaple with fetch.
```javascript{}[client.js]
const url = `http://localhost:${port}`;
const response = await fetch(`${url}/test`);
const reader = response.body.getReader(); // get the response stream
const decoder = new TextDecoder(); // This will convert the Uint8Array of bytes into ASCII text
// Loop indefinitely while the response comes in (I don't think this is blocking)
while (true) {
    const { done, value } = await reader.read(); // value will be the byes of the latest response
        if (done)
            break; // exit the loop
	
	let text = decoder.decode(value);
	// Use the text returned by the server
    console.log(text);
}
// After the response is done
if(response.ok)
	console.log(`Done! ${await response.text())`)
```

Interacting with the data send back is pretty simple.

```javascript
let total = 0;
if(text.includes('total'))
	total = text.split(' ')[1];
else
	updateProgressBar(text, total);
```

You also don't have to report the total to the client, you could calculate the percentage on the server and just send that if just want to use the percentage.

## Displaying the progress
A progress bar can be thought of as a box within a box. The outer box representing the total, and the inner box the proportion of the completed progress.

We can create this quite easily in HTML with this
```html
<div id="progress-bar">
	<div id="progress">
		<span id="progress-text">0%</span>
	</div>
</div>
```
You can be as fancy as you'd like with the styling, and there are dozens of examples of great progress bar designs around the web.
### Styling the progress bar
A basic style for this might look like
```css
#progress-bar {
	width: 100%;
	max-width: 500px;
	background: #ccc;
}
#progress {
	background: green;
}
#progress-text {
	color: white;
	text-align: center;
}
```

Example of simple progress bar:
<p class="codepen" data-height="300" data-theme-id="dark" data-default-tab="html,result" data-slug-hash="poPKQXG" data-editable="true" data-user="FlorianEagox" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/FlorianEagox/pen/poPKQXG">
  Simple Progress bar</a> by Tessa (<a href="https://codepen.io/FlorianEagox">@FlorianEagox</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>
<script async src="https://cpwebassets.codepen.io/assets/embed/ei.js"></script>

I decided to get very fancy with the one used in Contribeautiful which you can see here:
<p class="codepen" data-height="300" data-theme-id="dark" data-default-tab="html,result" data-slug-hash="qBmKLVm" data-editable="true" data-user="FlorianEagox" style="height: 300px; box-sizing: border-box; display: flex; align-items: center; justify-content: center; border: 2px solid; margin: 1em 0; padding: 1em;">
  <span>See the Pen <a href="https://codepen.io/FlorianEagox/pen/qBmKLVm">
  Contribeautiful progress bar</a> by Tessa (<a href="https://codepen.io/FlorianEagox">@FlorianEagox</a>)
  on <a href="https://codepen.io">CodePen</a>.</span>
</p>

### Updating the progress
You can update the progress bar with JS like this
```javascript
function updateProgressBar(progress, total) {
	const bar = document.querySelector('#progress');
	const text = document.querySelector('#progress-text');
	const percentage = Math.floor(progress / total) * 100);
	bar.style.width = `${percentage}%`;
	text.textContent = `${progress} of ${total}`;
}
```

You can also experiment with the HTML5 `<progress>` tag. It's much easier to work with, but provides much less flexibility in styling capabilities.

You can read more about that [here](https://css-tricks.com/html5-progress-element/).

## Conclusion
This is my method for making real-time progress bars for moderately long tasks. I really like this approach of streaming the response body in chunks rather than several small requests. I've been purposefully very thorough in this article, and your implementation will likely be much cleaner and simpler, but I wanted to give a comprehensive explanation of this fairly unconventional method. If you use it or have any thoughts or recommendations to improve it, please let me know!
