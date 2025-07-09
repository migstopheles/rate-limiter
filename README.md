# Rate limiter

A simple JavaScript rate limiting function. Used to limit the frequency of calls to a function returning a promise.

## Installation

`npm i rate-limiter`

## Usage

```ts
import limiter from 'rate-limiter';

const limit = limiter(500, 2); // allow 2 concurrent calls every 500ms

const external = () => axios.get('https://google.com/rate-limited-endpoint');
const limited = limit(external);

// bad news
const responses = await Promise.all([
	external(), // called immediately
	external(), // following calls at risk of rate limiting!
	external(),
	external()
]);

// good news
const responses = await Promise.all([
	limited(), // called immediately
	limited(), // called immediately
	limited(), // called 500ms after either of ^ resolves
	limited(), // called 500ms after any of ^ resolves
	limited()  // called 1000ms after any of ^ resolves
]);

```
