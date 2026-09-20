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

test("preserves safe percentage image widths", () => {
  const html = '<figure class="image" style="width:50%;"><img src="https://example.com/tooth.jpg"></figure>';

  assert.equal(
    sanitizeContent(html),
    '<figure class="image" style="width:50%"><img src="https://example.com/tooth.jpg" /></figure>',
  );
});

test("removes unsafe image style properties and invalid widths", () => {
  const html = '<figure class="image" style="width:500%;position:fixed;background:url(javascript:alert(1))"><img src="https://example.com/tooth.jpg"></figure>';

  assert.equal(
    sanitizeContent(html),
    '<figure class="image"><img src="https://example.com/tooth.jpg" /></figure>',
  );
});

test("preserves CKEditor bold, italic, and safe hyperlink markup", () => {
  const html = '<p><strong>بولد</strong> <i>ایتالیک</i> <a href="https://example.com/page">لینک</a></p>';

  assert.equal(
    sanitizeContent(html),
    '<p><strong>بولد</strong> <i>ایتالیک</i> <a href="https://example.com/page" rel="noopener noreferrer" target="_blank">لینک</a></p>',
  );
});
