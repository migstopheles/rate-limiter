import limiter from '../';

jest.useFakeTimers({
	legacyFakeTimers: true,
});

describe('rate-limiter', () => {
	it('calls limitable functions with args', async () => {
		const slowAdd = jest.fn().mockImplementation((first: number, second: number) => {
			return new Promise<number>((res) => setTimeout(() => res(first + second), 1000));
		});
		const limit = limiter(1000, 2);
		const limited = limit(slowAdd);
		const promise = limited(1, 2);
		jest.runOnlyPendingTimers();
		const result = await promise;
		expect(result).toBe(3);
		expect(slowAdd).toHaveBeenCalledWith(1, 2);
	});

	it('limits the rate of calls', async () => {
		const TEST_TIMER = 10;
		const LIMIT_TIMER = 1000;
		const a = jest.fn().mockImplementation((first: number, second: number) => {
			return new Promise<number>((res) => setTimeout(() => res(first + second), TEST_TIMER));
		});
		const b = jest.fn().mockImplementation((first: number, second: number) => {
			return new Promise<number>((res) => setTimeout(() => res(first * second), TEST_TIMER));
		});
		const c = jest.fn().mockImplementation((first: number, second: number) => {
			return new Promise<number>((res) => setTimeout(() => res(first / second), TEST_TIMER));
		});
		const limit = limiter(LIMIT_TIMER, 1);
		const limitA = limit(a);
		const limitB = limit(b);
		const limitC = limit(c);

		const stepToNext = () => {
			// the two setImmediates allow the timer and the promise function to resolve internally in the limiter
			return new Promise(setImmediate).then(() => {
				jest.advanceTimersByTime(LIMIT_TIMER + 100);
				return new Promise(setImmediate);
			})
		};

		const calls = [
			limitA(1, 2),
			limitB(3, 4),
			limitC(10, 4)
		];

		jest.advanceTimersByTime(TEST_TIMER);
		expect(a).toHaveBeenCalledWith(1, 2);
		expect(b).not.toHaveBeenCalled();
		expect(c).not.toHaveBeenCalled();

		await stepToNext();
		jest.advanceTimersByTime(TEST_TIMER);
		expect(a).toHaveBeenCalledWith(1, 2);
		expect(b).toHaveBeenCalledWith(3, 4);
		expect(c).not.toHaveBeenCalled();

		await stepToNext();
		jest.advanceTimersByTime(TEST_TIMER);
		expect(a).toHaveBeenCalledWith(1, 2);
		expect(b).toHaveBeenCalledWith(3, 4);
		expect(c).toHaveBeenCalledWith(10, 4);

		const result = await Promise.all(calls);
		expect(result).toEqual([3, 12, 2.5]);
	});


	it('limits with concurrency', async () => {
		const TEST_TIMER = 10;
		const LIMIT_TIMER = 1000;
		const a = jest.fn().mockImplementation((first: number, second: number) => {
			return new Promise<number>((res) => setTimeout(() => res(first + second), TEST_TIMER));
		});
		const b = jest.fn().mockImplementation((first: number, second: number) => {
			return new Promise<number>((res) => setTimeout(() => res(first - second), TEST_TIMER));
		});
		const c = jest.fn().mockImplementation((first: number, second: number) => {
			return new Promise<number>((res) => setTimeout(() => res(first * second), TEST_TIMER));
		});
		const d = jest.fn().mockImplementation((first: number, second: number) => {
			return new Promise<number>((res) => setTimeout(() => res(first / second), TEST_TIMER));
		});

		const limit = limiter(LIMIT_TIMER, 2);
		const limitA = limit(a);
		const limitB = limit(b);
		const limitC = limit(c);
		const limitD = limit(d);

		const stepToNext = () => {
			// the two setImmediates allow the timer and the promise function to resolve internally in the limiter
			return new Promise(setImmediate).then(() => {
				jest.advanceTimersByTime(LIMIT_TIMER);
				return new Promise(setImmediate);
			})
		};

		const calls = [
			limitA(1, 2),
			limitB(3, 4),
			limitC(5, 6),
			limitD(7, 8),
		];

		jest.advanceTimersByTime(TEST_TIMER);
		expect(a).toHaveBeenCalledWith(1, 2);
		expect(b).toHaveBeenCalledWith(3, 4);
		expect(c).not.toHaveBeenCalled();
		expect(d).not.toHaveBeenCalled();

		await stepToNext();
		jest.advanceTimersByTime(TEST_TIMER);
		expect(a).toHaveBeenCalledWith(1, 2);
		expect(b).toHaveBeenCalledWith(3, 4);
		expect(c).toHaveBeenCalledWith(5, 6);
		expect(d).toHaveBeenCalledWith(7, 8);

		const result = await Promise.all(calls);
		expect(result).toEqual([3, -1, 30, 0.875]);
	});
});
