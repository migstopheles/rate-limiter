type Limitable = (...args: any[]) => Promise<any>;
type Args<F> = F extends (...args: infer A) => any ? A : never;
type PromiseReturnType<T> = T extends (...args: any[]) => Promise<infer R> ? R : never;

export type Limiter = <F extends Limitable>(fn: F, interval?: number, concurrency?: number) => (...args: Args<F>) => Promise<PromiseReturnType<F>>;

/**
 * Create a function that will limit calls by time and by concurrency
 * @param interval - The minimum time allowed between calls
 * @param concurrency - The maximum number of concurrent calls allowed
 * @returns A higher order function, which rate limits calls to the function it wraps
*/
export default (interval = 1000, concurrency = 1) => {
    const pending: Array<Promise<any>> = [];

    const limiter: Limiter = (fn) => {
        return (...args) => {
            const check = () => {
                if (pending.length < concurrency) {
                    return enqueue();
                } else {
                    return Promise.race(pending.slice(0, concurrency)).then(check);
                }
            };
            const enqueue = () => {
                const promise = fn(...args)
                const delay = promise.catch(() => null).then(async () => {
					await new Promise((res) => setTimeout(res, interval));
                    pending.splice(pending.indexOf(delay), 1);
                });
                pending.push(delay);
                return promise;
            };
            return check();
        };
    };

    return limiter;
};
