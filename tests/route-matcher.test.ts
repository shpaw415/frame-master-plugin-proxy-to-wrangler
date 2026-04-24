import { describe, expect, test } from "bun:test";
import { matchesRoute } from "../index";

describe("matchesRoute — string with trailing wildcard (/api*)", () => {
	const pattern = "/api*";

	test("matches exact prefix", () =>
		expect(matchesRoute("/api", pattern)).toBe(true));
	test("matches prefix + slash", () =>
		expect(matchesRoute("/api/", pattern)).toBe(true));
	test("matches prefix + path", () =>
		expect(matchesRoute("/api/users", pattern)).toBe(true));
	test("matches prefix + non-slash continuation", () =>
		expect(matchesRoute("/apiv2", pattern)).toBe(true));
	test("does not match unrelated path", () =>
		expect(matchesRoute("/other", pattern)).toBe(false));
	test("does not match partial prefix", () =>
		expect(matchesRoute("/ap", pattern)).toBe(false));
});

describe("matchesRoute — string with inner wildcard (/api/*)", () => {
	const pattern = "/api/*";

	test("matches /api/ + path", () =>
		expect(matchesRoute("/api/users", pattern)).toBe(true));
	test("matches /api/ alone", () =>
		expect(matchesRoute("/api/", pattern)).toBe(true));
	test("does not match /api without trailing slash", () =>
		expect(matchesRoute("/api", pattern)).toBe(false));
	test("does not match /apiv2", () =>
		expect(matchesRoute("/apiv2", pattern)).toBe(false));
	test("does not match unrelated path", () =>
		expect(matchesRoute("/other", pattern)).toBe(false));
});

describe("matchesRoute — string without wildcard (/api)", () => {
	const pattern = "/api";

	test("matches exact path", () =>
		expect(matchesRoute("/api", pattern)).toBe(true));
	test("does not match sub-route", () =>
		expect(matchesRoute("/api/users", pattern)).toBe(false));
	test("does not match path + query string", () =>
		expect(matchesRoute("/api?q=1", pattern)).toBe(false));
	test("does not match path + hash", () =>
		expect(matchesRoute("/api#section", pattern)).toBe(false));
	test("does not match /apiv2", () =>
		expect(matchesRoute("/apiv2", pattern)).toBe(false));
	test("does not match unrelated path", () =>
		expect(matchesRoute("/other", pattern)).toBe(false));
	test("does not match partial prefix", () =>
		expect(matchesRoute("/ap", pattern)).toBe(false));
});

describe("matchesRoute — RegExp (/^\\/api\\//)", () => {
	const pattern = /^\/api\//;

	test("matches /api/ + path", () =>
		expect(matchesRoute("/api/users", pattern)).toBe(true));
	test("matches /api/ alone", () =>
		expect(matchesRoute("/api/", pattern)).toBe(true));
	test("does not match /api without trailing slash", () =>
		expect(matchesRoute("/api", pattern)).toBe(false));
	test("does not match /apiv2", () =>
		expect(matchesRoute("/apiv2", pattern)).toBe(false));
	test("does not match unrelated path", () =>
		expect(matchesRoute("/other", pattern)).toBe(false));
});

describe("matchesRoute — root wildcard (/*)", () => {
	const pattern = "/*";

	test("matches any path", () =>
		expect(matchesRoute("/anything", pattern)).toBe(true));
	test("matches root", () => expect(matchesRoute("/", pattern)).toBe(true));
});

describe("matchesRoute — multiple wildcards (/a/*/b/*)", () => {
	const pattern = "/a/*/b/*";

	test("matches /a/x/b/y", () =>
		expect(matchesRoute("/a/x/b/y", pattern)).toBe(true));
	test("matches /a//b/ (empty segments)", () =>
		expect(matchesRoute("/a//b/", pattern)).toBe(true));
	test("does not match /a/x/c/y", () =>
		expect(matchesRoute("/a/x/c/y", pattern)).toBe(false));
});
