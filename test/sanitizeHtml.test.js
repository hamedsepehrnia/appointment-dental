const test = require("node:test");
const assert = require("node:assert/strict");

const { sanitizeContent } = require("../src/utils/sanitizeHtml");

test("preserves CKEditor image alignment markup", () => {
  const html = [
    '<figure class="image image-style-align-left">',
    '<img src="https://example.com/tooth.jpg" alt="tooth">',
    '<figcaption>نمونه تصویر</figcaption>',
    "</figure>",
  ].join("");

  assert.equal(
    sanitizeContent(html),
    '<figure class="image image-style-align-left"><img src="https://example.com/tooth.jpg" alt="tooth" /><figcaption>نمونه تصویر</figcaption></figure>',
  );
});

test("removes unsupported classes while preserving safe CKEditor image classes", () => {
  const html = '<figure class="image image-style-align-right malicious"><img src="https://example.com/tooth.jpg"></figure>';

  assert.equal(
    sanitizeContent(html),
    '<figure class="image image-style-align-right"><img src="https://example.com/tooth.jpg" /></figure>',
  );
});
